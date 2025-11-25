// src/components/receipts/smart-receipt-scanner.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  AlertTitle,
  TextField,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  Skeleton,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  RotateCcw,
  Sparkles,
  Info,
  QrCode,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useReceiptScanner,
  ReceiptItemForm,
} from "@/hooks/use-receipt-scanner";
import { useNFCeScanner, NFCeItemForm } from "@/hooks/use-nfce-scanner";
import { QRCodeScanner } from "@/components/camera/qrcode-scanner";
import { MobileCamera } from "@/components/camera/mobile-camera";
import { FileUpload } from "@/components/camera/file-upload";
import { DEFAULT_AI_CREDENTIAL } from "@/lib/ai-settings";
import { TransactionCategory } from "@/lib/types";
import { InlineCategorySelector } from "@/components/transactions/category-selector";

type ScanMode = "auto" | "qrcode" | "photo";

// Tipo unificado para item de formulário
type UnifiedItemForm = (ReceiptItemForm | NFCeItemForm) & {
  category?: TransactionCategory;
  subcategory?: string;
};

interface SmartReceiptScannerProps {
  onComplete?: () => void;
}

export function SmartReceiptScanner({ onComplete }: SmartReceiptScannerProps) {
  const isMobile = useIsMobile();
  const [scanMode, setScanMode] = useState<ScanMode>("auto");
  const [showAllItems, setShowAllItems] = useState(false);

  // Hook para QR Code / NFCe
  const nfceScanner = useNFCeScanner();

  // Hook para foto/IA
  const receiptScanner = useReceiptScanner();

  // Determinar qual scanner está ativo
  const isNFCeActive = !!nfceScanner.form;
  const hasData = nfceScanner.form || receiptScanner.form;
  const isProcessing = nfceScanner.isProcessing || receiptScanner.isProcessing;
  const isSaving = nfceScanner.isSaving || receiptScanner.isSaving;

  // Usar dados do scanner ativo
  const activeForm = nfceScanner.form || receiptScanner.form;
  const activeWallets =
    nfceScanner.wallets.length > 0
      ? nfceScanner.wallets
      : receiptScanner.wallets;
  const activeCategories =
    nfceScanner.categories.length > 0
      ? nfceScanner.categories
      : receiptScanner.categories;

  const handleQRCodeDetected = useCallback(
    (url: string) => {
      setScanMode("qrcode");
      nfceScanner.processQRCode(url);
    },
    [nfceScanner]
  );

  const handlePhotoCapture = useCallback(
    (imageData: string) => {
      setScanMode("photo");
      receiptScanner.processImage(imageData);
    },
    [receiptScanner]
  );

  const handleSwitchToPhoto = useCallback(() => {
    setScanMode("photo");
  }, []);

  const handleSwitchToQRCode = useCallback(() => {
    setScanMode("qrcode");
    receiptScanner.reset();
  }, [receiptScanner]);

  const handleReset = useCallback(() => {
    setScanMode("auto");
    nfceScanner.reset();
    receiptScanner.reset();
    setShowAllItems(false);
  }, [nfceScanner, receiptScanner]);

  const handleSave = useCallback(async () => {
    let success = false;
    if (nfceScanner.form) {
      success = await nfceScanner.saveTransactions();
    } else if (receiptScanner.form) {
      success = await receiptScanner.saveTransactions();
    }

    if (success) {
      onComplete?.();
    }
  }, [nfceScanner, receiptScanner, onComplete]);

  // Renderizar skeleton de carregamento
  const renderProcessingSkeleton = () => (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Skeleton sx={{ height: "1.5rem", width: "8rem" }} />
        <Skeleton sx={{ height: "1.5rem", width: "5rem" }} />
      </Stack>
      <Stack spacing={2}>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2 }}
          >
            <Skeleton sx={{ height: "2.5rem" }} />
            <Skeleton sx={{ height: "2.5rem" }} />
          </Box>
        ))}
      </Stack>
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            color: "text.secondary",
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="body2">
            {nfceScanner.isProcessing
              ? "Acessando portal da NFCe..."
              : "Analisando nota fiscal com IA..."}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );

  // Renderizar formulário de edição
  const renderEditForm = () => {
    if (!activeForm) return null;

    const items = activeForm.items;
    const selectedCount = items.filter((i) => i.selected).length;
    const totalSelected = items
      .filter((i) => i.selected)
      .reduce((sum, i) => sum + i.amount, 0);
    const displayItems = showAllItems ? items : items.slice(0, 5);

    const updateForm = nfceScanner.form
      ? nfceScanner.updateForm
      : receiptScanner.updateForm;
    const updateItem = nfceScanner.form
      ? nfceScanner.updateItem
      : receiptScanner.updateItem;
    const toggleItem = nfceScanner.form
      ? nfceScanner.toggleItemSelection
      : receiptScanner.toggleItemSelection;
    const selectAll = nfceScanner.form
      ? nfceScanner.selectAllItems
      : receiptScanner.selectAllItems;

    return (
      <Stack spacing={3}>
        {/* Header com status */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {activeForm.establishment || "Nota Fiscal"}
          </Typography>
          <Chip
            label={nfceScanner.form ? "Via QR Code" : "Via IA"}
            color={nfceScanner.form ? "success" : "primary"}
            size="small"
            icon={
              nfceScanner.form ? <QrCode size={14} /> : <Sparkles size={14} />
            }
          />
        </Stack>

        {/* Configurações gerais */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel>Carteira</InputLabel>
            <Select
              value={activeForm.walletId}
              label="Carteira"
              onChange={(e) => updateForm({ walletId: e.target.value })}
            >
              {activeWallets.map((wallet) => (
                <MenuItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={activeForm.category}
              label="Categoria"
              onChange={(e) =>
                updateForm({ category: e.target.value as TransactionCategory })
              }
            >
              {activeCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Data"
            value={activeForm.date}
            onChange={(e) => updateForm({ date: e.target.value })}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={activeForm.type}
              label="Tipo"
              onChange={(e) =>
                updateForm({ type: e.target.value as "income" | "expense" })
              }
            >
              <MenuItem value="expense">Despesa</MenuItem>
              <MenuItem value="income">Receita</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Lista de itens */}
        <Stack spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2">
              Itens ({selectedCount}/{items.length} selecionados)
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => selectAll(selectedCount !== items.length)}
            >
              {selectedCount === items.length
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </Button>
          </Stack>

          {displayItems.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1.5,
                borderRadius: 1,
                bgcolor: item.selected ? "action.selected" : "action.hover",
                opacity: item.selected ? 1 : 0.6,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Checkbox
                  checked={item.selected}
                  onChange={() => toggleItem(index)}
                  size="small"
                />
                <TextField
                  value={item.item}
                  onChange={(e) => updateItem(index, { item: e.target.value })}
                  size="small"
                  sx={{ flex: 2 }}
                  disabled={!item.selected}
                />
                <TextField
                  type="number"
                  value={item.amount}
                  onChange={(e) =>
                    updateItem(index, {
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  size="small"
                  sx={{ width: 100 }}
                  disabled={!item.selected}
                  inputProps={{ step: "0.01" }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", minWidth: 30 }}
                >
                  x{item.quantity}
                </Typography>
              </Box>
              {/* Seletor de categoria e subcategoria por item */}
              {item.selected && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pl: 4.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", minWidth: 60 }}
                  >
                    Categoria:
                  </Typography>
                  <InlineCategorySelector
                    category={
                      (item as UnifiedItemForm).category || activeForm.category
                    }
                    subcategory={
                      (item as UnifiedItemForm).subcategory ||
                      activeForm.subcategory ||
                      ""
                    }
                    onCategoryChange={(category) =>
                      updateItem(index, { category })
                    }
                    onSubcategoryChange={(subcategory) =>
                      updateItem(index, { subcategory })
                    }
                    disabled={!item.selected}
                  />
                </Box>
              )}
            </Box>
          ))}

          {items.length > 5 && (
            <Button
              size="small"
              variant="text"
              onClick={() => setShowAllItems(!showAllItems)}
              startIcon={
                showAllItems ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )
              }
            >
              {showAllItems
                ? "Ver menos"
                : `Ver mais ${items.length - 5} itens`}
            </Button>
          )}
        </Stack>

        {/* Total */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1">Total Selecionado</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            R$ {totalSelected.toFixed(2)}
          </Typography>
        </Box>

        {/* Ações */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={isSaving}
            startIcon={<RotateCcw size={16} />}
          >
            Recomeçar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || selectedCount === 0}
            sx={{ flex: 1 }}
            startIcon={
              isSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Check size={16} />
              )
            }
          >
            {isSaving
              ? "Salvando..."
              : `Salvar ${selectedCount} ${
                  selectedCount === 1 ? "item" : "itens"
                }`}
          </Button>
        </Stack>
      </Stack>
    );
  };

  // Renderizar erro
  const renderError = () => {
    const error = nfceScanner.error;
    if (!error) return null;

    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Erro ao processar NFCe</AlertTitle>
        <Typography variant="body2">{error}</Typography>
        <Button size="small" onClick={handleReset} sx={{ mt: 1 }}>
          Tentar novamente
        </Button>
      </Alert>
    );
  };

  // Se já tem dados, mostrar formulário de edição
  if (hasData) {
    return (
      <Stack spacing={3}>
        {renderError()}
        {renderEditForm()}
      </Stack>
    );
  }

  // Se está processando
  if (isProcessing) {
    return renderProcessingSkeleton();
  }

  // Se houve erro sem dados
  if (nfceScanner.error) {
    return (
      <Stack spacing={3}>
        {renderError()}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleSwitchToPhoto}
            startIcon={<Camera size={16} />}
          >
            Tirar foto da nota
          </Button>
        </Box>
      </Stack>
    );
  }

  // Mostrar scanner (QR Code ou Foto)
  return (
    <Stack spacing={3}>
      {/* Tabs para escolher modo */}
      {!isMobile && (
        <Tabs
          value={scanMode === "photo" ? 1 : 0}
          onChange={(_, v) => setScanMode(v === 0 ? "qrcode" : "photo")}
          sx={{ mb: 2 }}
        >
          <Tab
            icon={<QrCode size={18} />}
            label="QR Code"
            iconPosition="start"
          />
          <Tab
            icon={<Camera size={18} />}
            label="Foto / Upload"
            iconPosition="start"
          />
        </Tabs>
      )}

      {/* Dica */}
      <Alert severity="info" icon={<Info size={18} />}>
        <AlertTitle>
          {scanMode === "photo" || !isMobile
            ? "Escaneie ou envie a nota fiscal"
            : "Escaneie o QR Code da NFCe"}
        </AlertTitle>
        <Typography variant="body2">
          {scanMode === "photo" || !isMobile
            ? "Tire uma foto da nota ou faça upload de uma imagem. A IA extrairá os itens automaticamente."
            : "Aponte a câmera para o QR Code da nota fiscal eletrônica. Os dados serão extraídos diretamente do portal da Fazenda."}
        </Typography>
      </Alert>

      {/* Scanner de QR Code (mobile) */}
      {isMobile && scanMode !== "photo" && (
        <QRCodeScanner
          onQRCodeDetected={handleQRCodeDetected}
          onSwitchToPhoto={handleSwitchToPhoto}
        />
      )}

      {/* Scanner de foto/IA */}
      {(scanMode === "photo" || !isMobile) && (
        <>
          {/* Seletor de IA (apenas para foto) */}
          {receiptScanner.canSelectProvider && (
            <FormControl size="small" fullWidth>
              <InputLabel>Provedor de IA</InputLabel>
              <Select
                value={receiptScanner.selectedAI}
                label="Provedor de IA"
                onChange={(e) => receiptScanner.setSelectedAI(e.target.value)}
              >
                {receiptScanner.visionCapableCredentials.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                    {c.id === DEFAULT_AI_CREDENTIAL.id && (
                      <Chip label="Padrão" size="small" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isMobile ? (
            <>
              <MobileCamera onCapture={handlePhotoCapture} />
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  OU
                </Typography>
              </Divider>
              <FileUpload onFileSelect={handlePhotoCapture} variant="button" />
              <Button
                variant="text"
                onClick={handleSwitchToQRCode}
                startIcon={<QrCode size={16} />}
              >
                Voltar para QR Code
              </Button>
            </>
          ) : (
            <FileUpload onFileSelect={handlePhotoCapture} />
          )}
        </>
      )}
    </Stack>
  );
}
