import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Licitações' };
const notices = [
  {
    number: '001/2026',
    title: 'Contratação de serviços de tecnologia',
    status: 'Aberta',
    date: '31/07/2026',
  },
  {
    number: '018/2026',
    title: 'Aquisição de materiais operacionais',
    status: 'Em análise',
    date: '25/07/2026',
  },
  {
    number: '014/2026',
    title: 'Manutenção preventiva de instalações',
    status: 'Encerrada',
    date: '12/07/2026',
  },
];
export default function LicitacoesPage() {
  return (
    <PageShell
      eyebrow="Compras públicas"
      title="Licitações organizadas, pesquisáveis e acessíveis."
      description="Consulte processos, editais, anexos, resultados e atualizações."
    >
      <section className="section container">
        <div className="list-toolbar">
          <input aria-label="Pesquisar licitações" placeholder="Pesquisar por número ou objeto" />
          <select aria-label="Filtrar por situação" defaultValue="Todas">
            <option>Todas</option>
            <option>Aberta</option>
            <option>Em análise</option>
            <option>Encerrada</option>
          </select>
        </div>
        <div className="notice-list">
          {notices.map((notice) => (
            <article key={notice.number}>
              <div>
                <span className="status">{notice.status}</span>
                <p>{notice.number}</p>
                <h2>{notice.title}</h2>
              </div>
              <div>
                <span>Prazo</span>
                <strong>{notice.date}</strong>
                <a href="#documentos">Ver documentos →</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
