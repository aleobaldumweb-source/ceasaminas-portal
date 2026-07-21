import type { Metadata } from 'next';
import { AuthGate } from '../components/auth-gate';
import { AuthProvider } from '../components/auth-provider';
import './styles.css';
import './auth.css';

export const metadata: Metadata = {
  title: {
    default: 'Administração | Ceasaminas',
    template: '%s | Ceasaminas Admin',
  },
  description: 'Painel administrativo da Ceasaminas.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
