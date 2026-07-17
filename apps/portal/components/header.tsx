import Image from 'next/image';
import Link from 'next/link';

const navigation = [
  ['Institucional', '#institucional'],
  ['Mercado', '#mercado'],
  ['Licitações', '#licitacoes'],
  ['Transparência', '#transparencia'],
  ['Notícias', '#noticias'],
  ['Contato', '#contato']
] as const;

export function Header() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <div className="header-inner">
        <Link href="/" aria-label="Página inicial da Ceasaminas" className="brand">
          <Image
            src="/brand/ceasaminas-logo.png"
            alt="Ceasaminas — Centrais de Abastecimento"
            width={238}
            height={154}
            priority
          />
        </Link>
        <nav aria-label="Navegação principal">
          <ul>
            {navigation.map(([label, href]) => (
              <li key={label}><Link href={href}>{label}</Link></li>
            ))}
          </ul>
        </nav>
        <Link className="header-search" href="#busca">Pesquisar</Link>
      </div>
    </header>
  );
}
