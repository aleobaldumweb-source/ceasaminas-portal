import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Transparência' };
const items = [
  'Receitas e despesas',
  'Contratos e convênios',
  'Governança corporativa',
  'Acesso à informação',
  'Relatórios e demonstrações',
  'Dados abertos',
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
          <Link href="#" key={item}>
            <span>0{index + 1}</span>
            <h2>{item}</h2>
            <p>Consultar documentos, séries históricas e informações relacionadas.</p>
            <strong>Acessar →</strong>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
