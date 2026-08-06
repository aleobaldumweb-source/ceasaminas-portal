import Link from 'next/link';
import type { UserRole } from '../lib/auth-types';

type AdminSection = 'overview' | 'market' | 'procurements' | 'users';

type AdminSidebarProps = {
  active: AdminSection;
  role?: UserRole;
};

export function AdminSidebar({ active, role }: AdminSidebarProps) {
  return (
    <aside>
      <div className="brand">
        <b>CEASAMINAS</b>
        <span>Administração</span>
      </div>
      <nav aria-label="Navegação administrativa">
        <Link
          aria-current={active === 'overview' ? 'page' : undefined}
          className={active === 'overview' ? 'active' : undefined}
          href="/#dashboard"
        >
          Visão geral
        </Link>
        <Link href="/#editor">Notícias</Link>
        <Link
          aria-current={active === 'market' ? 'page' : undefined}
          className={active === 'market' ? 'active' : undefined}
          href="/market"
        >
          Mercado
        </Link>
        <Link
          aria-current={active === 'procurements' ? 'page' : undefined}
          className={active === 'procurements' ? 'active' : undefined}
          href="/procurements"
        >
          Licitações
        </Link>
        {role === 'ADMIN' && (
          <Link
            aria-current={active === 'users' ? 'page' : undefined}
            className={active === 'users' ? 'active' : undefined}
            href="/users"
          >
            Usuários
          </Link>
        )}
        <span aria-disabled="true">
          Transparência <small>Em breve</small>
        </span>
      </nav>
      <footer>● Ambiente administrativo</footer>
    </aside>
  );
}
