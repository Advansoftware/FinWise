import { Button } from "@/components/ui/button";
import { PlusCircle, QrCode } from "lucide-react";
import { AddTransactionSheet } from "./add-transaction-sheet";
import { ScanQRCodeDialog } from "./scan-qr-code-dialog";

export function Header() {
  return (
    <div className="flex items-center justify-between space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
      <div className="flex items-center space-x-2">
        <ScanQRCodeDialog>
          <Button>
            <QrCode className="mr-2 h-4 w-4" /> Scan Invoice
          </Button>
        </ScanQRCodeDialog>
        <AddTransactionSheet>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Manually
          </Button>
        </AddTransactionSheet>
      </div>
    </div>
  );
}
