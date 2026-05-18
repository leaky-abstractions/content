import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SIDECAR_REL = 'brand/.banner-uploaded.sha256';

/** Reads the SHA-256 of the last successfully-uploaded banner, or undefined if the sidecar is missing. */
export function readBannerSidecar(cwd: string): string | undefined {
    const path = resolve(cwd, SIDECAR_REL);
    if (!existsSync(path)) return undefined;
    return readFileSync(path, 'utf8').trim();
}

export function writeBannerSidecar(cwd: string, sha256: string): void {
    writeFileSync(resolve(cwd, SIDECAR_REL), sha256 + '\n', 'utf8');
}
