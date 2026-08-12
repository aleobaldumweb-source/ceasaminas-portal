import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const [{ prisma }, { ProcurementsService }] = await Promise.all([
  import('@ceasaminas/database'),
  import('../dist/procurement/procurements.service.js'),
]);

const originalFindUnique = prisma.procurement.findUnique;
const originalTransaction = prisma.$transaction;

afterEach(() => {
  prisma.procurement.findUnique = originalFindUnique;
  prisma.$transaction = originalTransaction;
});

describe('ProcurementsService', () => {
  it('converte conflito concorrente de número em resposta previsível', async () => {
    prisma.procurement.findUnique = async () => null;
    prisma.$transaction = async () => {
      throw { code: 'P2002' };
    };

    const service = new ProcurementsService();

    await assert.rejects(
      () =>
        service.create(
          {
            number: '001/2026',
            title: 'Aquisição de equipamentos',
            description: 'Processo para aquisição de equipamentos.',
            modality: 'PREGÃO ELETRÔNICO',
            status: 'DRAFT',
          },
          { id: 'admin-1', role: 'ADMIN' },
        ),
      /Já existe uma licitação com esse número/,
    );
  });

  it('devolve os documentos removidos para limpeza dos arquivos', async () => {
    const item = {
      number: '001/2026',
      documents: [{ fileUrl: '/uploads/procurements/edital.pdf' }],
    };
    prisma.procurement.findUnique = async () => item;
    prisma.$transaction = async (operation) =>
      operation({
        procurement: { delete: async () => undefined },
        auditLog: { create: async () => undefined },
      });

    const service = new ProcurementsService();
    const result = await service.remove('procurement-1', { id: 'admin-1', role: 'ADMIN' });

    assert.equal(result, item);
  });
});
