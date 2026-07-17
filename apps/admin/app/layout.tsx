import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Administração | Ceasaminas' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
