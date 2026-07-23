'use client';

import { useMemo, useState } from 'react';

import styles from './market-chart.module.css';

type MarketPoint = {
  label: string;
  value: number;
};

type MarketChartProps = {
  title: string;
  unit: string;
  datasets: Record<string, MarketPoint[]>;
};

export function MarketChart({ title, unit, datasets }: MarketChartProps) {
  const products = Object.keys(datasets);
  const [selectedProduct, setSelectedProduct] = useState(products[0] ?? '');

  const points = datasets[selectedProduct] ?? [];

  const chart = useMemo(() => {
    if (points.length === 0) {
      return {
        polyline: '',
        min: 0,
        max: 0,
      };
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);

    const polyline = points
      .map((point, index) => {
        const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
        const y = 92 - ((point.value - min) / range) * 74;

        return `${x},${y}`;
      })
      .join(' ');

    return {
      polyline,
      min,
      max,
    };
  }, [points]);

  return (
    <section className={styles.card} aria-labelledby="market-chart-title">
      <header className={styles.header}>
        <div>
          <p>Histórico recente</p>
          <h2 id="market-chart-title">{title}</h2>
        </div>

        <label>
          <span>Produto</span>
          <select
            value={selectedProduct}
            onChange={(event) => setSelectedProduct(event.target.value)}
          >
            {products.map((product) => (
              <option value={product} key={product}>
                {product}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className={styles.summary}>
        <strong>
          {points.at(-1)?.value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) ?? '0,00'}
        </strong>
        <span>{unit}</span>
      </div>

      <div className={styles.chart}>
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Evolução de preços de ${selectedProduct}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="market-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          <polyline
            points={`0,100 ${chart.polyline} 100,100`}
            fill="url(#market-area)"
            stroke="none"
          />

          <polyline
            points={chart.polyline}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className={styles.axis}>
          {points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <span>
          Mínimo: {chart.min.toLocaleString('pt-BR')} {unit}
        </span>
        <span>
          Máximo: {chart.max.toLocaleString('pt-BR')} {unit}
        </span>
      </footer>
    </section>
  );
}
