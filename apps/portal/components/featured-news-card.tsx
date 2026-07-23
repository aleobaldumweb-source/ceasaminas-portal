import Link from 'next/link';

import type { NewsArticle } from '@/lib/news';
import { formatNewsDate } from '@/lib/news';

import { NewsMedia } from './news-media';
import styles from './featured-news-card.module.css';

type FeaturedNewsCardProps = {
  article: NewsArticle;
};

export function FeaturedNewsCard({ article }: FeaturedNewsCardProps) {
  const href = `/noticias/${article.slug}`;

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.mediaLink} aria-label={`Ler notícia: ${article.title}`}>
        <NewsMedia src={article.imageUrl} alt={article.title} priority variant="featured" />
      </Link>

      <div className={styles.body}>
        <p className={styles.meta}>
          {article.category || 'Institucional'}
          <span aria-hidden="true">•</span>
          {formatNewsDate(article.publishedAt ?? article.createdAt)}
        </p>

        <h2>
          <Link href={href}>{article.title}</Link>
        </h2>

        <p className={styles.summary}>{article.summary}</p>

        <Link href={href} className={styles.button}>
          Ler notícia completa
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
