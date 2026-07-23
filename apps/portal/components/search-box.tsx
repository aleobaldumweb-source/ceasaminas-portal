'use client';

import { useMemo, useState } from 'react';

import styles from './search-box.module.css';

type SearchSuggestion = {
  title: string;
  href: string;
  type: string;
};

type SearchBoxProps = {
  initialQuery: string;
  suggestions: SearchSuggestion[];
};

export function SearchBox({ initialQuery, suggestions }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const normalized = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();

    if (normalized.length < 2) {
      return [];
    }

    return suggestions
      .filter((suggestion) => {
        const title = suggestion.title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('pt-BR');

        return title.includes(normalized);
      })
      .slice(0, 6);
  }, [query, suggestions]);

  const showSuggestions = focused && filteredSuggestions.length > 0;

  return (
    <div className={styles.root}>
      <form className={styles.form} action="/pesquisa" method="get">
        <label className={styles.visuallyHidden} htmlFor="portal-search">
          Digite o que deseja encontrar
        </label>

        <input
          id="portal-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 120);
          }}
          placeholder="Ex.: licitação, banana, transparência..."
          autoComplete="off"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
        />

        <button type="submit">
          Pesquisar
          <span aria-hidden="true">→</span>
        </button>
      </form>

      {showSuggestions ? (
        <div className={styles.suggestions} id="search-suggestions" role="listbox">
          {filteredSuggestions.map((suggestion) => (
            <a href={suggestion.href} key={`${suggestion.type}-${suggestion.href}`} role="option">
              <span>{suggestion.type}</span>
              <strong>{suggestion.title}</strong>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
