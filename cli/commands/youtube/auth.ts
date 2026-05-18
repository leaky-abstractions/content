import { defineCommand } from 'citty';
import consola from 'consola';
import { OAuth2Client } from 'google-auth-library';
import { createServer } from 'node:http';
import { URL } from 'node:url';
import { spawn } from 'node:child_process';
import { YOUTUBE_OAUTH_SCOPE, verifyRefreshToken } from '../../lib/youtube/auth';
import { loadYouTubeCredentials } from '../../lib/config';

const bootstrap = defineCommand({
    meta: {
        name: 'bootstrap',
        description: 'Run a one-time local OAuth flow and print a refresh token',
    },
    args: {
        port: { type: 'string', default: '8765', description: 'Localhost port for the OAuth callback' },
    },
    async run({ args }) {
        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            consola.error('Missing YOUTUBE_CLIENT_ID and/or YOUTUBE_CLIENT_SECRET in the environment.');
            consola.error('');
            consola.error('Provide them via one of:');
            consola.error('  • 1Password CLI (recommended — no plaintext on disk):');
            consola.error('      op run --env-file=.env.1password -- bun cli/index.ts youtube auth bootstrap');
            consola.error('  • A gitignored .env file at the repo root with:');
            consola.error('      YOUTUBE_CLIENT_ID=…');
            consola.error('      YOUTUBE_CLIENT_SECRET=…');
            process.exit(1);
        }

        const port = Number(args.port);
        const redirectUri = `http://localhost:${port}/oauth2callback`;

        const client = new OAuth2Client({ clientId, clientSecret, redirectUri });
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [YOUTUBE_OAUTH_SCOPE],
        });

        consola.box(
            [
                'IMPORTANT: Google Cloud OAuth clients in "Testing" publishing status',
                'have refresh tokens that silently expire after 7 days.',
                '',
                'Before continuing, ensure your OAuth client is in "In production"',
                'publishing status (Google Cloud Console → APIs & Services →',
                'OAuth consent screen → Publishing status → PUBLISH APP).',
                '',
                'For a single-user personal channel, "In production" without sensitive',
                'scopes ships immediately and requires no verification review.',
            ].join('\n'),
        );

        consola.info(`Opening: ${authUrl}`);
        consola.info(`If your browser does not open, paste the URL above manually.`);

        const code = await new Promise<string>((resolveCode, rejectCode) => {
            const server = createServer((req, res) => {
                if (!req.url) {
                    res.writeHead(400).end('No URL');
                    return;
                }
                const url = new URL(req.url, redirectUri);
                if (url.pathname !== '/oauth2callback') {
                    res.writeHead(404).end('Not found');
                    return;
                }
                const code = url.searchParams.get('code');
                const error = url.searchParams.get('error');
                if (error) {
                    res.writeHead(400).end(`OAuth error: ${error}`);
                    server.close();
                    rejectCode(new Error(`OAuth error: ${error}`));
                    return;
                }
                if (!code) {
                    res.writeHead(400).end('No code in callback');
                    server.close();
                    rejectCode(new Error('No code in callback'));
                    return;
                }
                res.writeHead(200, { 'content-type': 'text/html' }).end(
                    '<h1>OK</h1><p>You can close this tab and return to the CLI.</p>',
                );
                server.close();
                resolveCode(code);
            });
            server.listen(port, () => {
                openBrowser(authUrl);
            });
        });

        const { tokens } = await client.getToken(code);
        if (!tokens.refresh_token) {
            consola.error('Google did not return a refresh token. This usually means:');
            consola.error("  - You've already authorized this app before. Revoke it at:");
            consola.error('    https://myaccount.google.com/permissions');
            consola.error('  - Then re-run this command.');
            process.exit(1);
        }

        consola.success('Refresh token obtained.');
        consola.log('');
        consola.log('REFRESH TOKEN:');
        consola.log('');
        consola.log(`  ${tokens.refresh_token}`);
        consola.log('');
        consola.box(
            [
                'Add this token to:',
                '',
                '  • Your 1Password item (recommended) — paste it into the',
                '    refresh_token field of the same item that holds client_id',
                '    and client_secret.',
                '',
                '  • A gitignored .env file at the repo root, as:',
                '      YOUTUBE_REFRESH_TOKEN=…',
                '',
                '  • GitHub Actions secrets (required for the sync.yml workflow):',
                '    Settings → Secrets and variables → Actions →',
                '      YOUTUBE_REFRESH_TOKEN',
                '',
                '(You should already have YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET',
                ' set wherever you keep them — you just used them to run this command.)',
            ].join('\n'),
        );
    },
});

const status = defineCommand({
    meta: {
        name: 'status',
        description: 'Verify the configured refresh token can mint an access token',
    },
    async run() {
        const creds = loadYouTubeCredentials();
        await verifyRefreshToken(creds);
        consola.success('Refresh token is valid; access tokens can be minted.');
    },
});

export default defineCommand({
    meta: { name: 'auth', description: 'OAuth bootstrap and verification' },
    subCommands: { bootstrap, status },
});

function openBrowser(url: string): void {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    try {
        spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
    } catch {
        // Ignore — user can still paste the URL manually.
    }
}
