// src/components/receipts/receipt-scanner-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { ReceiptScanner } from "./receipt-scanner";

interface ReceiptScannerDialogProps {
  children: React.ReactNode;
}

export function ReceiptScannerDialog({ children }: ReceiptScannerDialogProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = () => {
    setIsOpen(false);
  };

  const renderContent = () => (
    <ReceiptScanner onComplete={handleComplete} />
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent side="bottom" sx={{ height: '95vh', display: 'flex', flexDirection: 'column' }}>
          <SheetHeader sx={{ textAlign: 'left' }}>
            <SheetTitle>Escanear Nota Fiscal</SheetTitle>
            <SheetDescription>
              Aponte a câmera para a nota fiscal ou envie uma imagem da galeria.
            </SheetDescription>
          </SheetHeader>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent sx={{ maxWidth: { sm: '42rem' }, maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle>Escanear Nota Fiscal</DialogTitle>
          <DialogDescription>
            Faça upload da imagem (PDF, PNG, JPG) da nota fiscal para adicionar as transações.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}