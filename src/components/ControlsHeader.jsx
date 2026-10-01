import React from 'react';
import { FilmIcon, UploadIcon, TargetIcon } from './Icons';

export default function ControlsHeader({ mode, activeVideo, apiBaseUrl }) {
  const getDisplayName = () => {
    if (!activeVideo) return 'No video loaded';
    if (mode === 'upload') {
      return activeVideo.name || 'Custom Upload';
    }
    return activeVideo.title || activeVideo.filename;
  };

  return (
    <header className="app-top-header">
      <div className="header-left">
        <div className="app-logo-badge">
          <TargetIcon className="logo-svg" />
        </div>
        <div className="header-titles">
          <div className="app-main-title">OpenTAD Inference Dashboard</div>
          <div className="app-sub-title">Temporal Action Detection & Dumping Monitoring</div>
        </div>
      </div>

      <div className="header-right">
        {/* Active Source Pill */}
        <div className={`source-pill ${!activeVideo ? 'source-none' : mode === 'upload' ? 'source-upload' : 'source-prestored'}`}>
          {mode === 'upload' ? (
            <UploadIcon className="source-icon" />
          ) : (
            <FilmIcon className="source-icon" />
          )}
          <span className="source-mode-name">
            {!activeVideo ? 'Status:' : mode === 'upload' ? 'Uploaded Video:' : 'Selected Video:'}
          </span>
          <span className="source-file-name" title={getDisplayName()}>
            {getDisplayName()}
          </span>
        </div>

        {/* Server Endpoint Indicator */}
        <div className="endpoint-pill" title={`Target API: ${apiBaseUrl}`}>
          <span className="endpoint-dot" />
          <span className="endpoint-label">API: {apiBaseUrl.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>
    </header>
  );
}
