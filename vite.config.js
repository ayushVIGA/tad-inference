import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function videoManifestPlugin() {
  const videosDir = path.resolve('public', 'videos');
  const manifestPath = path.join(videosDir, 'manifest.json');
  const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.webm', '.mkv']);

  const generate = () => {
    try {
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }
      const files = fs.readdirSync(videosDir);
      const videoFiles = files.filter(f => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()));
      const manifest = videoFiles.map((filename, idx) => {
        const base = path.basename(filename, path.extname(filename));
        const formattedTitle = base
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        return {
          id: `video-${String(idx + 1).padStart(2, '0')}`,
          filename,
          title: formattedTitle,
          description: `Video file: ${filename}`
        };
      });

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not auto-generate manifest.json:', e.message);
    }
  };

  return {
    name: 'video-manifest-plugin',
    buildStart() {
      generate();
    },
    configureServer(server) {
      generate();
      server.watcher.add(videosDir);
      server.watcher.on('add', (filePath) => {
        if (filePath.startsWith(videosDir) && !filePath.endsWith('manifest.json')) {
          generate();
        }
      });
      server.watcher.on('unlink', (filePath) => {
        if (filePath.startsWith(videosDir) && !filePath.endsWith('manifest.json')) {
          generate();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), videoManifestPlugin()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
