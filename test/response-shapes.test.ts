import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankParse } from '../src/index.js';
import type {
  ApiResponse,
  CrawlHistoryData,
  PagePerformanceData,
  PageSeoData,
  SchemaMarkupResponse,
  SiteHealthData,
  SitemapResponse,
  TechStackData,
} from '../src/index.js';

// Fixtures mirror what the live API returns (api/src/endpoints/*.ts in rankparse-api). Each is
// annotated with the SDK type, so `npm run typecheck` fails when a type drifts from the response.
// The runtime assertions then check the client hands the body back unchanged.

function respondWith(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('response shapes match the live API', () => {
  let client: RankParse;

  beforeEach(() => {
    client = new RankParse({ apiKey: 'rp_testkey1234567890' });
  });

  it('pageSeo() returns nested objects, not flat fields', async () => {
    const body: ApiResponse<PageSeoData> = {
      url: 'https://stripe.com/about',
      data: {
        url: 'https://stripe.com/about',
        final_url: 'https://stripe.com/about',
        status_code: 200,
        response_time_ms: 312,
        title: { text: 'About Stripe', length: 12, optimal: false },
        description: { text: null, length: 0, optimal: false },
        canonical: { url: 'https://stripe.com/about', self_referential: true },
        robots: { index: true, follow: true, raw: 'index,follow' },
        viewport: 'width=device-width, initial-scale=1',
        language: { primary: 'en', tag: 'en-US', source: 'html_lang' },
        hreflang: [{ lang: 'fr', url: 'https://stripe.com/fr/about' }],
        headings: { h1: ['About Stripe'], h2: ['Our mission'], h3_count: 4 },
        og: { title: 'About Stripe', imageWidth: '1200' },
        twitter: { card: 'summary_large_image' },
        json_ld: [{ '@type': 'Organization', name: 'Stripe' }],
        images: { total: 8, missing_alt: 2 },
        links: { internal: 24, external: 3 },
        word_count: 412,
        favicon: 'https://stripe.com/favicon.ico',
      },
      credits_used: 3,
      credits_remaining: 997,
    };
    const fetchMock = respondWith(body);

    const res = await client.pageSeo('https://stripe.com/about');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(new URL(url).pathname).toBe('/v1/page-seo');
    expect(res.data.title.text).toBe('About Stripe');
    expect(res.data.title.optimal).toBe(false);
    expect(res.data.description.text).toBeNull();
    expect(res.data.canonical.self_referential).toBe(true);
    expect(res.data.robots.index).toBe(true);
    expect(res.data.headings.h1).toEqual(['About Stripe']);
    expect(res.data.og.imageWidth).toBe('1200');
    expect(res.data.images.missing_alt).toBe(2);
    expect(res.data.links.external).toBe(3);
    expect(res.data.language.source).toBe('html_lang');
    expect(res.data.final_url).toBe('https://stripe.com/about');
    // The old flat fields were never in the response.
    expect(res.data).not.toHaveProperty('h1');
    expect(res.data).not.toHaveProperty('og_title');
    expect(res.data).not.toHaveProperty('lang');
  });

  it('pagePerformance() returns category scores, core_web_vitals and crux_data', async () => {
    const body: ApiResponse<PagePerformanceData> = {
      url: 'https://stripe.com',
      data: {
        url: 'https://stripe.com',
        performance_score: 87,
        accessibility_score: 94,
        seo_score: 100,
        core_web_vitals: { lcp_ms: 1834.5, cls: 0.02, inp_ms: null, fcp_ms: 912, ttfb_ms: 148 },
        crux_data: true,
        strategy: 'desktop',
        cached_at: '2026-10-11T09:42:17.318Z',
      },
      credits_used: 3,
      credits_remaining: 997,
    };
    const fetchMock = respondWith(body);

    const res = await client.pagePerformance('https://stripe.com', { strategy: 'desktop' });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(new URL(url).searchParams.get('strategy')).toBe('desktop');
    expect(res.data.performance_score).toBe(87);
    expect(res.data.accessibility_score).toBe(94);
    expect(res.data.seo_score).toBe(100);
    expect(res.data.core_web_vitals.lcp_ms).toBe(1834.5);
    expect(res.data.core_web_vitals.inp_ms).toBeNull();
    expect(res.data.crux_data).toBe(true);
    expect(res.data.strategy).toBe('desktop');
    expect(res.data.cached_at).toBe('2026-10-11T09:42:17.318Z');
    // The old lab-metric fields were never in the response.
    expect(res.data).not.toHaveProperty('lcp');
    expect(res.data).not.toHaveProperty('fetched_at');
  });

  it('techStack() returns technologies with a confidence, plus server headers', async () => {
    const body: ApiResponse<TechStackData> = {
      domain: 'example.com',
      data: {
        domain: 'example.com',
        technologies: [
          { name: 'WordPress', category: 'cms', confidence: 'definite' },
          { name: 'Cloudflare', category: 'cdn', confidence: 'high' },
        ],
        server: 'cloudflare',
        x_powered_by: null,
        response_time_ms: 240,
      },
      credits_used: 2,
      credits_remaining: 98,
    };
    const fetchMock = respondWith(body);

    const res = await client.techStack('example.com');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(new URL(url).searchParams.get('domain')).toBe('example.com');
    expect(res.data.technologies[0]).toEqual({ name: 'WordPress', category: 'cms', confidence: 'definite' });
    expect(res.data.server).toBe('cloudflare');
    expect(res.data.x_powered_by).toBeNull();
    expect(res.data.response_time_ms).toBe(240);
    expect(res.data.technologies[0]).not.toHaveProperty('version');
  });

  it('siteHealth() returns https, www_redirect, checks, security_headers and robots_txt', async () => {
    const body: ApiResponse<SiteHealthData> = {
      domain: 'example.com',
      data: {
        domain: 'example.com',
        https: { enforced: true, hsts: true, hsts_max_age: 31536000 },
        www_redirect: { enabled: true, target: 'https://example.com/' },
        checks: [
          { url: 'https://example.com/', status: 200, content_type: 'text/html', response_time_ms: 180 },
          { url: 'https://example.com/robots.txt', status: 200, content_type: 'text/plain', response_time_ms: 90 },
          { url: 'https://example.com/sitemap.xml', status: null, content_type: null, response_time_ms: null },
        ],
        security_headers: {
          x_frame_options: 'DENY',
          x_content_type_options: 'nosniff',
          content_security_policy: false,
          strict_transport_security: 'max-age=31536000',
          referrer_policy: null,
        },
        robots_txt: { present: true, disallow_all: false, sitemap_declared: true },
      },
      credits_used: 2,
      credits_remaining: 98,
    };
    respondWith(body);

    const res = await client.siteHealth('example.com');

    expect(res.data.https.hsts_max_age).toBe(31536000);
    expect(res.data.www_redirect.target).toBe('https://example.com/');
    expect(res.data.checks).toHaveLength(3);
    expect(res.data.checks[2].status).toBeNull();
    expect(res.data.security_headers.content_security_policy).toBe(false);
    expect(res.data.robots_txt.sitemap_declared).toBe(true);
    expect(res.data).not.toHaveProperty('status_codes');
    expect(res.data).not.toHaveProperty('total_pages');
  });

  it('sitemap() returns the entries as data with discovery details at the top level', async () => {
    const body: SitemapResponse = {
      domain: 'example.com',
      data: [
        { url: 'https://example.com/', lastmod: '2026-10-01', priority: '1.0' },
        { url: 'https://example.com/about' },
      ],
      total: 2,
      sitemap_url: 'https://example.com/sitemap.xml',
      sitemap_type: 'sitemap',
      child_sitemaps: [],
      child_sitemaps_total: 0,
      child_sitemaps_fetched: [],
      truncated: false,
      source: 'sitemap',
      credits_used: 2,
      credits_remaining: 98,
    };
    respondWith(body);

    const res = await client.sitemap('example.com');

    expect(res.data).toHaveLength(2);
    expect(res.data[0].lastmod).toBe('2026-10-01');
    expect(res.data[1].lastmod).toBeUndefined();
    expect(res.total).toBe(2);
    expect(res.sitemap_url).toBe('https://example.com/sitemap.xml');
    expect(res.sitemap_type).toBe('sitemap');
    expect(res.truncated).toBe(false);
    expect(res.source).toBe('sitemap');
  });

  it('sitemap() on a domain with no sitemap answers an empty list, charged 0', async () => {
    const body: SitemapResponse = {
      domain: 'nositemap.example',
      data: [],
      total: 0,
      sitemap_url: null,
      sitemap_type: 'none',
      child_sitemaps: [],
      child_sitemaps_total: 0,
      child_sitemaps_fetched: [],
      truncated: false,
      source: 'none',
      credits_used: 0,
      credits_remaining: 100,
    };
    respondWith(body);

    const res = await client.sitemap('nositemap.example');

    expect(res.data).toEqual([]);
    expect(res.sitemap_url).toBeNull();
    expect(res.credits_used).toBe(0);
  });

  it('crawlHistory() returns one Wayback summary object, not a list', async () => {
    const body: ApiResponse<CrawlHistoryData> = {
      domain: 'example.com',
      data: {
        domain: 'example.com',
        first_seen: '2004-03-12',
        last_seen: '2026-10-30',
        total_snapshots: 10000,
        total_snapshots_capped: true,
        source: 'wayback_machine',
      },
      credits_used: 2,
      credits_remaining: 98,
    };
    respondWith(body);

    const res = await client.crawlHistory('example.com');

    expect(Array.isArray(res.data)).toBe(false);
    expect(res.data.first_seen).toBe('2004-03-12');
    expect(res.data.total_snapshots).toBe(10000);
    expect(res.data.total_snapshots_capped).toBe(true);
    expect(res.data.source).toBe('wayback_machine');
  });

  it('schemaMarkup() returns entities as data with page details at the top level', async () => {
    const body: SchemaMarkupResponse = {
      url: 'https://example.com/',
      data: [
        {
          type: ['Organization'],
          id: null,
          block_index: 0,
          source: 'top_level',
          properties: { '@type': 'Organization', name: 'Example' },
        },
        {
          type: ['WebSite'],
          id: 'https://example.com/#website',
          block_index: 1,
          source: 'graph',
          properties: { '@type': 'WebSite', '@id': 'https://example.com/#website' },
        },
      ],
      total: 2,
      final_url: 'https://example.com/',
      status_code: 200,
      response_time_ms: 210,
      has_schema_markup: true,
      types: ['Organization', 'WebSite'],
      block_count: 3,
      valid_block_count: 2,
      invalid_block_count: 1,
      invalid_blocks: [{ index: 2, error: 'Unexpected token } in JSON at position 14' }],
      credits_used: 2,
      credits_remaining: 98,
    };
    respondWith(body);

    const res = await client.schemaMarkup('https://example.com/');

    expect(res.data).toHaveLength(2);
    expect(res.data[1].source).toBe('graph');
    expect(res.total).toBe(2);
    expect(res.types).toEqual(['Organization', 'WebSite']);
    expect(res.has_schema_markup).toBe(true);
    expect(res.invalid_blocks[0].index).toBe(2);
  });
});
