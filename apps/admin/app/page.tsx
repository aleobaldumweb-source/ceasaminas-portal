const modules = ['Notícias', 'Licitações', 'Mercado', 'Transparência', 'Usuários', 'Auditoria'];
export default function AdminHome() {
  return (
    <main>
      <aside><strong>CEASAMINAS</strong><span>Administração</span></aside>
      <section>
        <p>Ambiente local</p>
        <h1>Painel administrativo</h1>
        <div>{modules.map((module) => <article key={module}><h2>{module}</h2><p>Módulo planejado para as próximas sprints.</p></article>)}</div>
      </section>
    </main>
  );
}
