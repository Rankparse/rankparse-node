import {
  RankParseError,
  AuthError,
  InsufficientCreditsError,
  NotFoundError,
  RateLimitError,
  APIError,
} from './errors.js';

import type {
  ApiResponse,
  BacklinkRow,
  ReferringDomainRow,
  OutboundLinkRow,
  AnchorTextRow,
  StubResult,
  LinkIntersectRow,
  DomainAuthorityData,
  DomainRankData,
  DomainOverlapRow,
  SimilarDomainRow,
  CompetitorGapRow,
  LinkAuditData,
  LinkAuditResponse,
  SiteExplorerRow,
  PageSeoData,
  PagePerformanceData,
  TechStackData,
  SiteHealthData,
  TechCategory,
  TechEntry,
  SiteHealthCheck,
  SitemapEntry,
  SitemapResponse,
  CrawlHistoryData,
  SchemaMarkupEntity,
  SchemaMarkupResponse,
  InternalLinkRow,
  TopPageRow,
  BatchResultItem,
  UserProfile,
  ApiKey,
  CreatedKey,
  UsageResponse,
  PaginatedOptions,
  BacklinksOptions,
} from './types.js';

export type {
  ApiResponse,
  BacklinkRow,
  ReferringDomainRow,
  OutboundLinkRow,
  AnchorTextRow,
  StubResult,
  LinkIntersectRow,
  DomainAuthorityData,
  DomainRankData,
  DomainOverlapRow,
  SimilarDomainRow,
  CompetitorGapRow,
  LinkAuditData,
  LinkAuditResponse,
  SiteExplorerRow,
  PageSeoData,
  PagePerformanceData,
  TechStackData,
  SiteHealthData,
  TechCategory,
  TechEntry,
  SiteHealthCheck,
  SitemapEntry,
  SitemapResponse,
  CrawlHistoryData,
  SchemaMarkupEntity,
  SchemaMarkupResponse,
  InternalLinkRow,
  TopPageRow,
  BatchResultItem,
  UserProfile,
  ApiKey,
  CreatedKey,
  UsageResponse,
  PaginatedOptions,
  BacklinksOptions,
};

export { RankParseError, AuthError, InsufficientCreditsError, NotFoundError, RateLimitError, APIError };

