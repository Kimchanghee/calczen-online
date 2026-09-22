import { calcLoanMonthly, calcVAT } from '../lib/calculators';

type Field = {
  key: string;
  label: string;
  type?: 'number' | 'date' | 'select';
  value: string | number;
  step?: string;
  options?: Array<[string, string]>;
};

type Result = {
  headline: string;
  rows: Array<[string, string]>;
  note: string;
};

type Definition = {
  fields: Field[];
  calculate: (values: Record<string, string>) => Result;
};

const won = (value: number) => `${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('ko-KR')}원`;
const number = (value: string) => Number(value) || 0;
const percent = (value: number) => `${value.toFixed(2)}%`;
const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86_400_000);

function progressiveTax(base: number, brackets: Array<[number, number, number]>): number {
  const bracket = brackets.find(([limit]) => base <= limit) ?? brackets[brackets.length - 1];
  return Math.max(0, base * bracket[1] - bracket[2]);
}

const incomeBrackets: Array<[number, number, number]> = [
  [14_000_000, 0.06, 0],
  [50_000_000, 0.15, 1_260_000],
  [88_000_000, 0.24, 5_760_000],
  [150_000_000, 0.35, 15_440_000],
  [300_000_000, 0.38, 19_940_000],
  [500_000_000, 0.40, 25_940_000],
  [1_000_000_000, 0.42, 35_940_000],
  [Infinity, 0.45, 65_940_000],
];

const transferBrackets = incomeBrackets;
const giftBrackets: Array<[number, number, number]> = [
  [100_000_000, 0.10, 0],
  [500_000_000, 0.20, 10_000_000],
  [1_000_000_000, 0.30, 60_000_000],
  [3_000_000_000, 0.40, 160_000_000],
  [Infinity, 0.50, 460_000_000],
];

