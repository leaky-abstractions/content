import { OAuth2Client } from 'google-auth-library';
import type { YouTubeCredentials } from '../config';

export const YOUTUBE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/youtube';

export function makeOAuth2Client(creds: YouTubeCredentials): OAuth2Client {
    const client = new OAuth2Client({
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
    });
    client.setCredentials({ refresh_token: creds.refreshToken });
    return client;
}

export async function verifyRefreshToken(creds: YouTubeCredentials): Promise<void> {
    const client = makeOAuth2Client(creds);
    const { token } = await client.getAccessToken();
    if (!token) {
        throw new Error('OAuth refresh returned no access token');
    }
}
