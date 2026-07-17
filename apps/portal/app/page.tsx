import Link from 'next/link';
import { Header } from '@/components/header';

const metrics = [
  { value: '120+', label: 'produtos monitorados' },
  { value: '6', label: 'unidades em Minas Gerais' },
  { value: '24h', label: 'informação de mercado' },
  { value: '100%', label: 'compromisso com transparência' }
];

const services = [
  ['Mercado hoje', 'Cotações, históricos e tendências dos principais produtos.', '#mercado'],
  ['Licitações', 'Editais, avisos, anexos e acompanhamento dos processos.', '#licitacoes'],
  ['Transparência', 'Contratos, despesas, receitas e dados abertos em um só lugar.', '#transparencia']
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Ceasaminas Digital</p>
            <h1 id="hero-title">Abastecimento, inteligência de mercado e serviço público.</h1>
            <p className="hero-lead">
              Um novo portal para conectar produtores, comerciantes, empresas e cidadãos com dados claros,
              serviços rápidos e transparência.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#mercado">Consultar mercado</Link>
              <Link className="button button-secondary" href="#transparencia">Acessar transparência</Link>
            </div>
          </div>
          <aside className="hero-panel" aria-label="Acesso rápido">
            <p>Atualização do portal</p>
            <strong>Protótipo local — Sprint 0.1</strong>
            <span>Base visual, infraestrutura e API inicial.</span>
          </aside>
        </section>

        <section className="metrics" aria-label="Indicadores em destaque">
          {metrics.map((metric) => (
            <article key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </section>

        <section className="section" id="mercado">
          <div className="section-heading">
            <p className="eyebrow">Serviços essenciais</p>
            <h2>Encontre rapidamente o que precisa</h2>
          </div>
          <div className="service-grid">
            {services.map(([title, description, href], index) => (
              <article className="service-card" id={href.slice(1)} key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={href}>Explorar serviço <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="editorial" id="noticias">
          <div>
            <p className="eyebrow">Informação pública</p>
            <h2>Notícias e comunicados com hierarquia editorial clara.</h2>
          </div>
          <p>
            Esta primeira versão aplica navegação institucional, tipografia editorial e acessibilidade como base.
            O CMS, as notícias reais e os filtros serão conectados nas próximas sprints.
          </p>
        </section>
      </main>
      <footer id="contato">
        <p>Ceasaminas Digital — ambiente local de desenvolvimento.</p>
      </footer>
    </>
  );
}
