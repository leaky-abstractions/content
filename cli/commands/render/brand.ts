import { defineCommand } from 'citty';
import consola from 'consola';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHtml, type RenderResult } from '../../lib/render';

interface Target {
    name: string;
    htmlPath: string;
    /** Query string (without leading '?') to append to the file:// URL, if any. */
    query?: string;
    out: string;
    width: number;
    height: number;
}

export default defineCommand({
    meta: {
        name: 'brand',
        description: 'Render brand assets (banner, logo) to PNG via headless Firefox',
    },
    args: {
        target: {
            type: 'string',
            default: 'all',
            description: 'Which asset to render: banner, logo, or all',
        },
        out: {
            type: 'string',
            default: 'brand',
            description: 'Output directory for rendered PNGs',
        },
    },
    async run({ args }) {
        const cwd = process.cwd();
        const outDir = resolve(cwd, args.out);
        mkdirSync(outDir, { recursive: true });

        const targets: Target[] = [];
        if (args.target === 'banner' || args.target === 'all') {
            targets.push({
                name: 'banner',
                htmlPath: resolve(cwd, 'brand/banner.html'),
                query: 'raw=1',
                out: resolve(outDir, 'banner.png'),
                width: 2560,
                height: 1440,
            });
        }
        if (args.target === 'logo' || args.target === 'all') {
            targets.push({
                name: 'logo',
                htmlPath: resolve(cwd, 'brand/logo.html'),
                out: resolve(outDir, 'logo-square.png'),
                width: 800,
                height: 800,
            });
        }
        if (targets.length === 0) {
            consola.error(`Unknown target: ${args.target}. Use banner, logo, or all.`);
            process.exit(1);
        }

        const results: RenderResult[] = [];
        for (const t of targets) {
            const url = `file://${t.htmlPath}${t.query ? `?${t.query}` : ''}`;
            consola.start(`Rendering ${t.name} → ${t.out}`);
            results.push(renderHtml({ url, outputPath: t.out, width: t.width, height: t.height }));
        }

        for (const r of results) {
            consola.success(`${r.outputPath} (${r.width}x${r.height}, ${formatSize(r.sizeBytes)})`);
        }
    },
});

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
