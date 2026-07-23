import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsImage } from '@/components/news-image';
import { formatNewsDate, getPublishedNews, type NewsArticle } from '@/lib/news';

export const dynamic = 'force-dynamic';

const metrics = [
  { value: '120+', label: 'produtos acompanhados' },
  { value: '6', label: 'unidades em Minas Gerais' },
  { value: '24h', label: 'acesso à informação' },
  { value: '100%', label: 'compromisso público' },
];

const services = [
  {
    number: '01',
    title: 'Mercado hoje',
    description: 'Cotações, históricos, sazonalidade e referências para decisões mais seguras.',
    href: '/mercado',
  },
  {
    number: '02',
    title: 'Licitações',
    description: 'Editais, avisos, anexos, resultados e acompanhamento dos processos.',
    href: '/licitacoes',
  },
  {
    number: '03',
    title: 'Transparência',
    description: 'Contratos, despesas, governança, acesso à informação e dados públicos.',
    href: '/transparencia',
  },
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

      <main id="conteudo">
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Ceasaminas Digital</p>

              <h1 id="hero-title">Abastecimento, inteligência de mercado e serviço público.</h1>

              <p className="hero-lead">
                Um portal para conectar produtores, comerciantes, empresas e cidadãos com dados
                claros, serviços rápidos e transparência.
              </p>

              <div className="hero-actions">
                <Link className="button button-primary" href="/mercado">
                  Consultar mercado
                </Link>

                <Link className="button button-secondary" href="/transparencia">
                  Acessar transparência
                </Link>
              </div>
            </div>

            <aside className="market-snapshot" aria-label="Resumo de mercado">
              <p className="eyebrow">Painel de mercado</p>

              <h2>Dados que apoiam decisões.</h2>

              <div className="snapshot-row">
                <span>Produtos monitorados</span>
                <strong>120+</strong>
              </div>

              <div className="snapshot-row">
                <span>Unidades de referência</span>
                <strong>6</strong>
              </div>

              <Link href="/mercado">Abrir painel completo →</Link>
            </aside>
          </div>
        </section>

        <section className="metrics container" aria-label="Indicadores em destaque">
          {metrics.map((metric) => (
            <article key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </section>

        <section className="section container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Serviços essenciais</p>
              <h2>Encontre rapidamente o que precisa.</h2>
            </div>

            <p>
              Arquitetura orientada a serviços públicos, informação de mercado e acesso
              transparente.
            </p>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.href}>
                <span>{service.number}</span>

                <h3>{service.title}</h3>

                <p>{service.description}</p>

                <Link href={service.href}>
                  Explorar serviço <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-band">
          <div className="container feature-grid">
            <div>
              <p className="eyebrow">Rede Ceasaminas</p>
              <h2>Presença regional com informação integrada.</h2>
            </div>

            <div className="unit-list">
              {[
                'Contagem',
                'Barbacena',
                'Caratinga',
                'Governador Valadares',
                'Juiz de Fora',
                'Uberlândia',
              ].map((unit) => (
                <span key={unit}>{unit}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="section-heading news-heading">
            <div>
              <p className="eyebrow">Notícias e comunicados</p>

              <h2>Informação pública com hierarquia editorial clara.</h2>
            </div>

            <Link className="text-link" href="/noticias">
              Ver todas as notícias →
            </Link>
          </div>

          {news.length > 0 ? (
            <div className="news-grid">
              {news.map((item, index) => (
                <article className="news-card" key={item.id}>
                  <Link href={`/noticias/${item.slug}`} aria-label={`Ler notícia: ${item.title}`}>
                    <NewsImage src={item.imageUrl} alt={item.title} priority={index === 0} />
                  </Link>

                  <p className="news-meta">
                    {item.category || 'Institucional'}
                    {' · '}
                    {formatNewsDate(item.publishedAt ?? item.createdAt)}
                  </p>

                  <h3>
                    <Link href={`/noticias/${item.slug}`}>{item.title}</Link>
                  </h3>

                  <p className="news-summary">{item.summary}</p>

                  <Link href={`/noticias/${item.slug}`}>
                    Ler notícia <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state" role="status">
              <h3>Notícias temporariamente indisponíveis</h3>

              <p>
                Não foi possível consultar as notícias neste momento. Tente novamente em instantes.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
