import { expect, test, type Page, type Route } from '@playwright/test';

type TransparencyItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  sortOrder: number;
  publishedAt: string | null;
};

const adminUser = {
  id: 'admin-e2e',
  name: 'Admin E2E',
  email: 'admin.e2e@ceasaminas.com.br',
  role: 'ADMIN',
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockAdminApi(page: Page) {
  const items: TransparencyItem[] = [];
  const mutations: Array<{ method: string; authorization: string | undefined }> = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const method = request.method();

    if (path === '/auth/refresh' && method === 'POST') {
      return json(route, { accessToken: 'e2e-access-token', user: adminUser });
    }

    if (path === '/transparency/admin' && method === 'GET') return json(route, items);

    if (path === '/transparency' && method === 'POST') {
      mutations.push({ method, authorization: request.headers().authorization });
      const input = request.postDataJSON() as Omit<TransparencyItem, 'id' | 'publishedAt'>;
      items.push({ ...input, id: 'item-e2e', publishedAt: null });
      return json(route, items[0], 201);
    }

    if (path === '/transparency/item-e2e' && method === 'PATCH') {
      mutations.push({ method, authorization: request.headers().authorization });
      Object.assign(items[0], request.postDataJSON());
      return json(route, items[0]);
    }

    if (path === '/transparency/item-e2e' && method === 'DELETE') {
      mutations.push({ method, authorization: request.headers().authorization });
      items.splice(0, 1);
      return route.fulfill({ status: 204 });
    }

    return json(route, { message: `Rota E2E não simulada: ${method} ${path}` }, 500);
  });

  return { items, mutations };
}

test('administrador conclui o CRUD de transparência com requisições autenticadas', async ({
  page,
}) => {
  const api = await mockAdminApi(page);
  await page.goto('http://localhost:3001/transparency', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Transparência' })).toBeVisible();
  await expect(page.getByText('Nenhum item cadastrado.')).toBeVisible();

  await page.getByLabel('Título').fill('Relatório institucional');
  await page.getByLabel('Descrição').fill('Documento oficial para consulta pública.');
  await page.getByLabel('URL oficial').fill('https://www.ceasaminas.com.br/relatorio');
  await page.getByLabel('Status').selectOption('PUBLISHED');
  await page.getByLabel('Ordem').fill('10');
  await page.getByRole('button', { name: 'Criar item' }).click();

  await expect(page.locator('[role="status"].success')).toContainText('Item criado com sucesso.');
  await expect(page.getByRole('cell', { name: /Relatório institucional/ })).toBeVisible();

  await page.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Título').fill('Relatório institucional atualizado');
  await page.getByRole('button', { name: 'Atualizar' }).click();
  await expect(page.locator('[role="status"].success')).toContainText(
    'Item atualizado com sucesso.',
  );
  await expect(page.getByText('Relatório institucional atualizado')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Excluir' }).click();
  await expect(page.locator('[role="status"].success')).toContainText('Item excluído.');
  await expect(page.getByText('Nenhum item cadastrado.')).toBeVisible();

  expect(api.items).toEqual([]);
  expect(api.mutations.map(({ method }) => method)).toEqual(['POST', 'PATCH', 'DELETE']);
  expect(
    api.mutations.every(({ authorization }) => authorization === 'Bearer e2e-access-token'),
  ).toBe(true);
});
