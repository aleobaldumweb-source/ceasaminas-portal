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

async function expectKeyboardFocusVisible(page: Page, steps: number) {
  let verified = 0;
  for (let attempt = 0; attempt < steps + 5 && verified < steps; attempt += 1) {
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        visible: Boolean(
          element.offsetWidth || element.offsetHeight || element.getClientRects().length,
        ),
        hasIndicator: style.outlineStyle !== 'none' || style.boxShadow !== 'none',
      };
    });

    if (!focus || !['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focus.tag)) continue;

    verified += 1;
    expect(focus.visible, `Foco invisível no passo ${verified} (${focus.tag}).`).toBe(true);
    expect(focus.hasIndicator, `Sem indicador de foco no passo ${verified} (${focus.tag}).`).toBe(
      true,
    );
  }
  expect(verified, 'A ordem de teclado terminou antes dos controles esperados.').toBe(steps);
}

for (const route of pages) {
  test(`${route.name} não possui violações WCAG A/AA detectáveis`, async ({ page }) => {
    await page.goto(route.url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main')).toBeVisible();
    await expectAccessible(page);
  });
}

test('portal mantém foco visível e ordem de teclado utilizável', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await expectKeyboardFocusVisible(page, 12);
});

test('login administrativo mantém foco visível por teclado', async ({ page }) => {
  await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expectKeyboardFocusVisible(page, 4);
});
