# Changelog

## 0.2.0 - 2026-11-10

- **Breaking (types only): response types for page and site endpoints now match the live API.** The old declarations described fields the API never returned, so reading them gave `undefined` at runtime and no runtime behaviour changes, but code that referenced the old fields will stop compiling:
  - `PageSeoData` is now the nested shape: `title: { text, length, optimal }`, `description`, `canonical: { url, self_referential }`, `robots: { index, follow, raw }`, `headings: { h1, h2, h3_count }`, `og`, `twitter`, `json_ld`, `images`, `links`, `hreflang`, `language`, `viewport`, `final_url`, `status_code`, `response_time_ms`, `word_count`, `favicon`. Removed: flat `h1`, `canonical: string`, `robots: string`, `og_title`, `og_description`, `og_image`, `lang`, `content_type`.
  - `PagePerformanceData` now has `performance_score`, `accessibility_score`, `seo_score`, `core_web_vitals: { lcp_ms, cls, inp_ms, fcp_ms, ttfb_ms }`, `crux_data`, `strategy` and `cached_at`. Removed: `fcp`, `lcp`, `cls`, `tbt`, `si`, `tti`, `fetched_at`. Real-user field values are not returned by the API, only the `crux_data` flag.
  - `TechStackData` gains `domain`, `server`, `x_powered_by`, `response_time_ms` (replacing `url`); `TechEntry` has `confidence` instead of `version`, and `category` is the new `TechCategory` union.
  - `SiteHealthData` is now `https`, `www_redirect`, `checks`, `security_headers`, `robots_txt`. Removed: `total_pages`, `status_codes`, `content_types`, `crawl_errors`.
  - `sitemap()` returns the new `SitemapResponse`: entries are `data: SitemapEntry[]`, with `total`, `sitemap_url`, `sitemap_type`, `child_sitemaps*`, `truncated` and `source` beside them. `SitemapData` is removed.
  - `crawlHistory()` returns `ApiResponse<CrawlHistoryData>` (one object: `first_seen`, `last_seen`, `total_snapshots`, `total_snapshots_capped`, `source`), not an array. `CrawlHistoryRow` is removed. The API ignores `limit` and `offset` here.
  - `schemaMarkup()` is now typed as `SchemaMarkupResponse` (was `ApiResponse<unknown>`).
- Added: `test/response-shapes.test.ts` asserts these shapes with fixtures typed against the SDK, and `npm run typecheck` now covers `test/`.
- Docs: README lists `pageSeo` at its real price (3 credits) and has examples for the page and site endpoints.

## 0.1.1 - 2026-08-03

- Fixed: `techStack(domain)` now sends `?domain=` (was `?url=`), matching the live API.
- Fixed: `batch(domains)` now sends `{ domains: string[] }` and returns the standard `ApiResponse<BatchResultItem[]>` envelope. Previous versions sent `{ requests: [...] }` and expected a `{ results, total_credits_used }` shape that the live API never returned — `batch()` was non-functional in 0.1.0.
