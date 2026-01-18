
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChartStyle, FormatConfig, ThresholdRule, RowAction } from '../../types';

interface SuperTableProps {
    data: any[];
    columns: string[];
    columnHeaders?: Record<string, string>; // Map of field key -> display label
    style?: ChartStyle;
    format?: FormatConfig;
    thresholds?: ThresholdRule[];
    onRowClick?: (row: any) => void;
    theme?: 'light' | 'dark';
    onPageSizeChange?: (size: number) => void;
    onActionClick?: (actionId: string, row: any) => void; // New prop for actions
    onColumnResize?: (column: string, width: number) => void; // New prop for saving width
}

const formatValue = (value: any, config?: FormatConfig): string => {
    if (value === undefined || value === null) return '-';
    if (typeof value !== 'number') return String(value);
    
    // If it looks like a timestamp, format date (Simple heuristic)
    if (value > 1600000000000 && value < 2000000000000) {
        return new Date(value).toLocaleString();
    }

    const precision = config?.precision ?? 1;
    let formatted = value.toFixed(precision);
    
    if (config?.type === 'percent') {
        formatted += '%';
    }
    
    if (config?.unitSuffix) {
        formatted += ` ${config.unitSuffix}`;
    }
    
    return formatted;
};

// Helper: Threshold Color
const getThresholdColor = (value: any, rules?: ThresholdRule[]): string | undefined => {
    if (typeof value !== 'number' || !rules || rules.length === 0) return undefined;
    
    for (const rule of rules) {
        let match = false;
        switch(rule.operator) {
            case '>': match = value > rule.value; break;
            case '>=': match = value >= rule.value; break;
            case '<': match = value < rule.value; break;
            case '<=': match = value <= rule.value; break;
            case '==': match = value === rule.value; break;
            case '!=': match = value !== rule.value; break;
        }
        if (match) return rule.color;
    }
    return undefined;
};

