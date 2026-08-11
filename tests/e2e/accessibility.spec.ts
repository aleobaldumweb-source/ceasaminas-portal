import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const pages = [
  { name: 'início', url: 'http://localhost:3000/' },
  { name: 'mercado', url: 'http://localhost:3000/mercado' },
  { name: 'licitações', url: 'http://localhost:3000/licitacoes' },
  { name: 'transparência', url: 'http://localhost:3000/transparencia' },
  { name: 'login', url: 'http://localhost:3001/login' },
  { name: 'recuperação de senha', url: 'http://localhost:3001/forgot-password' },
] as const;

function summarizeViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes
          .map((node) => `  - ${node.target.join(' ')}`)
          .join('\n')}`,
    )
    .join('\n\n');
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations, summarizeViolations(results.violations)).toEqual([]);
}

for (const route of pages) {
  test(`${route.name} não possui violações WCAG A/AA detectáveis`, async ({ page }) => {
    await page.goto(route.url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main')).toBeVisible();
    await expectAccessible(page);
  });
}
