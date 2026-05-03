# Leaky Abstractions — Monorepo Setup Spec

Initial scaffold for the `videos` monorepo. Covers directory structure, tooling, schemas, and validation. Excludes the YouTube/Perforce publishing pipeline (separate task).

## Repository Facts

- Repo name: `videos` (already exists on GitHub, currently empty).
- Visibility: public.
- Licenses: MIT for code, CC BY 4.0 for creative assets. Dual license required.
- Package manager: **pnpm** (required, not npm/yarn).
- Node: latest LTS.

## Required Tooling

- pnpm workspaces.
- TypeScript at root.
- Motion Canvas (single install at root, multiple project entries in `vite.config.ts`).
- Eleventy at root.
- Ajv + ajv-formats for content validation.
- Prettier + EditorConfig for consistency.

## Target Directory Structure

```
videos/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
├── eleventy.config.mjs
├── .editorconfig
├── .gitignore
├── .prettierrc
├── README.md
├── LICENSE-MIT
├── LICENSE-CC-BY-4.0
├── llms.txt
├── packages/
│   └── style/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── colors.ts
│           ├── typography.ts
│           └── components/
│               └── .gitkeep
├── episodes/
│   ├── 001-example-standalone/
│   │   ├── meta.yml
│   │   ├── script.md
│   │   ├── blog.md
│   │   ├── description.md
│   │   ├── captions.md
│   │   └── scenes/
│   │       └── main.tsx
│   └── _series/
│       └── firmament/
│           ├── series.yml
│           ├── intro-card.tsx
│           ├── blog-index.md
│           └── 001-example-series-episode/
│               ├── meta.yml
│               ├── script.md
│               ├── blog.md
│               ├── description.md
│               ├── captions.md
│               └── scenes/
│                   └── main.tsx
├── schemas/
│   ├── meta.schema.json
│   ├── series.schema.json
│   └── blog-frontmatter.schema.json
└── scripts/
    └── validate-content.mjs
```

## File Specifications

### `package.json` (root)

- `private: true`
- `type: "module"`
- Scripts:
    - `dev:scenes` → run Motion Canvas dev server via Vite.
    - `build:scenes` → Vite build.
    - `dev:blog` → Eleventy serve.
    - `build:blog` → Eleventy build to `_site/`.
    - `validate` → `node scripts/validate-content.mjs`.
    - `prebuild` → runs `validate`.
    - `build` → runs `build:scenes` then `build:blog`.
- Dependencies: `@motion-canvas/core`, `@motion-canvas/2d`, `@motion-canvas/ui`, `@motion-canvas/vite-plugin`.
- Dev dependencies: `vite`, `typescript`, `@11ty/eleventy`, `ajv`, `ajv-formats`, `js-yaml`, `gray-matter`, `fast-glob`, `prettier`.

### `pnpm-workspace.yaml`

```yaml
packages:
    - 'packages/*'
```

Episodes are NOT workspace members. They are content directories.

### `tsconfig.json`

- `target: ES2022`
- `module: ESNext`
- `moduleResolution: bundler`
- `jsx: preserve` (Motion Canvas uses TSX)
- `jsxImportSource: "@motion-canvas/2d/lib"`
- Path alias: `"@style/*": ["packages/style/src/*"]`
- Strict mode on.

### `vite.config.ts`

- Imports `@motion-canvas/vite-plugin`.
- Auto-discovers all `episodes/**/scenes/*.tsx` as project entries via `fast-glob`. Do not hardcode episode paths.
- Each discovered project's name derives from its episode slug (parent directory name, including series prefix when applicable).

### `eleventy.config.mjs`

- Input: repo root.
- Output: `_site/`.
- Globs `episodes/**/blog.md` as the `posts` collection.
- Excludes (via `.eleventyignore` or config): `node_modules`, `packages`, `scenes`, `**/scenes/**`, `**/*.tsx`, `**/*.ts`, `_site`, `.git`, `schemas`, `scripts`, all engine project directories (`**/godot/**`, `**/unity/**`, `**/unreal/**`, `**/nim/**`).
- Permalink computation:
    - Read frontmatter `series` field. If present, slug = `${series}/${parentDirName}`. Else slug = `parentDirName`.
    - Permalink: `/blog/${slug}/index.html`.
- Series landing page: `episodes/_series/<series>/blog-index.md` → `/blog/<series>/index.html`.
- Markdown: enable GFM, syntax highlighting via Eleventy's syntax highlight plugin or Shiki.
- Inject per-page `<script type="text/llms.txt">…</script>` block in the layout from a frontmatter-derived summary.

### `episodes/<slug>/meta.yml` schema

