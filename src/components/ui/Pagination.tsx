import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 4px 4px 4px',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.85rem',
        color: 'var(--beige)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div>
        Showing <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{startItem}</span> to{' '}
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{endItem}</span> of{' '}
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{totalItems}</span> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            background: currentPage === 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--glass-border)',
            color: currentPage === 1 ? 'var(--grey-mid)' : 'var(--cream)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span style={{ padding: '0 8px', color: 'var(--cream)', fontWeight: 600 }}>
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--glass-border)',
            color: currentPage === totalPages ? 'var(--grey-mid)' : 'var(--cream)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
