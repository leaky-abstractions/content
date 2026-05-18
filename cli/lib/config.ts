export interface YouTubeCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}

export function loadYouTubeCredentials(): YouTubeCredentials {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    const missing: string[] = [];
    if (!clientId) missing.push('YOUTUBE_CLIENT_ID');
    if (!clientSecret) missing.push('YOUTUBE_CLIENT_SECRET');
    if (!refreshToken) missing.push('YOUTUBE_REFRESH_TOKEN');

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}.\n` +
                `Run \`bun cli youtube auth bootstrap\` to generate a refresh token,\n` +
                `then place all three values in a gitignored .env or GitHub Actions secrets.`,
        );
    }

    return { clientId: clientId!, clientSecret: clientSecret!, refreshToken: refreshToken! };
}
