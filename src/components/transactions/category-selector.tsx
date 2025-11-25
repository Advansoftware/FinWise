// src/components/transactions/category-selector.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Divider,
  Collapse,
  FormControl,
  InputLabel,
  ListSubheader,
} from "@mui/material";
import { Plus, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { TransactionCategory } from "@/lib/types";
import { useTransactions } from "@/hooks/use-transactions";

interface CategorySelectorProps {
  category: TransactionCategory;
  subcategory?: string;
  onCategoryChange: (category: TransactionCategory) => void;
  onSubcategoryChange?: (subcategory: string) => void;
  size?: "small" | "medium";
  showSubcategory?: boolean;
  variant?: "full" | "compact";
  disabled?: boolean;
}

export function CategorySelector({
  category,
  subcategory = "",
  onCategoryChange,
  onSubcategoryChange,
  size = "small",
  showSubcategory = true,
  variant = "full",
  disabled = false,
}: CategorySelectorProps) {
  const { categories, subcategories, addCategory, addSubcategory } =
    useTransactions();

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [expanded, setExpanded] = useState(false);

  const currentSubcategories = subcategories[category] || [];

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    const trimmedName = newCategoryName.trim() as TransactionCategory;
    await addCategory(trimmedName);
    onCategoryChange(trimmedName);
    setNewCategoryName("");
    setIsCreatingCategory(false);
  }, [newCategoryName, addCategory, onCategoryChange]);

  const handleCreateSubcategory = useCallback(async () => {
    if (!newSubcategoryName.trim() || !category) return;

    const trimmedName = newSubcategoryName.trim();
    await addSubcategory(category, trimmedName);
    onSubcategoryChange?.(trimmedName);
    setNewSubcategoryName("");
    setIsCreatingSubcategory(false);
  }, [newSubcategoryName, category, addSubcategory, onSubcategoryChange]);

  const handleCategorySelectChange = (value: string) => {
    if (value === "__create__") {
      setIsCreatingCategory(true);
    } else {
      onCategoryChange(value as TransactionCategory);
      // Limpar subcategoria se mudar de categoria
      if (value !== category) {
        onSubcategoryChange?.("");
      }
    }
  };

  const handleSubcategorySelectChange = (value: string) => {
    if (value === "__create__") {
      setIsCreatingSubcategory(true);
    } else {
      onSubcategoryChange?.(value);
    }
  };

  // Versão compacta para uso em listas
  if (variant === "compact") {
    return (
      <Box sx={{ width: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          onClick={() => !disabled && setExpanded(!expanded)}
          sx={{
            cursor: disabled ? "default" : "pointer",
            "&:hover": disabled ? {} : { bgcolor: "action.hover" },
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {category}
            {subcategory && ` / ${subcategory}`}
          </Typography>
          {!disabled &&
            (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </Stack>

        <Collapse in={expanded && !disabled}>
          <Stack spacing={1} sx={{ mt: 1, pl: 1 }}>
            {/* Categoria */}
            {isCreatingCategory ? (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <TextField
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCategory();
                    if (e.key === "Escape") setIsCreatingCategory(false);
                  }}
                  placeholder="Nova categoria"
                  size="small"
                  sx={{ flex: 1 }}
                  InputProps={{ style: { fontSize: "0.75rem" } }}
                />
                <IconButton
                  size="small"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  color="primary"
                >
                  <Check size={14} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategoryName("");
                  }}
                >
                  <X size={14} />
                </IconButton>
              </Stack>
            ) : (
              <Select
                value={category}
                onChange={(e) => handleCategorySelectChange(e.target.value)}
                size="small"
                fullWidth
                sx={{ fontSize: "0.75rem" }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: "0.75rem" }}>
                    {cat}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem
                  value="__create__"
                  sx={{ fontSize: "0.75rem", color: "primary.main" }}
                >
                  <Plus size={14} style={{ marginRight: 4 }} />
                  Criar nova categoria
                </MenuItem>
              </Select>
            )}

            {/* Subcategoria */}
            {showSubcategory && (
              <>
                {isCreatingSubcategory ? (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <TextField
                      autoFocus
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateSubcategory();
                        if (e.key === "Escape") setIsCreatingSubcategory(false);
                      }}
                      placeholder="Nova subcategoria"
                      size="small"
                      sx={{ flex: 1 }}
                      InputProps={{ style: { fontSize: "0.75rem" } }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleCreateSubcategory}
                      disabled={!newSubcategoryName.trim()}
                      color="primary"
                    >
                      <Check size={14} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsCreatingSubcategory(false);
                        setNewSubcategoryName("");
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Stack>
                ) : (
                  <Select
                    value={subcategory}
                    onChange={(e) =>
                      handleSubcategorySelectChange(e.target.value)
                    }
                    size="small"
                    fullWidth
                    displayEmpty
                    sx={{ fontSize: "0.75rem" }}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.75rem" }}>
                      <em>Sem subcategoria</em>
                    </MenuItem>
                    {currentSubcategories.map((sub) => (
                      <MenuItem
                        key={sub}
                        value={sub}
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {sub}
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem
                      value="__create__"
                      sx={{ fontSize: "0.75rem", color: "primary.main" }}
                    >
                      <Plus size={14} style={{ marginRight: 4 }} />
                      Criar nova subcategoria
                    </MenuItem>
                  </Select>
                )}
              </>
            )}
          </Stack>
        </Collapse>
      </Box>
    );
  }

  // Versão completa para formulários
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {/* Categoria */}
      {isCreatingCategory ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateCategory();
              if (e.key === "Escape") setIsCreatingCategory(false);
            }}
            placeholder="Nome da nova categoria"
            size={size}
            fullWidth
            label="Nova Categoria"
          />
          <IconButton
            onClick={handleCreateCategory}
            disabled={!newCategoryName.trim()}
            color="primary"
          >
            <Check size={18} />
          </IconButton>
          <IconButton
            onClick={() => {
              setIsCreatingCategory(false);
              setNewCategoryName("");
            }}
          >
            <X size={18} />
          </IconButton>
        </Stack>
      ) : (
        <FormControl size={size} fullWidth disabled={disabled}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={category}
            label="Categoria"
            onChange={(e) => handleCategorySelectChange(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem value="__create__" sx={{ color: "primary.main" }}>
              <Plus size={16} style={{ marginRight: 8 }} />
              Criar nova categoria
            </MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Subcategoria */}
      {showSubcategory && (
        <>
          {isCreatingSubcategory ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                autoFocus
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSubcategory();
                  if (e.key === "Escape") setIsCreatingSubcategory(false);
                }}
                placeholder="Nome da nova subcategoria"
                size={size}
                fullWidth
                label="Nova Subcategoria"
              />
              <IconButton
                onClick={handleCreateSubcategory}
                disabled={!newSubcategoryName.trim()}
                color="primary"
              >
                <Check size={18} />
              </IconButton>
              <IconButton
                onClick={() => {
                  setIsCreatingSubcategory(false);
                  setNewSubcategoryName("");
                }}
              >
                <X size={18} />
              </IconButton>
            </Stack>
          ) : (
            <FormControl size={size} fullWidth disabled={disabled}>
              <InputLabel>Subcategoria</InputLabel>
              <Select
                value={subcategory}
                label="Subcategoria"
                onChange={(e) => handleSubcategorySelectChange(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Sem subcategoria</em>
                </MenuItem>
                {currentSubcategories.length > 0 && (
                  <ListSubheader>{category}</ListSubheader>
                )}
                {currentSubcategories.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem value="__create__" sx={{ color: "primary.main" }}>
                  <Plus size={16} style={{ marginRight: 8 }} />
                  Criar nova subcategoria
                </MenuItem>
              </Select>
            </FormControl>
          )}
        </>
      )}
    </Stack>
  );
}

