export interface ApiResponse<T = unknown> {
  data: T;
  domain?: string;
  url?: string;
  total?: number;
  limit?: number;
  offset?: number;
  credits_used: number;
  credits_remaining: number;
  crawl_release?: string;
  cached?: boolean;
}

export interface BacklinkRow {
  from_url: string;
  from_domain: string;
  to_url: string;
  anchor_text: string | null;
  link_type: string | null;
  first_seen: string | null;
  last_seen: string | null;
}

export interface ReferringDomainRow {
  from_domain: string;
  backlink_count: number;
  first_seen: string | null;
  last_seen: string | null;
}

export interface OutboundLinkRow {
  to_url: string;
  to_domain: string;
  anchor_text: string | null;
  link_type: string | null;
}

export interface AnchorTextRow {
  anchor_text: string;
  count: number;
}

export interface StubResult {
  status: string;
  message: string;
}

export interface LinkIntersectRow {
  from_domain: string;
  backlink_count_a: number;
  backlink_count_b: number;
}

export interface DomainAuthorityData {
  domain: string;
  authority_score: number;
  backlink_count: number;
  referring_domain_count: number;
  outbound_link_count: number;
  registered_at: string | null;
  registrar: string | null;
  popularity_rank: number | null;
}

export interface DomainRankData {
  domain: string;
  rank: number | null;
  percentile: number | null;
}

export interface DomainOverlapRow {
  domain: string;
  overlap_count: number;
  total_a: number;
  total_b: number;
  overlap_pct: number;
}

export interface SimilarDomainRow {
  domain: string;
  similarity_score: number;
  shared_backlinks: number;
}

export interface CompetitorGapRow {
  from_domain: string;
  links_to_competitor: number;
  links_to_target: number;
}

export interface LinkAuditData {
  total_backlinks: number;
  total_referring_domains: number;
  nofollow_count: number;
  dofollow_count: number;
  sponsored_count: number;
  ugc_count: number;
  top_anchors: AnchorTextRow[];
}

/** @deprecated Use LinkAuditData wrapped in ApiResponse<LinkAuditData> instead */
export interface LinkAuditResponse extends LinkAuditData {
  domain: string;
  credits_used: number;
  credits_remaining: number;
}

export interface SiteExplorerRow {
  url: string;
  title: string | null;
  backlink_count: number;
  referring_domain_count: number;
}

export interface PageSeoData {
  /** The URL you sent. */
  url: string;
  /** The URL after following redirects. */
  final_url: string;
  /** HTTP status the target returned. The API still answers 200 (and bills) for a 404 or 500 target. */
  status_code: number;
  response_time_ms: number;
  title: { text: string | null; length: number; optimal: boolean };
  description: { text: string | null; length: number; optimal: boolean };
  canonical: { url: string | null; self_referential: boolean | null };
  robots: { index: boolean; follow: boolean; raw: string | null };
  viewport: string | null;
  language: {
    primary: string | null;
    tag: string | null;
    source: 'html_lang' | 'content_language_header' | 'meta_http_equiv' | null;
  };
  hreflang: Array<{ lang: string; url: string }>;
  headings: { h1: string[]; h2: string[]; h3_count: number };
  /** Open Graph tags keyed by the name after `og:` (`og:image:width` becomes `imageWidth`). */
  og: Record<string, string | undefined>;
  /** Twitter card tags keyed by the name after `twitter:`. */
  twitter: Record<string, string | undefined>;
  /** Parsed JSON-LD objects. For flattened `@graph` entities use `schemaMarkup()`. */
  json_ld: unknown[];
  images: { total: number; missing_alt: number };
  links: { internal: number; external: number };
  word_count: number;
  favicon: string | null;
}

/** Google's real-user (CrUX) data is not returned, only whether it exists (`crux_data`). */
export interface PagePerformanceData {
  /** The URL that was measured. */
  url: string;
  /** Lighthouse category scores, 0 to 100. A category Google did not return is reported as 0. */
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  /** Lab metrics. Each is null when Google did not return it. Times are in milliseconds. */
  core_web_vitals: {
    lcp_ms: number | null;
    /** Unitless. */
    cls: number | null;
    /** Often null in lab runs. */
    inp_ms: number | null;
    fcp_ms: number | null;
    ttfb_ms: number | null;
  };
  /** True when Google holds Chrome UX Report field data for the URL. */
  crux_data: boolean;
  strategy: 'mobile' | 'desktop';
  /** ISO 8601 time the result was produced; on a cache hit, up to 24 hours ago. */
  cached_at: string;
}

