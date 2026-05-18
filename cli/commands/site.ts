import { defineCommand } from 'citty';
import { spawnSync } from 'node:child_process';

const dev = defineCommand({
    meta: { name: 'dev', description: 'Run the Eleventy dev server' },
    run: () => {
        const res = spawnSync('eleventy', ['--serve'], { stdio: 'inherit' });
        process.exit(res.status ?? 1);
    },
});

const build = defineCommand({
    meta: { name: 'build', description: 'Build the site and index with pagefind' },
    run: () => {
        const eleventy = spawnSync('eleventy', [], { stdio: 'inherit' });
        if ((eleventy.status ?? 1) !== 0) process.exit(eleventy.status ?? 1);
        const pagefind = spawnSync('pagefind', ['--site', '_site', '--root-selector', '.terminal-body'], {
            stdio: 'inherit',
        });
        process.exit(pagefind.status ?? 1);
    },
});

export default defineCommand({
    meta: { name: 'site', description: 'Site dev and build' },
    subCommands: { dev, build },
});
