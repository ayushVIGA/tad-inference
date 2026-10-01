import fs from 'fs';
import path from 'path';

const videosDir = path.resolve('public', 'videos');
const manifestPath = path.join(videosDir, 'manifest.json');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.webm', '.mkv']);

function formatTitle(filename) {
  const base = path.basename(filename, path.extname(filename));
  // Convert snake_case or kebab-case or dots to title case
  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateManifest() {
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const files = fs.readdirSync(videosDir);
  const videoFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return VIDEO_EXTENSIONS.has(ext);
  });

  const manifest = videoFiles.map((filename, idx) => ({
    id: `video-${String(idx + 1).padStart(2, '0')}`,
    filename,
    title: formatTitle(filename),
    description: `Video file: ${filename}`
  }));

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Generated manifest.json with ${manifest.length} video(s):`);
  manifest.forEach(v => console.log(` - [${v.id}] ${v.filename}`));
}

generateManifest();
