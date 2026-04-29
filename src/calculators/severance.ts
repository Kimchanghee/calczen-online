/**
 * 퇴직금 계산기 (한국 근로기준법)
 *
 * 산식: 평균임금 × 30 × 근속일수 / 365
 * 평균임금: 퇴직 직전 3개월 임금 합 / 3개월 일수
 *
 * 추가 고려: 연차수당, 상여금 일부 (3개월 비례)
 */

import { calcSeverance } from '../lib/calculators';

export function mountSeverance(root: HTMLElement) {
  root.innerHTML = `
    <div class="grid gap-5">
      <div class="grid gap-3 md:grid-cols-2">
        <label class="text-sm">
          입사일
          <input id="sv-start" type="date" value="2020-01-01" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
        <label class="text-sm">
          퇴직일
          <input id="sv-end" type="date" value="2026-04-29" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
      </div>
      <div class="rounded-lg border bg-white p-4">
        <h3 class="mb-3 font-semibold">퇴직 직전 3개월 임금 (월별)</h3>
        <div class="grid gap-3 md:grid-cols-3">
          <label class="text-sm">
            1개월 전 (원)
            <input id="sv-m1" type="number" value="3500000" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
          </label>
          <label class="text-sm">
            2개월 전 (원)
            <input id="sv-m2" type="number" value="3500000" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
          </label>
          <label class="text-sm">
            3개월 전 (원)
            <input id="sv-m3" type="number" value="3500000" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
          </label>
        </div>
        <label class="mt-3 block text-sm">
          연간 상여금 합계 (원, 선택)
          <input id="sv-bonus" type="number" value="0" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
      </div>
      <div class="rounded-xl border bg-emerald-50 p-5 text-center">
        <div class="text-sm text-emerald-700">예상 퇴직금 (세전)</div>
        <div id="sv-result" class="mt-1 text-3xl font-bold text-emerald-900">-</div>
        <div class="mt-2 grid grid-cols-3 gap-3 text-sm">
          <div>
            <div class="text-slate-500">근속일수</div>
            <div id="sv-days" class="font-semibold">-</div>
          </div>
          <div>
            <div class="text-slate-500">평균임금</div>
            <div id="sv-avg" class="font-semibold">-</div>
          </div>
          <div>
            <div class="text-slate-500">근속연수</div>
            <div id="sv-years" class="font-semibold">-</div>
          </div>
        </div>
      </div>
      <p class="text-xs text-slate-500">
        ※ 1년 미만 근속자는 퇴직금 청구권 없음. 퇴직소득세 별도 계산 필요.
      </p>
    </div>
  `;

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';
  const startEl = root.querySelector<HTMLInputElement>('#sv-start')!;
  const endEl = root.querySelector<HTMLInputElement>('#sv-end')!;
  const m1 = root.querySelector<HTMLInputElement>('#sv-m1')!;
  const m2 = root.querySelector<HTMLInputElement>('#sv-m2')!;
  const m3 = root.querySelector<HTMLInputElement>('#sv-m3')!;
  const bonusEl = root.querySelector<HTMLInputElement>('#sv-bonus')!;

  const recompute = () => {
    const start = new Date(startEl.value);
    const end = new Date(endEl.value);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 365) {
      root.querySelector('#sv-result')!.textContent = '근속 1년 미만 — 청구권 없음';
      root.querySelector('#sv-days')!.textContent = String(days) + '일';
      root.querySelector('#sv-avg')!.textContent = '-';
      root.querySelector('#sv-years')!.textContent = '-';
      return;
    }

    const total3m = (Number(m1.value) || 0) + (Number(m2.value) || 0) + (Number(m3.value) || 0);
    const bonusPortion = (Number(bonusEl.value) || 0) * (3 / 12); // 3개월 비례
    // 평균임금 = (3개월 임금 + 연간 상여 × 3/12) / 92일 (3개월)
    const avgDaily = (total3m + bonusPortion) / 92;
    const avgMonthly = avgDaily * 30;

    const severance = calcSeverance(avgMonthly, days);
    root.querySelector('#sv-result')!.textContent = fmt(severance);
    root.querySelector('#sv-days')!.textContent = days.toLocaleString() + '일';
    root.querySelector('#sv-avg')!.textContent = fmt(avgMonthly);
    root.querySelector('#sv-years')!.textContent = (days / 365).toFixed(1) + '년';
  };

  [startEl, endEl, m1, m2, m3, bonusEl].forEach(el => el.oninput = recompute);
  recompute();
}
