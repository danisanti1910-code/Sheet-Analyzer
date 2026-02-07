import { useState } from 'react';
import { SheetData } from '@/lib/sheet-utils';
import { useSheet } from '@/lib/sheet-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DataTableProps {
  data: SheetData;
  selectedColumns?: string[];
}

export function DataTable({ data, selectedColumns = [] }: DataTableProps) {
  const { updateProject, activeProjectId } = useSheet();
  const [page, setPage] = useState(0);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [tempColumnName, setTempColumnName] = useState("");
  const pageSize = 50;
  
  const displayColumns = selectedColumns.length > 0 ? selectedColumns : data.columns;
  const totalPages = Math.ceil(data.rows.length / pageSize);
  
  const paginatedData = data.rows.slice(page * pageSize, (page + 1) * pageSize);

  const handleRenameColumn = (oldName: string) => {
    if (!tempColumnName || tempColumnName === oldName) {
      setEditingColumn(null);
      return;
    }

    const newColumns = data.columns.map(c => c === oldName ? tempColumnName : c);
    const newProfiles = { ...data.columnProfiles };
    newProfiles[tempColumnName] = { ...newProfiles[oldName], name: tempColumnName };
    delete newProfiles[oldName];

    const newRows = data.rows.map(row => {
      const newRow = { ...row };
      newRow[tempColumnName] = row[oldName];
      delete newRow[oldName];
      return newRow;
    });

    updateProject(activeProjectId!, {
      sheetData: {
        ...data,
        columns: newColumns,
        columnProfiles: newProfiles,
        rows: newRows
      }
    });
    setEditingColumn(null);
  };

  if (!data || data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader className="bg-muted/50">
                <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                {displayColumns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap font-semibold text-primary/80 group">
                        <div className="flex items-center gap-2">
                          {editingColumn === col ? (
                            <div className="flex items-center gap-1">
                              <Input 
                                value={tempColumnName} 
                                onChange={e => setTempColumnName(e.target.value)}
                                className="h-7 w-32 text-xs"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" onClick={() => handleRenameColumn(col)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setEditingColumn(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span>{data.columnProfiles[col]?.name || col}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100" 
                                onClick={() => { setEditingColumn(col); setTempColumnName(data.columnProfiles[col]?.name || col); }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                    </TableHead>
                ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedData.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/5">
                    <TableCell className="text-center text-xs text-muted-foreground">
                    {page * pageSize + i + 1}
                    </TableCell>
                    {displayColumns.map((col) => (
                    <TableCell key={`${i}-${col}`} className="whitespace-nowrap max-w-[300px] truncate">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-muted-foreground/30 italic">null</span>}
                    </TableCell>
                    ))}
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, data.rows.length)} de {data.rows.length} filas
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Página {page + 1} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
