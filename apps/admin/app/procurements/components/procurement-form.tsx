import type { FormEvent } from 'react';
import { modalityLabels, statusLabels } from '../constants';
import type { ProcurementFormValues, ProcurementModality, ProcurementStatus } from '../types';
import { PublicationWarning } from './publication-warning';

type Props = {
  form: ProcurementFormValues;
  editing: boolean;
  saving: boolean;
  warning: { type: 'warning' | 'info'; title: string; text: string } | null;
  onUpdate: <K extends keyof ProcurementFormValues>(key: K, value: ProcurementFormValues[K]) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
};

export function ProcurementForm({ form, editing, saving, warning, onUpdate, onSubmit, onCancel }: Props) {
  return (
    <section className="panel procurement-form-panel">
      <div className="section-title">
        <div><p>CADASTRO</p><h2>{editing ? 'Editar licitação' : 'Nova licitação'}</h2></div>
        {editing && <button type="button" className="secondary" onClick={onCancel}>Cancelar edição</button>}
      </div>

      <form onSubmit={onSubmit} className="grid2 procurement-form">
        <label>Número<input required value={form.number} onChange={(event) => onUpdate('number', event.target.value)} /></label>
        <label>Modalidade<select value={form.modality} onChange={(event) => onUpdate('modality', event.target.value as ProcurementModality)}>{Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-wide">Objeto / título<input required minLength={5} value={form.title} onChange={(event) => onUpdate('title', event.target.value)} /></label>
        <label className="field-wide">Descrição<textarea required rows={5} value={form.description} onChange={(event) => onUpdate('description', event.target.value)} /></label>
        <label>Status<select value={form.status} onChange={(event) => onUpdate('status', event.target.value as ProcurementStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Valor estimado (R$)<input type="number" min="0" step="0.01" value={form.estimatedValue} onChange={(event) => onUpdate('estimatedValue', event.target.value)} /></label>
        <label>Abertura<input type="datetime-local" value={form.openingAt} onChange={(event) => onUpdate('openingAt', event.target.value)} /></label>
        <label>Prazo<input type="datetime-local" value={form.deadlineAt} onChange={(event) => onUpdate('deadlineAt', event.target.value)} /></label>
        <label>Setor responsável<input value={form.department} onChange={(event) => onUpdate('department', event.target.value)} /></label>
        <label>E-mail de contato<input type="email" value={form.contactEmail} onChange={(event) => onUpdate('contactEmail', event.target.value)} /></label>
        <label>Publicar em<input type="datetime-local" value={form.publishedAt} onChange={(event) => onUpdate('publishedAt', event.target.value)} /></label>
        <PublicationWarning warning={warning} />
        <div className="form-actions"><button className="primary" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar licitação'}</button></div>
      </form>
    </section>
  );
}
