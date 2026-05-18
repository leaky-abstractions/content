import { defineCommand } from 'citty';

export default defineCommand({
    meta: {
        name: 'render',
        description: 'Render brand assets to PNG',
    },
    subCommands: {
        brand: () => import('./render/brand').then((m) => m.default),
    },
});
