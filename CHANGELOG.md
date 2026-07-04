# Changelog

## 0.1.1 (unreleased)

- Fixed: `techStack(domain)` now sends `?domain=` (was `?url=`), matching the live API.
- Fixed: `batch(domains)` now sends `{ domains: string[] }` and returns the standard `ApiResponse<BatchResultItem[]>` envelope. Previous versions sent `{ requests: [...] }` and expected a `{ results, total_credits_used }` shape that the live API never returned — `batch()` was non-functional in 0.1.0.
