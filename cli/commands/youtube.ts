import { defineCommand } from 'citty';

export default defineCommand({
    meta: {
        name: 'youtube',
        description: 'YouTube Data API operations',
    },
    subCommands: {
        auth: () => import('./youtube/auth').then((m) => m.default),
        channel: () => import('./youtube/channel').then((m) => m.default),
        video: () => import('./youtube/video').then((m) => m.default),
        playlist: () => import('./youtube/playlist').then((m) => m.default),
    },
});
