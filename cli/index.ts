#!/usr/bin/env bun
import { defineCommand, runMain } from 'citty';

const main = defineCommand({
    meta: {
        name: 'la',
        version: '0.1.0',
        description: 'Leaky Abstractions content pipeline CLI',
    },
    subCommands: {
        validate: () => import('./commands/validate').then((m) => m.default),
        render: () => import('./commands/render').then((m) => m.default),
        youtube: () => import('./commands/youtube').then((m) => m.default),
        site: () => import('./commands/site').then((m) => m.default),
    },
});

runMain(main);
