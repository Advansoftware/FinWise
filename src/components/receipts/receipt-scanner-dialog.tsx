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
        <SheetContent side="bottom" className="h-[95vh] flex flex-col">
          <SheetHeader className="text-left">
            <SheetTitle>Escanear Nota Fiscal</SheetTitle>
            <SheetDescription>
              Aponte a câmera para a nota fiscal ou envie uma imagem da galeria.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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