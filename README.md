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
| `pageSeo(url)` | Title, description, OG tags, canonical | — | 2 |
| `pagePerformance(url, opts?)` | Core Web Vitals via PageSpeed Insights | `strategy` (mobile/desktop) | 3 |
| `techStack(domain)` | Detected technologies and frameworks | — | 2 |
| `siteHealth(domain)` | Status codes and content-type distribution | — | 2 |
| `sitemap(domain)` | Sitemap URLs found for a domain | — | 2 |
| `crawlHistory(domain, opts?)` | Crawl snapshot history | `limit`, `offset` | 2 |
| `schemaMarkup(url)` | Schema.org markup detected on page | — | 2 |
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
import type { BacklinkRow, DomainAuthorityData, ApiResponse } from 'rankparse';
```

## License

MIT
