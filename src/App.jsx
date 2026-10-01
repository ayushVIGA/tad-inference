import React, { useState, useEffect, useRef } from 'react';
import ControlsHeader from './components/ControlsHeader';
import Sidebar from './components/Sidebar';
import ParameterPanel from './components/ParameterPanel';
import VideoPlayer from './components/VideoPlayer';
import PredictionsTable from './components/PredictionsTable';
import { AlertCircleIcon, CheckCircleIcon } from './components/Icons';
import './App.css';

// Read default environment variables with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_CHECKPOINT = import.meta.env.VITE_DEFAULT_CHECKPOINT || 'exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_37.pth';
const DEFAULT_THRESHOLD = parseFloat(import.meta.env.VITE_DEFAULT_THRESHOLD) || 0.15;
const DEFAULT_IOU_THRESHOLD = parseFloat(import.meta.env.VITE_DEFAULT_IOU_THRESHOLD) || 0.25;

const initialModelType = 'positives';
const initialEpoch = 37;
const initialCheckpoint = import.meta.env.VITE_DEFAULT_CHECKPOINT || 'exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_37.pth';

export default function App() {
  // Stored video manifests
  const [videoManifest, setVideoManifest] = useState([]);
  
  // Selection and Mode: 'pre-stored' | 'upload'
  const [mode, setMode] = useState('pre-stored');
  const [activeVideo, setActiveVideo] = useState(null); // manifest object or File object
  const [videoSrc, setVideoSrc] = useState('');
  
  // Sidebar Collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Predictions and detection state
  const [predictions, setPredictions] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Loading & Request State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const abortControllerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Parameter Configuration State (Only Positives selected by default)
  const [params, setParams] = useState({
    model_type: initialModelType, // 'positives' | 'negatives'
    epoch: initialEpoch,
    checkpoint: initialCheckpoint,
    threshold: DEFAULT_THRESHOLD,
    nms_type: 'hard', // 'hard' | 'soft'
    iou_threshold: DEFAULT_IOU_THRESHOLD,
    sigma: 0.4,
    max_seg_num: 5,
  });

  // Load manifest.json on mount (only load metadata list, do NOT load video files)
  useEffect(() => {
    fetch('/videos/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load video manifest');
        return res.json();
      })
      .then((data) => {
        setVideoManifest(data);
        // Do not auto-load or pre-buffer video files on initial page load
      })
      .catch((err) => {
        console.warn('Could not load manifest.json:', err);
      });
  }, []);

  // Cleanup object URLs when switching upload
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Show temporary toast notification
  const showToast = (message, type = 'info', duration = 5000) => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  // Handler: Selecting a stored video
  const handleSelectPreStored = (videoItem) => {
    // Loads and plays the video only when selected
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    setActiveVideo(videoItem);
    setVideoSrc(`/videos/${videoItem.filename}`);
    setMode('pre-stored');
    setPredictions([]);
    showToast(`Loaded video: ${videoItem.title || videoItem.filename}`, 'info', 3000);
  };

  // Handler: Uploading a video
  const handleUploadVideo = (file) => {
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    const objectUrl = URL.createObjectURL(file);
    setActiveVideo(file);
    setVideoSrc(objectUrl);
    setMode('upload');
    setPredictions([]);
    showToast(`Loaded upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'success', 3000);
  };

  // Normalize API predictions from any standard shape
  const normalizePredictions = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    return rawList
      .map((item) => {
        const start_time_sec = parseFloat(
          item.start_time_sec ?? item.start_time ?? (Array.isArray(item.segment) ? item.segment[0] : 0)
        );
        const end_time_sec = parseFloat(
          item.end_time_sec ?? item.end_time ?? (Array.isArray(item.segment) ? item.segment[1] : 0)
        );
        const duration_sec = parseFloat(
          item.duration_sec ?? Math.max(0, end_time_sec - start_time_sec)
        );
        const score = parseFloat(item.score ?? item.confidence ?? 0);
        const label = item.label ?? item.label_name ?? 'dumping';
        return { start_time_sec, end_time_sec, duration_sec, score, label };
      })
      .filter((p) => p.score >= params.threshold)
      .slice(0, params.max_seg_num);
  };

  // Cancel ongoing request
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearInterval(timerIntervalRef.current);
    setIsLoading(false);
    setLoadingTime(0);
    showToast('Prediction request cancelled', 'info');
  };

  // Handler: Run Prediction
  const handlePredict = async () => {
    if (!activeVideo) {
      showToast('Please select or upload a video before running prediction.', 'error');
      return;
    }

    setIsLoading(true);
    setLoadingTime(0);
    timerIntervalRef.current = setInterval(() => {
      setLoadingTime((prev) => prev + 1);
    }, 1000);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Timeout of 300,000ms (5 minutes)
    const timeoutId = setTimeout(() => {
      abortController.abort('Request timed out after 5 minutes');
    }, 300000);

    try {
      let response;

      if (mode === 'pre-stored') {
        // Request: POST /api/predict
        // Headers: Content-Type: application/json
        const payload = {
          video_name: activeVideo.filename,
          checkpoint: params.checkpoint,
          threshold: Number(params.threshold),
          nms_type: params.nms_type,
          iou_threshold: Number(params.iou_threshold),
          max_seg_num: Number(params.max_seg_num),
        };
        if (params.nms_type === 'soft') {
          payload.sigma = Number(params.sigma);
        }

        response = await fetch('/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });
      } else {
        // Uploaded Video: FormData
        // Append fields: video, checkpoint, threshold, nms_type, iou_threshold, max_seg_num
        const formData = new FormData();
        formData.append('video', activeVideo); // File object
        formData.append('checkpoint', params.checkpoint);
        formData.append('threshold', String(params.threshold));
        formData.append('nms_type', params.nms_type);
        if (params.nms_type === 'hard') {
          formData.append('iou_threshold', String(params.iou_threshold));
        } else {
          formData.append('sigma', String(params.sigma));
        }
        formData.append('max_seg_num', String(params.max_seg_num));

        response = await fetch('/api/predict', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      const rawList = data.predictions || data.results || (Array.isArray(data) ? data : []);
      const normalized = normalizePredictions(rawList);
      setPredictions(normalized);
      showToast(`Prediction complete: Found ${normalized.length} action segment(s).`, 'success');

    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Request was aborted or reached 5-minute timeout.', 'error');
      } else {
        console.error('API error:', err);
        showToast(`Prediction failed: ${err.message || 'Unable to connect to inference server at ' + API_BASE_URL}`, 'error', 6000);
      }
    } finally {
      clearTimeout(timeoutId);
      clearInterval(timerIntervalRef.current);
      setIsLoading(false);
      setLoadingTime(0);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="tad-app-layout">
      {/* Top Header */}
      <ControlsHeader
        mode={mode}
        activeVideo={activeVideo}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Main Body with Sidebar + Dashboard Content */}
      <div className="tad-body-container">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          videos={videoManifest}
          activeVideo={activeVideo}
          mode={mode}
          onSelectPreStored={handleSelectPreStored}
          onUploadVideo={handleUploadVideo}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center/Right Content Area */}
        <main className="tad-main-content">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className={`toast-notification toast-${toastMessage.type}`}>
              {toastMessage.type === 'error' ? (
                <AlertCircleIcon className="toast-icon" />
              ) : (
                <CheckCircleIcon className="toast-icon" />
              )}
              <span className="toast-text">{toastMessage.message}</span>
              <button
                type="button"
                className="toast-dismiss-btn"
                onClick={() => setToastMessage(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Parameter Controls Panel */}
          <ParameterPanel
            params={params}
            setParams={setParams}
            onPredict={handlePredict}
            isLoading={isLoading}
            loadingTime={loadingTime}
            onCancelRequest={handleCancelRequest}
          />

          {/* Main Video Viewport & Timeline */}
          <VideoPlayer
            videoSrc={videoSrc}
            predictions={predictions}
            videoTitle={activeVideo ? (mode === 'upload' ? activeVideo.name : activeVideo.title) : ''}
            mode={mode}
          />

          {/* Predictions Table (appears when segments exist) */}
          <PredictionsTable
            predictions={predictions}
            onSeek={(t) => {
              const videoEl = document.querySelector('.main-html5-video');
              if (videoEl) {
                videoEl.currentTime = t;
              }
            }}
          />
        </main>
      </div>
    </div>
  );
}
