import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { MarketChart } from '@/components/market-chart';
import { getMarketDashboard, type MarketDashboard } from '@/lib/market';

import styles from './mercado.module.css';

export const metadata: Metadata = {
  title: 'Mercado',
  description: 'Painel de preços, tendências e informações de mercado da Ceasaminas.',
};

export const dynamic = 'force-dynamic';

async function loadDashboard(): Promise<MarketDashboard | null> {
  try {
    return await getMarketDashboard();
  } catch (error) {
    console.error('Não foi possível carregar o painel de mercado:', error);
    return null;
  }
}

export default async function MarketPage() {
  const dashboard = await loadDashboard();
  const prices = dashboard?.prices ?? [];
  const selected = dashboard?.history.productName ?? 'Banana-prata';

  const chartDatasets = {
    [selected]:
      dashboard?.history.items.map((item) => ({
        label: item.label,
        value: item.avgPrice,
      })) ?? [],
  };

  const highest = dashboard?.highlights.highestIncrease;
  const lowest = dashboard?.highlights.highestDecrease;
  const viewed = dashboard?.highlights.mostViewed;

  return (
    <>
      <Header />

      <main id="conteudo" className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
              <Link href="/">Início</Link>
              <span aria-hidden="true">/</span>
              <span>Mercado</span>
            </nav>

            <div className={styles.heroGrid}>
              <div>
                <p className={styles.eyebrow}>Inteligência de mercado</p>
                <h1>Preços e tendências para decisões mais seguras.</h1>
                <p className={styles.heroLead}>
                  Acompanhe referências de produtos, variações e movimentos do mercado atacadista da
                  Ceasaminas.
                </p>
              </div>

              <aside className={styles.heroSummary}>
                <span>Última atualização</span>
                <strong>
                  {dashboard
                    ? new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo',
                      }).format(new Date(dashboard.updatedAt))
                    : 'Indisponível'}
                </strong>
                <small>
                  {dashboard?.source === 'database'
                    ? 'Dados carregados do banco de dados.'
                    : 'Dados demonstrativos enquanto não há cotações cadastradas.'}
                </small>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.toolbarSection}>
          <div className={`${styles.container} ${styles.toolbar}`}>
            <div>
              <span>Unidade</span>
              <strong>Contagem</strong>
            </div>
            <div>
              <span>Categoria</span>
              <strong>Todos os produtos</strong>
            </div>
            <div>
              <span>Período</span>
              <strong>Últimos {dashboard?.filters.days ?? 30} dias</strong>
            </div>
            <button type="button">Atualizar painel</button>
          </div>
        </section>

        <section className={styles.dashboardSection}>
          <div className={styles.container}>
            {!dashboard ? (
              <div className={styles.emptyState} role="status">
                <h2>Painel temporariamente indisponível</h2>
                <p>Verifique se a API está em execução e tente novamente.</p>
              </div>
            ) : (
              <>
                <div className={styles.highlights}>
                  <article>
                    <span>Maior alta</span>
                    <strong>
                      {highest ? `+${highest.variation.toLocaleString('pt-BR')}%` : '—'}
                    </strong>
                    <p>{highest?.productName ?? 'Sem dados'}</p>
                  </article>

                  <article>
                    <span>Maior baixa</span>
                    <strong>{lowest ? `${lowest.variation.toLocaleString('pt-BR')}%` : '—'}</strong>
                    <p>{lowest?.productName ?? 'Sem dados'}</p>
                  </article>

                  <article>
                    <span>Mais consultado</span>
                    <strong>1º</strong>
                    <p>{viewed?.productName ?? 'Sem dados'}</p>
                  </article>
                </div>

                <div className={styles.dashboardGrid}>
                  <MarketChart title="Evolução dos preços" unit="R$" datasets={chartDatasets} />

                  <aside className={styles.ranking}>
                    <header>
                      <p className={styles.eyebrow}>Resumo diário</p>
                      <h2>Produtos em destaque</h2>
                    </header>

                    <div>
                      {prices.slice(0, 5).map((product, index) => (
                        <article key={product.productName}>
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <div>
                            <strong>{product.productName}</strong>
                            <small>{product.unit}</small>
                          </div>
                          <b>
                            R${' '}
                            {product.avgPrice.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </b>
                        </article>
                      ))}
                    </div>
                  </aside>
                </div>

                <section className={styles.tableSection}>
                  <header className={styles.sectionHeader}>
                    <div>
                      <p className={styles.eyebrow}>Cotações</p>
                      <h2>Referências por produto</h2>
                    </div>
                    <button type="button">Exportar dados</button>
                  </header>

                  <div className={styles.tableWrapper}>
                    <table>
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Unidade</th>
                          <th>Preço mínimo</th>
                          <th>Preço médio</th>
                          <th>Preço máximo</th>
                          <th>Variação</th>
                        </tr>
                      </thead>

                      <tbody>
                        {prices.map((product) => (
                          <tr key={product.productName}>
                            <td>
                              <strong>{product.productName}</strong>
                            </td>
                            <td>{product.category}</td>
                            <td>{product.unit}</td>
                            <td>
                              R${' '}
                              {product.minPrice.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              R${' '}
                              {product.avgPrice.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              R${' '}
                              {product.maxPrice.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              <span
                                className={
                                  product.variation >= 0 ? styles.positive : styles.negative
                                }
                              >
                                {product.variation >= 0 ? '▲' : '▼'}{' '}
                                {Math.abs(product.variation).toLocaleString('pt-BR')}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
