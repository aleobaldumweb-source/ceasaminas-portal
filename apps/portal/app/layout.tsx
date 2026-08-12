import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: {
    default: 'Ceasaminas | Centrais de Abastecimento de Minas Gerais',
    template: '%s | Ceasaminas',
  },
  description: 'Portal institucional, mercado, licitações e transparência da Ceasaminas.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
