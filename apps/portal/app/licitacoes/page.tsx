import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { ProcurementsList } from './procurements-list';
export const metadata: Metadata = { title: 'Licitações', description: 'Consulte editais, processos, anexos e resultados de licitações da Ceasaminas.' };
const API_URL=process.env.NEXT_PUBLIC_API_URL??'http://localhost:3333/api/v1';
async function getItems(){try{const response=await fetch(`${API_URL}/procurements`,{next:{revalidate:60}});if(!response.ok)return[];return await response.json();}catch{return[];}}
export default async function LicitacoesPage(){const items=await getItems();return <PageShell eyebrow="Compras públicas" title="Licitações organizadas, pesquisáveis e acessíveis." description="Consulte processos, editais, anexos, resultados e atualizações oficiais."><section className="section container"><ProcurementsList items={items}/></section></PageShell>}
