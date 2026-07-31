type Props = {
  total: number;
  open: number;
  drafts: number;
  expiring: number;
};

export function ProcurementMetrics({ total, open, drafts, expiring }: Props) {
  return (
    <section className="metrics procurement-metrics" aria-label="Resumo das licitações">
      <article className="metric-total">
        <span>Total de processos</span>
        <strong>{total}</strong>
        <small>Todos os registros</small>
      </article>
      <article className="metric-open">
        <span>Licitações abertas</span>
        <strong>{open}</strong>
        <small>Disponíveis para participação</small>
      </article>
      <article className="metric-draft">
        <span>Rascunhos</span>
        <strong>{drafts}</strong>
        <small>Ainda não publicados</small>
      </article>
      <article className="metric-expiring">
        <span>Vencem em 7 dias</span>
        <strong>{expiring}</strong>
        <small>Exigem atenção</small>
      </article>
    </section>
  );
}
