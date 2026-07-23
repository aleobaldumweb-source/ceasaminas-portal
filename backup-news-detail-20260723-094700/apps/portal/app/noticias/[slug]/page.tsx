import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { ApiRequestError, formatNewsDate, getPublishedNewsBySlug } from '@/lib/news';

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

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await loadArticle(slug);

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

  return (
    <>
      <Header />

      <main id="conteudo">
        <article className="article-page">
          <header className="article-header">
            <div className="container article-container">
              <nav className="breadcrumb" aria-label="Navegação estrutural">
                <Link href="/">Início</Link>
                <span aria-hidden="true">/</span>
                <Link href="/noticias">Notícias</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{article.title}</span>
              </nav>

              <p className="eyebrow">Institucional</p>
              <h1>{article.title}</h1>

              <p className="article-summary">{article.summary}</p>

              <div className="article-meta">
                <span>Publicado em {formatNewsDate(article.publishedAt)}</span>

                <span>Atualizado em {formatNewsDate(article.updatedAt)}</span>
              </div>
            </div>
          </header>

          <div className="container article-container article-body">
            {article.content
              .split(/\r?\n/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={`${article.id}-${index}`}>{paragraph}</p>
              ))}

            <div className="article-footer">
              <Link className="button button-secondary" href="/noticias">
                ← Voltar para notícias
              </Link>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
