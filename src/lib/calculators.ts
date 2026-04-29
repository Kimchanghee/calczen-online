/**
 * 한국형 계산기 50종 메타 + 핵심 산식.
 * 각 계산기는 클라이언트 사이드 100% 작동.
 * 세법·요율은 매년 갱신 필요 → scripts/fetch-rates.ts 에서 ECOS·공단 페이지 폴링.
 */

export type CalcCategory = 'loan' | 'tax' | 'labor' | 'life';

export interface CalcMeta {
  id: string;
  category: CalcCategory;
  slug: string;
  name: string;
  description: string;
  /** 검색 트래픽 키워드 (SEO 메타용) */
  keywords: string[];
}

export const CALCULATORS: CalcMeta[] = [
  // 금융 (loan)
  { id: 'mortgage-ltv', category: 'loan', slug: 'mortgage-ltv-dti-dsr',
    name: '주택담보대출 LTV·DTI·DSR 계산기',
    description: '주택 가격, 소득, 기존 대출로 가능 한도 산정. 규제·비규제 지역 별도.',
    keywords: ['LTV 계산기', 'DTI 계산기', 'DSR 계산기', '주담대 한도'] },
  { id: 'loan-monthly', category: 'loan', slug: 'loan-monthly-payment',
    name: '대출 월상환액 계산기',
    description: '원리금균등·원금균등·만기일시 상환 방식별 월상환액과 총이자.',
    keywords: ['대출 계산기', '원리금균등', '월상환액'] },
  { id: 'savings-vs-deposit', category: 'loan', slug: 'savings-vs-deposit',
    name: '적금 vs 예금 수익 비교',
    description: '동일 원금·기간일 때 적금과 예금 만기 수령액 차이.',
    keywords: ['적금 계산기', '예금 계산기', '복리'] },
  { id: 'compound-interest', category: 'loan', slug: 'compound-interest',
    name: '복리 계산기',
    description: '월·분기·연 복리 적용 시 미래 가치.',
    keywords: ['복리 계산기', '단리'] },
  { id: 'auto-loan', category: 'loan', slug: 'auto-loan',
    name: '자동차 할부 계산기',
    description: '신차·중고차 할부 월 부담액 + 총이자.',
    keywords: ['자동차 할부', '오토론'] },
  { id: 'student-loan', category: 'loan', slug: 'student-loan',
    name: '학자금 대출 상환 계산기',
    description: '한국장학재단 일반·취업후상환 시뮬레이션.',
    keywords: ['학자금 대출', '취업후상환'] },

  // 세금 (tax)
  { id: 'income-tax', category: 'tax', slug: 'comprehensive-income-tax',
    name: '종합소득세 계산기',
    description: '근로·사업·이자·배당 소득 합산 종합소득세 산출.',
    keywords: ['종합소득세 계산기', '5월 종합소득세'] },
  { id: 'capital-gains', category: 'tax', slug: 'capital-gains-tax',
    name: '양도소득세 계산기',
    description: '주택·토지·주식 양도 시 양도세. 1주택 비과세 자동 판정.',
    keywords: ['양도세 계산기', '1주택 비과세'] },
  { id: 'gift-tax', category: 'tax', slug: 'gift-tax',
    name: '증여세 계산기',
    description: '증여재산·관계별 공제·할증 적용.',
    keywords: ['증여세 계산기', '증여재산공제'] },
  { id: 'inheritance-tax', category: 'tax', slug: 'inheritance-tax',
    name: '상속세 계산기',
    description: '상속재산·일괄공제·기초공제 적용 후 세액 추정.',
    keywords: ['상속세 계산기'] },
  { id: 'vat', category: 'tax', slug: 'vat',
    name: '부가가치세 계산기',
    description: '공급가액 ↔ 부가세 포함가 양방향 변환.',
    keywords: ['부가세 계산기', '공급가액'] },
  { id: 'withholding', category: 'tax', slug: 'withholding-tax',
    name: '원천징수 계산기',
    description: '근로·사업·기타소득 원천징수 세율.',
    keywords: ['원천징수 계산기', '3.3%'] },
  { id: 'property-tax', category: 'tax', slug: 'comprehensive-property-tax',
    name: '종합부동산세 계산기',
    description: '공시가격·세대 합산 종부세.',
    keywords: ['종부세 계산기'] },
  { id: 'acquisition-tax', category: 'tax', slug: 'acquisition-tax',
    name: '취득세 계산기',
    description: '주택·토지·자동차 취득세 + 지방교육세.',
    keywords: ['취득세 계산기', '주택 취득세'] },

  // 노동 (labor)
  { id: 'salary-net', category: 'labor', slug: 'salary-net-calculator',
    name: '연봉 실수령액 계산기',
    description: '4대보험·소득세 차감 후 월 실수령액.',
    keywords: ['연봉 실수령액', '월급 계산기', '연봉 계산'] },
  { id: 'severance', category: 'labor', slug: 'severance-pay',
    name: '퇴직금 계산기',
    description: '평균임금 × 30 × 근속연수 / 365.',
    keywords: ['퇴직금 계산기'] },
  { id: 'unemployment', category: 'labor', slug: 'unemployment-benefits',
    name: '실업급여 계산기',
    description: '소정급여일수·구직급여 일액·총수급액.',
    keywords: ['실업급여 계산기', '구직급여'] },
  { id: 'annual-leave', category: 'labor', slug: 'annual-leave',
    name: '연차수당 계산기',
    description: '미사용 연차수당 환산.',
    keywords: ['연차수당 계산기'] },
  { id: 'overtime', category: 'labor', slug: 'overtime-pay',
    name: '야근·휴일수당 계산기',
    description: '연장·야간·휴일 가산 수당.',
    keywords: ['야근수당 계산기', '연장근로수당'] },
  { id: 'four-insurance', category: 'labor', slug: 'four-major-insurance',
    name: '4대보험 계산기',
    description: '국민연금·건강보험·장기요양·고용·산재 본인·회사 부담분.',
    keywords: ['4대보험 계산기'] },
  { id: 'hourly-wage', category: 'labor', slug: 'hourly-wage-converter',
    name: '시급 ↔ 월급 ↔ 연봉 변환기',
    description: '근무시간·주휴수당 포함 환산.',
    keywords: ['시급 계산기', '주휴수당'] },

  // 일상 (life)
  { id: 'bmi', category: 'life', slug: 'bmi',
    name: 'BMI 계산기',
    description: '체질량지수 + 표준체중.',
    keywords: ['BMI 계산기'] },
  { id: 'calorie', category: 'life', slug: 'calorie',
    name: '칼로리 계산기',
    description: '기초대사량·활동대사량·다이어트 권장 칼로리.',
    keywords: ['칼로리 계산기', '기초대사량'] },
  { id: 'pregnancy', category: 'life', slug: 'pregnancy-week',
    name: '임신 주수 계산기',
    description: '마지막 생리일 기준 주수·예정일.',
    keywords: ['임신 주수', '출산 예정일'] },
  { id: 'dday', category: 'life', slug: 'dday',
    name: '디데이 계산기',
    description: '두 날짜 사이 일수·주수.',
    keywords: ['디데이 계산기'] },
  { id: 'age', category: 'life', slug: 'age',
    name: '만 나이·연 나이 계산기',
    description: '만 나이 통일법 적용.',
    keywords: ['만나이 계산기'] },
  { id: 'unit', category: 'life', slug: 'unit-converter',
    name: '단위 변환기',
    description: '길이·무게·온도·면적·부피 종합.',
    keywords: ['단위 변환기'] },
];

