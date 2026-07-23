import type { Metadata } from 'next';
import Link from 'next/link';

import { FeaturedNewsCard } from '@/components/featured-news-card';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsCard } from '@/components/news-card';
import { getPublishedNews, type NewsArticle } from '@/lib/news';

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
                <FeaturedNewsCard article={featuredArticle} />

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
                        <NewsCard article={article} priority={index < 2} key={article.id} />
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
