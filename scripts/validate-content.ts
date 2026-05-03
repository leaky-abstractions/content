import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import fg from 'fast-glob';
import yaml from 'js-yaml';
import matter from 'gray-matter';

function readText(path: string): string {
    return readFileSync(path, 'utf8');
}

// --- Types matching JSON schemas ---

interface EpisodeMeta {
    title: string;
    date: string;
    youtube_id: string;
    series?: string;
    episode?: number;
    tags?: string[];
    draft?: boolean;
}

interface SeriesMeta {
    slug: string;
    title: string;
    description: string;
    playlist_id?: string;
    intro_card?: string;
    banner?: string;
}

interface BlogFrontmatter {
    title: string;
    date: string;
    summary: string;
    tags?: string[];
    draft?: boolean;
}

interface SeriesPair {
    series: string;
    episode: number | undefined;
    file: string;
}

// --- Setup ---

const root = resolve(import.meta.dir, '..');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validateMeta = ajv.compile<EpisodeMeta>(JSON.parse(readText(resolve(root, 'schemas/meta.schema.json'))));
const validateSeries = ajv.compile<SeriesMeta>(JSON.parse(readText(resolve(root, 'schemas/series.schema.json'))));
const validateBlog = ajv.compile<BlogFrontmatter>(
    JSON.parse(readText(resolve(root, 'schemas/blog-frontmatter.schema.json'))),
);

const REQUIRED_SIBLINGS = ['script.md', 'blog.md', 'description.md', 'captions.md'] as const;

const errors: string[] = [];
const seriesPairs: SeriesPair[] = [];

// --- 1. Validate meta.yml files ---

for (const file of fg.sync('episodes/**/meta.yml', { cwd: root })) {
    const fullPath = resolve(root, file);
    const content = yaml.load(readText(fullPath)) as unknown;

    if (!validateMeta(content)) {
        for (const err of validateMeta.errors!) {
            errors.push(`${file}: ${err.instancePath} ${err.message}`);
        }
    } else if (content.series) {
        seriesPairs.push({
            series: content.series,
            episode: content.episode,
            file,
        });
    }

    const dir = dirname(fullPath);
    for (const required of REQUIRED_SIBLINGS) {
        if (!existsSync(resolve(dir, required))) {
            errors.push(`${file}: missing required sibling file "${required}"`);
        }
    }
}

// --- 2. Validate series.yml files ---

const knownSeries = new Set<string>();

for (const file of fg.sync('episodes/_series/*/series.yml', { cwd: root })) {
    const fullPath = resolve(root, file);
    const content = yaml.load(readText(fullPath)) as unknown;

    if (!validateSeries(content)) {
        for (const err of validateSeries.errors!) {
            errors.push(`${file}: ${err.instancePath} ${err.message}`);
        }
    } else {
        knownSeries.add(content.slug);
    }
}

// --- 3. Validate blog.md frontmatter ---

for (const file of fg.sync('episodes/**/blog.md', { cwd: root })) {
    const fullPath = resolve(root, file);
    const { data } = matter(readText(fullPath));

    if (!validateBlog(data)) {
        for (const err of validateBlog.errors!) {
            errors.push(`${file}: frontmatter ${err.instancePath} ${err.message}`);
        }
    }
}

// --- 4. Cross-reference: series field → existing series.yml ---

for (const { series, file } of seriesPairs) {
    if (!knownSeries.has(series)) {
        errors.push(`${file}: references series "${series}" but no matching series.yml found`);
    }
}

// --- 5. Cross-reference: unique (series, episode) pairs ---

const pairKeys = new Set<string>();
for (const { series, episode, file } of seriesPairs) {
    const key = `${series}:${episode}`;
    if (pairKeys.has(key)) {
        errors.push(`${file}: duplicate (series, episode) pair "${key}"`);
    }
    pairKeys.add(key);
}

// --- Report ---

if (errors.length > 0) {
    console.error('Validation failed:\n');
    for (const err of errors) {
        console.error(`  ✗ ${err}`);
    }
    console.error(`\n${errors.length} error(s) found.`);
    process.exit(1);
} else {
    console.log('✓ All content validated successfully.');
}
