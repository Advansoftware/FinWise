
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AICreditLog } from "@/ai/ai-types";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "../ui/badge";

interface AICreditStatementDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  logs: AICreditLog[];
}

export function AICreditStatementDialog({ isOpen, setIsOpen, logs }: AICreditStatementDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Extrato de Créditos de IA</DialogTitle>
          <DialogDescription>
            Aqui está o histórico de uso dos seus créditos de IA.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] my-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação Realizada</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-right font-bold text-destructive">-{log.cost}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        Nenhum crédito foi utilizado ainda.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
