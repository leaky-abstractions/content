High-impact polish:
- [ ] Open Graph / share image — when posts are shared on Twitter/LinkedIn/Discord there's no thumbnail; biggest single missing piece. Start with one site-wide image; per-page generated OG cards later.
- [ ] Tag listing pages — tags appear everywhere but clicking them goes nowhere. Add `/tags/<tag>/` pages and a `/tags/` index. Completes the tag system.
- [ ] Drafts handling — verify `draft: true` in frontmatter actually excludes from production builds and listings. WIP episodes must not leak.
- [ ] Code-block copy button — small "copy" button on each `<pre>` block; technical readers will copy code, so make it one click.
- [ ] Accessibility pass — focus indicators, color contrast across all 16 themes, keyboard nav for shell input, skip-to-content link, `aria-label` review on icon-only buttons.
- [x] Favicon — `{;}` mark, JS-generated SVG data URI, theme-responsive (color follows current `--base0E`).
- [ ] '#' as the table of contents button on episodes sites needs to have more glow and grow with intensifity glow on hover
- [ ] grep search modal needs to have a separate scroll container for results where the search stays put at the top

SEO & discoverability:
- [ ] JSON-LD BreadcrumbList — Home → Episodes → Firmament → Episode 2 breadcrumb on series episode pages; small SEO win.
- [ ] Twitter card upgrade — switch `summary` → `summary_large_image` once an OG image exists.
- [ ] Per-page OG images — generated cards with title + date + tags per episode (Vercel-style). Bigger lift, much richer share previews.
- [ ] Sitemap polish — add `<changefreq>` and `<priority>` hints.

Performance & resilience:
- [ ] Self-host JetBrains Mono + Font Awesome — currently from CDN; if Google Fonts or cdnjs degrades, the site does too. Self-hosting also speeds up first paint.
- [ ] Verify reading progress bar — `.reading-progress` element exists in the chrome; confirm it actually fills as you scroll.

Content infrastructure:
- [ ] Archive page — full chronological list of all episodes, useful once homepage's "latest 5" outgrows itself.
- [ ] About / colophon page — content page about the author + the site's stack. Adds personality and is a natural target for the "mrbandler" author link.
- [ ] Better 404 — current 404 is functional but minimal. Could be more whimsical / on-brand (fake `core dumped`, ASCII art, etc.).

Engagement (optional / later):
- [ ] Comments / webmentions — none currently. Options: Giscus / Utterances (GitHub-issue-backed) or skip entirely. Big decision, not urgent.
- [ ] Newsletter integration — Buttondown / ConvertKit / etc. if you want a subscriber list separate from RSS.
- [ ] Share buttons — Twitter / LinkedIn / copy-link on each post. Useful but adds tracking surface; consider trade-offs.
