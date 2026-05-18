import { defineCommand } from 'citty';
import consola from 'consola';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { makeYouTubeClient } from '../../../lib/youtube/client';
import { loadChannelState } from '../../../lib/channel/state';
import { writeBannerSidecar } from '../../../lib/channel/banner-state';

export default defineCommand({
    meta: { name: 'sync', description: 'Apply channel description, keywords, banner, avatar to YouTube' },
    args: {
        dryRun: { type: 'boolean', default: false, description: 'Print actions instead of executing them' },
        bannerPath: { type: 'string', default: 'tmp/brand/banner.png' },
    },
    async run({ args }) {
        const cwd = process.cwd();
        const bannerPath = resolve(cwd, args.bannerPath);
        const yt = makeYouTubeClient();

        const { current, desired, diff } = await loadChannelState({ cwd, bannerPath, yt });

        if (!diff.hasChanges) {
            consola.success('No changes — channel is in sync.');
            return;
        }

        if (args.dryRun) {
            consola.info('[dry-run] Would apply:');
            if (diff.fieldChanges.description) consola.info('  - update description');
            if (diff.fieldChanges.keywords) consola.info('  - update keywords');
            if (diff.bannerChanged) consola.info('  - upload new banner');
            return;
        }

        // Step 1: upload banner binary if it changed. Yields a CDN URL that we then point
        // the channel at in step 2's channels.update.
        let newBannerUrl: string | undefined;
        if (diff.bannerChanged) {
            const inserted = await yt.channelBanners.insert({
                media: { mimeType: 'image/png', body: createReadStream(bannerPath) },
            });
            newBannerUrl = inserted.data.url ?? undefined;
            if (!newBannerUrl) {
                throw new Error('channelBanners.insert returned no URL.');
            }
        }

        // Step 2: a single channels.update with the full brandingSettings payload.
        //
        // YouTube's `channels.update` with `part=brandingSettings` does NOT accept partial
        // updates — fields not present in the payload are interpreted as "set to empty",
        // and the API rejects an empty `brandingSettings.channel.title` with a 400 "Required"
        // error. We always send title+description+keywords (echoing title from the live
        // state) so the call shape is consistent regardless of which subset actually
        // changed. Sending values that already match is idempotent server-side.
        await yt.channels.update({
            part: ['brandingSettings'],
            requestBody: {
                id: current.channelId,
                brandingSettings: {
                    channel: {
                        title: current.title,
                        description: desired.description,
                        keywords: desired.keywords,
                    },
                    ...(newBannerUrl ? { image: { bannerExternalUrl: newBannerUrl } } : {}),
                },
            },
        });

        if (diff.fieldChanges.description || diff.fieldChanges.keywords) {
            consola.success('Updated channel description and/or keywords.');
        }
        if (newBannerUrl) {
            writeBannerSidecar(cwd, desired.bannerSha256);
            consola.success(`Updated channel banner: ${newBannerUrl}`);
        }
        consola.success('Channel sync complete.');
    },
});
