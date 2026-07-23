import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { MarketChart } from '@/components/market-chart';

import styles from './mercado.module.css';

export const metadata: Metadata = {
  title: 'Mercado',
  description: 'Painel de preços, tendências e informações de mercado da Ceasaminas.',
};

const marketProducts = [
  {
    name: 'Banana-prata',
    unit: 'cx. 20 kg',
    price: 88.5,
    variation: 4.2,
    category: 'Frutas',
  },
  {
    name: 'Tomate longa vida',
    unit: 'cx. 22 kg',
    price: 96.0,
    variation: -2.1,
    category: 'Hortaliças',
  },
  {
    name: 'Batata inglesa',
    unit: 'sc. 50 kg',
    price: 154.0,
    variation: 8.4,
    category: 'Tubérculos',
  },
  {
    name: 'Cenoura',
    unit: 'cx. 20 kg',
    price: 72.0,
    variation: 1.5,
    category: 'Hortaliças',
  },
  {
    name: 'Abacaxi pérola',
    unit: 'unidade',
    price: 7.4,
    variation: -0.9,
    category: 'Frutas',
  },
  {
    name: 'Mamão formosa',
    unit: 'cx. 18 kg',
    price: 74.5,
    variation: 3.1,
    category: 'Frutas',
  },
] as const;

const chartDatasets = {
  'Banana-prata': [
    { label: 'Seg', value: 82.0 },
    { label: 'Ter', value: 83.5 },
    { label: 'Qua', value: 84.0 },
    { label: 'Qui', value: 86.2 },
    { label: 'Sex', value: 88.5 },
  ],
  'Tomate longa vida': [
    { label: 'Seg', value: 101.0 },
    { label: 'Ter', value: 99.5 },
    { label: 'Qua', value: 98.0 },
    { label: 'Qui', value: 97.2 },
    { label: 'Sex', value: 96.0 },
  ],
  'Batata inglesa': [
    { label: 'Seg', value: 138.0 },
    { label: 'Ter', value: 141.0 },
    { label: 'Qua', value: 146.0 },
    { label: 'Qui', value: 149.5 },
    { label: 'Sex', value: 154.0 },
  ],
};

const highlights = [
  {
    title: 'Maior alta',
    value: '+8,4%',
    product: 'Batata inglesa',
  },
  {
    title: 'Maior baixa',
    value: '-2,1%',
    product: 'Tomate longa vida',
  },
  {
    title: 'Mais consultado',
    value: '1º',
    product: 'Banana-prata',
  },
] as const;

export default function MarketPage() {
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
                <strong>Hoje, 08h30</strong>
                <small>Dados demonstrativos para desenvolvimento.</small>
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
              <strong>Últimos 5 dias</strong>
            </div>

            <button type="button">Atualizar painel</button>
          </div>
        </section>

        <section className={styles.dashboardSection}>
          <div className={styles.container}>
            <div className={styles.highlights}>
              {highlights.map((highlight) => (
                <article key={highlight.title}>
                  <span>{highlight.title}</span>
                  <strong>{highlight.value}</strong>
                  <p>{highlight.product}</p>
                </article>
              ))}
            </div>

            <div className={styles.dashboardGrid}>
              <MarketChart title="Evolução dos preços" unit="R$" datasets={chartDatasets} />

              <aside className={styles.ranking}>
                <header>
                  <p className={styles.eyebrow}>Resumo diário</p>
                  <h2>Produtos em destaque</h2>
                </header>

                <div>
                  {marketProducts.slice(0, 5).map((product, index) => (
                    <article key={product.name}>
                      <span>{String(index + 1).padStart(2, '0')}</span>

                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.unit}</small>
                      </div>

                      <b>
                        R${' '}
                        {product.price.toLocaleString('pt-BR', {
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
                      <th>Preço médio</th>
                      <th>Variação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {marketProducts.map((product) => (
                      <tr key={product.name}>
                        <td>
                          <strong>{product.name}</strong>
                        </td>
                        <td>{product.category}</td>
                        <td>{product.unit}</td>
                        <td>
                          R${' '}
                          {product.price.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          <span
                            className={product.variation >= 0 ? styles.positive : styles.negative}
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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
