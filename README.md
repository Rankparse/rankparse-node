# rankparse

Official Node.js / TypeScript SDK for the [RankParse](https://rankparse.com) SEO API.

RankParse gives you 25+ SEO signals — backlinks, domain authority, tech stack, page metadata, and more — powered by pre-processed Common Crawl data, served from Cloudflare's edge.

## Install

```bash
npm install rankparse
```

## Quick Start

```ts
import { RankParse } from 'rankparse';

const client = new RankParse({ apiKey: 'rp_your_key_here' });

const result = await client.domainAuthority('example.com');
console.log(result.data.authority_score);  // e.g. 72
console.log(result.credits_remaining);     // credits left after this call
```

## Constructor Options

```ts
new RankParse({
  apiKey: string;       // required — your rp_... API key
  baseUrl?: string;     // default: 'https://api.rankparse.com/v1'
  timeout?: number;     // request timeout in ms, default: 30_000
})
```

## Methods

All methods return a `Promise`. Paginated endpoints accept `{ limit?, offset? }` options.

### Link Graph

| Method | Description | Params | Credits |
|---|---|---|---|
| `backlinks(domain, opts?)` | Inbound links to a domain | `limit`, `offset`, `sort`, `from_domain`, `link_type` | 2 |
| `referringDomains(domain, opts?)` | Unique domains linking to target | `limit`, `offset` | 2 |
| `outboundLinks(domain, opts?)` | Links from a domain to others | `limit` | 2 |
| `anchorText(domain, opts?)` | Top anchor text breakdown | `limit` | 2 |
| `linkVelocity(domain)` | Link growth over time (stub in v1) | — | 0 |
| `newLinks(domain)` | Recently gained links (stub in v1) | — | 0 |
| `lostLinks(domain)` | Recently lost links (stub in v1) | — | 0 |
| `linkIntersect(domainA, domainB, opts?)` | Domains linking to both targets | `limit` | 5 |

### Domain Intelligence

| Method | Description | Params | Credits |
|---|---|---|---|
| `domainAuthority(domain)` | Authority score + RDAP + Tranco rank | — | 1 |
| `domainRank(domain)` | Popularity rank among crawled domains | — | 2 |
| `domainOverlap(domains[], opts?)` | Backlink overlap between domains | `limit` | 5 |
| `similarDomains(domain, opts?)` | Domains with similar backlink profiles | `limit` | 5 |
| `competitorGap(domain, vs, opts?)` | Backlink sources your competitor has that you don't | `limit` | 5 |
| `linkAudit(domain)` | Full link quality audit | — | 2 |
| `siteExplorer(domain, opts?)` | Top pages by backlink count | `limit` | 10 |

### Page / Site

| Method | Description | Params | Credits |
|---|---|---|---|
| `pageSeo(url)` | Live on-page audit: title, description, canonical, robots, headings, OG/Twitter, JSON-LD, images, links | — | 3 |
| `pagePerformance(url, opts?)` | Core Web Vitals via PageSpeed Insights | `strategy` (mobile/desktop) | 3 |
| `techStack(domain)` | Detected technologies, `Server` and `X-Powered-By` | — | 2 |
| `siteHealth(domain)` | Live check: HTTPS/HSTS, www redirect, security headers, robots.txt | — | 2 |
| `sitemap(domain)` | Sitemap entries found for a domain (the API also accepts `limit`, default 100, max 1000) | — | 2 (0 if none found) |
| `crawlHistory(domain)` | Wayback Machine first/last seen and snapshot count | — | 2 |
| `schemaMarkup(url)` | JSON-LD entities on the page, including `@graph` | — | 2 |
| `internalLinks(url, opts?)` | Internal link graph for a page | `limit`, `offset` | 2 |
| `topPages(domain, opts?)` | Top pages by estimated traffic | `limit` | 2 |

### Batch

| Method | Description | Credits |
|---|---|---|
| `batch(domains[])` | Backlink lookup for up to 50 domains in one request | 2 per domain |

```ts
const result = await client.batch(['github.com', 'stripe.com']);
```

### Dashboard (no credit cost)

| Method | Description |
|---|---|
| `me()` | Your user profile and credit balance |
| `credits()` | Current credit balance |
| `keys()` | List your API keys |
| `createKey(name?)` | Create a new API key (returns raw key once) |
| `revokeKey(keyId)` | Revoke an API key |
| `usage(opts?)` | Paginated usage logs |
| `checkout(packId)` | Create a Stripe checkout session for a credit pack |

## Page and site examples

These endpoints return nested objects, so read fields through them (`data.title.text`, not `data.title`).

```ts
const seo = await client.pageSeo('https://stripe.com/about');
console.log(seo.data.title.text, seo.data.title.optimal); // 'About Stripe', false
console.log(seo.data.canonical.self_referential);          // true
console.log(seo.data.headings.h1);                         // ['About Stripe']
console.log(seo.data.images.missing_alt);                  // 2

const perf = await client.pagePerformance('https://stripe.com', { strategy: 'desktop' });
console.log(perf.data.performance_score);                  // 87
console.log(perf.data.core_web_vitals.lcp_ms);             // 1834.5 (null when Google omits it)
console.log(perf.data.crux_data);                          // true when real-user data exists

const tech = await client.techStack('example.com');
tech.data.technologies.forEach((t) => console.log(t.name, t.category, t.confidence));
console.log(tech.data.server);                             // 'cloudflare'

const health = await client.siteHealth('example.com');
console.log(health.data.https.enforced, health.data.robots_txt.present);

// sitemap() and schemaMarkup() put the list in `data` and extra details beside it.
const sm = await client.sitemap('example.com');
console.log(sm.data.length, sm.total, sm.sitemap_url, sm.truncated);

const history = await client.crawlHistory('example.com');
console.log(history.data.first_seen, history.data.total_snapshots);
```

## Response Envelope

All data endpoints return an `ApiResponse<T>` envelope:

```ts
interface ApiResponse<T> {
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
```

## Error Handling

```ts
import {
  RankParse,
  AuthError,
  InsufficientCreditsError,
  NotFoundError,
  RateLimitError,
  APIError,
} from 'rankparse';

const client = new RankParse({ apiKey: 'rp_...' });

try {
  const result = await client.backlinks('example.com', { limit: 50 });
  console.log(result.data);
} catch (err) {
  if (err instanceof AuthError) {
    console.error('Invalid API key');
  } else if (err instanceof InsufficientCreditsError) {
    console.error('Top up your credits at https://rankparse.com/dashboard');
  } else if (err instanceof RateLimitError) {
    console.error('Slow down — rate limit hit');
  } else if (err instanceof APIError) {
    console.error(`API error ${err.status}: ${err.message} (${err.code})`);
  } else {
    throw err;
  }
}
```

All error classes extend `RankParseError` which has:
- `message` — human-readable description
- `code` — machine-readable error code string
- `status` — HTTP status code

## TypeScript

The SDK ships full TypeScript types. All response shapes are exported from the package root:

```ts
import type { BacklinkRow, DomainAuthorityData, PageSeoData, ApiResponse } from 'rankparse';
```

## License

MIT
