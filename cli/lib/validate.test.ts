import { test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { validateContent } from './validate';

const repoRoot = resolve(import.meta.dir, '../..');

test('validateContent returns ok=false with errors when meta is malformed', async () => {
    const result = await validateContent({
        cwd: resolve(repoRoot, 'cli/lib/__fixtures__/invalid-meta'),
        schemasDir: resolve(repoRoot, 'schemas'),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('meta.yml'))).toBe(true);
});

test('validateContent fails for malformed channel/keywords.yml', async () => {
    const result = await validateContent({
        cwd: resolve(repoRoot, 'cli/lib/__fixtures__/bad-channel'),
        schemasDir: resolve(repoRoot, 'schemas'),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('keywords.yml'))).toBe(true);
});
