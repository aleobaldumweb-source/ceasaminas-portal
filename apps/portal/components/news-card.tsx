import Link from 'next/link';

import type { NewsArticle } from '@/lib/news';
import { formatNewsDate } from '@/lib/news';

import { NewsMedia } from './news-media';
import styles from './news-card.module.css';

type NewsCardProps = {
  article: NewsArticle;
  priority?: boolean;
};

export function NewsCard({ article, priority = false }: NewsCardProps) {
  const href = `/noticias/${article.slug}`;

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.mediaLink} aria-label={`Ler notícia: ${article.title}`}>
        <NewsMedia src={article.imageUrl} alt={article.title} priority={priority} variant="card" />
      </Link>

      <div className={styles.body}>
        <p className={styles.meta}>
          {article.category || 'Institucional'}
          <span aria-hidden="true">•</span>
          {formatNewsDate(article.publishedAt ?? article.createdAt)}
        </p>

        <h3>
          <Link href={href}>{article.title}</Link>
        </h3>

        <p className={styles.summary}>{article.summary}</p>

        <Link
          href={href}
          className={styles.readMore}
          aria-label={`Ler notícia completa: ${article.title}`}
        >
          Ler notícia
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