export const SuperTable: React.FC<SuperTableProps> = ({ 
    data, 
    columns, 
    columnHeaders,
    style, 
    format, 
    thresholds, 
    onRowClick,
    theme = 'light',
    onPageSizeChange,
    onActionClick,
    onColumnResize
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [pageSize, setPageSize] = useState(style?.pageSize || 10);
    
    // Column Width State
    const [colWidths, setColWidths] = useState<Record<string, number>>(style?.columnWidths || {});
    const resizingRef = useRef<{ column: string, startX: number, startWidth: number } | null>(null);

    const isDark = theme === 'dark';
    const enablePagination = style?.enablePagination ?? false;
    const showRowNumber = style?.showRowNumber ?? false;
    const actions = style?.rowActions || [];

    // Sync prop changes
    useEffect(() => {
        if (style?.pageSize) setPageSize(style.pageSize);
    }, [style?.pageSize]);

    useEffect(() => {
        if (style?.columnWidths) setColWidths(style.columnWidths);
    }, [style?.columnWidths]);

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1); 
        if (onPageSizeChange) onPageSizeChange(newSize);
    };

    // --- Resizing Logic ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            const { column, startX, startWidth } = resizingRef.current;
            const diff = e.clientX - startX;
            const newWidth = Math.max(50, startWidth + diff); // Min width 50px
            setColWidths(prev => ({ ...prev, [column]: newWidth }));
        };

        const handleMouseUp = () => {
            if (resizingRef.current) {
                // Ideally trigger save here
                if (onColumnResize) {
                    onColumnResize(resizingRef.current.column, colWidths[resizingRef.current.column]);
                }
                resizingRef.current = null;
            }
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        if (resizingRef.current) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [colWidths, onColumnResize]);

    const startResize = (e: React.MouseEvent, column: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent sort click
        const currentWidth = colWidths[column] || 150; // Default guess
        resizingRef.current = { column, startX: e.clientX, startWidth: currentWidth };
        document.body.style.cursor = 'col-resize';
    };

    // --- Sorting Logic ---
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // --- Pagination Logic ---
    const paginatedData = useMemo(() => {
        if (!enablePagination) return sortedData;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize, enablePagination]);

    const totalPages = Math.ceil(data.length / pageSize);

    const handleHeaderClick = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse relative" style={{ tableLayout: 'fixed' }}>
                    <thead className={`sticky top-0 z-20 backdrop-blur-sm ${isDark ? 'bg-slate-800/90 text-slate-300' : 'bg-slate-50/95 text-slate-500'} border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <tr>
                            {showRowNumber && (
                                <th className="p-3 text-[10px] font-black uppercase tracking-wider w-12 text-center sticky left-0 z-30 bg-inherit border-r border-slate-200">#</th>
                            )}
                            {columns.map(col => (
                                <th 
                                    key={col} 
                                    className="p-3 text-[10px] font-black uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none relative group"
                                    style={{ width: colWidths[col] ? `${colWidths[col]}px` : 'auto', minWidth: '100px' }}
                                    onClick={() => handleHeaderClick(col)}
                                >
                                    <div className="flex items-center gap-1 truncate">
                                        {columnHeaders ? (columnHeaders[col] || col) : col}
                                        {sortConfig?.key === col && (
                                            <svg className={`w-3 h-3 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        )}
                                    </div>
                                    {/* Resize Handle */}
                                    <div 
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400 group-hover:bg-slate-300 transition-colors z-40"
                                        onMouseDown={(e) => startResize(e, col)}
                                        onClick={(e) => e.stopPropagation()} 
                                    />
                                </th>
                            ))}
                            {actions.length > 0 && (
                                <th className="p-3 text-[10px] font-black uppercase tracking-wider text-center sticky right-0 z-30 bg-inherit border-l border-slate-200 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]" style={{ width: '120px' }}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                        {paginatedData.map((row, idx) => (
                            <tr 
                                key={idx} 
                                onClick={() => onRowClick?.(row)}
                                className={`
                                    transition-colors group
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                    ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}
                                `}
                            >
                                {showRowNumber && (
                                    <td className={`p-3 text-xs font-mono text-center opacity-50 sticky left-0 z-10 bg-inherit border-r border-slate-100 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {(enablePagination ? (currentPage - 1) * pageSize : 0) + idx + 1}
                                    </td>
                                )}
                                {columns.map(col => {
                                    const rawVal = row[col];
                                    const thresholdColor = getThresholdColor(rawVal, thresholds);
                                    
                                    return (
                                        <td key={col} className={`p-3 text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {thresholdColor ? (
                                                <span 
                                                    className="px-2 py-0.5 rounded font-bold" 
                                                    style={{ backgroundColor: thresholdColor + '20', color: thresholdColor }}
                                                >
                                                    {formatValue(rawVal, format)}
                                                </span>
                                            ) : (
                                                col.toLowerCase() === 'status' ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${String(rawVal).toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                        {String(rawVal)}
                                                    </div>
                                                ) : formatValue(rawVal, format)
                                            )}
                                        </td>
                                    );
                                })}
                                {actions.length > 0 && (
                                    <td className="p-2 text-center sticky right-0 z-10 bg-inherit border-l border-slate-50 group-hover:border-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center justify-center gap-1">
                                            {actions.map((action) => (
                                                <button
                                                    key={action.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onActionClick?.(action.id, row);
                                                    }}
                                                    className={`
                                                        p-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1
                                                        ${action.type === 'primary' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 
                                                          action.type === 'danger' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 
                                                          'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                                                    `}
                                                    title={action.label}
                                                >
                                                    {action.icon ? (
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
                                                        </svg>
                                                    ) : action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + (showRowNumber ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="p-8 text-center text-xs text-slate-400">
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {enablePagination && (
                <div className={`flex justify-between items-center p-3 border-t text-[10px] font-bold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'} flex-shrink-0`}>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span>Rows:</span>
                            <select 
                                value={pageSize} 
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className={`bg-transparent border rounded p-1 outline-none ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <span className="opacity-50">
                            {Math.min((currentPage - 1) * pageSize + 1, data.length)} - {Math.min(currentPage * pageSize, data.length)} of {data.length}
                        </span>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="flex gap-1">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className={`p-1.5 rounded-lg border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-700 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 disabled:opacity-30'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="flex items-center px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className={`p-1.5 rounded-lg border transition-all ${isDark ? 'border-slate-700 hover:bg-slate-700 disabled:opacity-30' : 'border-slate-200 hover:bg-slate-100 disabled:opacity-30'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
