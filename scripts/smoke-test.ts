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
