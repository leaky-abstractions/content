import { test, expect } from 'bun:test';
import { renderChannelDescription } from './description';

test('strips markdown and preserves paragraph breaks', () => {
    const result = renderChannelDescription({
        markdown: '# Hello\n\n**bold** world',
    });
    expect(result).toBe('Hello\n\nbold world');
});

test('trims to 1000 characters at a word boundary', () => {
    const longText = 'word '.repeat(300);
    const result = renderChannelDescription({ markdown: longText });
    expect(result.length).toBeLessThanOrEqual(1000);
    expect(result.endsWith(' ')).toBe(false);
});

test('preserves URLs unchanged through markdown stripping', () => {
    const result = renderChannelDescription({
        markdown: 'see [my site](https://example.com)',
    });
    expect(result).toContain('https://example.com');
});
