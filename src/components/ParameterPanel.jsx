import React from 'react';
import Tooltip from './Tooltip';
import { ZapIcon, RefreshCwIcon, SlidersIcon } from './Icons';

function getCheckpointPath(modelType, epoch) {
  const epochNum = parseInt(epoch, 10) || 1;
  if (modelType === 'negatives') {
    return `exps/custom/tridet_videomaev2_1class_neg/gpu1_id0/checkpoint/epoch_${epochNum}.pth`;
  }
  return `exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_${epochNum}.pth`;
}

export default function ParameterPanel({
  params,
  setParams,
  onPredict,
  isLoading,
  loadingTime,
  onCancelRequest
}) {
  const handleChange = (field, value) => {
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModelTypeSelect = (newType) => {
    let newEpoch = params.epoch;
    if (newType === 'negatives' && params.epoch === 37) {
      newEpoch = 14;
    } else if (newType === 'positives' && (params.epoch === 14 || params.epoch === 17)) {
      newEpoch = 37;
    }
    const newCheckpoint = getCheckpointPath(newType, newEpoch);
    setParams((prev) => ({
      ...prev,
      model_type: newType,
      epoch: newEpoch,
      checkpoint: newCheckpoint,
    }));
  };

  const handleEpochChange = (epochVal) => {
    const epochNum = parseInt(epochVal, 10);
    const validEpoch = isNaN(epochNum) ? '' : Math.max(1, epochNum);
    const newCheckpoint = getCheckpointPath(params.model_type || 'positives', validEpoch);
    setParams((prev) => ({
      ...prev,
      epoch: validEpoch,
      checkpoint: newCheckpoint,
    }));
  };

  return (
    <div className="parameter-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <SlidersIcon className="panel-title-icon" />
          <h3 className="panel-title">TAD Inference Parameters</h3>
        </div>
      </div>

      <div className="parameters-grid">
        {/* Model Variant & Epoch Generator Card */}
        <div className="checkpoint-generator-card full-span">
          <div className="param-label-row">
            <span className="param-label">Model Architecture & Epoch</span>
            <Tooltip content="Choose the model training variant and enter the target training epoch. The checkpoint path is generated automatically." />
          </div>

          <div className="model-variant-grid">
            {/* Option 1 (Left): Only Positives */}
            <div
              className={`model-option-card ${params.model_type === 'positives' ? 'selected' : ''}`}
              onClick={() => !isLoading && handleModelTypeSelect('positives')}
            >
              <div className="model-radio-circle">
                {params.model_type === 'positives' && <span className="radio-inner-dot"></span>}
              </div>
              <div className="model-option-content">
                <div className="model-option-title">Only Positives</div>
                <div className="model-option-desc">Trained only with dumping videos</div>
                <div className="model-recommendation-tag">
                  Best: <strong>Epoch 37</strong>
                </div>
              </div>
            </div>

            {/* Option 2 (Right): Model with Negatives */}
            <div
              className={`model-option-card ${params.model_type === 'negatives' ? 'selected' : ''}`}
              onClick={() => !isLoading && handleModelTypeSelect('negatives')}
            >
              <div className="model-radio-circle">
                {params.model_type === 'negatives' && <span className="radio-inner-dot"></span>}
              </div>
              <div className="model-option-content">
                <div className="model-option-title">Model with Negatives</div>
                <div className="model-option-desc">Trained with more negative samples</div>
                <div className="model-recommendation-tag">
                  Best: <strong>Epoch 14</strong> (or <strong>17</strong>)
                </div>
              </div>
            </div>
          </div>

          {/* Epoch Input and Preset Buttons */}
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
                disabled={isLoading}
              />
            </div>

            {/* Quick Epoch Buttons based on selected model */}
            <div className="epoch-presets-group">
              <span className="presets-label">Recommended:</span>
              {params.model_type === 'negatives' ? (
                <>
                  <button
                    type="button"
                    className={`epoch-preset-btn ${params.epoch === 14 ? 'active' : ''}`}
                    onClick={() => handleEpochChange(14)}
                    disabled={isLoading}
                  >
                    Epoch 14 (Best)
                  </button>
                  <button
                    type="button"
                    className={`epoch-preset-btn ${params.epoch === 17 ? 'active' : ''}`}
                    onClick={() => handleEpochChange(17)}
                    disabled={isLoading}
                  >
                    Epoch 17
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={`epoch-preset-btn ${params.epoch === 37 ? 'active' : ''}`}
                  onClick={() => handleEpochChange(37)}
                  disabled={isLoading}
                >
                  Epoch 37 (Best)
                </button>
              )}
            </div>
          </div>

          {/* Generated Checkpoint Path Preview Box */}
          <div className="checkpoint-path-preview">
            <span className="preview-label">Generated Checkpoint Path:</span>
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            >
              Hard NMS
            </button>
            <button
              type="button"
              className={`nms-btn ${params.nms_type === 'soft' ? 'active' : ''}`}
              onClick={() => handleChange('nms_type', 'soft')}
              disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        {/* Action Button Container */}
        <div className="param-action-wrapper">
          {isLoading ? (
            <div className="loading-state-box">
              <div className="loading-spinner"></div>
              <div className="loading-info">
                <span className="loading-text">Extracting TAD Features & Detecting...</span>
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
          ) : (
            <button
              type="button"
              id="btn-predict"
              className="predict-button"
              onClick={onPredict}
            >
              <ZapIcon className="predict-icon" />
              <span>Run TAD Prediction</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
