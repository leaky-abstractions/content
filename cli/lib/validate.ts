import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import fg from 'fast-glob';
import yaml from 'js-yaml';
import matter from 'gray-matter';

interface ValidateOptions {
    cwd: string;
    schemasDir?: string;
}

export interface ValidateResult {
    ok: boolean;
    errors: string[];
}

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

export async function validateContent(opts: ValidateOptions): Promise<ValidateResult> {
    const { cwd } = opts;
    const schemasDir = opts.schemasDir ?? resolve(cwd, 'schemas');

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const metaSchema = JSON.parse(readFileSync(resolve(schemasDir, 'meta.schema.json'), 'utf8'));
    const seriesSchema = JSON.parse(readFileSync(resolve(schemasDir, 'series.schema.json'), 'utf8'));
    const blogSchema = JSON.parse(readFileSync(resolve(schemasDir, 'blog-frontmatter.schema.json'), 'utf8'));

    const validateMeta = ajv.compile<EpisodeMeta>(metaSchema);
    const validateSeries = ajv.compile<SeriesMeta>(seriesSchema);
    const validateBlog = ajv.compile<BlogFrontmatter>(blogSchema);

    const REQUIRED_SIBLINGS = ['script.md', 'blog.md', 'description.md', 'captions.md'] as const;

    const errors: string[] = [];
    type SeriesPair = { series: string; episode: number | undefined; file: string };
    const seriesPairs: SeriesPair[] = [];

    for (const file of fg.sync('episodes/**/meta.yml', { cwd })) {
        const fullPath = resolve(cwd, file);
        const content = yaml.load(readFileSync(fullPath, 'utf8'));

        if (!validateMeta(content)) {
            for (const err of validateMeta.errors!) {
                errors.push(`${file}: ${err.instancePath} ${err.message}`);
            }
        } else if (content.series) {
            seriesPairs.push({ series: content.series, episode: content.episode, file });
        }

        const dir = dirname(fullPath);
        for (const required of REQUIRED_SIBLINGS) {
            if (!existsSync(resolve(dir, required))) {
                errors.push(`${file}: missing required sibling file "${required}"`);
            }
        }
    }

    const knownSeries = new Set<string>();
    for (const file of fg.sync('episodes/_series/*/series.yml', { cwd })) {
        const content = yaml.load(readFileSync(resolve(cwd, file), 'utf8'));
        if (!validateSeries(content)) {
            for (const err of validateSeries.errors!) {
                errors.push(`${file}: ${err.instancePath} ${err.message}`);
            }
        } else {
            knownSeries.add(content.slug);
        }
    }

    const channelSchema = JSON.parse(readFileSync(resolve(schemasDir, 'channel.schema.json'), 'utf8'));
    ajv.addSchema(channelSchema, 'channel.schema.json');
    const validateKeywords = ajv.compile({ $ref: 'channel.schema.json#/$defs/keywords' });

    const keywordsPath = resolve(cwd, 'channel/keywords.yml');
    if (existsSync(keywordsPath)) {
        const content = yaml.load(readFileSync(keywordsPath, 'utf8')) as unknown;
        if (!validateKeywords(content)) {
            for (const err of validateKeywords.errors!) {
                errors.push(`channel/keywords.yml: ${err.instancePath} ${err.message}`);
            }
        }
    }

    for (const file of fg.sync('episodes/**/blog.md', { cwd })) {
        const { data } = matter(readFileSync(resolve(cwd, file), 'utf8'));
        if (!validateBlog(data)) {
            for (const err of validateBlog.errors!) {
                errors.push(`${file}: frontmatter ${err.instancePath} ${err.message}`);
            }
        }
    }

    for (const { series, file } of seriesPairs) {
        if (!knownSeries.has(series)) {
            errors.push(`${file}: references series "${series}" but no matching series.yml found`);
        }
    }

    const pairKeys = new Set<string>();
    for (const { series, episode, file } of seriesPairs) {
        const key = `${series}:${episode}`;
        if (pairKeys.has(key)) {
            errors.push(`${file}: duplicate (series, episode) pair "${key}"`);
        }
        pairKeys.add(key);
    }

    return { ok: errors.length === 0, errors };
}
