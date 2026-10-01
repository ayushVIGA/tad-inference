import React from 'react';
import { PlayIcon, CheckCircleIcon } from './Icons';

export default function PredictionsTable({
  predictions = [],
  currentTime = 0,
  onSeek
}) {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const formatSecs = (val) => {
    if (val === undefined || isNaN(val)) return '0.0s';
    return `${Number(val).toFixed(2)}s`;
  };

  return (
    <div className="predictions-table-card">
      <div className="table-header-row">
        <div className="table-title-group">
          <CheckCircleIcon className="table-success-icon" />
          <h4 className="table-title">Detected Action Proposals</h4>
          <span className="table-count-pill">{predictions.length} segments</span>
        </div>
        <span className="table-caption-hint">Click any row to jump video playback to that segment</span>
      </div>

      <div className="table-scroll-container">
        <table className="detection-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Class Label</th>
              <th>Confidence</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((seg, idx) => {
              const isCurrentlyActive =
                currentTime >= seg.start_time_sec && currentTime <= seg.end_time_sec;
              const scoreNum = Number(seg.score).toFixed(3);
              const durationSec = seg.duration_sec ?? (seg.end_time_sec - seg.start_time_sec);

              return (
                <tr
                  key={idx}
                  className={`detection-row ${isCurrentlyActive ? 'row-active-detection' : ''}`}
                  onClick={() => onSeek(seg.start_time_sec)}
                >
                  <td className="row-rank">#{idx + 1}</td>
                  <td>
                    <span className="detection-badge-label">
                      {seg.label || 'dumping'}
                    </span>
                  </td>
                  <td>
                    <div className="confidence-cell">
                      <div className="confidence-track">
                        <div
                          className="confidence-fill"
                          style={{ width: `${Math.min(100, Math.max(0, seg.score * 100))}%` }}
                        />
                      </div>
                      <span className="confidence-text">{scoreNum}</span>
                    </div>
                  </td>
                  <td className="time-mono">{formatSecs(seg.start_time_sec)}</td>
                  <td className="time-mono">{formatSecs(seg.end_time_sec)}</td>
                  <td className="time-mono">{formatSecs(durationSec)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="jump-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(seg.start_time_sec);
                      }}
                      title={`Jump to ${formatSecs(seg.start_time_sec)}`}
                    >
                      <PlayIcon className="jump-icon" />
                      <span>Jump</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
