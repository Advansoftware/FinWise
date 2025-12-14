// src/components/ui/confirm-dialog.tsx
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { ReactNode, useState } from "react";

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed (cancel clicked or clicked outside) */
  onClose: () => void;
  /** Callback when confirm action is clicked */
  onConfirm: () => void | Promise<void>;
  /** Dialog title */
  title: string;
  /** Dialog description/body */
  description?: string | ReactNode;
  /** Text for the cancel button */
  cancelText?: string;
  /** Text for the confirm button */
  confirmText?: string;
  /** Color of the confirm button (for destructive actions like delete) */
  confirmColor?: "primary" | "secondary" | "error" | "success" | "warning" | "info";
  /** Whether the confirm action is loading */
  loading?: boolean;
  /** Disable the confirm button */
  confirmDisabled?: boolean;
}

/**
 * A reusable confirmation dialog component.
 * 
 * Follows the app's button standard:
 * - Cancel: `variant="outlined"`
 * - Confirm/Action: `variant="contained"`
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir Item"
 *   description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
 *   confirmText="Excluir"
 *   confirmColor="error"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  confirmColor = "primary",
  loading = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("ConfirmDialog action failed:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const isLoading = loading || isConfirming;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      {description && (
        <DialogContent>
          {typeof description === "string" ? (
            <DialogContentText id="confirm-dialog-description">
              {description}
            </DialogContentText>
          ) : (
            description
          )}
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={handleConfirm}
          disabled={confirmDisabled || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
