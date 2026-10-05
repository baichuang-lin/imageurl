const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
let failures = 0;

function check(label, condition, detail = '') {
  const ok = Boolean(condition);
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}\n`);
  if (!ok) failures += 1;
}

const requiredFiles = [
  'mvp-homepage.html',
  'privacy.html',
  'package.json',
  'vercel.json',
  '.env.example',
  'api/upload-url.js',
  'api/complete-upload.js',
  'api/cleanup.js',
  'api/_lib/config.js',
  'api/_lib/http.js',
  'api/_lib/r2.js',
  'docs/REUSE-AND-PITFALLS.md',
  'AGENTS.md'
];

for (const file of requiredFiles) {
  check(`required file ${file}`, fs.existsSync(path.join(root, file)));
}

for (const file of requiredFiles.filter((file) => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  check(`syntax ${file}`, result.status === 0, (result.stderr || '').trim());
}

const homepage = fs.readFileSync(path.join(root, 'mvp-homepage.html'), 'utf8');
check('homepage language is English', /<html\s+lang="en"/i.test(homepage));
check('homepage has one H1', (homepage.match(/<h1\b/gi) || []).length === 1);
check('homepage has SEO title', /<title>[^<]*Image to URL Converter/i.test(homepage));
check('homepage has meta description', /<meta\s+name="description"/i.test(homepage));
check('homepage has canonical URL', /rel="canonical"\s+href="https:\/\/imageurl\.net\/"/i.test(homepage));
check('homepage links privacy policy', /href="\/privacy\.html"/i.test(homepage));

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const name of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_BASE_URL', 'ANONYMOUS_RETENTION_DAYS', 'CLEANUP_MAX_PAGES', 'CRON_SECRET']) {
  check(`environment template includes ${name}`, new RegExp(`^${name}=`, 'm').test(envExample));
}

check('real .env is not present in project root', !fs.existsSync(path.join(root, '.env')), 'keep credentials outside committed files');

process.stdout.write(`\n${failures ? `${failures} check(s) failed.` : 'All project checks passed.'}\n`);
process.exit(failures ? 1 : 0);