export interface RankParseOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class RankParse {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: RankParseOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.rankparse.com/v1';
    this.timeout = options.timeout ?? 30_000;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let timedOut = false;
    const controller = new AbortController();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeout);

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Accept': 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) {
        throw new APIError(`Request timed out after ${this.timeout}ms`, 'timeout', 0);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let errorCode = 'unknown_error';
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorBody = await response.json() as { error?: string; code?: string; message?: string };
        errorCode = errorBody.code ?? errorBody.error ?? errorCode;
        errorMessage = errorBody.message ?? errorBody.error ?? errorMessage;
      } catch {
        // ignore JSON parse failures
      }

      switch (response.status) {
        case 401:
          throw new AuthError(errorMessage, errorCode);
        case 402:
          throw new InsufficientCreditsError(errorMessage, errorCode);
        case 404:
          throw new NotFoundError(errorMessage, errorCode);
        case 429:
          throw new RateLimitError(errorMessage, errorCode);
        default:
          throw new APIError(errorMessage, errorCode, response.status);
      }
    }

    return response.json() as Promise<T>;
  }

  // ---------------------------------------------------------------------------
  // Link graph
  // ---------------------------------------------------------------------------

  async backlinks(
    domain: string,
    opts?: BacklinksOptions
  ): Promise<ApiResponse<BacklinkRow[]>> {
    return this.request('GET', '/backlinks', {
      domain,
      limit: opts?.limit,
      offset: opts?.offset,
      sort: opts?.sort,
      from_domain: opts?.from_domain,
      link_type: opts?.link_type,
    });
  }

  async referringDomains(
    domain: string,
    opts?: PaginatedOptions
  ): Promise<ApiResponse<ReferringDomainRow[]>> {
    return this.request('GET', '/referring-domains', {
      domain,
      limit: opts?.limit,
      offset: opts?.offset,
    });
  }

  async outboundLinks(
    domain: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<OutboundLinkRow[]>> {
    return this.request('GET', '/outbound-links', {
      domain,
      limit: opts?.limit,
    });
  }

  async anchorText(
    domain: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<AnchorTextRow[]>> {
    return this.request('GET', '/anchor-text', {
      domain,
      limit: opts?.limit,
    });
  }

  async linkVelocity(domain: string): Promise<ApiResponse<StubResult>> {
    return this.request('GET', '/link-velocity', { domain });
  }

  async newLinks(domain: string): Promise<ApiResponse<StubResult>> {
    return this.request('GET', '/new-links', { domain });
  }

  async lostLinks(domain: string): Promise<ApiResponse<StubResult>> {
    return this.request('GET', '/lost-links', { domain });
  }

  async linkIntersect(
    domainA: string,
    domainB: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<LinkIntersectRow[]>> {
    return this.request('GET', '/link-intersect', {
      domain_a: domainA,
      domain_b: domainB,
      limit: opts?.limit,
    });
  }

  // ---------------------------------------------------------------------------
  // Domain intelligence
  // ---------------------------------------------------------------------------

  async domainAuthority(domain: string): Promise<ApiResponse<DomainAuthorityData>> {
    return this.request('GET', '/domain-authority', { domain });
  }

  async domainRank(domain: string): Promise<ApiResponse<DomainRankData>> {
    return this.request('GET', '/domain-rank', { domain });
  }

  async domainOverlap(
    domains: string[],
    opts?: { limit?: number }
  ): Promise<ApiResponse<DomainOverlapRow[]>> {
    return this.request('GET', '/domain-overlap', {
      domains: domains.join(','),
      limit: opts?.limit,
    });
  }

  async similarDomains(
    domain: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<SimilarDomainRow[]>> {
    return this.request('GET', '/similar-domains', {
      domain,
      limit: opts?.limit,
    });
  }

  async competitorGap(
    domain: string,
    vs: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<CompetitorGapRow[]>> {
    return this.request('GET', '/competitor-gap', {
      domain,
      vs,
      limit: opts?.limit,
    });
  }

  async linkAudit(domain: string): Promise<ApiResponse<LinkAuditData>> {
    const raw = await this.request<Record<string, unknown>>('GET', '/link-audit', { domain });
    // The API returns a flat object — extract envelope fields to match ApiResponse<T> shape
    const { credits_used, credits_remaining, crawl_release, cached, domain: d, ...data } = raw as {
      credits_used: number;
      credits_remaining: number;
      crawl_release?: string;
      cached?: boolean;
      domain: string;
      [key: string]: unknown;
    };
    return {
      domain: d,
      data: data as unknown as LinkAuditData,
      credits_used,
      credits_remaining,
      crawl_release,
      cached,
    };
  }

  async siteExplorer(
    domain: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<SiteExplorerRow[]>> {
    return this.request('GET', '/site-explorer', {
      domain,
      limit: opts?.limit,
    });
  }

  // ---------------------------------------------------------------------------
  // Page / site
  // ---------------------------------------------------------------------------

  async pageSeo(url: string): Promise<ApiResponse<PageSeoData>> {
    return this.request('GET', '/page-seo', { url });
  }

  async pagePerformance(
    url: string,
    opts?: { strategy?: 'mobile' | 'desktop' }
  ): Promise<ApiResponse<PagePerformanceData>> {
    return this.request('GET', '/page-performance', {
      url,
      strategy: opts?.strategy,
    });
  }

  async techStack(domain: string): Promise<ApiResponse<TechStackData>> {
    return this.request('GET', '/tech-stack', { domain });
  }

  async siteHealth(domain: string): Promise<ApiResponse<SiteHealthData>> {
    return this.request('GET', '/site-health', { domain });
  }

  async sitemap(domain: string): Promise<SitemapResponse> {
    return this.request('GET', '/sitemap', { domain });
  }

  async crawlHistory(
    domain: string,
    opts?: PaginatedOptions
  ): Promise<ApiResponse<CrawlHistoryData>> {
    return this.request('GET', '/crawl-history', {
      domain,
      limit: opts?.limit,
      offset: opts?.offset,
    });
  }

  async schemaMarkup(url: string): Promise<SchemaMarkupResponse> {
    return this.request('GET', '/schema-markup', { url });
  }

  async internalLinks(
    url: string,
    opts?: PaginatedOptions
  ): Promise<ApiResponse<InternalLinkRow[]>> {
    return this.request('GET', '/internal-links', {
      url,
      limit: opts?.limit,
      offset: opts?.offset,
    });
  }

  async topPages(
    domain: string,
    opts?: { limit?: number }
  ): Promise<ApiResponse<TopPageRow[]>> {
    return this.request('GET', '/top-pages', {
      domain,
      limit: opts?.limit,
    });
  }

  // ---------------------------------------------------------------------------
  // Batch
  // ---------------------------------------------------------------------------

  async batch(domains: string[]): Promise<ApiResponse<BatchResultItem[]>> {
    return this.request('POST', '/batch', undefined, { domains });
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  async me(): Promise<ApiResponse<UserProfile>> {
    return this.request('GET', '/me');
  }

  async credits(): Promise<ApiResponse<{ balance: number }>> {
    return this.request('GET', '/credits');
  }

  async keys(): Promise<ApiKey[]> {
    const res = await this.request<{ keys: ApiKey[] }>('GET', '/keys');
    return res.keys;
  }

  async createKey(name?: string): Promise<CreatedKey> {
    return this.request('POST', '/keys', undefined, { name });
  }

  async revokeKey(keyId: string): Promise<void> {
    await this.request('DELETE', `/keys/${keyId}`);
  }

  async usage(opts?: PaginatedOptions): Promise<ApiResponse<UsageResponse>> {
    return this.request('GET', '/usage', {
      limit: opts?.limit,
      offset: opts?.offset,
    });
  }

  async checkout(packId: string): Promise<ApiResponse<{ checkout_url: string }>> {
    return this.request('POST', '/checkout', undefined, { pack_id: packId });
  }
}

export default RankParse;
