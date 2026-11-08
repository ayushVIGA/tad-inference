import React from 'react';
import Tooltip from './Tooltip';
import { ZapIcon, SlidersIcon, LayersIcon, RefreshCwIcon } from './Icons';

export const DEFAULT_POSITIVES_PREFIX = 'exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint';

export function getPositivesCheckpointPath(epoch) {
  const epochNum = parseInt(epoch, 10) || 37;
  return `${DEFAULT_POSITIVES_PREFIX}/epoch_${epochNum}.pth`;
}

export default function ParameterPanel({
  params,
  setParams,
  onPredict,
  isLoading,
  loadingTime,
  onCancelRequest,
  onFullInference,
  isBatchRunning,
  batchProgress,
  onCancelBatch,
  totalVideos = 0,
}) {
  const isBusy = isLoading || isBatchRunning;

  const handleChange = (field, value) => {
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckpointModeSelect = (mode) => {
    if (isBusy) return;
    setParams((prev) => {
      let newCheckpoint = prev.checkpoint;
      if (mode === 'epoch') {
        newCheckpoint = getPositivesCheckpointPath(prev.epoch || 37);
      } else {
        newCheckpoint = prev.custom_checkpoint?.trim() || prev.checkpoint;
      }
      return {
        ...prev,
        checkpoint_mode: mode,
        checkpoint: newCheckpoint,
      };
    });
  };

  const handleEpochChange = (epochVal) => {
    const epochNum = parseInt(epochVal, 10);
    const validEpoch = isNaN(epochNum) ? '' : Math.max(1, epochNum);
    const newCheckpoint = getPositivesCheckpointPath(validEpoch);
    setParams((prev) => ({
      ...prev,
      epoch: validEpoch,
      checkpoint: newCheckpoint,
    }));
  };

  const handleCustomPathChange = (customPath) => {
    setParams((prev) => ({
      ...prev,
      custom_checkpoint: customPath,
      checkpoint: customPath.trim() || getPositivesCheckpointPath(prev.epoch || 37),
    }));
  };

  const handleResetDefaultCheckpoint = () => {
    const defaultPath = getPositivesCheckpointPath(37);
    setParams((prev) => ({
      ...prev,
      custom_checkpoint: defaultPath,
      checkpoint: defaultPath,
    }));
  };

  const currentMode = params.checkpoint_mode || 'epoch';

  return (
    <div className="parameter-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <SlidersIcon className="panel-title-icon" />
          <h3 className="panel-title">TAD Inference Parameters</h3>
        </div>
      </div>

      <div className="parameters-grid">
        {/* Model Architecture & Checkpoint Selection */}
        <div className="checkpoint-generator-card full-span">
          <div className="param-label-row">
            <span className="param-label">Model Checkpoint Configuration (Positives Model)</span>
            <Tooltip content="Select checkpoint by epoch number (auto-generates standard path for the positives model) or provide a custom checkpoint path." />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="checkpoint-mode-selector">
            <button
              type="button"
              className={`checkpoint-mode-tab ${currentMode === 'epoch' ? 'active' : ''}`}
              onClick={() => handleCheckpointModeSelect('epoch')}
              disabled={isBusy}
            >
              <span className="mode-tab-dot"></span>
              Standard Epoch (Positives)
            </button>
            <button
              type="button"
              className={`checkpoint-mode-tab ${currentMode === 'custom' ? 'active' : ''}`}
              onClick={() => handleCheckpointModeSelect('custom')}
              disabled={isBusy}
            >
              <span className="mode-tab-dot"></span>
              Custom Model Checkpoint Path
            </button>
          </div>

          {/* Content based on Mode */}
          {currentMode === 'epoch' ? (
            /* Epoch Input and Preset Buttons */
            <div className="epoch-control-row">
              <div className="epoch-input-group">
                <label htmlFor="epoch-input" className="epoch-input-label">
                  Target Epoch:
                </label>
                <input
                  id="epoch-input"
                  type="number"
                  min="1"
                  max="200"
                  className="epoch-number-input"
                  value={params.epoch}
                  onChange={(e) => handleEpochChange(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <div className="epoch-presets-group">
                <span className="presets-label">Preset:</span>
                <button
                  type="button"
                  className={`epoch-preset-btn ${params.epoch === 37 ? 'active' : ''}`}
                  onClick={() => handleEpochChange(37)}
                  disabled={isBusy}
                >
                  Epoch 37 (Best)
                </button>
              </div>
            </div>
          ) : (
            /* Custom Model Path Input */
            <div className="custom-checkpoint-row">
              <div className="custom-input-wrapper">
                <label htmlFor="custom-checkpoint-input" className="custom-input-label">
                  Custom Model Path:
                </label>
                <input
                  id="custom-checkpoint-input"
                  type="text"
                  className="custom-checkpoint-input"
                  placeholder="e.g. exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_37.pth"
                  value={params.custom_checkpoint ?? ''}
                  onChange={(e) => handleCustomPathChange(e.target.value)}
                  disabled={isBusy}
                />
                <button
                  type="button"
                  className="custom-reset-btn"
                  title="Fill with default Epoch 37 path"
                  onClick={handleResetDefaultCheckpoint}
                  disabled={isBusy}
                >
                  <RefreshCwIcon size={12} />
                  Default
                </button>
              </div>
            </div>
          )}

          {/* Active Checkpoint Path Preview Box */}
          <div className="checkpoint-path-preview">
            <span className="preview-label">Active Checkpoint Path:</span>
            <code className="preview-path" title={params.checkpoint}>
              {params.checkpoint}
            </code>
          </div>
        </div>

        {/* Confidence Threshold */}
        <div className="param-item">
          <div className="param-label-row">
            <label htmlFor="threshold-slider" className="param-label">
              Confidence Threshold
            </label>
            <span className="param-val-badge">{Number(params.threshold).toFixed(2)}</span>
            <Tooltip content="Minimum confidence score required for an action proposal to be kept." />
          </div>
          <div className="param-slider-wrapper">
            <input
              id="threshold-slider"
              type="range"
              min="0.01"
              max="1.00"
              step="0.01"
              value={params.threshold}
              onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
              disabled={isBusy}
              className="param-range-slider"
            />
            <input
              type="number"
              min="0.01"
              max="1.00"
              step="0.01"
              value={params.threshold}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleChange('threshold', Math.min(1.0, Math.max(0.01, val)));
              }}
              disabled={isBusy}
              className="param-number-mini"
            />
          </div>
        </div>

        {/* NMS Type */}
        <div className="param-item">
          <div className="param-label-row">
            <span className="param-label">NMS Type</span>
            <Tooltip content="Non-Maximum Suppression method. 'Hard' strictly eliminates overlapping duplicates based on IoU. 'Soft' decays duplicate scores." />
          </div>
          <div className="nms-toggle-group">
            <button
              type="button"
              className={`nms-btn ${params.nms_type === 'hard' ? 'active' : ''}`}
              onClick={() => handleChange('nms_type', 'hard')}
              disabled={isBusy}
            >
              Hard NMS
            </button>
            <button
              type="button"
              className={`nms-btn ${params.nms_type === 'soft' ? 'active' : ''}`}
              onClick={() => handleChange('nms_type', 'soft')}
              disabled={isBusy}
            >
              Soft NMS
            </button>
          </div>
        </div>

        {/* IoU Threshold (Visible only when nms_type === 'hard') */}
        {params.nms_type === 'hard' && (
          <div className="param-item">
            <div className="param-label-row">
              <label htmlFor="iou-slider" className="param-label">
                IoU Threshold
              </label>
              <span className="param-val-badge">{Number(params.iou_threshold).toFixed(2)}</span>
              <Tooltip content="Overlap threshold (tIoU) above which candidate segments are eliminated." />
            </div>
            <div className="param-slider-wrapper">
              <input
                id="iou-slider"
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={params.iou_threshold}
                onChange={(e) => handleChange('iou_threshold', parseFloat(e.target.value))}
                disabled={isBusy}
                className="param-range-slider"
              />
              <input
                type="number"
                min="0.05"
                max="0.95"
                step="0.01"
                value={params.iou_threshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) handleChange('iou_threshold', Math.min(0.95, Math.max(0.05, val)));
                }}
                disabled={isBusy}
                className="param-number-mini"
              />
            </div>
          </div>
        )}

        {/* Sigma (Visible only when nms_type === 'soft') */}
        {params.nms_type === 'soft' && (
          <div className="param-item">
            <div className="param-label-row">
              <label htmlFor="sigma-input" className="param-label">
                Sigma (Soft Penalty)
              </label>
              <Tooltip content="Gaussian penalty parameter for decaying overlapping scores." />
            </div>
            <input
              id="sigma-input"
              type="number"
              step="0.05"
              min="0.05"
              max="2.00"
              className="param-text-input"
              value={params.sigma}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleChange('sigma', val);
              }}
              disabled={isBusy}
            />
          </div>
        )}

        {/* Max Segments */}
        <div className="param-item">
          <div className="param-label-row">
            <label htmlFor="max-seg-input" className="param-label">
              Max Segments
            </label>
            <Tooltip content="Maximum number of top-scoring action segments to return." />
          </div>
          <input
            id="max-seg-input"
            type="number"
            min="1"
            max="100"
            className="param-text-input"
            value={params.max_seg_num}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) handleChange('max_seg_num', Math.max(1, val));
            }}
            disabled={isBusy}
          />
        </div>

        {/* Action Button Container */}
        <div className="param-action-wrapper">
          {isLoading ? (
            <div className="loading-state-box">
              <div className="loading-spinner"></div>
              <div className="loading-info">
                <span className="loading-text">Predicting Current Video...</span>
                <span className="loading-timer">{loadingTime}s elapsed</span>
              </div>
              <button
                type="button"
                onClick={onCancelRequest}
                className="cancel-btn"
                title="Cancel ongoing request"
              >
                Cancel
              </button>
            </div>
          ) : isBatchRunning ? (
            <div className="loading-state-box batch-loading-box">
              <div className="loading-spinner"></div>
              <div className="loading-info">
                <span className="loading-text">
                  Full Inference: {batchProgress?.currentIdx || 0} / {batchProgress?.total || totalVideos}
                </span>
                <span className="loading-timer" title={batchProgress?.currentVideo || ''}>
                  {batchProgress?.currentVideo ? `Processing: ${batchProgress.currentVideo}` : 'Starting batch...'}
                </span>
                <div className="batch-progress-bar-container">
                  <div
                    className="batch-progress-bar-fill"
                    style={{
                      width: `${
                        batchProgress?.total
                          ? Math.round(((batchProgress.currentIdx || 0) / batchProgress.total) * 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancelBatch}
                className="cancel-btn"
                title="Halt full inference batch"
              >
                Stop Batch
              </button>
            </div>
          ) : (
            <div className="action-buttons-group">
              <button
                type="button"
                id="btn-predict"
                className="predict-button"
                onClick={onPredict}
                title="Run inference for currently selected/uploaded video"
              >
                <ZapIcon className="predict-icon" />
                <span>Run TAD Prediction</span>
              </button>

              {totalVideos > 0 && (
                <button
                  type="button"
                  id="btn-full-inference"
                  className="full-inference-button"
                  onClick={onFullInference}
                  title={`Run inference for all ${totalVideos} server videos sequentially`}
                >
                  <LayersIcon className="full-inference-icon" />
                  <span>Full Inference ({totalVideos} Videos)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
