/**
 * 대출 월상환액 계산기 — 클라이언트 사이드 100% 작동
 * <calc-loan-monthly> 마운트 → 자동 초기화
 */
import { calcLoanMonthly } from '../lib/calculators';

export function mountLoanMonthly(root: HTMLElement) {
  root.innerHTML = `
    <div class="grid gap-5">
      <div class="grid gap-3 md:grid-cols-3">
        <label class="text-sm">
          대출 원금 (원)
          <input id="lm-principal" type="number" value="300000000" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
        <label class="text-sm">
          연 이자율 (%)
          <input id="lm-rate" type="number" step="0.01" value="4.5" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
        <label class="text-sm">
          상환 기간 (개월)
          <input id="lm-months" type="number" value="360" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
      </div>
      <div class="flex flex-wrap gap-2">
        <button data-type="equal-payment" class="lm-type rounded-lg bg-emerald-600 px-4 py-2 text-white">원리금 균등</button>
        <button data-type="equal-principal" class="lm-type rounded-lg bg-slate-200 px-4 py-2">원금 균등</button>
        <button data-type="bullet" class="lm-type rounded-lg bg-slate-200 px-4 py-2">만기 일시</button>
      </div>
      <div id="lm-result" class="rounded-xl border bg-emerald-50 p-5 text-center">
        <div class="text-sm text-emerald-700">월 상환액</div>
        <div id="lm-monthly" class="mt-1 text-3xl font-bold text-emerald-900">-</div>
        <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-slate-500">총 이자</div>
            <div id="lm-interest" class="font-semibold">-</div>
          </div>
          <div>
            <div class="text-slate-500">총 상환액</div>
            <div id="lm-total" class="font-semibold">-</div>
          </div>
        </div>
      </div>
      <details class="rounded-lg border bg-white">
        <summary class="cursor-pointer p-4 font-medium">상환 스케줄 (전체 보기)</summary>
        <div id="lm-schedule" class="max-h-96 overflow-auto p-4 text-xs"></div>
      </details>
    </div>
  `;

  let type: 'equal-payment' | 'equal-principal' | 'bullet' = 'equal-payment';

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR') + '원';
  const principal = root.querySelector<HTMLInputElement>('#lm-principal')!;
  const rate = root.querySelector<HTMLInputElement>('#lm-rate')!;
  const months = root.querySelector<HTMLInputElement>('#lm-months')!;

  const recompute = () => {
    const p = Number(principal.value) || 0;
    const r = Number(rate.value) || 0;
    const m = Number(months.value) || 0;
    if (p <= 0 || m <= 0) return;
    const result = calcLoanMonthly(p, r, m, type);
    root.querySelector('#lm-monthly')!.textContent = fmt(result.monthly);
    root.querySelector('#lm-interest')!.textContent = fmt(result.totalInterest);
    root.querySelector('#lm-total')!.textContent = fmt(p + result.totalInterest);

    const schedHtml = `
      <table class="w-full">
        <thead class="bg-slate-100">
          <tr><th class="p-2 text-left">회차</th><th class="p-2 text-right">원금</th><th class="p-2 text-right">이자</th><th class="p-2 text-right">잔액</th></tr>
        </thead>
        <tbody>
          ${result.schedule.map(s => `
            <tr class="border-b border-slate-100">
              <td class="p-2">${s.month}</td>
              <td class="p-2 text-right font-mono">${fmt(s.principal)}</td>
              <td class="p-2 text-right font-mono text-slate-500">${fmt(s.interest)}</td>
              <td class="p-2 text-right font-mono">${fmt(s.balance)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;
    root.querySelector('#lm-schedule')!.innerHTML = schedHtml;
  };

  root.querySelectorAll<HTMLButtonElement>('.lm-type').forEach(btn => {
    btn.onclick = () => {
      type = btn.dataset.type as any;
      root.querySelectorAll('.lm-type').forEach(b => {
        b.className = 'lm-type rounded-lg bg-slate-200 px-4 py-2';
      });
      btn.className = 'lm-type rounded-lg bg-emerald-600 px-4 py-2 text-white';
      recompute();
    };
  });
  [principal, rate, months].forEach(el => el.oninput = recompute);
  recompute();
}
