import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankParse, AuthError, InsufficientCreditsError, NotFoundError, RateLimitError, APIError } from '../src/index.js';

const BASE_URL = 'https://api.rankparse.com/v1';
const API_KEY = 'rp_testkey1234567890';

function makeOkResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeErrorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: code, code, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(response: Response) {
  return vi.fn().mockResolvedValue(response);
}

describe('RankParse SDK', () => {
  let client: RankParse;

  beforeEach(() => {
    client = new RankParse({ apiKey: API_KEY });
  });

  // 1. Auth header
  it('sends X-API-Key header on every request', async () => {
    const fetchMock = mockFetch(makeOkResponse({ data: [], credits_used: 1, credits_remaining: 99 }));
    vi.stubGlobal('fetch', fetchMock);

    await client.backlinks('example.com');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe(API_KEY);
  });

  // 2. Params serialized
  it('serializes backlinks limit/offset into query string', async () => {
    const fetchMock = mockFetch(makeOkResponse({ data: [], credits_used: 2, credits_remaining: 98 }));
    vi.stubGlobal('fetch', fetchMock);

    await client.backlinks('example.com', { limit: 50, offset: 100 });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('domain')).toBe('example.com');
    expect(parsed.searchParams.get('limit')).toBe('50');
    expect(parsed.searchParams.get('offset')).toBe('100');
  });

  // 3. 401 -> AuthError
  it('throws AuthError on 401', async () => {
    vi.stubGlobal('fetch', mockFetch(makeErrorResponse(401, 'invalid_api_key', 'Invalid API key')));

    await expect(client.domainAuthority('example.com')).rejects.toBeInstanceOf(AuthError);
  });

  // 4. 402 -> InsufficientCreditsError
  it('throws InsufficientCreditsError on 402', async () => {
    vi.stubGlobal('fetch', mockFetch(makeErrorResponse(402, 'insufficient_credits', 'Not enough credits')));

    await expect(client.backlinks('example.com')).rejects.toBeInstanceOf(InsufficientCreditsError);
  });

  // 5. 404 -> NotFoundError
  it('throws NotFoundError on 404', async () => {
    vi.stubGlobal('fetch', mockFetch(makeErrorResponse(404, 'not_found', 'Not found')));

    await expect(client.domainAuthority('missing.com')).rejects.toBeInstanceOf(NotFoundError);
  });

  // 6. 429 -> RateLimitError
  it('throws RateLimitError on 429', async () => {
    vi.stubGlobal('fetch', mockFetch(makeErrorResponse(429, 'rate_limited', 'Rate limit exceeded')));

    await expect(client.backlinks('example.com')).rejects.toBeInstanceOf(RateLimitError);
  });

  // 7. 500 -> APIError
  it('throws APIError on 500', async () => {
    vi.stubGlobal('fetch', mockFetch(makeErrorResponse(500, 'internal_error', 'Internal server error')));

    await expect(client.backlinks('example.com')).rejects.toBeInstanceOf(APIError);
  });

  // 8. backlinks() happy path
  it('returns correct shape on backlinks() happy path', async () => {
    const mockData = {
      data: [
        {
          from_url: 'https://other.com/page',
          from_domain: 'other.com',
          to_url: 'https://example.com/',
          anchor_text: 'Example',
          link_type: 'dofollow',
          first_seen: '2024-01-01',
          last_seen: '2024-06-01',
        },
      ],
      domain: 'example.com',
      total: 1,
      limit: 100,
      offset: 0,
      credits_used: 2,
      credits_remaining: 98,
    };
    vi.stubGlobal('fetch', mockFetch(makeOkResponse(mockData)));

    const result = await client.backlinks('example.com');

    expect(result.credits_used).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].from_domain).toBe('other.com');
  });

  // 9. domainOverlap() array param — joined with comma, not bracket notation
  it('sends domains as comma-joined string for domainOverlap()', async () => {
    const fetchMock = mockFetch(makeOkResponse({ data: [], credits_used: 5, credits_remaining: 95 }));
    vi.stubGlobal('fetch', fetchMock);

    await client.domainOverlap(['a.com', 'b.com']);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('domains')).toBe('a.com,b.com');
    expect(parsed.searchParams.has('domains[]')).toBe(false);
  });

  // 10. linkIntersect() two domain params
  it('sends domain_a and domain_b for linkIntersect()', async () => {
    const fetchMock = mockFetch(makeOkResponse({ data: [], credits_used: 5, credits_remaining: 95 }));
    vi.stubGlobal('fetch', fetchMock);

    await client.linkIntersect('x.com', 'y.com');

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('domain_a')).toBe('x.com');
    expect(parsed.searchParams.get('domain_b')).toBe('y.com');
  });

  // 11. batch() POST body
  it('sends POST with JSON body for batch()', async () => {
    const mockBatchResponse = {
      data: [{ domain: 'example.com', success: true, data: [], total: 0 }],
      credits_used: 2,
      credits_remaining: 100,
    };
    const fetchMock = mockFetch(makeOkResponse(mockBatchResponse));
    vi.stubGlobal('fetch', fetchMock);

    const domains = ['example.com'];
    await client.batch(domains);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    const parsedBody = JSON.parse(init.body as string) as { domains: typeof domains };
    expect(parsedBody.domains).toEqual(domains);
  });

  // 12. revokeKey() DELETE
  it('uses DELETE method for revokeKey()', async () => {
    const fetchMock = mockFetch(makeOkResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await client.revokeKey('key_abc123');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
    expect(url).toContain('/keys/key_abc123');
  });
});
