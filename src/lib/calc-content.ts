/**
 * 계산기별 설명 콘텐츠. 모든 문장은 src/calculators/*.ts 및 src/lib/calculators.ts 에 구현된 산식만 설명한다.
 * 법령·요율의 최신성은 보장하지 않으며, 구현된 가정(구간표·요율)을 "이 계산기가 쓰는 값"으로만 서술한다.
 */
import { CALCULATORS, calcBMI, calcLoanMonthly, type CalcMeta } from './calculators';
import { calculateGeneral, getGeneralDefaults, getGeneralCalculatorSlugs, getGeneralFields } from '../calculators/general';
import { computeSalaryNet } from '../calculators/salary-net';
import { computeSeverance } from '../calculators/severance';

export const CONTENT_UPDATED = '2026-10-13';

export interface CalcContent {
  /** 계산기가 무엇을 하는지 한 문장 (직답) */
  what: string;
  /** 구현된 산식 설명 */
  formula: string[];
  /** 결과에 반영되지 않는 것 / 주의 (구현된 한계) */
  limits: string;
  /** 확인 창구 (기관명만) */
  checkWith: Array<{ name: string; url: string }>;
}

const NTS = { name: '국세청 홈택스', url: 'https://www.hometax.go.kr/' };
const MOEL = { name: '고용노동부', url: 'https://www.moel.go.kr/' };
const NHIS = { name: '국민건강보험공단', url: 'https://www.nhis.or.kr/' };
const NPS = { name: '국민연금공단', url: 'https://www.nps.or.kr/' };

const TAX_BRACKET_TEXT =
  '과세표준 1,400만 원 이하 6%, 5,000만 원 이하 15%, 8,800만 원 이하 24%, 1.5억 원 이하 35%, 3억 원 이하 38%, 5억 원 이하 40%, 10억 원 이하 42%, 초과 45%의 구간표(누진공제액 포함)';
const GIFT_BRACKET_TEXT =
  '과세표준 1억 원 이하 10%, 5억 원 이하 20%, 10억 원 이하 30%, 30억 원 이하 40%, 초과 50%의 구간표(누진공제액 포함)';