const definitions: Record<string, Definition> = {
  'mortgage-ltv-dti-dsr': {
    fields: [
      { key: 'price', label: '주택 가격 (원)', value: 600000000 },
      { key: 'income', label: '연소득 (원)', value: 60000000 },
      { key: 'existing', label: '기존 연간 원리금 (원)', value: 0 },
      { key: 'ltv', label: '적용 LTV (%)', value: 70, step: '0.1' },
      { key: 'dsr', label: '적용 DSR (%)', value: 40, step: '0.1' },
      { key: 'rate', label: '예상 금리 (%)', value: 4.5, step: '0.01' },
      { key: 'years', label: '상환 기간 (년)', value: 30 },
    ],
    calculate: (v) => {
      const ltvLimit = number(v.price) * number(v.ltv) / 100;
      const annualCapacity = Math.max(0, number(v.income) * number(v.dsr) / 100 - number(v.existing));
      const months = Math.max(1, number(v.years) * 12);
      const monthlyCapacity = annualCapacity / 12;
      const r = number(v.rate) / 100 / 12;
      const dsrLimit = r === 0 ? monthlyCapacity * months : monthlyCapacity * (1 - (1 + r) ** -months) / r;
      const limit = Math.min(ltvLimit, dsrLimit);
      return { headline: won(limit), rows: [['LTV 기준 한도', won(ltvLimit)], ['DSR 기준 한도', won(dsrLimit)], ['월 원리금 여력', won(monthlyCapacity)]], note: '규제지역, 스트레스 DSR, 금융사 심사와 담보평가액은 별도로 확인하세요.' };
    },
  },
  'savings-vs-deposit': {
    fields: [
      { key: 'principal', label: '총 납입 원금 (원)', value: 12000000 },
      { key: 'rate', label: '연 이율 (%)', value: 3.5, step: '0.01' },
      { key: 'months', label: '기간 (개월)', value: 12 },
    ],
    calculate: (v) => {
      const p = number(v.principal), rate = number(v.rate) / 100, months = Math.max(1, number(v.months));
      const depositInterest = p * rate * months / 12;
      const monthly = p / months;
      const savingsInterest = monthly * rate / 12 * (months * (months + 1) / 2);
      const tax = 0.154;
      return { headline: `예금 ${won(p + depositInterest * (1 - tax))}`, rows: [['예금 세후 이자', won(depositInterest * (1 - tax))], ['적금 세후 이자', won(savingsInterest * (1 - tax))], ['적금 월 납입액', won(monthly)]], note: '일반과세 15.4%, 매월 초 납입 단리 기준의 간이 비교입니다.' };
    },
  },
  'compound-interest': {
    fields: [
      { key: 'principal', label: '초기 원금 (원)', value: 10000000 },
      { key: 'monthly', label: '월 추가 납입액 (원)', value: 300000 },
      { key: 'rate', label: '연 수익률 (%)', value: 5, step: '0.01' },
      { key: 'years', label: '기간 (년)', value: 10 },
    ],
    calculate: (v) => {
      const p = number(v.principal), payment = number(v.monthly), months = Math.max(0, number(v.years) * 12), r = number(v.rate) / 100 / 12;
      const futurePrincipal = p * (1 + r) ** months;
      const futurePayments = r === 0 ? payment * months : payment * (((1 + r) ** months - 1) / r);
      const total = futurePrincipal + futurePayments;
      const contributed = p + payment * months;
      return { headline: won(total), rows: [['총 납입 원금', won(contributed)], ['복리 수익', won(total - contributed)], ['기간', `${number(v.years)}년`]], note: '월말 납입, 월복리, 세금과 수수료 미반영 가정입니다.' };
    },
  },
  'auto-loan': {
    fields: [
      { key: 'price', label: '차량 가격 (원)', value: 40000000 },
      { key: 'down', label: '선수금 (원)', value: 10000000 },
      { key: 'rate', label: '연 이율 (%)', value: 5.5, step: '0.01' },
      { key: 'months', label: '할부 기간 (개월)', value: 60 },
    ],
    calculate: (v) => {
      const principal = Math.max(0, number(v.price) - number(v.down));
      const result = calcLoanMonthly(principal, number(v.rate), Math.max(1, number(v.months)), 'equal-payment');
      return { headline: won(result.monthly), rows: [['할부 원금', won(principal)], ['총 이자', won(result.totalInterest)], ['총 납부액', won(principal + result.totalInterest)]], note: '취등록세, 보험료, 금융사 수수료와 중도상환수수료는 포함하지 않습니다.' };
    },
  },
  'student-loan': {
    fields: [
      { key: 'balance', label: '대출 잔액 (원)', value: 20000000 },
      { key: 'rate', label: '연 이율 (%)', value: 1.7, step: '0.01' },
      { key: 'payment', label: '월 상환액 (원)', value: 300000 },
    ],
    calculate: (v) => {
      let balance = number(v.balance), interest = 0, months = 0;
      const monthlyRate = number(v.rate) / 100 / 12, payment = number(v.payment);
      while (balance > 0 && months < 1200 && payment > balance * monthlyRate) {
        const monthlyInterest = balance * monthlyRate;
        interest += monthlyInterest;
        balance -= Math.min(balance, payment - monthlyInterest);
        months += 1;
      }
      const valid = balance <= 0;
      return { headline: valid ? `${months}개월` : '상환액 부족', rows: [['예상 총 이자', valid ? won(interest) : '-'], ['예상 총 상환액', valid ? won(number(v.balance) + interest) : '-'], ['월 상환액', won(payment)]], note: '일반 상환 방식의 단순 추정입니다. 취업 후 상환은 소득과 의무상환 기준을 별도 확인하세요.' };
    },
  },
  'comprehensive-income-tax': {
    fields: [
      { key: 'income', label: '종합소득금액 (원)', value: 60000000 },
      { key: 'deduction', label: '소득공제 합계 (원)', value: 15000000 },
      { key: 'credit', label: '세액공제 합계 (원)', value: 1000000 },
    ],
    calculate: (v) => {
      const base = Math.max(0, number(v.income) - number(v.deduction));
      const national = Math.max(0, progressiveTax(base, incomeBrackets) - number(v.credit));
      return { headline: won(national * 1.1), rows: [['과세표준', won(base)], ['소득세', won(national)], ['지방소득세', won(national * 0.1)]], note: '누진세율만 반영한 간이 추정으로 필요경비, 공제·감면과 신고세액공제는 별도입니다.' };
    },
  },
  'capital-gains-tax': {
    fields: [
      { key: 'sale', label: '양도가액 (원)', value: 800000000 },
      { key: 'purchase', label: '취득가액 (원)', value: 500000000 },
      { key: 'expenses', label: '필요경비 (원)', value: 20000000 },
      { key: 'deduction', label: '장기보유·기본공제 (원)', value: 2500000 },
    ],
    calculate: (v) => {
      const gain = Math.max(0, number(v.sale) - number(v.purchase) - number(v.expenses));
      const base = Math.max(0, gain - number(v.deduction));
      const national = progressiveTax(base, transferBrackets);
      return { headline: won(national * 1.1), rows: [['양도차익', won(gain)], ['과세표준', won(base)], ['지방소득세 포함', won(national * 1.1)]], note: '1세대 1주택 비과세, 다주택 중과, 보유기간 공제 등은 자동 판정하지 않는 간이 계산입니다.' };
    },
  },
  'gift-tax': {
    fields: [
      { key: 'amount', label: '증여재산가액 (원)', value: 200000000 },
      { key: 'deduction', label: '관계별 공제액 (원)', value: 50000000 },
    ],
    calculate: (v) => {
      const base = Math.max(0, number(v.amount) - number(v.deduction));
      const tax = progressiveTax(base, giftBrackets);
      return { headline: won(tax), rows: [['과세표준', won(base)], ['산출세액', won(tax)], ['공제 적용액', won(number(v.deduction))]], note: '10년 합산 증여, 세대생략 할증, 신고세액공제는 별도 확인하세요.' };
    },
  },
  'inheritance-tax': {
    fields: [
      { key: 'estate', label: '상속재산가액 (원)', value: 1200000000 },
      { key: 'debt', label: '채무·장례비 (원)', value: 100000000 },
      { key: 'deduction', label: '상속공제 합계 (원)', value: 500000000 },
    ],
    calculate: (v) => {
      const base = Math.max(0, number(v.estate) - number(v.debt) - number(v.deduction));
      const tax = progressiveTax(base, giftBrackets);
      return { headline: won(tax), rows: [['과세표준', won(base)], ['산출세액', won(tax)], ['채무·공제 합계', won(number(v.debt) + number(v.deduction))]], note: '배우자공제, 금융재산공제, 사전증여재산과 신고세액공제는 별도입니다.' };
    },
  },
  vat: {
    fields: [
      { key: 'amount', label: '금액 (원)', value: 110000 },
      { key: 'mode', label: '계산 방식', type: 'select', value: 'extract', options: [['extract', '부가세 포함가에서 분리'], ['add', '공급가액에 부가세 추가']] },
    ],
    calculate: (v) => {
      const result = calcVAT(number(v.amount), 0.1, v.mode === 'add' ? 'add' : 'extract');
      return { headline: won(result.gross), rows: [['공급가액', won(result.net)], ['부가가치세', won(result.vat)], ['합계', won(result.gross)]], note: '일반적인 10% 세율 기준이며 영세율·면세 거래는 다릅니다.' };
    },
  },
  'withholding-tax': {
    fields: [
      { key: 'amount', label: '지급액 (원)', value: 3000000 },
      { key: 'rate', label: '원천징수 유형', type: 'select', value: '3.3', options: [['3.3', '사업소득 3.3%'], ['8.8', '기타소득 예시 8.8%'], ['22', '일반 이자·배당 22% 예시']] },
    ],
    calculate: (v) => {
      const withheld = number(v.amount) * number(v.rate) / 100;
      return { headline: won(number(v.amount) - withheld), rows: [['지급액', won(number(v.amount))], ['원천징수액', won(withheld)], ['실지급액', won(number(v.amount) - withheld)]], note: '소득 구분과 필요경비 인정 여부에 따라 실제 원천징수 세율이 달라집니다.' };
    },
  },
  'comprehensive-property-tax': {
    fields: [
      { key: 'value', label: '주택 공시가격 합계 (원)', value: 1500000000 },
      { key: 'deduction', label: '공제액 (원)', value: 900000000 },
      { key: 'ratio', label: '공정시장가액비율 (%)', value: 60, step: '0.1' },
    ],
    calculate: (v) => {
      const base = Math.max(0, number(v.value) - number(v.deduction)) * number(v.ratio) / 100;
      const tax = base <= 300_000_000 ? base * 0.005 : base <= 600_000_000 ? base * 0.007 - 600_000 : base * 0.01 - 2_400_000;
      return { headline: won(Math.max(0, tax)), rows: [['과세표준', won(base)], ['간이 산출세액', won(Math.max(0, tax))], ['적용 공제', won(number(v.deduction))]], note: '주택 수, 세액공제, 재산세 중복분, 농어촌특별세는 반영하지 않은 간이 추정입니다.' };
    },
  },
  'acquisition-tax': {
    fields: [
      { key: 'price', label: '취득가액 (원)', value: 500000000 },
      { key: 'rate', label: '적용 세율 (%)', value: 1.1, step: '0.01' },
    ],
    calculate: (v) => {
      const tax = number(v.price) * number(v.rate) / 100;
      return { headline: won(tax), rows: [['취득가액', won(number(v.price))], ['적용 세율', percent(number(v.rate))], ['예상 취득 관련 세액', won(tax)]], note: '주택 수, 조정대상지역, 면적, 지방교육세·농특세에 맞는 실제 합산 세율을 입력하세요.' };
    },
  },
  'unemployment-benefits': {
    fields: [
      { key: 'daily', label: '퇴직 전 1일 평균임금 (원)', value: 100000 },
      { key: 'days', label: '소정급여일수 (일)', value: 180 },
      { key: 'cap', label: '1일 상한액 (원)', value: 66000 },
    ],
    calculate: (v) => {
      const daily = Math.min(number(v.daily) * 0.6, number(v.cap));
      return { headline: won(daily * number(v.days)), rows: [['1일 구직급여', won(daily)], ['소정급여일수', `${number(v.days)}일`], ['예상 총액', won(daily * number(v.days))]], note: '하한액, 연령·가입기간별 급여일수와 수급자격 판정은 고용센터 기준을 확인하세요.' };
    },
  },
  'annual-leave': {
    fields: [
      { key: 'salary', label: '통상 월급 (원)', value: 3000000 },
      { key: 'hours', label: '월 통상근로시간', value: 209 },
      { key: 'days', label: '미사용 연차 (일)', value: 5 },
    ],
    calculate: (v) => {
      const hourly = number(v.salary) / Math.max(1, number(v.hours));
      const pay = hourly * 8 * number(v.days);
      return { headline: won(pay), rows: [['통상 시급', won(hourly)], ['1일 연차수당', won(hourly * 8)], ['미사용 연차', `${number(v.days)}일`]], note: '통상임금 포함 항목과 1일 소정근로시간은 근로계약을 기준으로 조정하세요.' };
    },
  },
  'overtime-pay': {
    fields: [
      { key: 'hourly', label: '통상 시급 (원)', value: 15000 },
      { key: 'overtime', label: '연장근로 시간', value: 10 },
      { key: 'night', label: '야간근로 시간', value: 5 },
      { key: 'holiday', label: '휴일근로 시간', value: 8 },
    ],
    calculate: (v) => {
      const hourly = number(v.hourly);
      const overtime = hourly * number(v.overtime) * 1.5;
      const night = hourly * number(v.night) * 0.5;
      const holiday = hourly * number(v.holiday) * 1.5;
      return { headline: won(overtime + night + holiday), rows: [['연장근로 수당', won(overtime)], ['야간 가산분', won(night)], ['휴일근로 수당', won(holiday)]], note: '야간·연장·휴일 중복 여부와 8시간 초과 휴일근로는 실제 근무표에 따라 달라집니다.' };
    },
  },
  'four-major-insurance': {
    fields: [{ key: 'salary', label: '월 보수 (원)', value: 3500000 }],
    calculate: (v) => {
      const salary = number(v.salary), pension = Math.min(salary, 5_530_000) * 0.045, health = salary * 0.03545, care = health * 0.1295, employment = salary * 0.009;
      return { headline: won(pension + health + care + employment), rows: [['국민연금 본인 부담', won(pension)], ['건강보험', won(health)], ['장기요양보험', won(care)], ['고용보험', won(employment)]], note: '근로자 부담분 간이 추정이며 보수월액 상·하한과 산재보험·회사 부담분은 별도입니다.' };
    },
  },
  'hourly-wage-converter': {
    fields: [
      { key: 'hourly', label: '시급 (원)', value: 10300 },
      { key: 'weekly', label: '주 소정근로시간', value: 40 },
    ],
    calculate: (v) => {
      const hourly = number(v.hourly), weekly = number(v.weekly);
      const monthlyHours = weekly >= 40 ? 209 : weekly * 4.345;
      const monthly = hourly * monthlyHours;
      return { headline: won(monthly), rows: [['월 환산 근로시간', `${monthlyHours.toFixed(1)}시간`], ['월급 환산', won(monthly)], ['연봉 환산', won(monthly * 12)]], note: '주 40시간은 주휴시간을 포함한 월 209시간 기준이며, 단시간 근로자는 조건이 다릅니다.' };
    },
  },
  calorie: {
    fields: [
      { key: 'sex', label: '성별', type: 'select', value: 'male', options: [['male', '남성'], ['female', '여성']] },
      { key: 'weight', label: '체중 (kg)', value: 68, step: '0.1' },
      { key: 'height', label: '신장 (cm)', value: 170, step: '0.1' },
      { key: 'age', label: '나이', value: 30 },
      { key: 'activity', label: '활동계수', type: 'select', value: '1.375', options: [['1.2', '거의 운동 안 함'], ['1.375', '가벼운 운동'], ['1.55', '중간 운동'], ['1.725', '강한 운동']] },
    ],
    calculate: (v) => {
      const bmr = v.sex === 'male' ? 10 * number(v.weight) + 6.25 * number(v.height) - 5 * number(v.age) + 5 : 10 * number(v.weight) + 6.25 * number(v.height) - 5 * number(v.age) - 161;
      const tdee = bmr * number(v.activity);
      return { headline: `${Math.round(tdee).toLocaleString('ko-KR')} kcal/일`, rows: [['기초대사량', `${Math.round(bmr).toLocaleString('ko-KR')} kcal`], ['감량 목표 예시', `${Math.max(0, Math.round(tdee - 500)).toLocaleString('ko-KR')} kcal`], ['유지 목표', `${Math.round(tdee).toLocaleString('ko-KR')} kcal`]], note: 'Mifflin-St Jeor 공식의 추정값이며 의료·영양 상담을 대신하지 않습니다.' };
    },
  },
  'pregnancy-week': {
    fields: [{ key: 'lmp', label: '마지막 생리 시작일', type: 'date', value: new Date(Date.now() - 70 * 86_400_000).toISOString().slice(0, 10) }],
    calculate: (v) => {
      const start = new Date(`${v.lmp}T00:00:00`), today = new Date(), elapsed = Math.max(0, daysBetween(start, today));
      const due = new Date(start); due.setDate(due.getDate() + 280);
      return { headline: `${Math.floor(elapsed / 7)}주 ${elapsed % 7}일`, rows: [['경과 일수', `${elapsed}일`], ['출산 예정일', due.toLocaleDateString('ko-KR')], ['예정일까지', `${daysBetween(today, due)}일`]], note: '마지막 생리일 기준 280일 계산이며 실제 예정일은 진료 결과에 따라 조정됩니다.' };
    },
  },
  dday: {
    fields: [{ key: 'target', label: '목표일', type: 'date', value: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) }],
    calculate: (v) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const target = new Date(`${v.target}T00:00:00`), diff = daysBetween(today, target);
      return { headline: diff === 0 ? 'D-DAY' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`, rows: [['오늘', today.toLocaleDateString('ko-KR')], ['목표일', target.toLocaleDateString('ko-KR')], ['주 단위', `${(Math.abs(diff) / 7).toFixed(1)}주`]], note: '현재 브라우저의 현지 시간대와 자정 기준으로 계산합니다.' };
    },
  },
  age: {
    fields: [{ key: 'birth', label: '생년월일', type: 'date', value: '1990-01-01' }],
    calculate: (v) => {
      const birth = new Date(`${v.birth}T00:00:00`), today = new Date();
      let full = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) full -= 1;
      return { headline: `만 ${Math.max(0, full)}세`, rows: [['연 나이', `${today.getFullYear() - birth.getFullYear()}세`], ['출생일', birth.toLocaleDateString('ko-KR')], ['다음 생일까지', `${daysUntilBirthday(birth, today)}일`]], note: '행정·법률상 나이는 만 나이를 사용하며 특정 제도는 연 나이를 적용할 수 있습니다.' };
    },
  },
  'unit-converter': {
    fields: [
      { key: 'kind', label: '변환 종류', type: 'select', value: 'km-mi', options: [['km-mi', '킬로미터 → 마일'], ['kg-lb', '킬로그램 → 파운드'], ['sqm-pyeong', '제곱미터 → 평'], ['c-f', '섭씨 → 화씨'], ['l-gal', '리터 → 미국 갤런']] },
      { key: 'value', label: '변환할 값', value: 1, step: 'any' },
    ],
    calculate: (v) => {
      const source = number(v.value);
      const map: Record<string, [string, number, string]> = {
        'km-mi': ['마일', source * 0.621371, '1 km = 0.621371 mile'],
        'kg-lb': ['파운드', source * 2.204623, '1 kg = 2.204623 lb'],
        'sqm-pyeong': ['평', source / 3.305785, '1평 = 3.305785㎡'],
        'c-f': ['화씨', source * 9 / 5 + 32, '°F = °C × 9/5 + 32'],
        'l-gal': ['미국 갤런', source * 0.264172, '1 L = 0.264172 US gal'],
      };
      const [unit, converted, formula] = map[v.kind] ?? map['km-mi'];
      return { headline: `${converted.toLocaleString('ko-KR', { maximumFractionDigits: 6 })} ${unit}`, rows: [['입력값', source.toLocaleString('ko-KR')], ['변환값', converted.toLocaleString('ko-KR', { maximumFractionDigits: 6 })], ['기준', formula]], note: '표시값은 소수점 이하 최대 6자리로 반올림합니다.' };
    },
  },
};

function daysUntilBirthday(birth: Date, today: Date): number {
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  next.setHours(0, 0, 0, 0);
  const base = new Date(today); base.setHours(0, 0, 0, 0);
  if (next < base) next.setFullYear(next.getFullYear() + 1);
  return daysBetween(base, next);
}

export function calculateGeneral(slug: string, values: Record<string, string>): Result {
  const definition = definitions[slug];
  if (!definition) throw new Error(`지원하지 않는 계산기: ${slug}`);
  return definition.calculate(values);
}

export function getGeneralCalculatorSlugs(): string[] {
  return Object.keys(definitions);
}

export function getGeneralDefaults(slug: string): Record<string, string> {
  const definition = definitions[slug];
  if (!definition) throw new Error(`지원하지 않는 계산기: ${slug}`);
  return Object.fromEntries(definition.fields.map((field) => [field.key, String(field.value)]));
}

export function mountGeneralCalculator(root: HTMLElement, slug: string) {
  const definition = definitions[slug];
  if (!definition) throw new Error(`지원하지 않는 계산기: ${slug}`);

  root.innerHTML = `
    <div class="grid gap-5">
      <div class="grid gap-3 md:grid-cols-2">
        ${definition.fields.map((field) => field.type === 'select' ? `
          <label class="text-sm">${field.label}
            <select data-field="${field.key}" class="mt-1 w-full rounded border px-3 py-2">
              ${(field.options ?? []).map(([value, label]) => `<option value="${value}" ${String(field.value) === value ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </label>` : `
          <label class="text-sm">${field.label}
            <input data-field="${field.key}" type="${field.type === 'date' ? 'date' : 'number'}" value="${field.value}" ${field.step ? `step="${field.step}"` : ''} class="mt-1 w-full rounded border px-3 py-2 font-mono" />
          </label>`).join('')}
      </div>
      <div class="rounded-xl border bg-emerald-50 p-5 text-center">
        <div class="text-sm text-emerald-700">계산 결과</div>
        <div data-headline class="mt-1 text-3xl font-bold text-emerald-900">-</div>
      </div>
      <div data-rows class="rounded-lg border bg-white p-4 grid gap-2 text-sm"></div>
      <p data-note class="text-xs text-slate-500"></p>
    </div>`;

  const recompute = () => {
    const values = Object.fromEntries(Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]')).map((el) => [el.dataset.field!, el.value]));
    const result = calculateGeneral(slug, values);
    root.querySelector<HTMLElement>('[data-headline]')!.textContent = result.headline;
    root.querySelector<HTMLElement>('[data-rows]')!.innerHTML = result.rows.map(([label, value]) => `<div class="flex justify-between gap-3"><span class="text-slate-600">${label}</span><strong>${value}</strong></div>`).join('');
    root.querySelector<HTMLElement>('[data-note]')!.textContent = `※ ${result.note}`;
  };

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach((el) => el.addEventListener('input', recompute));
  recompute();
}
