import { defineConfig } from 'vite';
import motionCanvasPlugin from '@motion-canvas/vite-plugin';
const motionCanvas = motionCanvasPlugin.default ?? motionCanvasPlugin;
import fg from 'fast-glob';

// Auto-discover all video.ts entry files from episodes
const projectFiles = fg.sync('episodes/**/src/video.ts').map((f) => `./${f}`);

export default defineConfig({
    plugins: [
        motionCanvas({
            project: projectFiles,
        }),
    ],
});
