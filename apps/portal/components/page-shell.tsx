import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <>
      <Header />
      <main id="conteudo">
        <section className="page-hero">
          <div className="container">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="page-lead">{description}</p>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </>
  );
}
