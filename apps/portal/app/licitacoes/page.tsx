import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import { getPublishedProcurements, type Procurement } from '@/lib/procurements';

import styles from './licitacoes.module.css';
import { ProcurementsList } from './procurements-list';

export const metadata: Metadata = {
  title: 'Licitações',
  description: 'Consulte editais, processos, documentos e resultados de licitações da Ceasaminas.',
};

export const dynamic = 'force-dynamic';

export default async function LicitacoesPage() {
  let items: Procurement[] = [];
  let unavailable = false;

  try {
    items = await getPublishedProcurements();
  } catch (error) {
    console.error('Não foi possível carregar as licitações da API:', error);
    unavailable = true;
  }

  return (
    <PageShell
      eyebrow="Compras públicas"
      title="Licitações organizadas, pesquisáveis e acessíveis."
      description="Consulte processos, editais, documentos, resultados e atualizações oficiais."
    >
      <section className={styles.section} aria-labelledby="processos-title">
        <div className="container">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Consulta pública</p>
              <h2 id="processos-title">Processos e oportunidades</h2>
            </div>
            <p>
              Pesquise pelo número ou objeto e filtre pela situação atual. Os documentos disponíveis
              são vinculados diretamente a cada processo.
            </p>
          </header>

          <ProcurementsList items={items} unavailable={unavailable} />
        </div>
      </section>
    </PageShell>
  );
}