export const CATEGORY_LABEL: Record<CalcCategory, string> = {
  loan: '금융·대출',
  tax: '세금',
  labor: '노동·소득',
  life: '일상',
};

export function getCalcsByCategory(cat: CalcCategory): CalcMeta[] {
  return CALCULATORS.filter((c) => c.category === cat);
}

export function getCalcBySlug(slug: string): CalcMeta | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

/* ========== 핵심 산식 ========== */

export function calcLoanMonthly(
  principal: number,
  annualRate: number,
  months: number,
  type: 'equal-payment' | 'equal-principal' | 'bullet'
): { monthly: number; totalInterest: number; schedule: { month: number; principal: number; interest: number; balance: number }[] } {
  const r = annualRate / 100 / 12;
  const schedule: { month: number; principal: number; interest: number; balance: number }[] = [];
  let balance = principal;
  let totalInterest = 0;
  if (type === 'equal-payment') {
    const monthly = (principal * r) / (1 - Math.pow(1 + r, -months));
    for (let m = 1; m <= months; m++) {
      const interest = balance * r;
      const p = monthly - interest;
      balance -= p;
      totalInterest += interest;
      schedule.push({ month: m, principal: p, interest, balance: Math.max(0, balance) });
    }
    return { monthly, totalInterest, schedule };
  } else if (type === 'equal-principal') {
    const principalPart = principal / months;
    const first = principalPart + balance * r;
    for (let m = 1; m <= months; m++) {
      const interest = balance * r;
      balance -= principalPart;
      totalInterest += interest;
      schedule.push({ month: m, principal: principalPart, interest, balance: Math.max(0, balance) });
    }
    return { monthly: first, totalInterest, schedule };
  } else {
    // bullet: 매월 이자만, 만기 원금 일시
    const interest = balance * r;
    for (let m = 1; m <= months - 1; m++) {
      totalInterest += interest;
      schedule.push({ month: m, principal: 0, interest, balance });
    }
    totalInterest += interest;
    schedule.push({ month: months, principal, interest, balance: 0 });
    return { monthly: interest, totalInterest, schedule };
  }
}

export function calcSeverance(monthlyAvg: number, daysWorked: number): number {
  return (monthlyAvg * 30 * daysWorked) / 365;
}

export function calcBMI(weightKg: number, heightCm: number): { bmi: number; category: string } {
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  let category = '';
  if (bmi < 18.5) category = '저체중';
  else if (bmi < 23) category = '정상';
  else if (bmi < 25) category = '과체중';
  else if (bmi < 30) category = '경도비만';
  else category = '고도비만';
  return { bmi: Math.round(bmi * 10) / 10, category };
}

export function calcVAT(amount: number, rate = 0.1, mode: 'add' | 'extract' = 'add'): { net: number; vat: number; gross: number } {
  if (mode === 'add') {
    const vat = amount * rate;
    return { net: amount, vat, gross: amount + vat };
  }
  const net = amount / (1 + rate);
  return { net, vat: amount - net, gross: amount };
}
