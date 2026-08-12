CREATE TABLE "transparency_items" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transparency_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transparency_items_status_sortOrder_publishedAt_idx" ON "transparency_items"("status", "sortOrder", "publishedAt");
CREATE INDEX "transparency_items_category_idx" ON "transparency_items"("category");

INSERT INTO "transparency_items" ("id", "title", "description", "category", "url", "status", "sortOrder", "publishedAt", "createdAt", "updatedAt") VALUES
  ('transparency-revenues', 'Receitas e despesas', 'Consulte receitas, despesas mensais e a execução financeira da empresa.', 'Financeiro', 'https://www.transparencia.ceasaminas.com.br/menu/receitas-e-despesas', 'PUBLISHED', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('transparency-contracts', 'Contratos e convênios', 'Acesse os contratos firmados e os respectivos instrumentos públicos.', 'Contratos', 'https://www.transparencia.ceasaminas.com.br/conteudos/contratos', 'PUBLISHED', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('transparency-governance', 'Governança corporativa', 'Veja as cartas anuais de políticas públicas e governança corporativa.', 'Governança', 'https://www.transparencia.ceasaminas.com.br/conteudos/carta-anual-de-politicas-publicas-e-governanca-corporativa', 'PUBLISHED', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('transparency-access', 'Acesso à informação', 'Conheça o Portal da Transparência e os canais oficiais de atendimento.', 'Acesso à informação', 'https://www.transparencia.ceasaminas.com.br/conteudos/o-que-e-o-portal', 'PUBLISHED', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('transparency-reports', 'Relatórios de gestão', 'Consulte relatórios de gestão, prestações de contas e responsáveis.', 'Relatórios', 'https://www.transparencia.ceasaminas.com.br/conteudos/transparencia-e-prestacao-de-contas-relatorio-de-gestao', 'PUBLISHED', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('transparency-statements', 'Demonstrações financeiras', 'Acesse demonstrações financeiras e documentos contábeis periódicos.', 'Financeiro', 'https://www.transparencia.ceasaminas.com.br/conteudos/ct-demonstracoes-financeiras-trimestrais', 'PUBLISHED', 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
