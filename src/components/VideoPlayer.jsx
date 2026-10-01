import React, { useRef, useState, useEffect } from 'react';
import Timeline from './Timeline';
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  VolumeMuteIcon,
  MaximizeIcon,
  MinimizeIcon,
  AlertCircleIcon
} from './Icons';

export default function VideoPlayer({
  videoSrc,
  predictions = [],
  videoTitle,
  mode
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);

  // Synchronize playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Synchronize volume / mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Reset state when video source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveSegment(null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [videoSrc]);

  // Fullscreen change listener across all browser engines
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Time update listener & Real-Time Dumping Detection HUD
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Check if current time falls within any detected segment
    if (predictions && predictions.length > 0) {
      const match = predictions.find(
        (seg) => cur >= seg.start_time_sec && cur <= seg.end_time_sec
      );
      setActiveSegment(match || null);
    } else {
      setActiveSegment(null);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (timeInSecs) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timeInSecs;
    setCurrentTime(timeInSecs);
  };

  const handleSegmentClick = (segment) => {
    handleSeek(segment.start_time_sec);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const isFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (!isFs) {
      const elem = containerRef.current;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const formatClock = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isDumpingActive = Boolean(activeSegment);

  return (
    <div className="player-section-wrapper">
      {/* Container with dynamic border per requirements:
          - If active in a dumping segment: border: 3px solid #ef4444
          - If outside dumping segments: neutral subtle border
      */}
      <div
        ref={containerRef}
        className={`video-viewport-card ${isFullscreen ? 'is-fullscreen' : ''} ${isDumpingActive ? 'dumping-active-border' : 'neutral-border'}`}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          zIndex: 99999,
          borderRadius: 0,
          border: 'none',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000000',
          overflow: 'hidden'
        } : undefined}
      >
        {/* Real-Time Dumping Detection HUD Overlay */}
        {isDumpingActive && (
          <div className="dumping-detection-badge">
            <span className="dumping-pulse-dot" />
            <AlertCircleIcon className="dumping-icon" />
            <span className="dumping-text">
              Dumping detected: {Number(activeSegment.score).toFixed(2)}
            </span>
          </div>
        )}

        {/* Video Element */}
        <div 
          className="video-media-wrapper" 
          onClick={togglePlay}
          style={isFullscreen ? {
            flex: '1 1 0%',
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          } : undefined}
        >
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="main-html5-video"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              preload="none"
              playsInline
              style={isFullscreen ? {
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              } : undefined}
            />
          ) : (
            <div className="video-empty-state">
              <p>No video selected. Select a video from the library or upload a video.</p>
            </div>
          )}

          {/* Centered Large Play Button when paused */}
          {!isPlaying && videoSrc && (
            <div className="video-center-play-overlay">
              <div className="center-play-circle">
                <PlayIcon className="center-play-icon" />
              </div>
            </div>
          )}
        </div>

        {/* Custom Video Controls Bar */}
        <div 
          className="video-controls-bar"
          style={isFullscreen ? {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 100,
            background: 'linear-gradient(0deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 70%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '14px 24px'
          } : undefined}
        >
          {/* Play/Pause Button */}
          <button
            type="button"
            className="ctrl-btn play-pause-btn"
            onClick={togglePlay}
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* Seek Progress Bar */}
          <div className="ctrl-seek-wrapper">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.05"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="ctrl-seek-slider"
            />
          </div>

          {/* Time Counter */}
          <div className="ctrl-time-label">
            <span>{formatClock(currentTime)}</span>
            <span className="ctrl-time-slash">/</span>
            <span>{formatClock(duration)}</span>
          </div>

          {/* Volume Control */}
          <div className="ctrl-volume-group">
            <button
              type="button"
              className="ctrl-btn volume-btn"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="ctrl-volume-slider"
              title="Volume"
            />
          </div>

          {/* Playback Speed Selector */}
          <div className="ctrl-speed-group">
            <select
              className="ctrl-speed-select"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              title="Playback Speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            className="ctrl-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
          </button>
        </div>
      </div>

      {/* Visual Interactive Timeline (Below Video) */}
      <Timeline
        duration={duration}
        currentTime={currentTime}
        segments={predictions}
        onSeek={handleSeek}
        onSegmentClick={handleSegmentClick}
      />
    </div>
  );
}
