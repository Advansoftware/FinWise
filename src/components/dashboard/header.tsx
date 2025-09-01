import { Button } from "@/components/ui/button";
import { PlusCircle, ScanLine } from "lucide-react";
import { AddTransactionSheet } from "./add-transaction-sheet";
import { ScanQRCodeDialog } from "./scan-qr-code-dialog";

export function Header() {
  return (
    <div className="flex items-center justify-between space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Painel</h1>
      <div className="flex items-center space-x-2">
        <ScanQRCodeDialog>
          <Button variant="outline" className="bg-card hover:bg-accent hover:text-accent-foreground border-primary/20">
            <ScanLine className="mr-2 h-4 w-4" /> Escanear Nota Fiscal
          </Button>
        </ScanQRCodeDialog>
        <AddTransactionSheet>
          <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Manualmente
          </Button>
        </AddTransactionSheet>
      </div>
    </div>
  );
}
