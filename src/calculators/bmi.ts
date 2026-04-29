/**
 * BMI 계산기 — 체질량지수 + 표준체중 + 다이어트 권장 칼로리
 */
import { calcBMI } from '../lib/calculators';

export function mountBMI(root: HTMLElement) {
  root.innerHTML = `
    <div class="grid gap-5">
      <div class="grid gap-3 md:grid-cols-3">
        <label class="text-sm">
          신장 (cm)
          <input id="bmi-h" type="number" value="170" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
        <label class="text-sm">
          체중 (kg)
          <input id="bmi-w" type="number" value="68" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
        <label class="text-sm">
          나이
          <input id="bmi-age" type="number" value="30" class="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </label>
      </div>
      <div class="grid gap-3 md:grid-cols-2">
        <label class="text-sm">
          성별
          <select id="bmi-sex" class="mt-1 w-full rounded border px-3 py-2">
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </label>
        <label class="text-sm">
          활동량
          <select id="bmi-act" class="mt-1 w-full rounded border px-3 py-2">
            <option value="1.2">거의 운동 안 함 (사무직)</option>
            <option value="1.375" selected>가벼운 운동 (주 1-3회)</option>
            <option value="1.55">중간 운동 (주 3-5회)</option>
            <option value="1.725">강한 운동 (주 6-7회)</option>
            <option value="1.9">매우 강한 운동 (운동선수)</option>
          </select>
        </label>
      </div>

      <div class="rounded-xl border bg-emerald-50 p-5 text-center">
        <div class="text-sm text-emerald-700">BMI</div>
        <div id="bmi-value" class="mt-1 text-4xl font-bold text-emerald-900">-</div>
        <div id="bmi-cat" class="mt-1 text-sm font-medium"></div>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <div class="rounded-lg border bg-white p-4">
          <div class="text-xs text-slate-500">표준체중 (BMI 22)</div>
          <div id="bmi-std" class="mt-1 text-xl font-bold">-</div>
        </div>
        <div class="rounded-lg border bg-white p-4">
          <div class="text-xs text-slate-500">기초대사량 (BMR)</div>
          <div id="bmi-bmr" class="mt-1 text-xl font-bold">-</div>
        </div>
        <div class="rounded-lg border bg-white p-4">
          <div class="text-xs text-slate-500">유지 칼로리 (TDEE)</div>
          <div id="bmi-tdee" class="mt-1 text-xl font-bold">-</div>
        </div>
      </div>

      <div class="rounded-lg border bg-rose-50 p-4">
        <h3 class="mb-2 font-semibold text-rose-900">목표별 권장 칼로리</h3>
        <div id="bmi-goals" class="grid gap-1.5 text-sm"></div>
      </div>

      <p class="text-xs text-slate-500">
        ※ Mifflin-St Jeor 공식 기반 추정. 의료 자문 아님 — 실제 영양 상담은 전문가에게.
      </p>
    </div>
  `;

  const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
  const h = root.querySelector<HTMLInputElement>('#bmi-h')!;
  const w = root.querySelector<HTMLInputElement>('#bmi-w')!;
  const age = root.querySelector<HTMLInputElement>('#bmi-age')!;
  const sex = root.querySelector<HTMLSelectElement>('#bmi-sex')!;
  const act = root.querySelector<HTMLSelectElement>('#bmi-act')!;

  const colorByCat = (cat: string) => ({
    '저체중': 'text-blue-700',
    '정상': 'text-emerald-700',
    '과체중': 'text-yellow-700',
    '경도비만': 'text-orange-700',
    '고도비만': 'text-red-700',
  } as Record<string, string>)[cat] || 'text-slate-700';

  const recompute = () => {
    const wt = Number(w.value) || 0;
    const ht = Number(h.value) || 0;
    if (wt <= 0 || ht <= 0) return;
    const { bmi, category } = calcBMI(wt, ht);
    root.querySelector('#bmi-value')!.textContent = String(bmi);
    const catEl = root.querySelector('#bmi-cat')!;
    catEl.textContent = category;
    catEl.className = `mt-1 text-sm font-medium ${colorByCat(category)}`;

    const std = 22 * (ht / 100) ** 2;
    const ageN = Number(age.value) || 30;
    const isMale = sex.value === 'male';
    // Mifflin-St Jeor BMR
    const bmr = isMale
      ? 10 * wt + 6.25 * ht - 5 * ageN + 5
      : 10 * wt + 6.25 * ht - 5 * ageN - 161;
    const tdee = bmr * Number(act.value);

    root.querySelector('#bmi-std')!.textContent = std.toFixed(1) + ' kg';
    root.querySelector('#bmi-bmr')!.textContent = fmt(bmr) + ' kcal';
    root.querySelector('#bmi-tdee')!.textContent = fmt(tdee) + ' kcal';

    const goals: [string, number][] = [
      ['공격적 감량 (-1kg/주)', tdee - 1100],
      ['보통 감량 (-0.5kg/주)', tdee - 550],
      ['유지', tdee],
      ['보통 증량 (+0.5kg/주)', tdee + 550],
      ['공격적 증량 (+1kg/주)', tdee + 1100],
    ];
    root.querySelector('#bmi-goals')!.innerHTML = goals.map(([label, kcal]) => `
      <div class="flex justify-between">
        <span class="text-slate-700">${label}</span>
        <span class="font-mono font-semibold">${fmt(kcal)} kcal/일</span>
      </div>
    `).join('');
  };

  [h, w, age, sex, act].forEach(el => el.addEventListener('input', recompute));
  recompute();
}
