import { defineCommand } from 'citty';
import consola from 'consola';

export default defineCommand({
    meta: { name: 'video', description: 'Per-video metadata sync (Phase 2 — not yet implemented)' },
    subCommands: {
        diff: defineCommand({
            meta: { name: 'diff', description: 'Show per-video metadata diffs' },
            run: () => {
                consola.info('youtube video diff: not yet implemented (Phase 2).');
            },
        }),
        sync: defineCommand({
            meta: { name: 'sync', description: 'Apply per-video metadata' },
            run: () => {
                consola.info('youtube video sync: not yet implemented (Phase 2).');
            },
        }),
    },
});
