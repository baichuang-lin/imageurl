# Reuse and pitfalls log

Last updated: October 3, 2026

This file is the durable memory for ImageURL.net. Read it before building another upload path, storage adapter, cleanup job, Vercel function, or deployment workflow.

## Confirmed product and architecture decisions

- Product: English-language single-purpose `Image to URL Converter`.
- Production frontend and API target: Vercel.
- Image storage target: Cloudflare R2 Standard.
- Public delivery target: `https://cdn.imageurl.net/i/{public-id}.{ext}`.
- Upload path: browser requests a short-lived presigned URL, then uploads directly to R2.
- Vercel must authorize and coordinate uploads, but should not proxy normal image bytes.
- Public URLs are immutable and should return `Cache-Control: public, max-age=31536000, immutable`.
- Anonymous retention is currently planned as 90 days, configurable with `ANONYMOUS_RETENTION_DAYS`.
- Marketing may say `Long-lasting direct image links`, but must not say `permanent`, `never expires`, or make an unconditional lifetime guarantee.
- Privacy and terms must disclose automatic removal and removal for abuse, legal, security, and operational reasons.
- No pricing, account system, additional image tools, API tokens, or team workspace in the MVP.

## What was learned from hairstyle-ai.net

Hairstyle-ai.net uses Vercel plus Supabase database/private Storage, not Cloudflare R2. It is useful as an engineering reference, not as a storage implementation to copy verbatim.

Reusable ideas:

- Separate development behavior from production behavior with explicit configuration; never let a fake development identity or local storage fallback become reachable in production.
- Use a scheduled cleanup endpoint protected by a secret.
- Store retention as configuration instead of scattering durations through code.
- Add timeouts to every external service call. Missing timeouts previously manifested as a page that appeared to load forever.
- Verify the actual production code path, not only a convenient local mock path.
- Use private storage and short-lived signed URLs for sensitive user photos. This remains correct for hairstyle-ai.net, but is not the public delivery model for ImageURL.net.
- Keep a health/verification script that fails with a non-zero exit code and uses isolated scratch state.
- Never trust a user ID, payment state, upload completion, or other authority asserted by the browser.
- Cron and webhook behavior should be idempotent because retries and overlapping invocations happen.

Do not copy these hairstyle-ai.net choices into ImageURL.net:

- Do not return short-lived signed URLs as the final product result. ImageURL.net sells a stable public image URL.
- Do not store public images in a private bucket unless a CDN/Worker provides the stable public URL layer.
- Do not route every image download through a Vercel function.
- Do not reuse its Supabase project, bucket, credentials, or private-image retention rules.

## Reusable code already present

Use these modules instead of recreating them:

- `api/_lib/config.js`: required environment variables and validated positive integers.
- `api/_lib/http.js`: JSON responses and correct 405 responses with an `Allow` header.
- `api/_lib/r2.js`: one cached R2 client, bucket name, and public base URL.
- `api/upload-url.js`: validates declared type/size and creates a short-lived presigned PUT URL.
- `api/complete-upload.js`: verifies that an expected object exists and returns the server-derived public URL.
- `api/cleanup.js`: secret-protected, paginated anonymous object cleanup.
- `scripts/verify-project.js`: dependency-free local structural and syntax verification.

If a database is added later, add one storage/repository module. Do not put raw database calls independently in every endpoint.

## Production blockers currently known

These are not optional polish. Resolve them before a public launch.

### 1. Post-upload file validation

Current presigning validates only the browser's declared MIME type and size. A malicious client can lie. `HeadObject` also reports stored metadata, not the true file signature.

Required production design:

1. Upload to a quarantine key or private upload bucket.
2. Read and validate magic bytes and decode the image.
3. Reject polyglots, malformed images, unsupported animation/size, or decompression bombs.
4. Publish or copy the validated object to the immutable `i/` namespace.
5. Delete the quarantine object on success or failure.

Do not make the final `i/` key public before validation.

### 2. Abuse protection

Add before public launch:

- IP and network-based rate limiting.
- Per-file and daily upload limits.
- Cloudflare Turnstile when traffic or abuse requires it.
- Moderation/report/remove workflow.
- A way to block a public ID quickly.
- Logging that does not record full secrets or unnecessary personal data.

In-memory rate limiting is insufficient on Vercel because separate function instances do not share memory. Use Cloudflare, Vercel Firewall, Upstash, a database, or another shared counter.

