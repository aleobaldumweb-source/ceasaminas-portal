import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/page-shell';

import styles from './institucional.module.css';

export const metadata: Metadata = {
  title: 'Institucional',
  description:
    'Conheça o propósito público, a rede de unidades, os princípios de atuação e a governança da Ceasaminas.',
};

const principles = [
  {
    number: '01',
    title: 'Interesse público',
    description:
      'Serviços e infraestrutura orientados ao abastecimento, à segurança alimentar e ao desenvolvimento regional.',
  },
  {
    number: '02',
    title: 'Eficiência',
    description:
      'Gestão responsável de recursos, processos claros e melhoria contínua da experiência dos públicos atendidos.',
  },
  {
    number: '03',
    title: 'Integridade',
    description:
      'Governança, transparência e responsabilidade como fundamentos das decisões institucionais.',
  },
] as const;

const units = [
  'Contagem',
  'Barbacena',
  'Caratinga',
  'Governador Valadares',
  'Juiz de Fora',
  'Uberlândia',
] as const;

const publicLinks = [
  {
    title: 'Transparência',
    description: 'Governança, contratos, despesas e acesso à informação.',
    href: '/transparencia',
  },
  {
    title: 'Licitações',
    description: 'Editais, avisos, documentos e resultados dos processos públicos.',
    href: '/licitacoes',
  },
  {
    title: 'Fale conosco',
    description: 'Canais de atendimento para cidadãos, empresas e parceiros.',
    href: '/contato',
  },
] as const;

export default function InstitucionalPage() {
  return (
    <PageShell
      eyebrow="Institucional"
      title="Uma empresa pública conectada ao abastecimento de Minas Gerais."
      description="Conheça o propósito, a presença regional e os compromissos que orientam a atuação da Ceasaminas."
    >
      <section className={styles.introduction} aria-labelledby="proposito-title">
        <div className={`container ${styles.introductionGrid}`}>
          <div>
            <p className={styles.eyebrow}>Propósito público</p>
            <h2 id="proposito-title">Conectar produção, comércio e consumo.</h2>
          </div>

          <div className={styles.introductionCopy}>
            <p>
              A Ceasaminas oferece infraestrutura, informação e serviços para fortalecer a
              comercialização e contribuir com o abastecimento alimentar em Minas Gerais.
            </p>
            <p>
              Sua rede aproxima produtores, comerciantes, empresas, trabalhadores e consumidores,
              apoiando relações de mercado mais eficientes e o acesso a alimentos.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principios-title">
        <div className="container">
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Como atuamos</p>
              <h2 id="principios-title">Princípios que orientam cada decisão.</h2>
            </div>
            <p>
              Compromissos institucionais traduzidos em serviços públicos mais claros, acessíveis e
              confiáveis.
            </p>
          </header>

          <div className={styles.principlesGrid}>
            {principles.map((principle) => (
              <article key={principle.number}>
                <span>{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.network} aria-labelledby="rede-title">
        <div className={`container ${styles.networkGrid}`}>
          <div className={styles.networkCopy}>
            <p className={styles.eyebrow}>Presença regional</p>
            <h2 id="rede-title">Uma rede com seis unidades em Minas Gerais.</h2>
            <p>
              A atuação regional amplia o acesso à infraestrutura de comercialização e conecta
              diferentes cadeias de abastecimento em todo o estado.
            </p>
            <Link href="/mercado">
              Consultar inteligência de mercado <span aria-hidden="true">→</span>
            </Link>
          </div>

          <ol className={styles.unitList} aria-label="Unidades da Ceasaminas">
            {units.map((unit, index) => (
              <li key={unit}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{unit}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.governance} aria-labelledby="governanca-title">
        <div className="container">
          <header className={styles.governanceHeader}>
            <div>
              <p className={styles.eyebrow}>Governança e acesso</p>
              <h2 id="governanca-title">Informação pública ao alcance de todos.</h2>
            </div>
            <p>
              Acesse documentos, processos e canais que fortalecem a transparência e o diálogo com a
              sociedade.
            </p>
          </header>

          <div className={styles.publicLinks}>
            {publicLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
