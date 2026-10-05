# ImageURL SEO Action Plan

Audit scope: local homepage `http://127.0.0.1:4173/`.  
Status: recommendations only; no fixes have been implemented.

## Priority 1 — Quick wins before production

### 1. Add `robots.txt` and `sitemap.xml`

- Priority: High
- Confidence: Confirmed
- Effort: Low
- Reason: Both local paths returned 404. A sitemap gives search engines a clean discovery signal, while robots.txt provides crawl policy and the sitemap URL.
- Acceptance criteria:
  - `/robots.txt` returns HTTP 200 and references `https://imageurl.net/sitemap.xml`.
  - `/sitemap.xml` returns HTTP 200 with the canonical homepage URL.

### 2. Tune title and meta description

- Priority: High
- Confidence: Confirmed
- Effort: Low
- Current title: 63 characters.
- Current description: 122 characters.
- Acceptance criteria:
  - Title is approximately 50–60 characters and starts with the primary intent.
  - Description is approximately 145–160 characters, includes `image to URL`, and contains a natural action/value statement.

### 3. Add Open Graph and Twitter metadata

- Priority: Medium
- Confidence: Confirmed
- Effort: Low
- Acceptance criteria:
  - `og:title`, `og:description`, `og:url`, `og:type`, and `og:image` are present.
  - `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` are present.
  - The OG image is a real absolute HTTPS URL and is at least 1200×630.

## Priority 2 — Search understanding and trust

### 4. Add JSON-LD structured data

- Priority: High
- Confidence: Confirmed
- Effort: Medium
- Recommended types: `WebApplication`, `WebSite`, `WebPage`; add `Organization` only after operator details are confirmed.
- Do not add `FAQPage` schema for this commercial site.
- Acceptance criteria:
  - JSON-LD uses `https://schema.org`.
  - All URLs are absolute HTTPS URLs.
  - Schema properties match visible page content and contain no placeholders.

### 5. Expand useful homepage content to at least the homepage quality gate

- Priority: High
- Confidence: Confirmed
- Effort: Medium
- Current rendered body: approximately 363 words.
- Add original content, not keyword padding:
  - What an image URL is.
  - How direct image links differ from local file paths.
  - Supported formats and size limits.
  - Website, blog, forum, documentation, and developer use cases.
  - Privacy and automatic retention explanation.
  - A short HTML/Markdown usage example.
- Acceptance criteria: approximately 500+ useful words with natural semantic variation.

### 6. Add transparent entity/trust signals

- Priority: Medium
- Confidence: Confirmed
- Effort: Medium
- Add only confirmed facts:
  - Operator or product ownership name if available.
  - Support/contact route.
  - Privacy and retention summary.
  - Link to full privacy policy and, if applicable, terms.
- Do not invent company credentials, reviews, ratings, or user counts.

## Priority 3 — Measurement and validation

### 7. Run production performance checks

- Priority: Medium
- Confidence: Unknown until deployed
- Effort: Low
- Run mobile and desktop PageSpeed/Lighthouse after the public HTTPS URL is accessible.
- Targets:
  - LCP ≤ 2.5s
  - INP ≤ 200ms
  - CLS ≤ 0.1

### 8. Verify deployed crawl behavior

- Priority: High before launch
- Confidence: Unknown until deployed
- Effort: Low
- Check:
  - HTTPS redirect behavior.
  - Canonical URL.
  - robots.txt and sitemap.xml.
  - Vercel rewrite from `/` to the current homepage.
  - No Preview deployment authentication on the intended public production origin.

### 9. Improve dynamic preview image semantics

- Priority: Low-Medium
- Confidence: Confirmed
- Effort: Low
- Reserve stable dimensions/aspect ratio for the preview image and set a useful alt value after upload, such as `Uploaded image preview` plus the format if available.

## Recommended implementation order

1. Title and meta description.
2. robots.txt and sitemap.xml.
3. Open Graph/Twitter metadata.
4. WebApplication/WebSite/WebPage JSON-LD.
5. Homepage content and trust section.
6. Production deployment verification.
7. PageSpeed/CWV measurement and final tuning.

