// src/components/receipts/receipt-scanner-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Drawer,
  Box,
  Typography,
  Button
} from "@mui/material";
import {useState, cloneElement} from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { ReceiptScanner } from "./receipt-scanner";

interface ReceiptScannerDialogProps {
  children: React.ReactElement;
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

  const trigger = cloneElement(children, {
    onClick: () => setIsOpen(true)
  });

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer 
          anchor="bottom" 
          open={isOpen} 
          onClose={() => setIsOpen(false)}
          PaperProps={{
            sx: { height: '95vh', display: 'flex', flexDirection: 'column' }
          }}
        >
          <Box sx={{ p: 3, textAlign: 'left' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Escanear Nota Fiscal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aponte a câmera para a nota fiscal ou envie uma imagem da galeria.
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 3, pt: 0 }}>
            {renderContent()}
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>Escanear Nota Fiscal</DialogTitle>
        <DialogContentText sx={{ px: 3, pb: 2 }}>
          Faça upload da imagem (PDF, PNG, JPG) da nota fiscal para adicionar as transações.
        </DialogContentText>
        <DialogContent sx={{ overflowY: 'auto' }}>
          {renderContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}