export const CONTENT: Record<string, CalcContent> = {
  'mortgage-ltv-dti-dsr': {
    what: '주택 가격에 LTV를, 연소득에 DSR을 각각 적용해 두 한도 중 작은 값을 대출 가능 금액의 간이 추정치로 보여줍니다.',
    formula: [
      'LTV 기준 한도 = 주택 가격 × 적용 LTV(%)',
      'DSR 기준 연 상환 여력 = 연소득 × 적용 DSR(%) − 기존 연간 원리금',
      'DSR 기준 한도 = 월 상환 여력(연 여력 ÷ 12)을 입력한 금리·기간의 원리금균등 상환으로 환산한 현재가치',
      '최종 추정 한도 = LTV 기준 한도와 DSR 기준 한도 중 작은 값',
    ],
    limits: '규제지역, 스트레스 DSR, 금융사 심사와 담보평가는 반영하지 않습니다. LTV와 DSR 비율은 사용자가 직접 입력하는 값입니다.',
    checkWith: [{ name: '금융감독원 금융소비자 정보 포털 파인', url: 'https://fine.fss.or.kr/' }],
  },
  'loan-monthly-payment': {
    what: '대출 원금·연 이자율·상환 기간으로 원리금균등·원금균등·만기일시 방식별 월 상환액과 총이자를 계산합니다.',
    formula: [
      '월 이자율 r = 연 이자율 ÷ 100 ÷ 12',
      '원리금균등: 월 상환액 = 원금 × r ÷ (1 − (1 + r)^−개월 수). 이자율이 0이면 원금 ÷ 개월 수',
      '원금균등: 매월 원금 상환분 = 원금 ÷ 개월 수, 이자는 남은 잔액 × r. 표시되는 월 상환액은 첫 달 금액',
      '만기일시: 매월 이자(원금 × r)만 납부하고 마지막 달에 원금 전액 상환',
    ],
    limits: '중도상환수수료, 보증료, 변동금리 조정, 우대금리는 반영하지 않습니다. 실제 금융사 조건과 다를 수 있습니다.',
    checkWith: [{ name: '금융감독원 금융소비자 정보 포털 파인', url: 'https://fine.fss.or.kr/' }],
  },
  'savings-vs-deposit': {
    what: '같은 총 납입 원금·연 이율·기간에서 예금과 적금의 세후 이자를 단순 이자 방식으로 비교합니다.',
    formula: [
      '예금 이자 = 원금 × 연 이율 × 개월 수 ÷ 12',
      '적금 이자 = (원금 ÷ 개월 수) × 연 이율 ÷ 12 × (개월 수 × (개월 수 + 1) ÷ 2)',
      '두 이자 모두 15.4%를 차감한 세후 값으로 표시',
    ],
    limits: '매월 초 납입 단리 기준의 간이 비교입니다. 복리, 우대금리, 중도해지, 비과세 상품 조건은 반영하지 않으며 세율 15.4%는 계산기에 고정된 값입니다.',
    checkWith: [{ name: '금융감독원 금융소비자 정보 포털 파인', url: 'https://fine.fss.or.kr/' }],
  },
  'compound-interest': {
    what: '초기 원금과 월 납입액에 월복리를 적용했을 때의 미래 가치를 추정합니다.',
    formula: [
      '월 수익률 r = 연 수익률 ÷ 100 ÷ 12, 기간 n = 연수 × 12',
      '원금의 미래 가치 = 초기 원금 × (1 + r)^n',
      '월 납입금의 미래 가치 = 월 납입액 × ((1 + r)^n − 1) ÷ r (월말 납입 가정, r = 0이면 월 납입액 × n)',
      '복리 수익 = 미래 가치 − 총 납입 원금',
    ],
    limits: '월말 납입과 월복리를 가정하며 세금·수수료·수익률 변동은 반영하지 않습니다.',
    checkWith: [{ name: '금융감독원 금융소비자 정보 포털 파인', url: 'https://fine.fss.or.kr/' }],
  },
  'auto-loan': {
    what: '차량 가격에서 선수금을 뺀 금액을 원리금균등 방식으로 할부했을 때 월 부담액과 총이자를 계산합니다.',
    formula: [
      '할부 원금 = 차량 가격 − 선수금',
      '월 납부액 = 원리금균등 상환 공식(대출 월상환액 계산기와 동일)으로 계산',
      '총 이자 = 전체 납입액 − 할부 원금',
    ],
    limits: '취등록세, 보험료, 금융사 수수료와 프로모션 금리는 반영하지 않습니다.',
    checkWith: [{ name: '금융감독원 금융소비자 정보 포털 파인', url: 'https://fine.fss.or.kr/' }],
  },
  'student-loan': {
    what: '대출 잔액·연 이율·월 상환액으로 완납까지 걸리는 개월 수와 총이자를 시뮬레이션합니다.',
    formula: [
      '매월 이자 = 잔액 × 연 이율 ÷ 12',
      '매월 원금 상환 = 월 상환액 − 이자. 잔액이 0이 될 때까지 반복(최대 1,200개월)',
      '월 상환액이 월 이자보다 크지 않으면 "상환액 부족"으로 표시',
    ],
    limits: '일반 상환 방식의 단순 추정입니다. 취업 후 상환은 소득과 의무상환 기준을 별도로 확인해야 합니다.',
    checkWith: [{ name: '한국장학재단', url: 'https://www.kosaf.go.kr/' }],
  },
  'comprehensive-income-tax': {
    what: '종합소득금액에서 소득공제를 빼 과세표준을 구하고 누진세율로 소득세와 지방소득세를 간이 추정합니다.',
    formula: [
      '과세표준 = 종합소득금액 − 소득공제 합계',
      `산출세액 = 과세표준 × 세율 − 누진공제액. 이 계산기에 구현된 ${TAX_BRACKET_TEXT}를 사용`,
      '소득세 = 산출세액 − 세액공제 합계(0 미만이면 0)',
      '표시 합계 = 소득세 × 1.1 (지방소득세 10% 가산)',
    ],
    limits: '누진세율만 반영한 간이 추정입니다. 필요경비, 개별 공제·감면, 가산세와 신고 방식에 따른 차이는 반영하지 않습니다.',
    checkWith: [NTS],
  },
  'capital-gains-tax': {
    what: '양도가액에서 취득가액과 필요경비를 빼 양도차익을 구하고 누진세율로 양도소득세를 간이 추정합니다.',
    formula: [
      '양도차익 = 양도가액 − 취득가액 − 필요경비',
      '과세표준 = 양도차익 − 입력한 장기보유·기본공제 합계',
      `산출세액은 종합소득세 계산기와 같은 ${TAX_BRACKET_TEXT}를 적용`,
      '표시 금액 = 산출세액 × 1.1 (지방소득세 10% 포함)',
    ],
    limits: '1세대 1주택 비과세, 다주택 중과, 보유기간별 공제율 자동 적용은 하지 않습니다. 공제액은 사용자가 직접 입력합니다.',
    checkWith: [NTS],
  },
  'gift-tax': {
    what: '증여재산가액에서 직접 입력한 공제액을 뺀 과세표준에 누진세율을 적용해 증여세를 간이 추정합니다.',
    formula: [
      '과세표준 = 증여재산가액 − 관계별 공제액(직접 입력)',
      `산출세액 = 과세표준 × 세율 − 누진공제액. 이 계산기에 구현된 ${GIFT_BRACKET_TEXT}를 사용`,
    ],
    limits: '10년 합산 증여, 세대생략 할증, 신고세액공제는 반영하지 않습니다.',
    checkWith: [NTS],
  },
  'inheritance-tax': {
    what: '상속재산에서 채무·장례비와 상속공제를 뺀 과세표준에 누진세율을 적용해 상속세를 간이 추정합니다.',
    formula: [
      '과세표준 = 상속재산가액 − 채무·장례비 − 상속공제 합계(직접 입력)',
      `산출세액은 증여세 계산기와 같은 ${GIFT_BRACKET_TEXT}를 적용`,
    ],
    limits: '배우자공제, 금융재산공제, 사전증여재산 합산, 신고세액공제는 자동 반영하지 않습니다.',
    checkWith: [NTS],
  },
  vat: {
    what: '10% 세율을 기준으로 공급가액과 부가세 포함가를 양방향으로 변환합니다.',
    formula: [
      '공급가액에 부가세 추가: 부가세 = 공급가액 × 0.1, 합계 = 공급가액 + 부가세',
      '부가세 포함가에서 분리: 공급가액 = 합계 ÷ 1.1, 부가세 = 합계 − 공급가액',
    ],
    limits: '일반적인 10% 세율만 계산하며 영세율·면세 거래는 다르게 처리됩니다.',
    checkWith: [NTS],
  },
  'withholding-tax': {
    what: '선택한 예시 세율(3.3%, 8.8%, 22%)로 원천징수액과 실지급액을 간이 계산합니다.',
    formula: [
      '원천징수액 = 지급액 × 선택한 세율',
      '실지급액 = 지급액 − 원천징수액',
      '선택 가능한 유형: 사업소득 3.3%, 기타소득 예시 8.8%, 일반 이자·배당 예시 22%',
    ],
    limits: '소득 구분과 필요경비 인정 여부에 따라 실제 원천징수율은 달라질 수 있습니다. 세율 선택지는 예시입니다.',
    checkWith: [NTS],
  },
  'comprehensive-property-tax': {
    what: '주택 공시가격 합계에서 공제액을 빼고 공정시장가액비율을 곱한 과세표준으로 종합부동산세를 간이 추정합니다.',
    formula: [
      '과세표준 = (공시가격 합계 − 공제액) × 공정시장가액비율',
      '과세표준 3억 원 이하: 과세표준 × 0.5%',
      '3억 원 초과 6억 원 이하: 과세표준 × 0.7% − 60만 원',
      '6억 원 초과: 과세표준 × 1.0% − 240만 원',
    ],
    limits: '주택 수, 세액공제, 재산세 중복분, 농어촌특별세는 반영하지 않은 간이 추정입니다.',
    checkWith: [NTS],
  },
  'acquisition-tax': {
    what: '취득가액에 직접 입력한 합산 세율을 곱해 취득 관련 세액을 계산합니다.',
    formula: ['예상 취득 관련 세액 = 취득가액 × 적용 세율(%) ÷ 100'],
    limits: '주택 수, 조정대상지역, 면적 구분과 지방교육세·농어촌특별세는 자동 계산하지 않으므로 합산 세율을 직접 입력해야 합니다.',
    checkWith: [{ name: '위택스', url: 'https://www.wetax.go.kr/' }],
  },
  'salary-net-calculator': {
    what: '세전 연봉을 12로 나눈 월급에서 4대보험과 소득세·지방소득세를 차감해 월 실수령액을 간이 추정합니다.',
    formula: [
      '국민연금 = min(월급, 5,530,000원) × 4.5%',
      '건강보험 = 월급 × 3.545%, 장기요양 = 건강보험료 × 12.95%, 고용보험 = 월급 × 0.9%',
      '소득세는 월 과세 대상 금액 구간별 단순화한 근사식으로 계산하고 부양가족 1인 추가당 12,500원을 차감',
      '지방소득세 = 소득세 × 10%, 실수령액 = 월급 − 모든 공제',
    ],
    limits: '비과세 항목과 연말정산 환급은 반영하지 않으며 소득세는 간이세액표의 근사치라 실제 급여명세서와 차이가 날 수 있습니다.',
    checkWith: [NTS, NHIS, NPS],
  },
  'severance-pay': {
    what: '퇴직 직전 3개월 임금으로 1일 평균임금을 구해 1일 평균임금 × 30 × 근속일수 ÷ 365 방식으로 퇴직금을 추정합니다.',
    formula: [
      '1일 평균임금 = (퇴직 직전 3개월 임금 합계 + 연간 상여금 × 3/12) ÷ 92일',
      '30일분 평균임금 = 1일 평균임금 × 30',
      '퇴직금 = 30일분 평균임금 × 근속일수 ÷ 365',
      '근속일수가 365일 미만이면 계산하지 않고 "청구권 없음"으로 표시',
    ],
    limits: '퇴직소득세는 계산하지 않으며, 3개월 일수는 92일로 고정했습니다. 연차수당 등 다른 임금 항목은 직접 포함해 입력해야 합니다.',
    checkWith: [MOEL],
  },
  'unemployment-benefits': {
    what: '퇴직 전 1일 평균임금의 60%와 1일 상한액 중 작은 값에 소정급여일수를 곱해 구직급여 총액을 추정합니다.',
    formula: [
      '1일 구직급여 = min(1일 평균임금 × 60%, 1일 상한액)',
      '예상 총액 = 1일 구직급여 × 소정급여일수',
    ],
    limits: '하한액, 연령·가입기간별 급여일수와 수급 자격은 자동 판정하지 않으며 상한액과 일수는 입력값을 그대로 씁니다.',
    checkWith: [MOEL, { name: '고용보험', url: 'https://www.ei.go.kr/' }],
  },
  'annual-leave': {
    what: '통상 월급을 월 통상근로시간으로 나눈 통상 시급에 하루 8시간과 미사용 연차 일수를 곱해 연차수당을 환산합니다.',
    formula: [
      '통상 시급 = 통상 월급 ÷ 월 통상근로시간(기본 209시간)',
      '1일 연차수당 = 통상 시급 × 8시간',
      '연차수당 = 1일 연차수당 × 미사용 연차 일수',
    ],
    limits: '통상임금 포함 항목과 1일 소정근로시간은 근로계약에 따라 다르며 이 계산기는 8시간으로 고정합니다.',
    checkWith: [MOEL],
  },
  'overtime-pay': {
    what: '통상 시급에 연장근로·야간근로·휴일근로 시간과 가산율을 적용해 추가 수당을 계산합니다.',
    formula: [
      '연장근로 수당 = 통상 시급 × 연장근로 시간 × 1.5',
      '야간 가산분 = 통상 시급 × 야간근로 시간 × 0.5',
      '휴일근로 수당 = 통상 시급 × 휴일근로 시간 × 1.5',
      '합계 = 위 세 항목의 합',
    ],
    limits: '연장·야간·휴일이 겹칠 때의 중복 가산과 휴일근로 8시간 초과분 가산은 자동 적용하지 않습니다.',
    checkWith: [MOEL],
  },
  'four-major-insurance': {
    what: '월 보수에 국민연금·건강보험·장기요양·고용보험 요율을 곱해 근로자 부담분을 간이 추정합니다.',
    formula: [
      '국민연금 = min(월 보수, 5,530,000원) × 4.5%',
      '건강보험 = 월 보수 × 3.545%',
      '장기요양보험 = 건강보험료 × 12.95%',
      '고용보험 = 월 보수 × 0.9%',
    ],
    limits: '근로자 부담분만 계산하며 산재보험과 사업주 부담분은 포함하지 않습니다. 요율과 상한은 계산기에 고정된 값입니다.',
    checkWith: [NHIS, NPS],
  },
  'hourly-wage-converter': {
    what: '시급과 주 소정근로시간으로 월급과 연봉을 환산합니다. 주 40시간 이상은 월 209시간을 적용합니다.',
    formula: [
      '월 환산 근로시간 = 주 40시간 이상이면 209시간, 미만이면 주 소정근로시간 × 4.345',
      '월급 = 시급 × 월 환산 근로시간, 연봉 = 월급 × 12',
    ],
    limits: '주 40시간 기준 209시간에는 주휴시간이 포함된 값입니다. 수당과 공제는 반영하지 않습니다.',
    checkWith: [MOEL],
  },
  bmi: {
    what: '체중(kg)을 신장(m)의 제곱으로 나눈 체질량지수와 표준체중, 기초대사량 기반 권장 칼로리를 보여줍니다.',
    formula: [
      'BMI = 체중(kg) ÷ 신장(m)²',
      '구간: 18.5 미만 저체중, 23 미만 정상, 25 미만 과체중, 30 미만 경도비만, 그 이상 고도비만',
      '표준체중 = 22 × 신장(m)²',
      '기초대사량은 Mifflin-St Jeor 식(남성 10×체중 + 6.25×신장 − 5×나이 + 5, 여성은 마지막 항이 −161)에 활동계수를 곱해 활동대사량을 계산',
    ],
    limits: '체질량지수는 근육량과 체지방률을 구분하지 못하며 의료 진단을 대신하지 않습니다.',
    checkWith: [{ name: '질병관리청 국가건강정보포털', url: 'https://health.kdca.go.kr/' }],
  },
  calorie: {
    what: '성별·체중·신장·나이로 기초대사량을 구하고 활동계수를 곱해 하루 권장 칼로리를 추정합니다.',
    formula: [
      '기초대사량(남성) = 10 × 체중 + 6.25 × 신장 − 5 × 나이 + 5, (여성) 마지막 항 −161 (Mifflin-St Jeor 식)',
      '일일 소비 칼로리 = 기초대사량 × 활동계수(1.2 / 1.375 / 1.55 / 1.725)',
      '감량 목표 예시는 일일 소비 칼로리에서 500kcal를 뺀 값',
    ],
    limits: '추정식이므로 개인차가 크며 의료·영양 상담을 대신하지 않습니다.',
    checkWith: [{ name: '질병관리청 국가건강정보포털', url: 'https://health.kdca.go.kr/' }],
  },
  'pregnancy-week': {
    what: '마지막 생리 시작일에서 오늘까지의 경과일로 임신 주수를 계산하고 280일 뒤를 출산 예정일로 표시합니다.',
    formula: [
      '경과 일수 = 오늘 − 마지막 생리 시작일',
      '임신 주수 = 경과 일수 ÷ 7의 몫(주)과 나머지(일)',
      '출산 예정일 = 마지막 생리 시작일 + 280일',
    ],
    limits: '월경 주기가 불규칙하거나 초음파로 주수를 보정한 경우 실제와 다를 수 있으며 의료 판단을 대신하지 않습니다.',
    checkWith: [{ name: '질병관리청 국가건강정보포털', url: 'https://health.kdca.go.kr/' }],
  },
  dday: {
    what: '오늘과 목표일 사이의 일수 차이를 D-day 형식과 주 단위로 보여줍니다.',
    formula: ['남은 일수 = 목표일 − 오늘(자정 기준). 0이면 D-DAY, 미래면 D-N, 과거면 D+N', '주 단위 = 절대 일수 ÷ 7'],
    limits: '사용자 기기의 날짜와 시간대를 기준으로 계산합니다.',
    checkWith: [],
  },
  age: {
    what: '생년월일로 만 나이와 연 나이, 다음 생일까지 남은 일수를 계산합니다.',
    formula: [
      '만 나이 = 올해 − 출생 연도, 올해 생일이 아직 지나지 않았으면 1을 뺌',
      '연 나이 = 올해 − 출생 연도',
    ],
    limits: '사용자 기기의 날짜를 기준으로 계산합니다.',
    checkWith: [],
  },
  'unit-converter': {
    what: '킬로미터·킬로그램·제곱미터·섭씨·리터를 마일·파운드·평·화씨·미국 갤런으로 변환합니다.',
    formula: [
      '1 km = 0.621371 mile, 1 kg = 2.204623 lb, 1평 = 3.305785㎡',
      '°F = °C × 9/5 + 32, 1 L = 0.264172 US gal',
    ],
    limits: '위 5종 변환만 지원하며 환산 계수는 계산기에 고정된 값입니다.',
    checkWith: [],
  },
};

