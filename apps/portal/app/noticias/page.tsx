import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
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

  return (
    <>
      <Header />

      <main id="conteudo">
        <section className="internal-hero">
          <div className="container">
            <nav className="breadcrumb" aria-label="Navegação estrutural">
              <Link href="/">Início</Link>
              <span aria-hidden="true">/</span>
              <span>Notícias</span>
            </nav>

            <p className="eyebrow">Imprensa e comunicação</p>
            <h1>Notícias e comunicados</h1>

            <p className="internal-hero-lead">
              Acompanhe as principais informações institucionais, serviços, projetos e ações da
              Ceasaminas.
            </p>
          </div>
        </section>

        <section className="section container">
          {news.length > 0 ? (
            <div className="news-list">
              {news.map((article) => (
                <article className="news-list-item" key={article.id}>
                  <div>
                    <p className="news-meta">
                      Institucional · {formatNewsDate(article.publishedAt)}
                    </p>

                    <h2>
                      <Link href={`/noticias/${article.slug}`}>{article.title}</Link>
                    </h2>

                    <p>{article.summary}</p>
                  </div>

                  <Link
                    className="news-list-link"
                    href={`/noticias/${article.slug}`}
                    aria-label={`Ler notícia: ${article.title}`}
                  >
                    Ler notícia →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state" role="status">
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
