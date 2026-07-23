import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsCard } from '@/components/news-card';
import { NewsMedia } from '@/components/news-media';
import {
  ApiRequestError,
  formatNewsDate,
  getPublishedNews,
  getPublishedNewsBySlug,
  type NewsArticle,
} from '@/lib/news';

import styles from './article.module.css';

export const dynamic = 'force-dynamic';

interface NewsDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function loadArticle(slug: string) {
  try {
    return await getPublishedNewsBySlug(slug);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

async function loadRelated(article: NewsArticle) {
  try {
    const allNews = await getPublishedNews();

    return allNews
      .filter((item) => item.id !== article.id)
      .sort((left, right) => {
        const leftCategory = left.category === article.category ? 1 : 0;
        const rightCategory = right.category === article.category ? 1 : 0;

        if (leftCategory !== rightCategory) {
          return rightCategory - leftCategory;
        }

        const leftDate = new Date(left.publishedAt ?? left.createdAt).getTime();
        const rightDate = new Date(right.publishedAt ?? right.createdAt).getTime();

        return rightDate - leftDate;
      })
      .slice(0, 3);
  } catch (error) {
    console.error('Não foi possível carregar notícias relacionadas:', error);
    return [];
  }
}

function getAbsoluteImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3333';

  return `${apiOrigin.replace(/\/+$/, '')}/${imageUrl.replace(/^\/+/, '')}`;
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await loadArticle(slug);
    const imageUrl = getAbsoluteImageUrl(article.imageUrl);

    return {
      title: article.title,
      description: article.summary,
      alternates: {
        canonical: `/noticias/${article.slug}`,
      },
      openGraph: {
        type: 'article',
        title: article.title,
        description: article.summary,
        publishedTime: article.publishedAt ?? undefined,
        modifiedTime: article.updatedAt,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                alt: article.title,
              },
            ]
          : undefined,
      },
    };
  } catch {
    return {
      title: 'Notícia',
      description: 'Notícia institucional da Ceasaminas.',
    };
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  const relatedArticles = await loadRelated(article);

  const paragraphs = article.content
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <>
      <Header />

      <main id="conteudo" className={styles.page}>
        <article>
          <header className={styles.header}>
            <div className={styles.container}>
              <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
                <Link href="/">Início</Link>
                <span aria-hidden="true">/</span>
                <Link href="/noticias">Notícias</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{article.title}</span>
              </nav>

              <p className={styles.eyebrow}>{article.category || 'Institucional'}</p>

              <h1>{article.title}</h1>

              <p className={styles.summary}>{article.summary}</p>

              <div className={styles.meta}>
                <span>Publicado em {formatNewsDate(article.publishedAt ?? article.createdAt)}</span>
                <span>Atualizado em {formatNewsDate(article.updatedAt)}</span>
              </div>
            </div>
          </header>

          <div className={styles.heroMedia}>
            <NewsMedia src={article.imageUrl} alt={article.title} priority variant="featured" />
          </div>

          <div className={styles.articleLayout}>
            <aside className={styles.aside} aria-label="Informações da publicação">
              <div className={styles.asideCard}>
                <span className={styles.asideLabel}>Categoria</span>
                <strong>{article.category || 'Institucional'}</strong>
              </div>

              <div className={styles.asideCard}>
                <span className={styles.asideLabel}>Compartilhar</span>
                <a
                  href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(
                    `Leia esta notícia da Ceasaminas: /noticias/${article.slug}`,
                  )}`}
                >
                  Enviar por e-mail
                </a>
              </div>
            </aside>

            <div className={styles.body}>
              {paragraphs.map((paragraph, index) => (
                <p key={`${article.id}-${index}`}>{paragraph}</p>
              ))}

              {article.sourceUrl ? (
                <div className={styles.sourceBox}>
                  <strong>Fonte oficial</strong>
                  <p>Esta publicação possui conteúdo complementar no endereço original.</p>
                  <a href={article.sourceUrl} target="_blank" rel="noreferrer">
                    Acessar publicação oficial
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              ) : null}

              <div className={styles.articleFooter}>
                <Link href="/noticias">← Voltar para notícias</Link>
              </div>
            </div>
          </div>
        </article>

        {relatedArticles.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-title">
            <div className={styles.container}>
              <header className={styles.relatedHeader}>
                <div>
                  <p className={styles.eyebrow}>Continue acompanhando</p>
                  <h2 id="related-title">Notícias relacionadas</h2>
                </div>

                <Link href="/noticias">Ver todas as notícias →</Link>
              </header>

              <div className={styles.relatedGrid}>
                {relatedArticles.map((related, index) => (
                  <NewsCard article={related} priority={index === 0} key={related.id} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
