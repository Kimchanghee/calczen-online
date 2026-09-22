import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CALCULATORS, calcBMI, calcLoanMonthly, calcSeverance, calcVAT } from '../src/lib/calculators';
import { calculateGeneral, getGeneralCalculatorSlugs, getGeneralDefaults } from '../src/calculators/general';

const zeroRateLoan = calcLoanMonthly(12_000_000, 0, 12, 'equal-payment');
assert.equal(Math.round(zeroRateLoan.monthly), 1_000_000);
assert.equal(Math.round(zeroRateLoan.totalInterest), 0);
assert.equal(zeroRateLoan.schedule.length, 12);

const standardLoan = calcLoanMonthly(100_000_000, 4.5, 360, 'equal-payment');
assert.ok(standardLoan.monthly > 500_000 && standardLoan.monthly < 510_000);
assert.equal(standardLoan.schedule.length, 360);
assert.ok(standardLoan.schedule.at(-1)!.balance < 0.01);

assert.equal(Math.round(calcSeverance(3_500_000, 365)), 3_500_000);
assert.deepEqual(calcBMI(68, 170), { bmi: 23.5, category: '과체중' });
const vat = calcVAT(110_000, 0.1, 'extract');
assert.equal(Math.round(vat.net), 100_000);
assert.equal(Math.round(vat.vat), 10_000);

const catalogCopy = CALCULATORS.map((calculator) => `${calculator.name} ${calculator.description}`).join('\n');
for (const unsupportedClaim of [
  '규제·비규제 지역 별도',
  '월·분기·연 복리',
  '취업후상환 시뮬레이션',
  '1주택 비과세 자동 판정',
  '관계별 공제·할증 적용',
  '세대 합산 종부세',
  '산재 본인·회사 부담분',
  '길이·무게·온도·면적·부피 종합',
]) {
  assert.ok(!catalogCopy.includes(unsupportedClaim), `Unsupported catalog claim remains: ${unsupportedClaim}`);
}
assert.equal(
  CALCULATORS.find((calculator) => calculator.slug === 'severance-pay')?.description,
  '1일 평균임금 × 30 × 근속일수 / 365 기준 퇴직금 추정.',
);

const affiliateCopy = readFileSync(new URL('../src/components/AffiliateBanner.astro', import.meta.url), 'utf8');
assert.doesNotMatch(affiliateCopy, /많이 보는|Associates 회원|amazon associates/i);
assert.match(affiliateCopy, /적격 구매 시 운영자가 수수료를 받을 수 있습니다/);

const dedicated = new Set(['loan-monthly-payment', 'salary-net-calculator', 'severance-pay', 'bmi']);
const generalSlugs = getGeneralCalculatorSlugs();
assert.equal(generalSlugs.length, CALCULATORS.length - dedicated.size);
for (const calculator of CALCULATORS) {
  if (dedicated.has(calculator.slug)) continue;
  assert.ok(generalSlugs.includes(calculator.slug), `Missing functional calculator: ${calculator.slug}`);
  const result = calculateGeneral(calculator.slug, getGeneralDefaults(calculator.slug));
  assert.ok(result.headline.length > 0, `Empty headline: ${calculator.slug}`);
  assert.ok(result.rows.length > 0, `Empty result rows: ${calculator.slug}`);
  assert.ok(result.note.length > 0, `Missing caution: ${calculator.slug}`);
}

const compound = calculateGeneral('compound-interest', {
  principal: '1000000', monthly: '0', rate: '0', years: '1',
});
assert.equal(compound.headline, '1,000,000원');

const unit = calculateGeneral('unit-converter', { kind: 'km-mi', value: '1' });
assert.match(unit.headline, /^0\.621371 마일$/);

console.log(`Arithmetic smoke tests passed: ${CALCULATORS.length} calculators covered (${dedicated.size} dedicated + ${generalSlugs.length} shared module).`);

