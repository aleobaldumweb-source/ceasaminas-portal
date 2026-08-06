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
        <a className={active === 'overview' ? 'active' : undefined} href="/#dashboard">
          Visão geral
        </a>
        <a href="/#editor">Notícias</a>
        <a className={active === 'market' ? 'active' : undefined} href="/market">
          Mercado
        </a>
        <a className={active === 'procurements' ? 'active' : undefined} href="/procurements">
          Licitações
        </a>
        {role === 'ADMIN' && (
          <a className={active === 'users' ? 'active' : undefined} href="/users">
            Usuários
          </a>
        )}
        <span>
          Transparência <small>Em breve</small>
        </span>
      </nav>
      <footer>● Ambiente administrativo</footer>
    </aside>
  );
}
