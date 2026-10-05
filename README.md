# ImageURL.net MVP

This repository contains the English MVP for a single-purpose `Image to URL Converter`.

Before making architecture or storage changes, read `AGENTS.md` and `docs/REUSE-AND-PITFALLS.md`. They record reusable implementation patterns, launch blockers, and previously encountered pitfalls.

## Product flow

1. The browser requests a short-lived presigned upload URL from `/api/upload-url`.
2. The browser uploads the image directly to Cloudflare R2.
3. `/api/complete-upload` verifies the object and returns the public URL on `cdn.imageurl.net`.
4. A scheduled `/api/cleanup` job removes expired anonymous objects.

The application does not proxy image bytes through Vercel. This keeps the Vercel function focused on authorization, validation, and metadata while the CDN serves image files directly.

## Local preview

The static preview server can be started with `node preview-server.js`. It serves the page at `http://127.0.0.1:4173/`. Upload API calls require a deployed Vercel environment and configured R2 variables, so the local static server intentionally does not pretend to complete uploads.

## Vercel and R2 configuration

Copy `.env.example` to the deployment environment and set the values there. Never commit real credentials.

Configure the R2 bucket CORS policy to allow `PUT` requests from the production site origin and local development origin, and expose `Content-Type`/`ETag` as needed. Attach the public custom domain `cdn.imageurl.net` to the bucket or its delivery Worker.

The Vercel cron invokes `/api/cleanup` daily. Set `CRON_SECRET` and verify the cron authorization before enabling the job. The cleanup implementation currently scans the first 1,000 objects under `i/`; add cursor pagination before operating at large scale.

## Verification

`node scripts/verify-project.js`

The current UI and API scaffolding are local only. No production deployment or external credential setup is included.
