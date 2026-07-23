import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { SearchBox } from '@/components/search-box';
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
    tipo?: string | string[];
    ordem?: string | string[];
    pagina?: string | string[];
  }>;
}

type SearchResultType = 'Notícia' | 'Serviço' | 'Página';

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  href: string;
  date?: string;
  timestamp?: number;
  keywords: string[];
};

const PAGE_SIZE = 8;

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

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
  const dateValue = article.publishedAt ?? article.createdAt;

  return {
    id: article.id,
    type: 'Notícia',
    title: article.title,
    description: article.summary,
    href: `/noticias/${article.slug}`,
    date: formatNewsDate(dateValue),
    timestamp: new Date(dateValue).getTime(),
    keywords: [article.category || 'Institucional', article.content, article.slug],
  };
}

function buildSearchHref({
  query,
  type,
  order,
  page,
}: {
  query: string;
  type: string;
  order: string;
  page: number;
}) {
  const params = new URLSearchParams();

  if (query) params.set('q', query);
  if (type && type !== 'todos') params.set('tipo', type);
  if (order && order !== 'relevancia') params.set('ordem', order);
  if (page > 1) params.set('pagina', String(page));

  const search = params.toString();
  return search ? `/pesquisa?${search}` : '/pesquisa';
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
  const resolved = await searchParams;

  const query = getSingleParam(resolved.q)?.trim() ?? '';
  const selectedType = getSingleParam(resolved.tipo) ?? 'todos';
  const selectedOrder = getSingleParam(resolved.ordem) ?? 'relevancia';
  const requestedPage = Number.parseInt(getSingleParam(resolved.pagina) ?? '1', 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const newsResults = await loadNewsResults();
  const allResults = [...portalEntries, ...newsResults];

  const scoredResults =
    terms.length === 0
      ? []
      : allResults
          .map((result) => ({
            result,
            score: scoreResult(result, terms),
          }))
          .filter(({ score, result }) => {
            const typeMatches =
              selectedType === 'todos' || normalize(result.type) === normalize(selectedType);

            return score > 0 && typeMatches;
          })
          .sort((left, right) => {
            if (selectedOrder === 'recentes') {
              return (right.result.timestamp ?? 0) - (left.result.timestamp ?? 0);
            }

            if (selectedOrder === 'alfabetica') {
              return left.result.title.localeCompare(right.result.title, 'pt-BR');
            }

            if (left.score !== right.score) {
              return right.score - left.score;
            }

            return (right.result.timestamp ?? 0) - (left.result.timestamp ?? 0);
          });

  const totalResults = scoredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const results = scoredResults.slice(pageStart, pageStart + PAGE_SIZE).map(({ result }) => result);

  const suggestions = allResults.map((result) => ({
    title: result.title,
    href: result.href,
    type: result.type,
  }));

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

            <SearchBox initialQuery={query} suggestions={suggestions} />

            <p className={styles.hint}>Pesquise em notícias, serviços e páginas institucionais.</p>
          </div>
        </section>

        <section className={styles.resultsSection}>
          <div className={styles.container}>
            {query ? (
              <>
                <header className={styles.resultsHeader}>
                  <div>
                    <p className={styles.eyebrow}>Resultados</p>
                    <h2>
                      {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'} para “{query}
                      ”
                    </h2>
                  </div>

                  <Link href="/pesquisa">Limpar pesquisa</Link>
                </header>

                <form className={styles.filters} action="/pesquisa" method="get">
                  <input type="hidden" name="q" value={query} />

                  <label>
                    <span>Tipo</span>
                    <select name="tipo" defaultValue={selectedType}>
                      <option value="todos">Todos</option>
                      <option value="noticia">Notícias</option>
                      <option value="servico">Serviços</option>
                      <option value="pagina">Páginas</option>
                    </select>
                  </label>

                  <label>
                    <span>Ordenar</span>
                    <select name="ordem" defaultValue={selectedOrder}>
                      <option value="relevancia">Relevância</option>
                      <option value="recentes">Mais recentes</option>
                      <option value="alfabetica">Ordem alfabética</option>
                    </select>
                  </label>

                  <button type="submit">Aplicar filtros</button>
                </form>
              </>
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
              <>
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

                {totalPages > 1 ? (
                  <nav className={styles.pagination} aria-label="Paginação">
                    <Link
                      aria-disabled={safePage === 1}
                      className={safePage === 1 ? styles.disabled : ''}
                      href={buildSearchHref({
                        query,
                        type: selectedType,
                        order: selectedOrder,
                        page: Math.max(1, safePage - 1),
                      })}
                    >
                      ← Anterior
                    </Link>

                    <span>
                      Página {safePage} de {totalPages}
                    </span>

                    <Link
                      aria-disabled={safePage === totalPages}
                      className={safePage === totalPages ? styles.disabled : ''}
                      href={buildSearchHref({
                        query,
                        type: selectedType,
                        order: selectedOrder,
                        page: Math.min(totalPages, safePage + 1),
                      })}
                    >
                      Próxima →
                    </Link>
                  </nav>
                ) : null}
              </>
            ) : null}

            {query && totalResults === 0 ? (
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
