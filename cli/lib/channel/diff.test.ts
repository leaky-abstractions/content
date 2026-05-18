import { test, expect } from 'bun:test';
import { computeChannelDiff } from './diff';

const baseCurrent = {
    channelId: 'UC123',
    title: 'Leaky Abstractions',
    description: 'Old text',
    keywords: 'old',
};

test('detects description change', () => {
    const diff = computeChannelDiff({
        current: baseCurrent,
        desired: { description: 'New text', keywords: 'old', bannerSha256: 'aaa', lastUploadedBannerSha256: 'aaa' },
    });
    expect(diff.fieldChanges.description).toEqual({ from: 'Old text', to: 'New text' });
    expect(diff.fieldChanges.keywords).toBeUndefined();
    expect(diff.bannerChanged).toBe(false);
    expect(diff.hasChanges).toBe(true);
});

test('detects keywords change', () => {
    const diff = computeChannelDiff({
        current: baseCurrent,
        desired: { description: 'Old text', keywords: 'new', bannerSha256: 'aaa', lastUploadedBannerSha256: 'aaa' },
    });
    expect(diff.fieldChanges.keywords).toEqual({ from: 'old', to: 'new' });
});

test('detects banner change via sidecar mismatch', () => {
    const diff = computeChannelDiff({
        current: baseCurrent,
        desired: { description: 'Old text', keywords: 'old', bannerSha256: 'bbb', lastUploadedBannerSha256: 'aaa' },
    });
    expect(diff.bannerChanged).toBe(true);
    expect(diff.hasChanges).toBe(true);
});

test('treats missing sidecar (undefined) as banner-changed', () => {
    const diff = computeChannelDiff({
        current: baseCurrent,
        desired: { description: 'Old text', keywords: 'old', bannerSha256: 'aaa', lastUploadedBannerSha256: undefined },
    });
    expect(diff.bannerChanged).toBe(true);
});

test('hasChanges=false when nothing differs', () => {
    const diff = computeChannelDiff({
        current: baseCurrent,
        desired: { description: 'Old text', keywords: 'old', bannerSha256: 'aaa', lastUploadedBannerSha256: 'aaa' },
    });
    expect(diff.hasChanges).toBe(false);
});
