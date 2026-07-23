import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { formatNewsDate, getPublishedNews, type NewsArticle } from '@/lib/news';

import styles from './pesquisa.module.css';

export const metadata: Metadata = {
  title: 'Pesquisa',
  description: 'Pesquise notícias, serviços e páginas do portal Ceasaminas.',
};

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}

type SearchResult = {
  id: string;
  type: 'Notícia' | 'Serviço' | 'Página';
  title: string;
  description: string;
  href: string;
  date?: string;
  keywords: string[];
};

const portalEntries: SearchResult[] = [
  {
    id: 'page-institucional',
    type: 'Página',
    title: 'Institucional',
    description:
      'Conheça a Ceasaminas, sua atuação, estrutura, unidades e compromisso com Minas Gerais.',
    href: '/institucional',
    keywords: ['empresa', 'história', 'governança', 'unidades', 'instituição'],
  },
  {
    id: 'service-market',
    type: 'Serviço',
    title: 'Mercado e cotações',
    description:
      'Consulte referências de mercado, produtos acompanhados e informações para tomada de decisão.',
    href: '/mercado',
    keywords: ['preços', 'cotação', 'produtos', 'mercado', 'abastecimento'],
  },
  {
    id: 'service-bids',
    type: 'Serviço',
    title: 'Licitações',
    description: 'Acompanhe editais, avisos, anexos, resultados e processos públicos.',
    href: '/licitacoes',
    keywords: ['edital', 'pregão', 'contratação', 'processo', 'compras'],
  },
  {
    id: 'service-transparency',
    type: 'Serviço',
    title: 'Transparência',
    description:
      'Acesse contratos, despesas, governança, dados públicos e informações institucionais.',
    href: '/transparencia',
    keywords: ['lai', 'contratos', 'despesas', 'dados públicos', 'governança'],
  },
  {
    id: 'page-news',
    type: 'Página',
    title: 'Notícias e comunicados',
    description: 'Acompanhe publicações institucionais, projetos e ações regionais da Ceasaminas.',
    href: '/noticias',
    keywords: ['imprensa', 'comunicados', 'publicações', 'informação'],
  },
  {
    id: 'page-contact',
    type: 'Página',
    title: 'Contato e Ouvidoria',
    description: 'Encontre canais de atendimento, orientações e formas de falar com a Ceasaminas.',
    href: '/contato',
    keywords: ['telefone', 'ouvidoria', 'atendimento', 'mensagem', 'contato'],
  },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function scoreResult(result: SearchResult, terms: string[]) {
  const normalizedTitle = normalize(result.title);
  const normalizedDescription = normalize(result.description);
  const normalizedKeywords = result.keywords.map(normalize);

  return terms.reduce((score, term) => {
    if (normalizedTitle === term) return score + 20;
    if (normalizedTitle.startsWith(term)) return score + 12;
    if (normalizedTitle.includes(term)) return score + 8;
    if (normalizedKeywords.some((keyword) => keyword.includes(term))) return score + 5;
    if (normalizedDescription.includes(term)) return score + 3;
    return score;
  }, 0);
}

function newsToResult(article: NewsArticle): SearchResult {
  return {
    id: article.id,
    type: 'Notícia',
    title: article.title,
    description: article.summary,
    href: `/noticias/${article.slug}`,
    date: formatNewsDate(article.publishedAt ?? article.createdAt),
    keywords: [article.category || 'Institucional', article.content, article.slug],
  };
}

async function loadNewsResults() {
  try {
    const news = await getPublishedNews();
    return news.map(newsToResult);
  } catch (error) {
    console.error('Não foi possível carregar notícias para pesquisa:', error);
    return [];
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawQuery = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;

  const query = rawQuery?.trim() ?? '';
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const newsResults = await loadNewsResults();

  const results =
    terms.length === 0
      ? []
      : [...portalEntries, ...newsResults]
          .map((result) => ({
            result,
            score: scoreResult(result, terms),
          }))
          .filter(({ score }) => score > 0)
          .sort((left, right) => {
            if (left.score !== right.score) {
              return right.score - left.score;
            }

            return left.result.title.localeCompare(right.result.title, 'pt-BR');
          })
          .map(({ result }) => result);

  return (
    <>
      <Header />

      <main id="conteudo" className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Navegação estrutural">
              <Link href="/">Início</Link>
              <span aria-hidden="true">/</span>
              <span>Pesquisa</span>
            </nav>

            <p className={styles.eyebrow}>Busca global</p>
            <h1>Encontre informações no portal.</h1>

            <form className={styles.searchForm} action="/pesquisa" method="get">
              <label className={styles.visuallyHidden} htmlFor="portal-search">
                Digite o que deseja encontrar
              </label>

              <input
                id="portal-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Ex.: licitação, banana, transparência..."
                autoComplete="off"
                autoFocus
              />

              <button type="submit">
                Pesquisar
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <p className={styles.hint}>Pesquise em notícias, serviços e páginas institucionais.</p>
          </div>
        </section>

        <section className={styles.resultsSection}>
          <div className={styles.container}>
            {query ? (
              <header className={styles.resultsHeader}>
                <div>
                  <p className={styles.eyebrow}>Resultados</p>
                  <h2>
                    {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para “
                    {query}”
                  </h2>
                </div>

                <Link href="/pesquisa">Limpar pesquisa</Link>
              </header>
            ) : (
              <div className={styles.intro}>
                <p className={styles.eyebrow}>Comece sua pesquisa</p>
                <h2>O que você procura?</h2>
                <p>
                  Use palavras relacionadas ao conteúdo desejado, como produto, unidade, edital,
                  contrato, notícia ou serviço.
                </p>

                <div className={styles.suggestions}>
                  {['Licitações', 'Transparência', 'Mercado', 'Notícias', 'Contato'].map(
                    (suggestion) => (
                      <Link key={suggestion} href={`/pesquisa?q=${encodeURIComponent(suggestion)}`}>
                        {suggestion}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            )}

            {query && results.length > 0 ? (
              <div className={styles.resultsList}>
                {results.map((result) => (
                  <article className={styles.resultCard} key={result.id}>
                    <div className={styles.resultTopline}>
                      <span>{result.type}</span>
                      {result.date ? <time>{result.date}</time> : null}
                    </div>

                    <h3>
                      <Link href={result.href}>{result.title}</Link>
                    </h3>

                    <p>{result.description}</p>

                    <Link className={styles.resultLink} href={result.href}>
                      Acessar conteúdo
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}

            {query && results.length === 0 ? (
              <div className={styles.emptyState} role="status">
                <span aria-hidden="true">?</span>
                <h2>Nenhum resultado encontrado</h2>
                <p>
                  Verifique a escrita, tente termos mais curtos ou pesquise por uma categoria mais
                  ampla.
                </p>

                <div className={styles.suggestions}>
                  <Link href="/pesquisa?q=mercado">Mercado</Link>
                  <Link href="/pesquisa?q=licitacoes">Licitações</Link>
                  <Link href="/pesquisa?q=noticias">Notícias</Link>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
