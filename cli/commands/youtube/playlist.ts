import { defineCommand } from 'citty';
import consola from 'consola';

export default defineCommand({
    meta: { name: 'playlist', description: 'Playlist composition sync (Phase 3 — not yet implemented)' },
    subCommands: {
        diff: defineCommand({
            meta: { name: 'diff', description: 'Show playlist diffs' },
            run: () => {
                consola.info('youtube playlist diff: not yet implemented (Phase 3).');
            },
        }),
        sync: defineCommand({
            meta: { name: 'sync', description: 'Apply playlist composition' },
            run: () => {
                consola.info('youtube playlist sync: not yet implemented (Phase 3).');
            },
        }),
    },
});