export type TechCategory =
  | 'framework'
  | 'cms'
  | 'ecommerce'
  | 'analytics'
  | 'cdn'
  | 'hosting'
  | 'email_marketing'
  | 'ab_testing'
  | 'payments'
  | 'crm'
  | 'support';

export interface TechEntry {
  name: string;
  category: TechCategory;
  confidence: 'definite' | 'high' | 'medium';
}

export interface TechStackData {
  domain: string;
  technologies: TechEntry[];
  /** `Server` response header. */
  server: string | null;
  /** `X-Powered-By` response header. */
  x_powered_by: string | null;
  response_time_ms: number;
}

export interface SiteHealthCheck {
  url: string;
  /** null when the request failed. */
  status: number | null;
  content_type: string | null;
  response_time_ms: number | null;
}

export interface SiteHealthData {
  domain: string;
  https: { enforced: boolean; hsts: boolean; hsts_max_age: number | null };
  www_redirect: { enabled: boolean; target: string | null };
  /** The home page, `/robots.txt` and `/sitemap.xml`, in that order. */
  checks: SiteHealthCheck[];
  security_headers: {
    x_frame_options: string | null;
    x_content_type_options: string | null;
    content_security_policy: boolean;
    strict_transport_security: string | null;
    referrer_policy: string | null;
  };
  robots_txt: { present: boolean; disallow_all: boolean; sitemap_declared: boolean };
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * `sitemap()` puts the entries in `data` and the discovery details beside it,
 * at the top level of the envelope.
 */
export interface SitemapResponse extends ApiResponse<SitemapEntry[]> {
  /** Entries found, before `limit` trims `data`. */
  total: number;
  sitemap_url: string | null;
  sitemap_type: 'sitemap' | 'sitemap_index' | 'none';
  child_sitemaps: string[];
  /** Child sitemaps discovered, before `child_sitemaps` is capped at 200. */
  child_sitemaps_total: number;
  child_sitemaps_fetched: string[];
  /** True when a cap stopped the walk, so `data` and `total` under-report the site. */
  truncated: boolean;
  source: 'sitemap' | 'none';
}

/** Wayback Machine summary. One object per domain, not a list of snapshots. */
export interface CrawlHistoryData {
  domain: string;
  first_seen: string | null;
  last_seen: string | null;
  /** Captures counted, up to 10,000. null when the count lookup failed. */
  total_snapshots: number | null;
  /** True when the count hit the cap, so the real total is at least that. */
  total_snapshots_capped: boolean;
  source: 'wayback_machine';
}

export interface SchemaMarkupEntity {
  /** Always an array, even for a single string `@type`. */
  type: string[];
  id: string | null;
  /** 0-based index of the `ld+json` block the entity came from. */
  block_index: number;
  source: 'top_level' | 'graph';
  /** The full parsed JSON-LD object. */
  properties: Record<string, unknown>;
}

/**
 * `schemaMarkup()` puts the entities in `data` and the page details beside it,
 * at the top level of the envelope.
 */
export interface SchemaMarkupResponse extends ApiResponse<SchemaMarkupEntity[]> {
  /** Same as `entity_count`. */
  total: number;
  final_url: string;
  status_code: number;
  response_time_ms: number;
  has_schema_markup: boolean;
  /** Unique schema.org types on the page, sorted. */
  types: string[];
  block_count: number;
  valid_block_count: number;
  invalid_block_count: number;
  /** Malformed blocks are skipped and reported here. */
  invalid_blocks: Array<{ index: number; error: string }>;
}

export interface InternalLinkRow {
  from_url: string;
  to_url: string;
  anchor_text: string | null;
}

export interface TopPageRow {
  url: string;
  title: string | null;
  backlink_count: number;
  referring_domain_count: number;
  estimated_traffic: number | null;
}

export interface BatchResultItem {
  domain: string;
  data?: BacklinkRow[];
  total?: number;
  success: boolean;
  error?: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  credits: number;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  last_four: string;
  created_at: string;
  revoked: boolean;
}

export interface CreatedKey extends ApiKey {
  key: string;
}

export interface UsageResponse {
  entries: UsageEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface UsageEntry {
  endpoint: string;
  credits_used: number;
  created_at: string;
  domain: string | null;
  url: string | null;
}

export interface PaginatedOptions {
  limit?: number;
  offset?: number;
}

export interface BacklinksOptions extends PaginatedOptions {
  sort?: 'importance' | 'recent';
  from_domain?: string;
  link_type?: string;
}
