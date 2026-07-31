import type { FormEvent } from 'react';

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  onFileChange: (value: File | null) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
};

export function DocumentUploader({ title, onTitleChange, onFileChange, onSubmit }: Props) {
  return (
    <form className="document-form" onSubmit={onSubmit}>
      <input
        required
        placeholder="Título do documento"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
      />
      <input
        required
        type="file"
        accept=".pdf,.doc,.docx,.xlsx"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <button className="primary">Enviar</button>
    </form>
  );
}