### 3. Deletion ownership

Anonymous users need a deletion capability. Return a one-time deletion token, store only its hash, and require it for deletion. Never put the deletion secret inside the public image URL.

### 4. Legal pages

`privacy.html` is a starter draft. Replace placeholder contact/legal details and review the actual retention, providers, jurisdiction, and user rights before launch. Add Terms and an abuse/reporting channel.

### 5. Cleanup semantics

R2 `LastModified` is the upload/change time, not the last-viewed time. The current 90-day cleanup therefore means 90 days after upload, even if an image remains popular.

If the product later promises retention based on usage, record access separately or change the retention policy. Do not assume CDN reads update R2 object timestamps.

### 6. Cleanup scale and duration

The cleanup endpoint paginates and caps work with `CLEANUP_MAX_PAGES`. Check the returned `truncated` field. At larger scale, use R2 lifecycle rules, queues, a database expiry index, or several bounded cron passes rather than one unbounded serverless run.

## R2 and CORS pitfalls

- Presigned PUT request headers must match the headers used when signing. In particular, send the same `Content-Type`.
- CORS controls browser JavaScript access and direct uploads. It is not the same as hotlink protection and does not stop another website from embedding a public image.
- Add exact production and preview origins deliberately. Do not use `*` with credentials.
- A Vercel preview domain may differ per deployment; decide whether to use a stable preview alias rather than continuously editing R2 CORS.
- Do not expose R2 S3 credentials to the browser. The browser receives only a short-lived presigned URL.
- Do not expose internal object keys that encode user email, original filename, IP, or directory structure.
- Do not enable bucket listing.
- `r2.dev` is suitable for temporary testing, not the final branded URL.
- Custom-domain caching must be tested with real response headers. Configuration screenshots are not proof.

## Vercel pitfalls

- A plain static server does not execute files under `/api`; use Vercel Preview or `vercel dev` for end-to-end API testing.
- Vercel environment variables are scoped to Development, Preview, and Production. Configure the intended environments explicitly.
- Changing environment variables usually requires a new deployment before functions see the new values.
- Vercel Cron uses an HTTP request. Keep the endpoint idempotent, bounded, secret-protected, and safe to retry.
- Do not proxy large images through Vercel unless required for validation; it adds bandwidth, duration, and body-size constraints.
- Keep cloud SDK clients outside the handler where safe so warm invocations can reuse them.
- Do not rely on local filesystem persistence in a serverless function.

## Upload and URL invariants

- One upload creates one new public ID.
- A public URL is never overwritten with different bytes.
- Server constructs the final public URL; ignore a `publicUrl` supplied by the client.
- Allowed MVP types: JPEG, PNG, WEBP, GIF. SVG remains disabled because of active-content/XSS risk.
- Maximum MVP file size: 5 MB, enforced both before presigning and after upload validation.
- Original filenames are not used in public URLs.
- Error messages shown to users are specific but do not expose provider internals or secrets.
- Image response should be inline with correct `Content-Type`, `ETag`, byte ranges where supported, and `X-Content-Type-Options: nosniff` where the delivery layer permits it.

## SEO and UI invariants

- Canonical homepage: `https://imageurl.net/`.
- One H1: `Image to URL Converter`.
- Primary query: `image to url`.
- Natural supporting language: `image to URL converter`, `image URL`, `image to link`, `direct image link`, and `convert image to URL`.
- Do not create several near-duplicate keyword pages until they have genuinely different functionality or content.
- The upload component remains the first-screen primary action.
- Do not advertise formats, limits, retention, privacy behavior, or availability that the production system does not actually provide.

## Required verification sequence

Before asking whether to deploy:

1. Run `node scripts/verify-project.js`.
2. Run the page locally and check desktop/mobile layout.
3. Test unsupported type, oversized file, network failure, copy failure, and repeat upload.
4. On a Vercel Preview with test R2 configuration, upload a real JPG, PNG, WEBP, and GIF.
5. Open each returned URL in a clean browser session.
6. Verify response status, `Content-Type`, cache headers, and that bytes are the expected image.
7. Verify unauthorized cleanup returns 401 and missing Cron configuration fails closed.
8. Run an authorized cleanup against test-only expired objects and confirm current objects survive.
9. Confirm no secret appears in HTML, browser storage, API JSON, logs, or repository files.
10. Report what was actually tested separately from what remains inferred or unconfigured.

