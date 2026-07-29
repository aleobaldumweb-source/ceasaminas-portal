import { modalityLabels, statusLabels } from '../constants';
import type { ProcurementModality, ProcurementStatus, PublicationFilter, SortDirection, SortKey } from '../types';

type Props = {
  query: string;
  status: 'ALL' | ProcurementStatus;
  modality: 'ALL' | ProcurementModality;
  publication: PublicationFilter;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: 'ALL' | ProcurementStatus) => void;
  onModalityChange: (value: 'ALL' | ProcurementModality) => void;
  onPublicationChange: (value: PublicationFilter) => void;
  onSortKeyChange: (value: SortKey) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onClear: () => void;
};

export function ProcurementFilters(props: Props) {
  return (
    <div className="procurement-filters">
      <label className="filter-field">Buscar<input className="search" placeholder="Número, objeto, descrição ou setor" value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} /></label>
      <label className="filter-field">Status<select value={props.status} onChange={(event) => props.onStatusChange(event.target.value as 'ALL' | ProcurementStatus)}><option value="ALL">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="filter-field">Modalidade<select value={props.modality} onChange={(event) => props.onModalityChange(event.target.value as 'ALL' | ProcurementModality)}><option value="ALL">Todas</option>{Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="filter-field">Publicação<select value={props.publication} onChange={(event) => props.onPublicationChange(event.target.value as PublicationFilter)}><option value="ALL">Todas</option><option value="PUBLIC">Públicas</option><option value="SCHEDULED">Programadas</option><option value="UNPUBLISHED">Não publicadas</option></select></label>
      <label className="filter-field">Ordenar por<select value={props.sortKey} onChange={(event) => props.onSortKeyChange(event.target.value as SortKey)}><option value="deadlineAt">Prazo</option><option value="publishedAt">Publicação</option><option value="number">Número</option><option value="title">Objeto</option><option value="status">Status</option></select></label>
      <label className="filter-field">Direção<select value={props.sortDirection} onChange={(event) => props.onSortDirectionChange(event.target.value as SortDirection)}><option value="asc">Crescente</option><option value="desc">Decrescente</option></select></label>
      <button type="button" className="secondary clear-filters" onClick={props.onClear}>Limpar filtros</button>
    </div>
  );
}
