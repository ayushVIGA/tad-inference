# OpenTAD Inference Dashboard

A clean, modern, light-themed web frontend for **Temporal Action Detection (TAD)** and illegal dumping monitoring, built with **React + Vite**.

---

## Features

- **Video Library**: Collapsible left sidebar listing surveillance videos located in `public/videos/` with metadata defined in `manifest.json`.
- **On-Demand Loading**: Videos are never preloaded on startup. A video is only loaded when selected or uploaded, ensuring fast initial page loads.
- **Custom Video Upload**: Drag-and-drop or file selector supporting `.mp4`, `.avi`, `.mov`, and `.webm` formats using `URL.createObjectURL`.
- **Inference Parameter Controls**:
  - **Two Model Variants with Automatic Path Generation**:
    - **Model with Negatives**: `exps/custom/tridet_videomaev2_1class_neg/gpu1_id0/checkpoint/epoch_<number>.pth` *(Best: Epoch 14, or Epoch 17)*
    - **Only Positives**: `exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_<number>.pth` *(Best: Epoch 37)*
  - **Epoch Number Input & Quick Presets**: Enter any target epoch number with one-click recommendation presets (`Epoch 14 (Best)`, `Epoch 17`, `Epoch 37 (Best)`).
  - Confidence threshold slider and number input (`0.01` – `1.00`)
  - NMS Type toggle (`hard` vs `soft`)
  - Conditional IoU threshold slider (`hard` NMS) and Sigma parameter (`soft` NMS)
  - Max segments limit selector
  - Informational `(?)` tooltips for each parameter
- **Real-Time Dumping Detection HUD**:
  - Dynamically triggers a **3px solid red border** (`#ef4444`) around the video container whenever playback enters a detected dumping action window.
  - Displays a high-contrast alert badge in the top-right corner showing the raw score: `Dumping detected: <score>` (e.g. `0.94`).
  - Automatically returns to a subtle neutral border when outside detected intervals.
- **Interactive Proportional Timeline**:
  - Proportional visual track representing total video duration.
  - Color-coded action segments positioned by `(start_time / duration) * 100%` and sized by `(duration_sec / duration) * 100%`.
  - Displays action label and numeric confidence score.
  - Hover tooltips showing exact timestamps, duration, and numeric confidence score.
  - Click-to-seek directly on the timeline track or on specific segment blocks.
  - Live vertical needle playhead synchronized with current playback time.
- **Playback Controls**:
  - Play/pause, seek slider, volume/mute control.
  - Multi-speed playback selector (`0.5x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - Fullscreen toggle supporting the HUD overlay.
- **Detection Proposals Table**:
  - Ranked list of detected actions with confidence bars and raw numeric scores (`0.000`–`1.000`).
  - "Jump" action button to seek playback directly to any proposal.

---

## Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
The application will start at:
```
http://localhost:3000
```

### 2. Environment Configuration (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DEFAULT_CHECKPOINT=exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_37.pth
VITE_DEFAULT_THRESHOLD=0.15
VITE_DEFAULT_IOU_THRESHOLD=0.25
```

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## API Request Dispatching

- **Stored Video**: Dispatches `POST /api/predict` (proxied to `${VITE_API_BASE_URL}/predict`) with JSON body:
  ```json
  {
    "video_name": "illegal_dumping_sample_01.mp4",
    "checkpoint": "exps/custom/tridet_videomaev2_1class/gpu1_id0/checkpoint/epoch_37.pth",
    "threshold": 0.15,
    "nms_type": "hard",
    "iou_threshold": 0.25,
    "max_seg_num": 5
  }
  ```
- **Uploaded Video**: Dispatches `POST /api/predict` with `multipart/form-data` containing the `video` `File` object and configuration fields.
