import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  currentPage,
  pageSize,
  pageSizeOptions = [10, 20, 30, 40, 50],
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Generate page numbers array with ellipsis if many pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (validCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      {/* 左侧：总数与每页条数选择 */}
      <div className="flex items-center space-x-3">
        <span className="text-slate-700">
          共 <strong className="font-mono text-blue-700 font-bold">{total}</strong> 条
        </span>
        <div className="flex items-center space-x-1.5">
          <span>每页显示</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              if (onPageSizeChange) {
                onPageSizeChange(newSize);
              }
              onPageChange(1);
            }}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>条</span>
        </div>
      </div>

      {/* 右侧：上一页、具体页码、下一页 */}
      <div className="flex items-center space-x-1 self-end sm:self-auto">
        {/* 上一页 */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className={`px-2 py-1 rounded border text-xs flex items-center transition ${
            validCurrentPage <= 1
              ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
          }`}
          title="上一页"
          aria-label="上一页"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* 具体页数 */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400">
                ...
              </span>
            );
          }
          const pageNum = Number(p);
          const isActive = pageNum === validCurrentPage;
          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[28px] h-7 px-2 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* 下一页 */}
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className={`px-2 py-1 rounded border text-xs flex items-center transition ${
            validCurrentPage >= totalPages
              ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
          }`}
          title="下一页"
          aria-label="下一页"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
