import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Institucional' };
export default function InstitucionalPage() {
  return (
    <PageShell
      eyebrow="Institucional"
      title="Uma empresa pública conectada ao abastecimento de Minas Gerais."
      description="Conheça a missão, a atuação regional, a governança e a estrutura da Ceasaminas."
    >
      <section className="section container content-grid">
        <article>
          <h2>Missão pública</h2>
          <p>
            Promover infraestrutura, informação e serviços para fortalecer a comercialização e o
            abastecimento alimentar.
          </p>
        </article>
        <article>
          <h2>Atuação regional</h2>
          <p>
            Uma rede de unidades que aproxima produção, comércio e consumo em diferentes regiões do
            estado.
          </p>
        </article>
        <article>
          <h2>Governança</h2>
          <p>
            Gestão orientada por integridade, transparência, eficiência e responsabilidade
            institucional.
          </p>
        </article>
      </section>
    </PageShell>
  );
}
