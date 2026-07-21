import Link from 'next/link';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export default function NotFound() {
  return (
    <>
      <Header />

      <main id="conteudo">
        <section className="not-found-page">
          <div className="container">
            <p className="eyebrow">Erro 404</p>
            <h1>Notícia não encontrada</h1>

            <p>
              A notícia pode ter sido removida, arquivada ou o endereço informado pode estar
              incorreto.
            </p>

            <div className="hero-actions">
              <Link className="button button-primary" href="/noticias">
                Ver todas as notícias
              </Link>

              <Link className="button button-secondary" href="/">
                Voltar ao início
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
