import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsCard } from '@/components/news-card';
import { getPublishedNews, type NewsArticle } from '@/lib/news';

import styles from './home.module.css';

export const dynamic = 'force-dynamic';

const metrics = [
  { value: '120+', label: 'produtos acompanhados' },
  { value: '6', label: 'unidades em Minas Gerais' },
  { value: '24h', label: 'acesso à informação' },
  { value: '100%', label: 'compromisso público' },
] as const;

const services = [
  {
    number: '01',
    title: 'Mercado e cotações',
    description:
      'Consulte referências, históricos, sazonalidade e informações para decisões mais seguras.',
    href: '/mercado',
    cta: 'Consultar mercado',
  },
  {
    number: '02',
    title: 'Licitações',
    description:
      'Acompanhe editais, anexos, avisos, resultados e o andamento dos processos públicos.',
    href: '/licitacoes',
    cta: 'Acessar licitações',
  },
  {
    number: '03',
    title: 'Transparência',
    description:
      'Encontre contratos, despesas, governança, acesso à informação e dados institucionais.',
    href: '/transparencia',
    cta: 'Abrir transparência',
  },
] as const;

const units = [
  'Contagem',
  'Barbacena',
  'Caratinga',
  'Governador Valadares',
  'Juiz de Fora',
  'Uberlândia',
] as const;

async function loadHomepageNews(): Promise<NewsArticle[]> {
  try {
    const articles = await getPublishedNews();
    return articles.slice(0, 3);
  } catch (error) {
    console.error('Não foi possível carregar as notícias da API:', error);
    return [];
  }
}

export default async function HomePage() {
  const news = await loadHomepageNews();

  return (
    <>
      <Header />

      <main id="conteudo" className={styles.page}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />

          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Ceasaminas Digital</p>

                <h1 id="hero-title">Abastecimento, inteligência de mercado e serviço público.</h1>

                <p className={styles.heroLead}>
                  Um portal para conectar produtores, comerciantes, empresas e cidadãos a dados
                  claros, serviços rápidos e informação pública.
                </p>

                <div className={styles.heroActions}>
                  <Link className={styles.primaryButton} href="/mercado">
                    Consultar mercado
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link className={styles.secondaryButton} href="/transparencia">
                    Acessar transparência
                  </Link>
                </div>
              </div>

              <aside className={styles.marketPanel} aria-label="Resumo de mercado">
                <div className={styles.panelHeader}>
                  <p className={styles.eyebrow}>Painel de mercado</p>
                  <span className={styles.liveBadge}>Atualização contínua</span>
                </div>

                <h2>Dados que apoiam decisões.</h2>

                <div className={styles.panelRows}>
                  <div>
                    <span>Produtos monitorados</span>
                    <strong>120+</strong>
                  </div>

                  <div>
                    <span>Unidades de referência</span>
                    <strong>6</strong>
                  </div>

                  <div>
                    <span>Acesso a informações</span>
                    <strong>24h</strong>
                  </div>
                </div>

                <Link href="/mercado">
                  Abrir painel completo
                  <span aria-hidden="true">→</span>
                </Link>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.metricsSection} aria-label="Indicadores institucionais">
          <div className={`${styles.container} ${styles.metricsGrid}`}>
            {metrics.map((metric) => (
              <article key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Serviços essenciais</p>
                <h2>Encontre rapidamente o que precisa.</h2>
              </div>

              <p>
                Uma arquitetura orientada a serviços públicos, informação de mercado e acesso
                transparente.
              </p>
            </header>

            <div className={styles.serviceGrid}>
              {services.map((service) => (
                <article className={styles.serviceCard} key={service.href}>
                  <span className={styles.serviceNumber}>{service.number}</span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>

                  <Link href={service.href}>
                    {service.cta}
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.networkSection}>
          <div className={`${styles.container} ${styles.networkGrid}`}>
            <div>
              <p className={styles.eyebrow}>Rede Ceasaminas</p>
              <h2>Presença regional com informação integrada.</h2>
              <p>
                Seis unidades conectadas para apoiar o abastecimento, a produção, o comércio e a
                segurança alimentar em Minas Gerais.
              </p>
            </div>

            <div className={styles.unitGrid}>
              {units.map((unit, index) => (
                <span key={unit}>
                  <small>{String(index + 1).padStart(2, '0')}</small>
                  {unit}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.newsSection}>
          <div className={styles.container}>
            <header className={styles.newsHeader}>
              <div>
                <p className={styles.eyebrow}>Notícias e comunicados</p>
                <h2>Informação pública com hierarquia editorial clara.</h2>
              </div>

              <Link href="/noticias">
                Ver todas as notícias
                <span aria-hidden="true">→</span>
              </Link>
            </header>

            {news.length > 0 ? (
              <div className={styles.newsGrid}>
                {news.map((article, index) => (
                  <NewsCard article={article} priority={index === 0} key={article.id} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState} role="status">
                <h3>Notícias temporariamente indisponíveis</h3>
                <p>
                  Não foi possível consultar as notícias neste momento. Tente novamente em
                  instantes.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={`${styles.container} ${styles.finalCtaInner}`}>
            <div>
              <p className={styles.eyebrow}>Acesso rápido</p>
              <h2>Serviços públicos com clareza, segurança e transparência.</h2>
            </div>

            <div className={styles.finalCtaActions}>
              <Link className={styles.primaryButton} href="/contato">
                Falar com a Ceasaminas
              </Link>

              <Link className={styles.secondaryButtonDark} href="/institucional">
                Conhecer a instituição
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
