import { google, type youtube_v3 } from 'googleapis';
import { loadYouTubeCredentials } from '../config';
import { makeOAuth2Client } from './auth';

export function makeYouTubeClient(): youtube_v3.Youtube {
    const creds = loadYouTubeCredentials();
    const auth = makeOAuth2Client(creds);
    return google.youtube({ version: 'v3', auth });
}

export interface CurrentChannelState {
    channelId: string;
    title: string;
    description: string;
    keywords: string;
}

export async function fetchCurrentChannelState(yt: youtube_v3.Youtube): Promise<CurrentChannelState> {
    const res = await yt.channels.list({ part: ['snippet', 'brandingSettings'], mine: true });
    const channel = res.data.items?.[0];
    if (!channel || !channel.id) {
        throw new Error('No channel returned for the authenticated user.');
    }
    return {
        channelId: channel.id,
        title: channel.snippet?.title ?? '',
        description: channel.brandingSettings?.channel?.description ?? '',
        keywords: channel.brandingSettings?.channel?.keywords ?? '',
    };
}
