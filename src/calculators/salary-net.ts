/**
 * 연봉 실수령액 계산기 (한국, 2026년 기준)
 * 4대보험 + 소득세 + 지방소득세 차감 후 실수령액.
 *
 * 요율 (2026):
 *   국민연금 4.5%, 건강보험 3.545%, 장기요양 12.95% × 건강보험료, 고용보험 0.9%
 *   소득세: 간이세액표 (사실상 누진 → 단순화 적용)
 */

const PENSION_RATE = 0.045;
const HEALTH_RATE = 0.03545;
const LONGTERM_RATE = 0.1295;
const EMPLOYMENT_RATE = 0.009;
const PENSION_MAX_BASE = 5_530_000; // 월 상한 (2026 기준 추정)

function incomeTax(monthlyTaxableMillion: number): number {
  // 간이세액표 단순화 — 부양가족 1인 기준 근사 (실세값과 ±10% 오차 가능)
  const m = monthlyTaxableMillion;
  if (m < 1.5) return Math.max(0, m * 0.005 * 1_000_000);
  if (m < 2.5) return (m * 0.02 - 0.02) * 1_000_000;
  if (m < 3.5) return (m * 0.04 - 0.07) * 1_000_000;
  if (m < 5) return (m * 0.07 - 0.18) * 1_000_000;
  if (m < 7) return (m * 0.10 - 0.34) * 1_000_000;
  if (m < 10) return (m * 0.13 - 0.55) * 1_000_000;
  return (m * 0.18 - 1.10) * 1_000_000;
}

export function mountSalaryNet(root: HTMLElement) {
  root.innerHTML = `
    <div class="grid gap-5">
      <div class="grid gap-3 md:grid-cols-2">
        <label class="text-sm">
          연봉 (세전, 원)
          <input id="sn-annual" type="number" value="50000000" step="1000000" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
        <label class="text-sm">
          부양가족 (본인 포함)
          <input id="sn-deps" type="number" value="1" min="1" max="10" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
      </div>
      <div class="rounded-xl border bg-emerald-50 p-5 text-center">
        <div class="text-sm text-emerald-700">월 실수령액</div>
        <div id="sn-net-monthly" class="mt-1 text-3xl font-bold text-emerald-900">-</div>
        <div class="mt-1 text-sm text-emerald-700">연 실수령액: <span id="sn-net-annual" class="font-semibold">-</span></div>
      </div>
      <div class="rounded-lg border bg-white p-4">
        <h3 class="mb-3 font-semibold">월별 공제 내역</h3>
        <div id="sn-breakdown" class="grid gap-1.5 text-sm font-mono"></div>
      </div>
      <p class="text-xs text-slate-500">
        ※ 2026년 요율 기준 추정값. 비과세 항목·연말정산 환급 미반영. 실제 명세서와 차이 가능.
      </p>
    </div>
  `;

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';
  const annualEl = root.querySelector<HTMLInputElement>('#sn-annual')!;
  const depsEl = root.querySelector<HTMLInputElement>('#sn-deps')!;

  const recompute = () => {
    const annual = Number(annualEl.value) || 0;
    const monthly = annual / 12;
    const monthlyMil = monthly / 1_000_000;

    const pensionBase = Math.min(monthly, PENSION_MAX_BASE);
    const pension = pensionBase * PENSION_RATE;
    const health = monthly * HEALTH_RATE;
    const longterm = health * LONGTERM_RATE;
    const employment = monthly * EMPLOYMENT_RATE;
    const incTax = incomeTax(monthlyMil);
    const localTax = incTax * 0.1;

    const totalDeduction = pension + health + longterm + employment + incTax + localTax;
    const netMonthly = monthly - totalDeduction;
    const netAnnual = netMonthly * 12;

    root.querySelector('#sn-net-monthly')!.textContent = fmt(netMonthly);
    root.querySelector('#sn-net-annual')!.textContent = fmt(netAnnual);

    const rows: [string, number][] = [
      ['세전 월급', monthly],
      ['국민연금 (4.5%)', -pension],
      ['건강보험 (3.545%)', -health],
      ['장기요양보험 (건보 × 12.95%)', -longterm],
      ['고용보험 (0.9%)', -employment],
      ['소득세 (간이세액 추정)', -incTax],
      ['지방소득세 (소득세 × 10%)', -localTax],
      ['= 실수령액', netMonthly],
    ];
    root.querySelector('#sn-breakdown')!.innerHTML = rows.map(([label, val]) => `
      <div class="flex justify-between ${label.startsWith('=') ? 'border-t pt-2 mt-1 font-bold' : ''}">
        <span class="text-slate-600">${label}</span>
        <span class="${val < 0 ? 'text-red-600' : 'text-slate-900'}">${val < 0 ? '-' : ''}${fmt(Math.abs(val))}</span>
      </div>
    `).join('');
  };

  [annualEl, depsEl].forEach(el => el.oninput = recompute);
  recompute();
}
