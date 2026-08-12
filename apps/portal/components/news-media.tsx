'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './news-media.module.css';

type NewsMediaProps = {
  src: string | null;
  alt: string;
  priority?: boolean;
  variant?: 'featured' | 'card';
};

function normalizeImageUrl(src: string | null) {
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

export function NewsMedia({ src, alt, priority = false, variant = 'card' }: NewsMediaProps) {
  const imageUrl = normalizeImageUrl(src);
  const imageRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);

    const image = imageRef.current;

    if (!image?.complete) return;

    if (image.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setFailed(true);
    }
  }, [imageUrl]);

  const rootClass = [
    styles.media,
    variant === 'featured' ? styles.featured : styles.card,
    loaded ? styles.loaded : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!imageUrl || failed) {
    return (
      <div
        className={`${rootClass} ${styles.placeholder}`}
        role="img"
        aria-label={`Imagem não disponível para: ${alt}`}
      >
        <span>Ceasaminas</span>
        <small>Imagem não disponível</small>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <span className={styles.skeleton} aria-hidden="true" />

      <img
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
