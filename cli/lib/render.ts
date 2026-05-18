import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

export interface RenderOptions {
    /** Full file:// URL to render (caller constructs, may include query string). */
    url: string;
    /** Output PNG path. */
    outputPath: string;
    width: number;
    height: number;
    timeoutMs?: number;
}

export interface RenderResult {
    outputPath: string;
    width: number;
    height: number;
    sizeBytes: number;
}

/**
 * Renders a URL to PNG via headless Firefox.
 *
 * The HTML page is expected to use locally-vendored fonts via @font-face with
 * `font-display: block` so Firefox's `load` event genuinely waits for fonts —
 * see brand/banner.html and brand/logo.html.
 */
export function renderHtml(opts: RenderOptions): RenderResult {
    const { url, outputPath, width, height, timeoutMs = 60_000 } = opts;
    const profile = mkdtempSync(resolve(tmpdir(), 'firefox-render-'));
    try {
        const result = spawnSync(
            'firefox',
            [
                '--headless',
                '--no-remote',
                '--profile',
                profile,
                `--window-size=${width},${height}`,
                '--screenshot',
                outputPath,
                url,
            ],
            { stdio: 'inherit', timeout: timeoutMs },
        );
        if (result.signal === 'SIGTERM') {
            throw new Error(`render: firefox timed out after ${timeoutMs / 1000}s for ${url}`);
        }
        if (result.status !== 0) {
            throw new Error(`render: firefox exited with status ${result.status} for ${url}`);
        }
    } finally {
        rmSync(profile, { recursive: true, force: true });
    }

    return verify(outputPath, width, height);
}

function verify(outputPath: string, expectedW: number, expectedH: number): RenderResult {
    if (!existsSync(outputPath)) {
        throw new Error(`render: output PNG was not created at ${outputPath}`);
    }
    const fileResult = spawnSync('file', [outputPath], { encoding: 'utf8' });
    const match = fileResult.stdout.match(/(\d+)\s*x\s*(\d+)/);
    if (!match) {
        throw new Error(`render: could not parse dimensions from \`file\` output: ${fileResult.stdout.trim()}`);
    }
    const [, wStr, hStr] = match;
    const w = Number(wStr);
    const h = Number(hStr);
    if (w !== expectedW || h !== expectedH) {
        throw new Error(`render: expected ${expectedW}x${expectedH}, got ${w}x${h} for ${outputPath}`);
    }
    return { outputPath, width: w, height: h, sizeBytes: statSync(outputPath).size };
}
