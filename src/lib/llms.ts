import { CALCULATORS, CATEGORY_LABEL } from './calculators';
export function llmsText(full = false): string {
  return `# CalcZen

Korean private reference calculators. Not a government service.

## Status and data policy
- Search indexing is intentionally limited to the canonical Home, About and Methodology pages. Calculator, category, legacy archive/blog/discovery, 404 and llms text routes remain noindex.
- Calculations run in the browser. No live rate, tax-rule, eligibility or professional-review guarantee.
- Defaults are examples. Cite assumptions and exclusions; never present estimates as financial, tax, legal or medical advice.
- Homepage discovery works without JavaScript; interactive calculation requires JavaScript.
- Input values are not sent or stored by calculator modules. Hosting access logs and external-link policies are separate.
- Calculator and category routes remain available for direct use but are excluded from search indexing and the sitemap.
- Legacy blog/discovery pages have not passed source audit and are excluded from this directory and the sitemap.

## Indexable canonical pages
- [Home](https://calczen.online/)
- [About](https://calczen.online/about)
- [Methodology](https://calczen.online/methodology)
- [Sitemap](https://calczen.online/sitemap.xml)

## Non-indexable categories
${Object.entries(CATEGORY_LABEL).map(([key, label]) => `- [${label}](https://calczen.online/categories/${key})`).join('\n')}

## Non-indexable calculators
${CALCULATORS.map(c => `- [${c.name}](https://calczen.online/calc/${c.slug})${full ? `: ${c.description}` : ''}`).join('\n')}
`;
}
