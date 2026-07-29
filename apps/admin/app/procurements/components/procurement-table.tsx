import type { FormEvent } from 'react';
import { modalityLabels, statusLabels } from '../constants';
import type { Procurement } from '../types';
import { formatCurrency, formatDateTime, getPublicState } from '../utils';
import { DocumentUploader } from './document-uploader';

type Props = {
  items: Procurement[];
  canEdit: boolean;
  isAdmin: boolean;
  documentFor: string | null;
  documentTitle: string;
  onEdit: (item: Procurement) => void;
  onRemove: (item: Procurement) => Promise<void>;
  onSelectDocumentTarget: (id: string) => void;
  onDocumentTitleChange: (value: string) => void;
  onDocumentFileChange: (value: File | null) => void;
  onUploadDocument: (event: FormEvent) => Promise<void>;
  onRemoveDocument: (itemId: string, documentId: string) => Promise<void>;
};

export function ProcurementTable(props: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Processo</th><th>Situação</th><th>Publicação</th><th>Prazo</th><th>Valor</th><th>Documentos</th><th>Ações</th></tr></thead>
        <tbody>
          {props.items.map((item) => {
            const publication = getPublicState(item);
            return (
              <tr key={item.id}>
                <td><strong>{item.number}</strong><small>{item.title}</small><small>{modalityLabels[item.modality]}</small></td>
                <td><span className={`proc-status ${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></td>
                <td><span className={`publication-state ${publication.className}`}>{publication.label}</span><small>{formatDateTime(item.publishedAt)}</small></td>
                <td>{formatDateTime(item.deadlineAt)}</td>
                <td>{formatCurrency(item.estimatedValue)}</td>
                <td>{item.documents.length}<div className="document-links">{item.documents.map((document) => <span key={document.id}><a href={document.fileUrl} target="_blank" rel="noreferrer">{document.title}</a>{props.canEdit && <button type="button" aria-label="Remover documento" onClick={() => void props.onRemoveDocument(item.id, document.id)}>×</button>}</span>)}</div></td>
                <td>
                  <div className="row-actions">
                    {props.canEdit && <><button type="button" className="secondary" onClick={() => props.onEdit(item)}>Editar</button><button type="button" className="secondary" onClick={() => props.onSelectDocumentTarget(item.id)}>Anexar</button></>}
                    {props.isAdmin && <button type="button" className="danger" onClick={() => void props.onRemove(item)}>Excluir</button>}
                  </div>
                  {props.documentFor === item.id && <DocumentUploader title={props.documentTitle} onTitleChange={props.onDocumentTitleChange} onFileChange={props.onDocumentFileChange} onSubmit={props.onUploadDocument} />}
                </td>
              </tr>
            );
          })}
          {props.items.length === 0 && <tr><td colSpan={7} className="empty">Nenhuma licitação corresponde aos filtros informados.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
