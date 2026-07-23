'use client';

import { useState } from 'react';

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

  const value = src.trim();

  if (value.startsWith('/uploads/')) {
    const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3333';

    return `${apiOrigin.replace(/\/+$/, '')}${value}`;
  }

  return value;
}

export function NewsImage({ src, alt, className = '', priority = false }: NewsImageProps) {
  const imageUrl = normalizeNewsImage(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        className={`news-image-placeholder ${className}`.trim()}
        role="img"
        aria-label={`Imagem não disponível para: ${alt}`}
      >
        <span className="news-placeholder-brand">Ceasaminas</span>
        <small>Imagem não disponível</small>
      </div>
    );
  }

  return (
    <div
      className={['news-image-wrapper', loaded ? 'is-loaded' : 'is-loading', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="news-image-skeleton" aria-hidden="true" />

      <img
        src={imageUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="news-image"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
