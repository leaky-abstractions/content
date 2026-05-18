import type { CurrentChannelState } from '../youtube/client';

export interface DesiredChannelState {
    description: string;
    keywords: string;
    /** SHA-256 of the freshly-rendered local banner PNG. */
    bannerSha256: string;
    /** SHA-256 stored in brand/.banner-uploaded.sha256 (undefined if file missing). */
    lastUploadedBannerSha256: string | undefined;
}

export interface ChannelDiff {
    fieldChanges: {
        description?: { from: string; to: string };
        keywords?: { from: string; to: string };
    };
    bannerChanged: boolean;
    hasChanges: boolean;
}

export function computeChannelDiff(args: {
    current: CurrentChannelState;
    desired: DesiredChannelState;
}): ChannelDiff {
    const { current, desired } = args;
    const fieldChanges: ChannelDiff['fieldChanges'] = {};
    if (current.description !== desired.description) {
        fieldChanges.description = { from: current.description, to: desired.description };
    }
    if (current.keywords !== desired.keywords) {
        fieldChanges.keywords = { from: current.keywords, to: desired.keywords };
    }
    const bannerChanged = desired.lastUploadedBannerSha256 !== desired.bannerSha256;
    const hasChanges = bannerChanged || Object.keys(fieldChanges).length > 0;
    return { fieldChanges, bannerChanged, hasChanges };
}
