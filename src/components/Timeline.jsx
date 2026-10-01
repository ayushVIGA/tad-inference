import React, { useRef, useState } from 'react';

export default function Timeline({
  duration = 0,
  currentTime = 0,
  segments = [],
  onSeek,
  onSegmentClick
}) {
  const trackRef = useRef(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Format seconds to mm:ss.ss or mm:ss
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTrackClick = (e) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    onSeek(targetTime);
  };

  const handleMouseMove = (e) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    setHoverTime(ratio * duration);
    setTooltipPos({ x: e.clientX, y: rect.top - 10 });
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoveredSegment(null);
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline-container">
      <div className="timeline-header-row">
        <div className="timeline-title-group">
          <span className="timeline-title">Temporal Action Detection Timeline</span>
          {segments.length > 0 ? (
            <span className="timeline-badge-found">
              {segments.length} {segments.length === 1 ? 'Action Segment' : 'Action Segments'} Detected
            </span>
          ) : (
            <span className="timeline-badge-idle">No Action Segments Detected</span>
          )}
        </div>
        <div className="timeline-time-display">
          <span className="time-current">{formatTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span className="time-total">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Track */}
      <div
        ref={trackRef}
        className="timeline-track"
        onClick={handleTrackClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Empty placeholder guide markers when no segments */}
        {segments.length === 0 && (
          <div className="timeline-empty-placeholder">
            <span className="empty-placeholder-text">
              {duration > 0 ? "Timeline ready — Run prediction to view detected action proposals" : "No video loaded"}
            </span>
          </div>
        )}

        {/* Time notch grid lines */}
        <div className="timeline-grid-notches">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="timeline-notch"
              style={{ left: `${percent}%` }}
            >
              <span className="notch-time">
                {duration > 0 ? formatTime((percent / 100) * duration) : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Render Action Segments */}
        {segments.map((seg, idx) => {
          if (duration <= 0) return null;
          const startPercent = Math.max(0, (seg.start_time_sec / duration) * 100);
          const segDuration = seg.duration_sec ?? (seg.end_time_sec - seg.start_time_sec);
          const widthPercent = Math.min(100 - startPercent, Math.max(1.5, (segDuration / duration) * 100));
          const isCurrentlyActive = currentTime >= seg.start_time_sec && currentTime <= seg.end_time_sec;

          return (
            <div
              key={idx}
              className={`timeline-segment ${isCurrentlyActive ? 'active-segment-pulse' : ''}`}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSegmentClick(seg);
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredSegment(seg);
                setTooltipPos({ x: e.clientX, y: e.clientY - 12 });
              }}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="segment-inner">
                <span className="segment-label-text">
                  {seg.label || 'Dumping'} ({Number(seg.score).toFixed(2)})
                </span>
              </div>
            </div>
          );
        })}

        {/* Hover scrub guide line */}
        {hoverTime !== null && duration > 0 && (
          <div
            className="timeline-hover-line"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          />
        )}

        {/* Live Playhead Needle */}
        {duration > 0 && (
          <div
            className="timeline-playhead"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="playhead-needle" />
            <div className="playhead-handle" />
          </div>
        )}
      </div>

      {/* Segment Floating Hover Tooltip */}
      {hoveredSegment && (
        <div
          className="segment-hover-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="tooltip-tag-row">
            <span className="tooltip-action-name">{hoveredSegment.label || 'Dumping'}</span>
            <span className="tooltip-score-badge">
              Score: {Number(hoveredSegment.score).toFixed(3)}
            </span>
          </div>
          <div className="tooltip-range">
            {formatTime(hoveredSegment.start_time_sec)} ➔ {formatTime(hoveredSegment.end_time_sec)} (
            {(hoveredSegment.end_time_sec - hoveredSegment.start_time_sec).toFixed(1)}s)
          </div>
          <div className="tooltip-hint">Click segment to seek</div>
        </div>
      )}
    </div>
  );
}
