'use client';

import { useAuth } from '../../components/auth-provider';
import { ProcurementFilters } from './components/procurement-filters';
import { ProcurementForm } from './components/procurement-form';
import { ProcurementMetrics } from './components/procurement-metrics';
import { ProcurementPagination } from './components/procurement-pagination';
import { ProcurementTable } from './components/procurement-table';
import { useProcurements } from './hooks/use-procurements';

export default function ProcurementsPage() {
  const { user, logout } = useAuth();
  const procurement = useProcurements();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="layout">
      <aside>
        <div className="brand"><b>CEASAMINAS</b><span>Administração</span></div>
        <nav><a href="/">Notícias</a><a href="/market">Mercado</a><a className="active" href="/procurements">Licitações</a>{isAdmin && <a href="/users">Usuários</a>}</nav>
        <footer>● Ambiente administrativo</footer>
      </aside>

      <main className="procurements-page">
        <header>
          <div><p>COMPRAS PÚBLICAS</p><h1>Licitações</h1></div>
          <div className="header-actions"><span>{user?.name}</span><button type="button" className="secondary" onClick={() => void logout()}>Sair</button></div>
        </header>

        {procurement.error && <p className="feedback error">{procurement.error}</p>}
        {procurement.message && <p className="feedback success">{procurement.message}</p>}

        <ProcurementMetrics {...procurement.metrics} />

        {canEdit && (
          <ProcurementForm
            form={procurement.form}
            editing={Boolean(procurement.editingId)}
            saving={procurement.saving}
            warning={procurement.publicationWarning}
            onUpdate={procurement.updateForm}
            onSubmit={procurement.submit}
            onCancel={procurement.resetForm}
          />
        )}

        <section className="panel procurement-list-panel">
          <div className="section-title procurement-list-title">
            <div><p>PROCESSOS</p><h2>Licitações cadastradas</h2></div>
            <span className="results-count">{procurement.filteredItems.length} resultado{procurement.filteredItems.length === 1 ? '' : 's'}</span>
          </div>

          <ProcurementFilters
            query={procurement.query}
            status={procurement.statusFilter}
            modality={procurement.modalityFilter}
            publication={procurement.publicationFilter}
            sortKey={procurement.sortKey}
            sortDirection={procurement.sortDirection}
            onQueryChange={procurement.setQuery}
            onStatusChange={procurement.setStatusFilter}
            onModalityChange={procurement.setModalityFilter}
            onPublicationChange={procurement.setPublicationFilter}
            onSortKeyChange={procurement.setSortKey}
            onSortDirectionChange={procurement.setSortDirection}
            onClear={procurement.clearFilters}
          />

          <ProcurementTable
            items={procurement.paginatedItems}
            canEdit={canEdit}
            isAdmin={isAdmin}
            documentFor={procurement.documentFor}
            documentTitle={procurement.documentTitle}
            onEdit={procurement.edit}
            onRemove={procurement.remove}
            onSelectDocumentTarget={procurement.setDocumentFor}
            onDocumentTitleChange={procurement.setDocumentTitle}
            onDocumentFileChange={procurement.setDocumentFile}
            onUploadDocument={procurement.uploadDocument}
            onRemoveDocument={procurement.removeDocument}
          />

          <ProcurementPagination
            page={procurement.pageNumber}
            totalPages={procurement.totalPages}
            onPageChange={procurement.setPageNumber}
          />
        </section>
      </main>
    </div>
  );
}
