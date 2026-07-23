interface NewsImageProps {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}

function normalizeNewsImage(src: string | null) {
  if (!src?.trim()) {
    return null;
  }

  const normalizedSrc = src.trim();

  if (normalizedSrc.startsWith('/uploads/')) {
    const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3333';

    return `${apiOrigin.replace(/\/+$/, '')}${normalizedSrc}`;
  }

  return normalizedSrc;
}

export function NewsImage({ src, alt, className = '' }: NewsImageProps) {
  const imageUrl = normalizeNewsImage(src);

  if (!imageUrl) {
    return (
      <div
        className={`news-image-placeholder ${className}`.trim()}
        role="img"
        aria-label={`Imagem não disponível para: ${alt}`}
      >
        <span>Ceasaminas</span>
      </div>
    );
  }

  return (
    <div className={`news-image-wrapper ${className}`.trim()}>
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          minHeight: '220px',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
