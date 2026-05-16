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
  url: string;
  title: string | null;
  description: string | null;
  h1: string | null;
  canonical: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  lang: string | null;
  word_count: number | null;
  status_code: number | null;
  content_type: string | null;
}

export interface PagePerformanceData {
  url: string;
  strategy: string;
  performance_score: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  si: number | null;
  tti: number | null;
  fetched_at: string;
}

export interface TechStackData {
  url: string;
  technologies: TechEntry[];
}

export interface TechEntry {
  name: string;
  category: string | null;
  version: string | null;
}

export interface SiteHealthData {
  domain: string;
  total_pages: number;
  status_codes: Record<string, number>;
  content_types: Record<string, number>;
  crawl_errors: number;
}

export interface SitemapData {
  domain: string;
  sitemap_urls: string[];
  page_count: number | null;
}

export interface CrawlHistoryRow {
  crawl_date: string;
  page_count: number;
  backlink_count: number;
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

export interface BatchRequest {
  endpoint: string;
  params: Record<string, string | number | boolean>;
}

export interface BatchResponse {
  results: Array<{
    endpoint: string;
    data: unknown;
    error?: string;
    credits_used: number;
  }>;
  total_credits_used: number;
  credits_remaining: number;
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