/** 날짜에 의존하는 도구는 빌드 시점 예시를 만들지 않는다(빌드 날짜가 내용에 섞이지 않게). */
const NO_EXAMPLE = new Set(['pregnancy-week', 'dday', 'age']);
const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export interface CalcExample {
  inputs: Array<[string, string]>;
  headline: string;
  rows: Array<[string, string]>;
}

/** 실제 계산 모듈의 기본 입력값으로 계산한 예시. 대응 모듈이 없으면 null. */
export function exampleFor(slug: string): CalcExample | null {
  if (NO_EXAMPLE.has(slug)) return null;
  if (slug === 'loan-monthly-payment') {
    const r = calcLoanMonthly(300_000_000, 4.5, 360, 'equal-payment');
    return {
      inputs: [['대출 원금', '300,000,000원'], ['연 이자율', '4.5%'], ['상환 기간', '360개월'], ['상환 방식', '원리금균등']],
      headline: `월 ${won(r.monthly)}`,
      rows: [['월 상환액', won(r.monthly)], ['총 이자', won(r.totalInterest)], ['총 상환액', won(300_000_000 + r.totalInterest)]],
    };
  }
  if (slug === 'salary-net-calculator') {
    const r = computeSalaryNet(50_000_000, 1);
    return {
      inputs: [['연봉(세전)', '50,000,000원'], ['부양가족(본인 포함)', '1명']],
      headline: `월 ${won(r.netMonthly)}`,
      rows: [['세전 월급', won(r.monthly)], ['국민연금', won(r.pension)], ['건강보험', won(r.health)], ['장기요양보험', won(r.longterm)], ['고용보험', won(r.employment)], ['소득세', won(r.incTax)], ['지방소득세', won(r.localTax)], ['월 실수령액', won(r.netMonthly)]],
    };
  }
  if (slug === 'severance-pay') {
    const r = computeSeverance('2020-01-01', '2026-04-29', [3_500_000, 3_500_000, 3_500_000], 0);
    if (!r.eligible) return null;
    return {
      inputs: [['입사일', '2020-01-01'], ['퇴직일', '2026-04-29'], ['퇴직 전 3개월 월 임금', '각 3,500,000원'], ['연간 상여금', '0원']],
      headline: won(r.severance),
      rows: [['근속일수', `${r.days.toLocaleString('ko-KR')}일`], ['30일분 평균임금', won(r.avgMonthly)], ['예상 퇴직금(세전)', won(r.severance)]],
    };
  }
  if (slug === 'bmi') {
    const r = calcBMI(68, 170);
    return {
      inputs: [['신장', '170cm'], ['체중', '68kg']],
      headline: `BMI ${r.bmi} (${r.category})`,
      rows: [['BMI', String(r.bmi)], ['구간', r.category], ['표준체중', `${(22 * 1.7 ** 2).toFixed(1)}kg`]],
    };
  }
  if (!getGeneralCalculatorSlugs().includes(slug)) return null;
  const defaults = getGeneralDefaults(slug);
  const res = calculateGeneral(slug, defaults);
  const inputs: Array<[string, string]> = getGeneralFields(slug).map((f) => {
    const raw = String(f.value);
    const opt = f.options?.find(([v]) => v === raw);
    const shown = opt ? opt[1] : f.type === 'number' || f.type === undefined ? Number(raw).toLocaleString('ko-KR') : raw;
    return [f.label, shown];
  });
  return { inputs, headline: res.headline, rows: res.rows };
}

/** 일반 계산기의 입력 라벨+기본값 목록 */
export { getGeneralDefaults };

export function contentFor(calc: CalcMeta): CalcContent {
  const c = CONTENT[calc.slug];
  if (!c) throw new Error(`calc-content 누락: ${calc.slug}`);
  return c;
}

export function assertAllContent() {
  for (const c of CALCULATORS) contentFor(c);
}
