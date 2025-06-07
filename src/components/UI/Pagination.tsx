import React, { useState } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
  showInfo?: boolean;
  showJumpTo?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  showInfo = true,
  showJumpTo = true
}) => {
  const [jumpToPage, setJumpToPage] = useState('');

  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const showFirstLast = totalPages > maxVisiblePages;
  const showLeftEllipsis = visiblePages[0] > 2;
  const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    }
  };

  const PaginationButton = ({ 
    isActive = false, 
    disabled = false, 
    onClick, 
    children 
  }: { 
    isActive?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      className="px-3 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 min-w-[40px] h-[40px] flex items-center justify-center disabled:cursor-not-allowed"
      style={{
        backgroundColor: isActive ? '#72b01d' : disabled ? 'rgba(69, 73, 85, 0.05)' : '#ffffff',
        color: isActive ? '#ffffff' : disabled ? 'rgba(69, 73, 85, 0.4)' : '#454955',
        borderColor: isActive ? '#72b01d' : disabled ? 'rgba(69, 73, 85, 0.1)' : 'rgba(114, 176, 29, 0.3)',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isActive ? '0 4px 12px rgba(114, 176, 29, 0.3)' : disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        if (!isActive && !disabled) {
          e.currentTarget.style.backgroundColor = 'rgba(114, 176, 29, 0.1)';
          e.currentTarget.style.borderColor = '#72b01d';
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !disabled) {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Results Information */}
      {showInfo && totalItems > 0 && (
        <div className="text-sm text-center" style={{ color: '#454955' }}>
          Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
          <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> of{' '}
          <span className="font-semibold">{totalItems}</span> results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* Previous Button */}
        <PaginationButton
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </PaginationButton>

        {/* First Page */}
        {showFirstLast && visiblePages[0] > 1 && (
          <>
            <PaginationButton
              isActive={currentPage === 1}
              onClick={() => onPageChange(1)}
            >
              1
            </PaginationButton>
            {showLeftEllipsis && (
              <span className="px-2 py-2 text-sm" style={{ color: '#454955' }}>...</span>
            )}
          </>
        )}

        {/* Visible Page Numbers */}
        {visiblePages.map((page) => (
          <PaginationButton
            key={page}
            isActive={currentPage === page}
            onClick={() => onPageChange(page)}
          >
            {page}
          </PaginationButton>
        ))}

        {/* Last Page */}
        {showFirstLast && visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {showRightEllipsis && (
              <span className="px-2 py-2 text-sm" style={{ color: '#454955' }}>...</span>
            )}
            <PaginationButton
              isActive={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </PaginationButton>
          </>
        )}

        {/* Next Button */}
        <PaginationButton
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </PaginationButton>
      </div>

      {/* Jump to Page */}
      {showJumpTo && totalPages > 10 && (
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: '#454955' }}>Go to page:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
            className="w-16 px-2 py-1 border rounded text-center"
            style={{ 
              borderColor: 'rgba(114, 176, 29, 0.3)',
              color: '#454955'
            }}
            placeholder={currentPage.toString()}
          />
          <button
            onClick={handleJumpToPage}
            className="px-3 py-1 rounded border text-xs font-medium transition-all"
            style={{
              backgroundColor: '#72b01d',
              color: '#ffffff',
              borderColor: '#72b01d'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3f7d20';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#72b01d';
            }}
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
