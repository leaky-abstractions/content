export function renderChannelKeywords(keywords: string[]): string {
    return keywords.map((k) => (k.includes(' ') ? `"${k}"` : k)).join(' ');
}
