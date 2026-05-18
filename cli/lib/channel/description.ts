import removeMd from 'remove-markdown';

export interface RenderDescriptionOptions {
    markdown: string;
    maxLength?: number;
}

const DEFAULT_MAX = 1000;

export function renderChannelDescription(opts: RenderDescriptionOptions): string {
    const { markdown, maxLength = DEFAULT_MAX } = opts;

    let body = removeMd(markdown, { useImgAltText: false, replaceLinksWithURL: true }).trim();

    if (body.length > maxLength) {
        const truncated = body.slice(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        body = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd();
    }

    return body;
}
