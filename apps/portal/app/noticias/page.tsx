import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Notícias' };
const posts = [
  'Modernização digital amplia acesso aos serviços da Ceasaminas',
  'Novo painel organiza informações de mercado por unidade',
  'Portal de transparência recebe arquitetura de navegação renovada',
  'Rede de unidades fortalece o abastecimento regional',
  'Banco de Alimentos amplia impacto social',
];
export default function NoticiasPage() {
  return (
    <PageShell
      eyebrow="Sala de imprensa"
      title="Notícias, comunicados e informação institucional."
      description="Acompanhe os principais acontecimentos, serviços e iniciativas da Ceasaminas."
    >
      <section className="section container news-list">
        {posts.map((post, index) => (
          <article key={post}>
            <div className="news-index">0{index + 1}</div>
            <div>
              <p className="news-meta">Ceasaminas · julho de 2026</p>
              <h2>{post}</h2>
              <p>Conteúdo editorial demonstrativo preparado para futura integração com o CMS.</p>
              <a href="#">Ler publicação →</a>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
