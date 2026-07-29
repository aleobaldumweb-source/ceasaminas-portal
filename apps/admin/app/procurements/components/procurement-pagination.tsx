type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function ProcurementPagination({ page, totalPages, onPageChange }: Props) {
  return (
    <div className="pagination" aria-label="Paginação">
      <span>
        Página {page} de {totalPages}
      </span>
      <div>
        <button
          type="button"
          className="secondary"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </button>
        <button
          type="button"
          className="secondary"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
