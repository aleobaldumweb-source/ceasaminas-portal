import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
export const metadata: Metadata = { title: 'Mercado' };
const rows = [
  ['Tomate', 'kg', 'R$ 3,00', 'Estável'],
  ['Banana-prata', 'kg', 'R$ 3,75', 'Alta'],
  ['Batata', 'kg', 'R$ 2,80', 'Baixa'],
  ['Cenoura', 'kg', 'R$ 3,75', 'Estável'],
  ['Laranja', 'kg', 'R$ 1,75', 'Alta'],
];
export default function MercadoPage() {
  return (
    <PageShell
      eyebrow="Inteligência de mercado"
      title="Preços, tendências e referências para o abastecimento."
      description="Painel demonstrativo preparado para integração com as bases oficiais da Ceasaminas."
    >
      <section className="section container">
        <div className="filter-bar">
          <label>
            Unidade
            <select defaultValue="Contagem">
              <option>Contagem</option>
              <option>Uberlândia</option>
              <option>Juiz de Fora</option>
            </select>
          </label>
          <label>
            Categoria
            <select defaultValue="Hortifrúti">
              <option>Hortifrúti</option>
              <option>Frutas</option>
              <option>Verduras</option>
            </select>
          </label>
          <button type="button">Atualizar consulta</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Unidade</th>
                <th>Preço comum</th>
                <th>Tendência</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="data-note">
          Dados ilustrativos. A publicação final deverá consumir a API oficial de cotações.
        </p>
      </section>
    </PageShell>
  );
}
