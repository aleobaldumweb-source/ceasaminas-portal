import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="site-footer" id="contato">
      <div className="container footer-grid">
        <div>
          <Image src="/brand/ceasaminas-logo.png" alt="Ceasaminas" width={160} height={56} />
          <p>Informação pública, abastecimento e inteligência de mercado para Minas Gerais.</p>
        </div>
        <div>
          <strong>Portal</strong>
          <Link href="/institucional">Institucional</Link>
          <Link href="/mercado">Mercado</Link>
          <Link href="/noticias">Notícias</Link>
        </div>
        <div>
          <strong>Serviços públicos</strong>
          <Link href="/licitacoes">Licitações</Link>
          <Link href="/transparencia">Transparência</Link>
          <Link href="/contato">Contato e ouvidoria</Link>
        </div>
        <div>
          <strong>Atendimento geral</strong>
          <span>(31) 3399-2050</span>
          <span>Contagem — Minas Gerais</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Ceasaminas.</span>
        <span>Portal em modernização.</span>
      </div>
    </footer>
  );
}