// Versão simplificada para uso inline em itens
interface InlineCategorySelectorProps {
  category: TransactionCategory;
  subcategory?: string;
  onCategoryChange: (category: TransactionCategory) => void;
  onSubcategoryChange?: (subcategory: string) => void;
  disabled?: boolean;
}

export function InlineCategorySelector({
  category,
  subcategory = "",
  onCategoryChange,
  onSubcategoryChange,
  disabled = false,
}: InlineCategorySelectorProps) {
  const { categories, subcategories, addCategory, addSubcategory } =
    useTransactions();

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const currentSubcategories = subcategories[category] || [];

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    const trimmedName = newCategoryName.trim() as TransactionCategory;
    await addCategory(trimmedName);
    onCategoryChange(trimmedName);
    setNewCategoryName("");
    setIsCreatingCategory(false);
  }, [newCategoryName, addCategory, onCategoryChange]);

  const handleCreateSubcategory = useCallback(async () => {
    if (!newSubcategoryName.trim() || !category) return;
    const trimmedName = newSubcategoryName.trim();
    await addSubcategory(category, trimmedName);
    onSubcategoryChange?.(trimmedName);
    setNewSubcategoryName("");
    setIsCreatingSubcategory(false);
  }, [newSubcategoryName, category, addSubcategory, onSubcategoryChange]);

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
      {/* Categoria */}
      {isCreatingCategory ? (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ flex: 1 }}
        >
          <TextField
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateCategory();
              if (e.key === "Escape") {
                setIsCreatingCategory(false);
                setNewCategoryName("");
              }
            }}
            placeholder="Nova categoria"
            size="small"
            sx={{ flex: 1, minWidth: 100 }}
            InputProps={{ style: { fontSize: "0.8rem" } }}
          />
          <IconButton
            size="small"
            onClick={handleCreateCategory}
            disabled={!newCategoryName.trim()}
            color="primary"
          >
            <Check size={14} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setIsCreatingCategory(false);
              setNewCategoryName("");
            }}
          >
            <X size={14} />
          </IconButton>
        </Stack>
      ) : (
        <Select
          value={category}
          onChange={(e) => {
            const value = e.target.value as string;
            if (value === "__create__") {
              setIsCreatingCategory(true);
            } else {
              onCategoryChange(value as TransactionCategory);
              if (value !== category) {
                onSubcategoryChange?.("");
              }
            }
          }}
          size="small"
          disabled={disabled}
          sx={{ flex: 1, minWidth: 100 }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
          <Divider />
          <MenuItem value="__create__" sx={{ color: "primary.main" }}>
            <Plus size={14} style={{ marginRight: 4 }} />
            Nova
          </MenuItem>
        </Select>
      )}

      {/* Subcategoria */}
      {onSubcategoryChange && (
        <>
          {isCreatingSubcategory ? (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ flex: 1 }}
            >
              <TextField
                autoFocus
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSubcategory();
                  if (e.key === "Escape") {
                    setIsCreatingSubcategory(false);
                    setNewSubcategoryName("");
                  }
                }}
                placeholder="Nova sub"
                size="small"
                sx={{ flex: 1, minWidth: 80 }}
                InputProps={{ style: { fontSize: "0.8rem" } }}
              />
              <IconButton
                size="small"
                onClick={handleCreateSubcategory}
                disabled={!newSubcategoryName.trim()}
                color="primary"
              >
                <Check size={14} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setIsCreatingSubcategory(false);
                  setNewSubcategoryName("");
                }}
              >
                <X size={14} />
              </IconButton>
            </Stack>
          ) : (
            <Select
              value={subcategory}
              onChange={(e) => {
                if (e.target.value === "__create__") {
                  setIsCreatingSubcategory(true);
                } else {
                  onSubcategoryChange(e.target.value);
                }
              }}
              size="small"
              disabled={disabled}
              displayEmpty
              sx={{ flex: 1, minWidth: 80 }}
            >
              <MenuItem value="">
                <em>-</em>
              </MenuItem>
              {currentSubcategories.map((sub) => (
                <MenuItem key={sub} value={sub}>
                  {sub}
                </MenuItem>
              ))}
              {currentSubcategories.length > 0 && <Divider />}
              <MenuItem value="__create__" sx={{ color: "primary.main" }}>
                <Plus size={14} style={{ marginRight: 4 }} />
                Nova
              </MenuItem>
            </Select>
          )}
        </>
      )}
    </Stack>
  );
}