// Build-output checks are opt-in because the required pre-build smoke run may see old dist.
assert.equal(CALCULATORS.length, 27);
assert.equal(new Set(CALCULATORS.map(c => c.slug)).size, 27);
const layoutSource = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const aboutSource = readFileSync(new URL('../src/pages/about.astro', import.meta.url), 'utf8');
const methodologySource = readFileSync(new URL('../src/pages/methodology.astro', import.meta.url), 'utf8');
assert.match(layoutSource, /indexable = false/);
assert.match(layoutSource, /'noindex, nofollow, noarchive'/);
assert.match(homeSource, /CALCULATORS\.filter/);
assert.match(homeSource, /class="station-link" href=\{'\/calc\/' \+ calc.slug\}/);
assert.match(homeSource, /routeMap indexable/);
assert.match(aboutSource, /canonicalPath="\/about" indexable/);
assert.match(methodologySource, /canonicalPath="\/methodology" indexable/);
assert.doesNotMatch(homeSource, /calcLoanMonthly|Math\.pow/);
if (process.argv.includes('--dist')) {
  const indexDirective = /name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/;
  const noindexDirective = /name="robots" content="noindex, nofollow, noarchive"/;
  const home = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.equal((home.match(/class="station-link"/g) ?? []).length, 27);
  assert.match(home, indexDirective);
  for (const c of CALCULATORS) {
    assert.ok(home.includes(`href="/calc/${c.slug}"`), `Missing station: ${c.slug}`);
    const html = readFileSync(new URL(`../dist/calc/${c.slug}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(`data-slug="${c.slug}"`));
    assert.match(html, noindexDirective);
    assert.doesNotMatch(html, indexDirective);
  }
  const xml = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  assert.equal((xml.match(/<loc>/g) ?? []).length, 3);
  for (const path of ['https://calczen.online/', 'https://calczen.online/about', 'https://calczen.online/methodology']) {
    assert.ok(xml.includes(`<loc>${path}</loc>`), `Missing sitemap URL: ${path}`);
  }
  assert.doesNotMatch(xml, /\/calc\/|\/categories\/|blog|discover|lastmod/);
  for (const c of ['loan', 'tax', 'labor', 'life']) {
    const categoryHtml = readFileSync(new URL(`../dist/categories/${c}/index.html`, import.meta.url), 'utf8');
    assert.match(categoryHtml, noindexDirective);
    assert.doesNotMatch(categoryHtml, indexDirective);
  }
  for (const p of ['about', 'methodology']) {
    const policyHtml = readFileSync(new URL(`../dist/${p}/index.html`, import.meta.url), 'utf8');
    assert.match(policyHtml, indexDirective);
    assert.doesNotMatch(policyHtml, noindexDirective);
  }
  const robots = readFileSync(new URL('../dist/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /Allow: \//);
  assert.doesNotMatch(robots, /Disallow:/);
  assert.match(robots, /Sitemap: https:\/\/calczen\.online\/sitemap\.xml/);
  const headers = readFileSync(new URL('../dist/_headers', import.meta.url), 'utf8');
  assert.doesNotMatch(headers, /^\/\*\r?\n  X-Robots-Tag:/m);
  for (const route of ['/calc/*', '/categories/*', '/blog/*', '/discover.html', '/404.html', '/llms.txt', '/llms-full.txt']) {
    assert.ok(headers.includes(`${route}\n  X-Robots-Tag: noindex, nofollow, noarchive`) || headers.includes(`${route}\r\n  X-Robots-Tag: noindex, nofollow, noarchive`), `Missing scoped X-Robots-Tag: ${route}`);
  }
  const notFound = readFileSync(new URL('../dist/404.html', import.meta.url), 'utf8');
  assert.match(notFound, noindexDirective);
  assert.doesNotMatch(notFound, indexDirective);
  const llms = readFileSync(new URL('../dist/llms-full.txt', import.meta.url), 'utf8');
  assert.match(llms, /Search indexing is intentionally limited/);
  for (const c of CALCULATORS) assert.ok(llms.includes(`/calc/${c.slug}`));
  console.log('Built indexing checks passed: only 3 canonical pages indexable; 27 calculators, 4 categories, 7 legacy pages, 404 and llms routes remain noindex.');
}

// Legacy public HTML is served directly: audit it separately from Astro layouts.
const quarantinedPages = [
  'blog/index.html',
  'blog/2026-salary-calculator-guide/index.html',
  'blog/bmi-calculator-asia-standard/index.html',
  'blog/loan-calculator-explained/index.html',
  'blog/retirement-savings-2026/index.html',
  'blog/severance-pay-2026/index.html',
  'discover.html',
];
for (const relativePath of quarantinedPages) {
  const source = readFileSync(new URL(`../public/${relativePath}`, import.meta.url), 'utf8');
  assert.match(source, /<html lang="ko">/);
  assert.match(source, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(source, /data-archive-status="source-review-pending"/);
  assert.match(source, /원문 제공 중단 · 출처 검토 미완료/);
  assert.doesNotMatch(source, /<script|application\/ld\+json|article:published_time|og:type[^>]*article/i);
  assert.doesNotMatch(source, /200ms|2026년|최신 세율|정확한 실수령액|정확한 퇴직금|monthly with the latest|real-world usage|Related owned sites|professionally reviewed/i);
  const originalPath = relativePath.endsWith('/index.html') ? `/${relativePath.replace(/index\.html$/, '')}` : `/${relativePath}`;
  assert.ok(source.includes(`href="https://calczen.online${originalPath}"`), `Original canonical changed: ${relativePath}`);
  if (process.argv.includes('--dist')) {
    const built = readFileSync(new URL(`../dist/${relativePath}`, import.meta.url), 'utf8');
    assert.equal(built, source, `Stale quarantine output: ${relativePath}`);
    const xml = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
    assert.ok(!xml.includes(originalPath), `Quarantined route in sitemap: ${relativePath}`);
  }
}
console.log(`Legacy quarantine checks passed: ${quarantinedPages.length} preserved URLs with source-review notice, noindex and no scripts/schema.`);
