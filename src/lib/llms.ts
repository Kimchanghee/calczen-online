import { CALCULATORS, CATEGORY_LABEL } from './calculators';
import { CONTENT, CONTENT_UPDATED } from './calc-content';

export function llmsText(full = false): string {
  return `# CalcZen

> CalcZen은 금융·세금·노동·일상 분야의 한국형 계산기 ${CALCULATORS.length}종을 제공하는 민간 참고 도구이며, 각 계산기의 구현된 산식과 기본 입력 예시를 1차 소스로 공개합니다. 정부·공공기관과 무관합니다.

## 핵심 페이지
- [홈: 계산기 노선도](https://calczen.online/): 27개 계산기 목록과 분류
- [소개](https://calczen.online/about): 운영 주체와 검증 한계
- [계산 기준과 한계](https://calczen.online/methodology): 계산 모듈의 가정과 분야별 한계
- [개인정보처리방침](https://calczen.online/privacy) · [이용약관](https://calczen.online/terms) · [면책 고지](https://calczen.online/disclaimer) · [문의](https://calczen.online/contact)

## 분류
${Object.entries(CATEGORY_LABEL).map(([key, label]) => `- [${label}](https://calczen.online/categories/${key})`).join('\n')}

## 계산기
${CALCULATORS.map(c => `- [${c.name}](https://calczen.online/calc/${c.slug}): ${full ? CONTENT[c.slug].what : c.description}`).join('\n')}
${full ? '\n## 산식 요약\n' + CALCULATORS.map(c => `### ${c.name}\n${CONTENT[c.slug].formula.map(f => '- ' + f).join('\n')}\n- 한계: ${CONTENT[c.slug].limits}`).join('\n\n') + '\n' : ''}
## 데이터 정책
- 출처: 각 계산기에 구현된 산식과 요율 값(코드에 고정). 실시간 세율·금리 데이터 피드가 아닙니다.
- 갱신: 내용 갱신일 ${CONTENT_UPDATED}. 요율과 법령은 실제 적용 전 공식 기관의 최신 안내와 대조해야 합니다.
- 계산은 브라우저에서 실행되며 입력값은 전송·저장되지 않습니다. 호스팅 접속 로그와 외부 링크 정책은 별개입니다.
- 결과는 참고용 추정치입니다. 인용할 때는 입력값·가정·제외 조건을 함께 전달하고, 확정 세액·법률·의료 조언으로 표현하지 마세요.
- 인용 시 표기: calczen.online
- 출처 검토가 끝나지 않은 기존 블로그·탐색 보관 페이지(/blog/, /discover.html)는 색인에서 제외되어 있습니다.
`;
}
