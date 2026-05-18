import { defineCommand } from 'citty';

export default defineCommand({
    meta: {
        name: 'channel',
        description: 'Channel-level brand sync (description, keywords, banner, avatar)',
    },
    subCommands: {
        diff: () => import('./channel/diff').then((m) => m.default),
        sync: () => import('./channel/sync').then((m) => m.default),
    },
});
