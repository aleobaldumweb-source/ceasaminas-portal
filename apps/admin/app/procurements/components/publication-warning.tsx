type Warning = {
  type: 'warning' | 'info';
  title: string;
  text: string;
};

export function PublicationWarning({ warning }: { warning: Warning | null }) {
  if (!warning) return null;

  return (
    <div className={`publication-warning ${warning.type}`} role="status" aria-live="polite">
      <strong>{warning.title}</strong>
      <p>{warning.text}</p>
    </div>
  );
}
