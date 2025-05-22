// src/components/ui/Table.tsx
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  data?: any[];
  columns?: TableColumn[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: any) => void;
  children?: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export function Table({ 
  data, 
  columns, 
  loading, 
  onSort, 
  sortKey, 
  sortDirection, 
  onRowClick, 
  children, 
  className = '' 
}: TableProps) {
  // Si se usan data y columns, renderizar tabla automática
  if (data && columns) {
    return (
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => {
                    if (column.sortable && onSort) {
                      const newDirection = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
                      onSort(column.key, newDirection);
                    }
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 ${
                            sortKey === column.key && sortDirection === 'asc' 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`} 
                        />
                        <ChevronDown 
                          className={`w-3 h-3 -mt-1 ${
                            sortKey === column.key && sortDirection === 'desc' 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`transition-colors ${
                    onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Si no, renderizar tabla manual con children
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  const baseClasses = 'transition-colors';
  const hoverClasses = onClick ? 'hover:bg-gray-50 cursor-pointer' : '';
  const classes = `${baseClasses} ${hoverClasses} ${className}`.trim();

  return (
    <tr className={classes} onClick={onClick}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', header = false }: TableCellProps) {
  const baseClasses = 'px-6 py-4 whitespace-nowrap text-sm';
  const headerClasses = header 
    ? 'font-medium text-gray-900 text-left tracking-wider uppercase' 
    : 'text-gray-900';
  
  const classes = `${baseClasses} ${headerClasses} ${className}`.trim();
  
  const Tag = header ? 'th' : 'td';
  
  return (
    <Tag className={classes}>
      {children}
    </Tag>
  );
}

// Exportación por defecto del componente principal
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;