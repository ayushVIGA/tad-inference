import React, { useRef, useState } from 'react';
import { FilmIcon, UploadIcon, ChevronLeftIcon, ChevronRightIcon, VideoCameraIcon, SearchIcon, XIcon } from './Icons';

export default function Sidebar({
  videos = [],
  activeVideo,
  mode, // 'pre-stored' | 'upload'
  onSelectPreStored,
  onUploadVideo,
  isCollapsed,
  onToggleCollapse
}) {
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
      // Reset input so same file can be selected again if desired
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

  // Filter videos matching query in real time
  const filteredVideos = videos.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const title = (item.title || '').toLowerCase();
    const filename = (item.filename || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    return title.includes(q) || filename.includes(q) || desc.includes(q);
  });

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
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                {searchQuery.trim() ? `${filteredVideos.length} of ${videos.length}` : `${videos.length} videos`}
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

            <div className="prestored-list">
              {filteredVideos.map((item) => {
                const isSelected = mode === 'pre-stored' && activeVideo?.filename === item.filename;
                return (
                  <button
                    key={item.id || item.filename}
                    type="button"
                    className={`video-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectPreStored(item)}
                  >
                    <div className="video-thumb-icon">
                      <FilmIcon className="thumb-film-icon" />
                      {item.duration_sec && (
                        <span className="thumb-duration">{item.duration_sec}s</span>
                      )}
                    </div>
                    <div className="video-item-info">
                      <div className="video-item-title" title={item.title || item.filename}>
                        {item.title || item.filename}
                      </div>
                      <div className="video-item-filename">{item.filename}</div>
                      {item.description && (
                        <div className="video-item-desc">{item.description}</div>
                      )}
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
                  {searchQuery.trim() ? `No videos match "${searchQuery}"` : "No videos found in library."}
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
            return (
              <button
                key={item.id || item.filename}
                type="button"
                className={`collapsed-video-btn ${isSelected ? 'selected' : ''}`}
                title={item.title || item.filename}
                onClick={() => onSelectPreStored(item)}
              >
                <FilmIcon />
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
