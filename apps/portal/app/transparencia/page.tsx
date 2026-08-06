import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Transparência' };
const items = [
  {
    title: 'Receitas e despesas',
    description: 'Consulte receitas, despesas mensais e a execução financeira da empresa.',
    href: 'https://www.transparencia.ceasaminas.com.br/menu/receitas-e-despesas',
  },
  {
    title: 'Contratos e convênios',
    description: 'Acesse os contratos firmados e os respectivos instrumentos públicos.',
    href: 'https://www.transparencia.ceasaminas.com.br/conteudos/contratos',
  },
  {
    title: 'Governança corporativa',
    description: 'Veja as cartas anuais de políticas públicas e governança corporativa.',
    href: 'https://www.transparencia.ceasaminas.com.br/conteudos/carta-anual-de-politicas-publicas-e-governanca-corporativa',
  },
  {
    title: 'Acesso à informação',
    description: 'Conheça o Portal da Transparência e os canais oficiais de atendimento.',
    href: 'https://www.transparencia.ceasaminas.com.br/conteudos/o-que-e-o-portal',
  },
  {
    title: 'Relatórios de gestão',
    description: 'Consulte relatórios de gestão, prestações de contas e responsáveis.',
    href: 'https://www.transparencia.ceasaminas.com.br/conteudos/transparencia-e-prestacao-de-contas-relatorio-de-gestao',
  },
  {
    title: 'Demonstrações financeiras',
    description: 'Acesse demonstrações financeiras e documentos contábeis periódicos.',
    href: 'https://www.transparencia.ceasaminas.com.br/conteudos/ct-demonstracoes-financeiras-trimestrais',
  },
];
export default function TransparenciaPage() {
  return (
    <PageShell
      eyebrow="Transparência pública"
      title="Informação institucional reunida em um único lugar."
      description="Acesso direto a documentos, dados, governança e canais de controle social."
    >
      <section className="section container transparency-grid">
        {items.map((item, index) => (
          <Link href={item.href} key={item.href} target="_blank" rel="noopener noreferrer">
            <span>0{index + 1}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <strong>Acessar portal oficial ↗</strong>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
