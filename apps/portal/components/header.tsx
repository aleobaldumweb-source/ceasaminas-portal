import Image from 'next/image';
import Link from 'next/link';

const navigation = [
  ['Institucional', '/institucional'],
  ['Mercado', '/mercado'],
  ['Licitações', '/licitacoes'],
  ['Transparência', '/transparencia'],
  ['Notícias', '/noticias'],
  ['Contato', '/contato'],
] as const;

export function Header() {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <div className="utility-bar">
          <div className="container utility-inner">
            <span>Centrais de Abastecimento de Minas Gerais S.A.</span>
            <div>
              <Link href="/transparencia">Acesso à informação</Link>
              <Link href="/contato">Ouvidoria</Link>
            </div>
          </div>
        </div>
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="Página inicial da Ceasaminas">
            <Image
              src="/brand/ceasaminas-logo.png"
              alt="Ceasaminas — Centrais de Abastecimento"
              width={180}
              height={64}
              priority
            />
          </Link>
          <nav aria-label="Navegação principal">
            <ul>
              {navigation.map(([label, href]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link className="header-search" href="/noticias" aria-label="Pesquisar no portal">
            Pesquisar
          </Link>
        </div>
      </header>
    </>
  );
}