Required:

- `title: string`
- `date: ISO date string`
- `youtube_id: string` (may be empty until first publish)

Optional:

- `series: string` (must match a `series.yml` slug under `_series/`)
- `episode: integer` (required if `series` is set)
- `tags: string[]`
- `draft: boolean` (default `false`)

### `episodes/_series/<slug>/series.yml` schema

Required:

- `slug: string`
- `title: string`
- `description: string`

Optional:

- `playlist_id: string` (populated by CI)
- `intro_card: relative path to .tsx`
- `banner: relative path to image`

### `blog.md` frontmatter schema

Required:

- `title: string`
- `date: ISO date string`
- `summary: string` (used for `<script type="text/llms.txt">`, OG description, RSS)

Optional:

- `tags: string[]`
- `draft: boolean`

### `scripts/validate-content.mjs`

- ESM, no dependencies beyond `ajv`, `ajv-formats`, `js-yaml`, `gray-matter`, `fast-glob`.
- Loads three JSON schemas from `schemas/`.
- Validates:
    1. Every `episodes/**/meta.yml` against `meta.schema.json`.
    2. Every `episodes/_series/*/series.yml` against `series.schema.json`.
    3. Every `episodes/**/blog.md` frontmatter against `blog-frontmatter.schema.json`.
    4. Cross-reference: every `meta.yml` with a `series` field must resolve to an existing `series.yml`.
    5. Cross-reference: every series episode must have a unique `(series, episode)` pair.
    6. Every episode directory must contain all required files: `meta.yml`, `script.md`, `blog.md`, `description.md`, `captions.md`.
- Exit code 1 on any violation. Print all violations before exiting (do not bail on first error).

### JSON Schemas (`schemas/*.schema.json`)

Generate strict JSON Schema (draft 2020-12) files matching the meta.yml, series.yml, and blog frontmatter contracts above. `additionalProperties: false`.

### `llms.txt` (root)

Static for now. Header block describing the channel and the repo, followed by sections to be programmatically extended later by the publish pipeline. Include for now:

- Channel: Leaky Abstractions
- Repo URL placeholder
- Brief content concept paragraph
- Pointer to per-page `<script type="text/llms.txt">` blocks

### `.gitignore`

- `node_modules/`
- `_site/`
- `dist/`
- `.cache/`
- `*.log`
- OS files: `.DS_Store`, `Thumbs.db`
- Editor: `.vscode/`, `.idea/`
- Motion Canvas output: `output/`, `**/output/`
- Engine binaries — Godot: `.godot/`, `*.import`. Unity: `Library/`, `Temp/`, `Obj/`, `Build/`, `Builds/`, `Logs/`, `UserSettings/`. Unreal: `Binaries/`, `DerivedDataCache/`, `Intermediate/`, `Saved/`, `*.VC.db`. Nim: `nimcache/`, compiled binaries.

### Example episode files

Populate `episodes/001-example-standalone/` and `episodes/_series/firmament/001-example-series-episode/` with placeholder content sufficient to pass the validator. These exist to verify the structure works end-to-end.

### `LICENSE-MIT` and `LICENSE-CC-BY-4.0`

Standard verbatim license texts. README must explain the dual license: code under MIT, creative content (scripts, blog posts, video assets, Motion Canvas scenes considered creative output, illustrations) under CC BY 4.0.

### `README.md`

Sections:

1. What this repo is.
2. Dual license notice.
3. Prerequisites (Node LTS, pnpm).
4. `pnpm install`, `pnpm dev:scenes`, `pnpm dev:blog`, `pnpm validate`, `pnpm build`.
5. How to add a new standalone episode.
6. How to add a new series episode.
7. Directory layout overview.

## Acceptance Criteria

- `pnpm install` succeeds from clean clone.
- `pnpm validate` passes on the seeded example episodes.
- `pnpm dev:scenes` launches Motion Canvas with both example episodes' scenes selectable.
- `pnpm dev:blog` serves the blog with both example posts at the correct URLs (`/blog/001-example-standalone/`, `/blog/firmament/001-example-series-episode/`, `/blog/firmament/`).
- `pnpm build` produces `_site/` with all expected pages and the root `llms.txt`.
- Removing a required field from any `meta.yml` causes `pnpm validate` to fail with a clear message.

## Out of Scope (Later Tasks)

- GitHub Actions self-hosted runner on Hetzner.
- Perforce integration for binary assets.
- YouTube Data API v3 publishing pipeline.
- Playlist creation/management for series.
- GitHub Pages deployment workflow.
- Thumbnail generation pipeline.
- Channel branding assets (logo, palette, banner).
