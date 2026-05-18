import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { renderChannelDescription } from './description';
import { renderChannelKeywords } from './keywords';
import { computeChannelDiff, type ChannelDiff, type DesiredChannelState } from './diff';
import { sha256OfFile } from '../hash';
import { readBannerSidecar } from './banner-state';
import { fetchCurrentChannelState, type CurrentChannelState } from '../youtube/client';
import type { youtube_v3 } from 'googleapis';

export interface LoadedChannelState {
    current: CurrentChannelState;
    desired: DesiredChannelState;
    diff: ChannelDiff;
    /** Absolute path of the local rendered banner PNG (caller verifies it exists). */
    bannerPath: string;
}

export async function loadChannelState(args: {
    cwd: string;
    bannerPath: string;
    yt: youtube_v3.Youtube;
}): Promise<LoadedChannelState> {
    const { cwd, bannerPath, yt } = args;
    if (!existsSync(bannerPath)) {
        throw new Error(`Banner PNG not found at ${bannerPath}. Run \`bun cli render brand\` first.`);
    }

    const markdown = readFileSync(resolve(cwd, 'channel/description.md'), 'utf8');
    const keywordsYaml = yaml.load(readFileSync(resolve(cwd, 'channel/keywords.yml'), 'utf8')) as {
        keywords: string[];
    };

    const description = renderChannelDescription({ markdown });
    const keywords = renderChannelKeywords(keywordsYaml.keywords);

    const bannerSha256 = sha256OfFile(bannerPath);
    const lastUploadedBannerSha256 = readBannerSidecar(cwd);

    const current = await fetchCurrentChannelState(yt);
    const desired: DesiredChannelState = { description, keywords, bannerSha256, lastUploadedBannerSha256 };
    const diff = computeChannelDiff({ current, desired });

    return { current, desired, diff, bannerPath };
}
