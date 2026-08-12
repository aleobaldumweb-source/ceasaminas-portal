import { expect, test } from '@playwright/test';

test('portal oferece navegação pública acessível', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: /ir para o conteúdo/i })).toBeAttached();
  await expect(page.getByRole('main')).toBeVisible();
  await page.getByRole('link', { name: 'Transparência' }).first().click();
  await expect(page).toHaveURL(/\/transparencia$/);
  await expect(page.getByRole('heading', { name: /informação institucional/i })).toBeVisible();
});

test('admin expõe login e recuperação sem autenticação', async ({ page }) => {
  await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Entrar no painel' })).toBeVisible();
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole('heading', { name: 'Esqueci minha senha' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toHaveAttribute('type', 'email');
});

test('redefinição rejeita link sem token antes de chamar a API', async ({ page }) => {
  await page.goto('http://localhost:3001/reset-password', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nova senha').fill('senha-segura-123');
  await page.getByLabel('Confirmar senha').fill('senha-segura-123');
  await page.getByRole('button', { name: 'Redefinir senha' }).click();
  await expect(page.locator('.alert.error')).toContainText('Link de redefinição inválido');
});
