import React, { useRef, useState, useMemo } from 'react';
import {
  FilmIcon,
  UploadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  VideoCameraIcon,
  SearchIcon,
  XIcon,
  FilterIcon,
  TrashIcon,
} from './Icons';

export default function Sidebar({
  videos = [],
  activeVideo,
  mode, // 'pre-stored' | 'upload'
  onSelectPreStored,
  onUploadVideo,
  isCollapsed,
  onToggleCollapse,
  batchResults = {},
  onClearBatchResults,
}) {
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'detections' | 'clean' | 'unprocessed'

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onUploadVideo(file);
    }
  };

  // Compute summary stats across all server videos
  const stats = useMemo(() => {
    let detections = 0;
    let clean = 0;
    let unprocessed = 0;

    videos.forEach((v) => {
      const res = batchResults[v.filename];
      if (!res || res.status === 'pending') {
        unprocessed++;
      } else if (res.status === 'completed') {
        if (res.count > 0 || (Array.isArray(res.predictions) && res.predictions.length > 0)) {
          detections++;
        } else {
          clean++;
        }
      } else {
        unprocessed++;
      }
    });

    const analyzed = detections + clean;
    return { all: videos.length, detections, clean, unprocessed, analyzed };
  }, [videos, batchResults]);

  // Filter videos matching both category and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((item) => {
      const res = batchResults[item.filename];
      const isCompleted = res && res.status === 'completed';
      const hasDetections = isCompleted && (res.count > 0 || res.predictions?.length > 0);
      const isClean = isCompleted && (!res.count || res.count === 0);

      if (categoryFilter === 'detections' && !hasDetections) return false;
      if (categoryFilter === 'clean' && !isClean) return false;
      if (categoryFilter === 'unprocessed' && isCompleted) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const title = (item.title || '').toLowerCase();
      const filename = (item.filename || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(q) || filename.includes(q) || desc.includes(q);
    });
  }, [videos, batchResults, categoryFilter, searchQuery]);

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-title-group">
            <span className="sidebar-badge">Video Repository</span>
            <h2 className="sidebar-heading">Video Library</h2>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      {!isCollapsed ? (
        <div className="sidebar-content">
          {/* Upload Dropzone / Button */}
          <div
            className={`upload-dropzone ${mode === 'upload' ? 'dropzone-active' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/avi,video/quicktime,video/webm,.mp4,.avi,.mov,.webm"
              style={{ display: 'none' }}
            />
            <div className="upload-icon-wrapper">
              <UploadIcon className="upload-icon" />
            </div>
            <div className="upload-text-group">
              <span className="upload-title">Upload Video</span>
              <span className="upload-subtitle">Drop MP4, AVI, MOV, WEBM</span>
            </div>
          </div>

          {/* Active Upload Info if in Upload Mode */}
          {mode === 'upload' && activeVideo && (
            <div className="active-upload-pill">
              <div className="active-upload-icon-box">
                <VideoCameraIcon />
              </div>
              <div className="active-upload-details">
                <span className="active-upload-tag">Active Upload</span>
                <span className="active-upload-name" title={activeVideo.name}>
                  {activeVideo.name}
                </span>
                <span className="active-upload-size">
                  {(activeVideo.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}

          {/* Stored Videos List */}
          <div className="prestored-section">
            <div className="section-label-row">
              <span className="section-label">Server Videos</span>
              <span className="section-count">
                {stats.analyzed > 0
                  ? `${stats.analyzed}/${videos.length} analyzed`
                  : `${videos.length} videos`}
              </span>
            </div>

            {/* Real-time Search Box */}
            <div className="sidebar-search-box">
              <SearchIcon className="search-box-icon" size={14} />
              <input
                type="text"
                className="sidebar-search-input"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <XIcon size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills (All / Detections / Clean / Pending) */}
            <div className="category-filter-bar">
              <button
                type="button"
                className={`category-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                All ({stats.all})
              </button>
              <button
                type="button"
                className={`category-pill pill-detections ${
                  categoryFilter === 'detections' ? 'active' : ''
                } ${stats.detections > 0 ? 'has-items' : ''}`}
                onClick={() => setCategoryFilter('detections')}
                title="Videos with detected dumping actions"
              >
                🚨 Detections ({stats.detections})
              </button>
              <button
                type="button"
                className={`category-pill pill-clean ${
                  categoryFilter === 'clean' ? 'active' : ''
                } ${stats.clean > 0 ? 'has-items' : ''}`}
                onClick={() => setCategoryFilter('clean')}
                title="Videos evaluated with zero detections"
              >
                ✓ Clean ({stats.clean})
              </button>
              {stats.unprocessed > 0 && stats.analyzed > 0 && (
                <button
                  type="button"
                  className={`category-pill pill-unprocessed ${
                    categoryFilter === 'unprocessed' ? 'active' : ''
                  }`}
                  onClick={() => setCategoryFilter('unprocessed')}
                  title="Videos not yet analyzed"
                >
                  Pending ({stats.unprocessed})
                </button>
              )}
            </div>

            {/* Cache Summary / Reset Action */}
            {stats.analyzed > 0 && (
              <div className="cache-info-row">
                <span className="cache-status-text">
                  Cached predictions: <strong>{stats.analyzed}</strong> video{stats.analyzed > 1 ? 's' : ''}
                </span>
                {onClearBatchResults && (
                  <button
                    type="button"
                    className="clear-cache-btn"
                    onClick={onClearBatchResults}
                    title="Clear cached inference results"
                  >
                    <TrashIcon size={12} />
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Video List */}
            <div className="prestored-list">
              {filteredVideos.map((item) => {
                const isSelected = mode === 'pre-stored' && activeVideo?.filename === item.filename;
                const res = batchResults[item.filename];
                const isCompleted = res && res.status === 'completed';
                const hasDetections = isCompleted && (res.count > 0 || res.predictions?.length > 0);
                const isClean = isCompleted && (!res.count || res.count === 0);
                const hasError = res && res.status === 'error';

                return (
                  <button
                    key={item.id || item.filename}
                    type="button"
                    className={`video-item-card ${isSelected ? 'selected' : ''} ${
                      hasDetections ? 'item-has-detections' : ''
                    }`}
                    onClick={() => onSelectPreStored(item)}
                  >
                    <div
                      className={`video-thumb-icon ${
                        hasDetections
                          ? 'thumb-detected'
                          : isClean
                          ? 'thumb-clean'
                          : ''
                      }`}
                    >
                      <FilmIcon className="thumb-film-icon" />
                      {item.duration_sec && (
                        <span className="thumb-duration">{item.duration_sec}s</span>
                      )}
                    </div>
                    <div className="video-item-info">
                      <div className="video-item-title-row">
                        <span className="video-item-title" title={item.title || item.filename}>
                          {item.title || item.filename}
                        </span>
                      </div>
                      <div className="video-item-filename">{item.filename}</div>

                      {/* Prediction Status Badge */}
                      <div className="video-status-badge-row">
                        {hasDetections && (
                          <span
                            className="video-status-badge badge-detected"
                            title={`${res.count} dumping segment(s) detected`}
                          >
                            🚨 {res.count} detection{res.count > 1 ? 's' : ''} ({Number(res.maxScore).toFixed(2)})
                          </span>
                        )}
                        {isClean && (
                          <span
                            className="video-status-badge badge-clean"
                            title="Evaluated: 0 dumping segments"
                          >
                            ✓ Clean (0 events)
                          </span>
                        )}
                        {hasError && (
                          <span
                            className="video-status-badge badge-error"
                            title={res.error || 'Prediction failed'}
                          >
                            ⚠ Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="selected-indicator" title="Currently Loaded">
                        <span className="indicator-dot"></span>
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredVideos.length === 0 && (
                <div className="empty-videos-state">
                  {searchQuery.trim()
                    ? `No videos match "${searchQuery}"`
                    : categoryFilter === 'detections'
                    ? 'No videos with detected dumping yet.'
                    : categoryFilter === 'clean'
                    ? 'No clean videos found in this filter.'
                    : categoryFilter === 'unprocessed'
                    ? 'All videos have been processed!'
                    : 'No videos found in library.'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Icon Strip */
        <div className="collapsed-strip">
          <button
            type="button"
            className="collapsed-action-btn"
            title="Upload Video"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/avi,video/quicktime,video/webm,.mp4,.avi,.mov,.webm"
              style={{ display: 'none' }}
            />
          </button>
          <div className="collapsed-divider"></div>
          {videos.map((item) => {
            const isSelected = mode === 'pre-stored' && activeVideo?.filename === item.filename;
            const res = batchResults[item.filename];
            const hasDetections = res?.status === 'completed' && (res.count > 0 || res.predictions?.length > 0);
            const isClean = res?.status === 'completed' && (!res.count || res.count === 0);

            return (
              <button
                key={item.id || item.filename}
                type="button"
                className={`collapsed-video-btn ${isSelected ? 'selected' : ''} ${
                  hasDetections ? 'collapsed-detected' : ''
                }`}
                title={`${item.title || item.filename}${
                  hasDetections
                    ? ` • 🚨 ${res.count} detection(s)`
                    : isClean
                    ? ' • ✓ Clean'
                    : ''
                }`}
                onClick={() => onSelectPreStored(item)}
              >
                <FilmIcon />
                {hasDetections && <span className="collapsed-alert-dot"></span>}
                {isClean && <span className="collapsed-clean-dot"></span>}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
