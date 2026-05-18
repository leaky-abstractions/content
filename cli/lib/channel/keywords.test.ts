import { test, expect } from 'bun:test';
import { renderChannelKeywords } from './keywords';

test('joins single-word keywords with spaces', () => {
    expect(renderChannelKeywords(['rust', 'cli', 'terminal'])).toBe('rust cli terminal');
});

test('quotes multi-word keywords', () => {
    expect(renderChannelKeywords(['machine learning', 'rust'])).toBe('"machine learning" rust');
});

test('handles empty array', () => {
    expect(renderChannelKeywords([])).toBe('');
});

test('preserves embedded double quotes by leaving the original (YouTube best-effort)', () => {
    expect(renderChannelKeywords(['weird"keyword'])).toBe('weird"keyword');
});
