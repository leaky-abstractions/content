import { defineCommand } from 'citty';
import consola from 'consola';
import { resolve } from 'node:path';
import { makeYouTubeClient } from '../../../lib/youtube/client';
import { loadChannelState } from '../../../lib/channel/state';

export default defineCommand({
    meta: { name: 'diff', description: 'Show what would change on the YouTube channel' },
    args: {
        bannerPath: {
            type: 'string',
            default: 'tmp/brand/banner.png',
            description: 'Path to the locally rendered banner PNG',
        },
    },
    async run({ args }) {
        const cwd = process.cwd();
        const yt = makeYouTubeClient();
        const { diff, desired } = await loadChannelState({
            cwd,
            bannerPath: resolve(cwd, args.bannerPath),
            yt,
        });

        if (!diff.hasChanges) {
            consola.success('No changes — channel is in sync with the repo.');
            return;
        }

        consola.info('Channel diff:');
        if (diff.fieldChanges.description) {
            consola.info('  description:');
            for (const line of diff.fieldChanges.description.from.split('\n')) consola.info(`    - ${line}`);
            for (const line of diff.fieldChanges.description.to.split('\n')) consola.info(`    + ${line}`);
        }
        if (diff.fieldChanges.keywords) {
            consola.info('  keywords:');
            consola.info(`    - ${diff.fieldChanges.keywords.from}`);
            consola.info(`    + ${diff.fieldChanges.keywords.to}`);
        }
        if (diff.bannerChanged) {
            const localPrefix = desired.bannerSha256.slice(0, 12);
            const lastPrefix = desired.lastUploadedBannerSha256?.slice(0, 12) ?? '(no sidecar)';
            consola.info(`  banner: would upload (local sha256=${localPrefix}…, last-uploaded=${lastPrefix})`);
        }
    },
});
