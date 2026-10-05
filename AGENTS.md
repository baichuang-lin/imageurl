# ImageURL.net project rules

These rules apply to every future development session in this repository.

1. Do not deploy, push, change production environment variables, DNS, Cloudflare, R2, or Vercel unless the user explicitly says `上生产`, `部署`, or equivalent.
2. Read `docs/REUSE-AND-PITFALLS.md` before changing architecture, upload, storage, cleanup, Vercel, R2, security, or SEO behavior.
3. Reuse the shared modules in `api/_lib/`; do not duplicate environment parsing, R2 client creation, or JSON response helpers in each function.
4. Keep image bytes off Vercel whenever possible. The browser uploads directly to R2 and the CDN serves public images directly.
5. Never print, commit, or paste full secrets. Real credentials belong only in local ignored environment files and Vercel environment variables.
6. Fail closed when security configuration is missing. Cron, deletion, admin, and future moderation endpoints must not become public because a secret is absent.
7. Treat browser-provided filename, extension, MIME type, size, identity, and upload completion as untrusted. Production launch requires post-upload file-signature validation and abuse controls.
8. Public image URLs are immutable. Never overwrite an existing public object; replacing an image creates a new public ID and URL.
9. Keep the MVP focused on one feature: image to URL. Do not add pricing, accounts, extra tools, or unrelated product lines without an explicit product decision.
10. Before handoff, run `node scripts/verify-project.js` and clearly distinguish locally tested behavior from unconfigured or untested cloud behavior.

