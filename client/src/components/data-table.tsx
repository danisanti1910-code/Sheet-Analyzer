import { useState } from 'react';
import { SheetData } from '@/lib/sheet-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

interface DataTableProps {
  data: SheetData;
  selectedColumns?: string[];
}

export function DataTable({ data, selectedColumns = [] }: DataTableProps) {
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  const displayColumns = selectedColumns.length > 0 ? selectedColumns : data.columns;
  const totalPages = Math.ceil(data.rows.length / pageSize);
  
  const paginatedData = data.rows.slice(page * pageSize, (page + 1) * pageSize);

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
                    <TableHead key={col} className="whitespace-nowrap font-semibold text-primary/80">
                        {col}
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
