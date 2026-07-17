import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Contato' };
export default function ContatoPage() {
  return (
    <PageShell
      eyebrow="Atendimento ao cidadão"
      title="Encontre o canal certo para sua solicitação."
      description="Contato geral, ouvidoria, acesso à informação e atendimento das unidades."
    >
      <section className="section container contact-grid">
        <article>
          <h2>Atendimento geral</h2>
          <p>(31) 3399-2050</p>
          <p>Contagem — Minas Gerais</p>
        </article>
        <article>
          <h2>Ouvidoria</h2>
          <p>0800-286-2267</p>
          <p>Manifestações, elogios, denúncias e sugestões.</p>
        </article>
        <article>
          <h2>Acesso à informação</h2>
          <p>sic@ceasaminas.com.br</p>
          <p>Solicitações fundamentadas na legislação de acesso à informação.</p>
        </article>
      </section>
    </PageShell>
  );
}
