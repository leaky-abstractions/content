#!/usr/bin/env bun
// Render brand assets to their final PNG outputs.
//
// Usage:
//   bun scripts/render-brand.ts banner
//   bun scripts/render-brand.ts logo
//   bun scripts/render-brand.ts all
//
// Banner: headless Firefox renders brand/banner.html in ?raw=1 mode at native
//   2560x1440. Single source of truth — edit the HTML, re-run this script,
//   get an updated brand/banner.png.
// Logo:   Inkscape rasterises brand/logo-square.svg to 800x800 PNG with text
//   converted to paths (font-independent output).

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const BRAND = resolve(ROOT, 'brand');

type Target = 'banner' | 'logo';

interface RenderResult {
    target: Target;
    output: string;
    dimensions: string;
    sizeBytes: number;
}

function renderBanner(): RenderResult {
    const url = `file://${BRAND}/banner.html?raw=1`;
    const output = resolve(BRAND, 'banner.png');

    // Throwaway profile so the render doesn't touch the user's main Firefox session.
    const profile = mkdtempSync(resolve(tmpdir(), 'firefox-render-'));
    try {
        const result = spawnSync(
            'firefox',
            [
                '--headless',
                // Bypass Firefox's single-instance IPC. Without this, the
                // headless process tries to attach to an already-running GUI
                // Firefox (if any) and hangs forever.
                '--no-remote',
                '--profile',
                profile,
                '--window-size=2560,1440',
                '--screenshot',
                output,
                url,
            ],
            { stdio: 'inherit', timeout: 60_000 },
        );
        if (result.signal === 'SIGTERM') {
            throw new Error('firefox render timed out after 60s');
        }
        if (result.status !== 0) {
            throw new Error(`firefox exited with status ${result.status}`);
        }
    } finally {
        rmSync(profile, { recursive: true, force: true });
    }

    return verify('banner', output, '2560 x 1440');
}

function renderLogo(): RenderResult {
    const source = resolve(BRAND, 'logo-square.svg');
    const output = resolve(BRAND, 'logo-square.png');

    const result = spawnSync(
        'inkscape',
        [source, '--export-type=png', '--export-width=800', '--export-text-to-path', `--export-filename=${output}`],
        { stdio: 'inherit' },
    );
    if (result.status !== 0) {
        throw new Error(`inkscape exited with status ${result.status}`);
    }

    return verify('logo', output, '800 x 800');
}

function verify(target: Target, output: string, expectedDims: string): RenderResult {
    const result = spawnSync('file', [output], { encoding: 'utf8' });
    const match = result.stdout.match(/(\d+)\s*x\s*(\d+)/);
    if (!match) {
        throw new Error(`${target}: could not parse dimensions from \`file\` output: ${result.stdout.trim()}`);
    }
    const dimensions = `${match[1]} x ${match[2]}`;
    if (dimensions !== expectedDims) {
        throw new Error(`${target}: expected ${expectedDims}, got ${dimensions}`);
    }
    return {
        target,
        output,
        dimensions,
        sizeBytes: statSync(output).size,
    };
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Main ---

const arg = process.argv[2];
const targets: Target[] =
    arg === 'banner' ? ['banner'] : arg === 'logo' ? ['logo'] : arg === 'all' ? ['banner', 'logo'] : [];

if (targets.length === 0) {
    console.error('Usage: bun scripts/render-brand.ts <banner|logo|all>');
    process.exit(1);
}

const results: RenderResult[] = [];
for (const t of targets) {
    results.push(t === 'banner' ? renderBanner() : renderLogo());
}

console.log();
for (const r of results) {
    const rel = r.output.replace(ROOT + '/', '');
    console.log(`✓ ${r.target}: ${rel} (${r.dimensions}, ${formatSize(r.sizeBytes)})`);
}
