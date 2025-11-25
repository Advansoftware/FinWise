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
  IconButton,
} from "@mui/material";
import { useState, cloneElement } from "react";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SmartReceiptScanner } from "./smart-receipt-scanner";

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
    <SmartReceiptScanner onComplete={handleComplete} />
  );

  const trigger = cloneElement(children, {
    onClick: () => setIsOpen(true),
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
            sx: { height: "95vh", display: "flex", flexDirection: "column" },
          }}
        >
          <Box
            sx={{
              p: 3,
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>
                Escanear Nota Fiscal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                QR Code de NFCe ou foto da nota fiscal
              </Typography>
            </Box>
            <IconButton onClick={() => setIsOpen(false)} size="small">
              <X size={20} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 3, pt: 0 }}>
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
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Escanear Nota Fiscal
          <IconButton onClick={() => setIsOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContentText sx={{ px: 3, pb: 2 }}>
          Escaneie o QR Code da NFCe ou faça upload da imagem da nota fiscal. Os
          dados serão extraídos automaticamente.
        </DialogContentText>
        <DialogContent>{renderContent()}</DialogContent>
      </Dialog>
    </>
  );
}
