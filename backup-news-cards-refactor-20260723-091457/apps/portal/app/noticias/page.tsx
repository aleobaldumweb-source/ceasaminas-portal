import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsImage } from '@/components/news-image';
import { formatNewsDate, getPublishedNews, type NewsArticle } from '@/lib/news';

import styles from './noticias.module.css';

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

function articleHref(article: NewsArticle) {
  return `/noticias/${article.slug}`;
}

export default async function NewsPage() {
  const news = await loadNews();
  const featuredArticle = news[0];
  const remainingArticles = news.slice(1);

  return (
    <>
      <Header />

      <main id="conteudo" className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
              <Link href="/">Início</Link>
              <span aria-hidden="true">/</span>
              <span>Notícias</span>
            </nav>

            <div className={styles.heroContent}>
              <p className={styles.eyebrow}>Imprensa e comunicação</p>
              <h1>Notícias e comunicados</h1>
              <p>
                Acompanhe informações institucionais, projetos, serviços públicos, ações regionais e
                notícias da Ceasaminas.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.container}>
            {featuredArticle ? (
              <>
                <article className={styles.featured}>
                  <Link
                    href={articleHref(featuredArticle)}
                    className={styles.featuredMedia}
                    aria-label={`Ler notícia: ${featuredArticle.title}`}
                  >
                    <NewsImage
                      src={featuredArticle.imageUrl}
                      alt={featuredArticle.title}
                      priority
                      className={styles.featuredImage}
                    />
                  </Link>

                  <div className={styles.featuredBody}>
                    <p className={styles.meta}>
                      {featuredArticle.category || 'Institucional'}
                      <span aria-hidden="true">•</span>
                      {formatNewsDate(featuredArticle.publishedAt ?? featuredArticle.createdAt)}
                    </p>

                    <h2>
                      <Link href={articleHref(featuredArticle)}>{featuredArticle.title}</Link>
                    </h2>

                    <p className={styles.featuredSummary}>{featuredArticle.summary}</p>

                    <Link href={articleHref(featuredArticle)} className={styles.primaryButton}>
                      Ler notícia completa
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>

                {remainingArticles.length > 0 ? (
                  <section className={styles.latest} aria-labelledby="latest-title">
                    <header className={styles.sectionHeader}>
                      <div>
                        <p className={styles.eyebrow}>Últimas publicações</p>
                        <h2 id="latest-title">Mais notícias da Ceasaminas</h2>
                      </div>

                      <span className={styles.publicationCount}>
                        {remainingArticles.length}{' '}
                        {remainingArticles.length === 1 ? 'publicação' : 'publicações'}
                      </span>
                    </header>

                    <div className={styles.grid}>
                      {remainingArticles.map((article, index) => (
                        <article className={styles.card} key={article.id}>
                          <Link
                            href={articleHref(article)}
                            className={styles.cardMedia}
                            aria-label={`Ler notícia: ${article.title}`}
                          >
                            <NewsImage
                              src={article.imageUrl}
                              alt={article.title}
                              priority={index < 2}
                              className={styles.cardImage}
                            />
                          </Link>

                          <div className={styles.cardBody}>
                            <p className={styles.meta}>
                              {article.category || 'Institucional'}
                              <span aria-hidden="true">•</span>
                              {formatNewsDate(article.publishedAt ?? article.createdAt)}
                            </p>

                            <h3>
                              <Link href={articleHref(article)}>{article.title}</Link>
                            </h3>

                            <p className={styles.summary}>{article.summary}</p>

                            <Link
                              href={articleHref(article)}
                              className={styles.readMore}
                              aria-label={`Ler notícia completa: ${article.title}`}
                            >
                              Ler notícia
                              <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <div className={styles.emptyState} role="status">
                <p className={styles.eyebrow}>Notícias</p>
                <h2>Nenhuma notícia disponível</h2>
                <p>
                  Não foi possível carregar as notícias neste momento ou ainda não existem
                  publicações disponíveis.
                </p>
                <Link className={styles.primaryButton} href="/">
                  Voltar ao início
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
