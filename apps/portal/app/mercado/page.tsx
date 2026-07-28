import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import {
  getMarketDashboard,
  getMarketImports,
  type MarketDashboard,
  type MarketImport,
} from '@/lib/market';

import { MarketPanel } from './market-panel';
import styles from './market.module.css';

export const metadata: Metadata = {
  title: 'Mercado hoje',
  description: 'Consulte cotações, variações e boletins de preços da Ceasaminas.',
};

export const dynamic = 'force-dynamic';

type MarketData = {
  dashboard: MarketDashboard | null;
  imports: MarketImport[];
  unavailable: boolean;
};

async function loadMarket(): Promise<MarketData> {
  try {
    const [dashboard, imports] = await Promise.all([getMarketDashboard(30), getMarketImports(12)]);

    return { dashboard, imports, unavailable: false };
  } catch (error) {
    console.error('Não foi possível carregar o mercado:', error);
    return { dashboard: null, imports: [], unavailable: true };
  }
}

export default async function MarketPage() {
  const data = await loadMarket();

  return (
    <>
      <Header />

      <main id="conteudo">
        <section className={`${styles.hero} internal-hero`}>
          <div className="container">
            <nav className="breadcrumb" aria-label="Navegação estrutural">
              <Link href="/">Início</Link>
              <span aria-hidden="true">/</span>
              <span>Mercado</span>
            </nav>

            <p className="eyebrow">Inteligência de mercado</p>
            <h1>Mercado hoje</h1>
            <p className="internal-hero-lead">
              Consulte preços mínimos, médios e máximos, acompanhe variações e acesse os boletins
              mais recentes da Ceasaminas.
            </p>
          </div>
        </section>

        <MarketPanel
          dashboard={data.dashboard}
          imports={data.imports}
          unavailable={data.unavailable}
        />
      </main>

      <Footer />
    </>
  );
}
