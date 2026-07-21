/*
No componente AdminShell, importe:
  import { useAuth } from './auth-provider';

Dentro do componente:
  const { user, logout } = useAuth();

Adicione nas ações do cabeçalho:
*/

<div className="user-menu">
  <div className="user-menu-copy">
    <strong>{user?.name}</strong>
    <small>{user?.role}</small>
  </div>
  <button className="button button-secondary" onClick={() => void logout()} type="button">
    Sair
  </button>
</div>;
