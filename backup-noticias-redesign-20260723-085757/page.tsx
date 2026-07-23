import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsImage } from '@/components/news-image';
import { formatNewsDate, getPublishedNews, type NewsArticle } from '@/lib/news';

export const metadata: Metadata = {
  title: 'Notícias',
  description: 'Notícias, comunicados e informações institucionais da Ceasaminas.',
};

export const dynamic = 'force-dynamic';

async function loadNews(): Promise<NewsArticle[]> {
  try {
    return await getPublishedNews();
  } catch (error) {
    console.error('Não foi possível carregar as notícias:', error);
    return [];
  }
}

export default async function NewsPage() {
  const news = await loadNews();

  const featuredArticle = news[0];
  const remainingArticles = news.slice(1);

  return (
    <>
      <Header />

      <main id="conteudo">
        <section className="internal-hero news-page-hero">
          <div className="container">
            <nav className="breadcrumb" aria-label="Navegação estrutural">
              <Link href="/">Início</Link>
              <span aria-hidden="true">/</span>
              <span>Notícias</span>
            </nav>

            <p className="eyebrow">Imprensa e comunicação</p>

            <h1>Notícias e comunicados</h1>

            <p className="internal-hero-lead">
              Acompanhe informações institucionais, projetos, serviços públicos, ações regionais e
              notícias da Ceasaminas.
            </p>
          </div>
        </section>

        <section className="section container news-page-section">
          {featuredArticle ? (
            <>
              <article className="featured-news">
                <Link
                  className="featured-news-image-link"
                  href={`/noticias/${featuredArticle.slug}`}
                  aria-label={`Ler notícia: ${featuredArticle.title}`}
                >
                  <NewsImage
                    src={featuredArticle.imageUrl}
                    alt={featuredArticle.title}
                    priority
                    className="featured-news-image"
                  />
                </Link>

                <div className="featured-news-content">
                  <p className="news-meta">
                    {featuredArticle.category || 'Institucional'}
                    {' · '}
                    {formatNewsDate(featuredArticle.publishedAt ?? featuredArticle.createdAt)}
                  </p>

                  <h2>
                    <Link href={`/noticias/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                  </h2>

                  <p className="featured-news-summary">{featuredArticle.summary}</p>

                  <Link
                    className="button button-primary"
                    href={`/noticias/${featuredArticle.slug}`}
                  >
                    Ler notícia completa
                  </Link>
                </div>
              </article>

              {remainingArticles.length > 0 && (
                <div className="news-page-content">
                  <div className="news-page-heading">
                    <div>
                      <p className="eyebrow">Últimas publicações</p>
                      <h2>Mais notícias da Ceasaminas</h2>
                    </div>

                    <span>
                      {remainingArticles.length}{' '}
                      {remainingArticles.length === 1 ? 'publicação' : 'publicações'}
                    </span>
                  </div>

                  <div className="news-modern-grid">
                    {remainingArticles.map((article, index) => (
                      <article className="news-modern-card" key={article.id}>
                        <Link
                          className="news-modern-image-link"
                          href={`/noticias/${article.slug}`}
                          aria-label={`Ler notícia: ${article.title}`}
                        >
                          <NewsImage
                            src={article.imageUrl}
                            alt={article.title}
                            priority={index < 2}
                          />
                        </Link>

                        <div className="news-modern-content">
                          <p className="news-meta">
                            {article.category || 'Institucional'}
                            {' · '}
                            {formatNewsDate(article.publishedAt ?? article.createdAt)}
                          </p>

                          <h3>
                            <Link href={`/noticias/${article.slug}`}>{article.title}</Link>
                          </h3>

                          <p className="news-summary">{article.summary}</p>

                          <Link
                            className="news-card-link"
                            href={`/noticias/${article.slug}`}
                            aria-label={`Ler notícia completa: ${article.title}`}
                          >
                            Ler notícia
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" role="status">
              <p className="eyebrow">Notícias</p>

              <h2>Nenhuma notícia disponível</h2>

              <p>
                Não foi possível carregar as notícias neste momento ou ainda não existem publicações
                disponíveis.
              </p>

              <Link className="button button-primary" href="/">
                Voltar ao início
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
