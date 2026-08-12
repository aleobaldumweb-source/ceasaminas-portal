import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Transparência' };
type TransparencyItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
};
async function getItems(): Promise<TransparencyItem[]> {
  const base = (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3333/api/v1'
  ).replace(/\/+$/, '');
  const response = await fetch(`${base}/transparency`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar os itens de transparência.');
  return response.json() as Promise<TransparencyItem[]>;
}
export default async function TransparenciaPage() {
  let items: TransparencyItem[] = [];
  let unavailable = false;
  try {
    items = await getItems();
  } catch {
    unavailable = true;
  }
  return (
    <PageShell
      eyebrow="Transparência pública"
      title="Informação institucional reunida em um único lugar."
      description="Acesso direto a documentos, dados, governança e canais de controle social."
    >
      <section className="section container transparency-grid" aria-live="polite">
        {unavailable && (
          <p role="alert">
            Os conteúdos de transparência estão temporariamente indisponíveis. Tente novamente mais
            tarde.
          </p>
        )}
        {!unavailable && items.length === 0 && (
          <p>Nenhum conteúdo de transparência foi publicado.</p>
        )}
        {items.map((item, index) => (
          <Link href={item.url} key={item.id} target="_blank" rel="noopener noreferrer">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <strong>Acessar portal oficial ↗</strong>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
