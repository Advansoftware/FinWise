"use client";

import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
  Alert,
  Button,
  TextField,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronDown,
  Lock,
  Copy,
  CheckCircle,
  ArrowLeft,
  Terminal,
  Shield,
  Play,
  LogOut,
  Menu,
  Wallet,
  Target,
  PieChart,
  Calendar,
  FileText,
  Settings,
  CreditCard,
  Tag,
  Key,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

// Cookie name for API docs auth (separate from main app)
const API_DOCS_TOKEN_COOKIE = "finwise_api_docs_token";

// Method badge colors
const methodColors: Record<string, string> = {
  GET: "#4caf50",
  POST: "#2196f3",
  PUT: "#ff9800",
  DELETE: "#f44336",
  PATCH: "#9c27b0",
};

interface Field {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
}

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  category: string;
  pathParams?: string[];
  queryParams?: Field[];
  requestBody?: {
    fields: Field[];
    example: object;
  };
  responseExample: object;
  errors?: { code: number; message: string }[];
}

// Complete API endpoints organized by category
const endpoints: Endpoint[] = [
  // ===== AUTH =====
  {
    method: "POST",
    path: "/api/v1/login",
    title: "Login",
    description:
      "Autenticar usuário e obter tokens JWT. Requer plano Infinity.",
    requiresAuth: false,
    category: "auth",
    requestBody: {
      fields: [
        {
          name: "email",
          type: "string",
          required: true,
          description: "Email do usuário",
        },
        {
          name: "password",
          type: "string",
          required: true,
          description: "Senha do usuário",
        },
      ],
      example: { email: "usuario@email.com", password: "sua_senha_aqui" },
    },
    responseExample: {
      user: {
        id: "...",
        email: "usuario@email.com",
        name: "Nome",
        plan: "Infinity",
      },
      tokens: { accessToken: "eyJhbGc...", refreshToken: "eyJhbGc..." },
    },
    errors: [
      { code: 400, message: "Email and password are required" },
      { code: 401, message: "Invalid email or password" },
      { code: 403, message: "Mobile API access requires Infinity plan" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/refresh",
    title: "Refresh Token",
    description: "Renovar o access token usando o refresh token.",
    requiresAuth: false,
    category: "auth",
    requestBody: {
      fields: [
        {
          name: "refreshToken",
          type: "string",
          required: true,
          description: "Refresh token obtido no login",
        },
      ],
      example: { refreshToken: "eyJhbGc..." },
    },
    responseExample: {
      accessToken: "eyJhbGc...",
      user: { id: "...", email: "...", plan: "Infinity" },
      expiresIn: 900,
    },
  },
  {
    method: "GET",
    path: "/api/v1/me",
    title: "Perfil do Usuário",
    description: "Obter informações do usuário autenticado.",
    requiresAuth: true,
    category: "auth",
    responseExample: {
      user: {
        id: "abc123",
        email: "usuario@email.com",
        name: "Nome",
        plan: "Infinity",
        aiCredits: 100,
      },
    },
  },

  // ===== WALLETS =====
  {
    method: "GET",
    path: "/api/v1/wallets",
    title: "Listar Carteiras",
    description: "Obter todas as carteiras do usuário.",
    requiresAuth: true,
    category: "wallets",
    responseExample: [
      {
        id: "123",
        name: "Conta Principal",
        type: "Conta Corrente",
        balance: 1500.0,
      },
      {
        id: "456",
        name: "Cartão Nubank",
        type: "Cartão de Crédito",
        balance: -250.0,
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/wallets",
    title: "Criar Carteira",
    description: "Criar uma nova carteira.",
    requiresAuth: true,
    category: "wallets",
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Nome da carteira",
        },
        {
          name: "type",
          type: "string",
          required: true,
          description:
            "Tipo: Conta Corrente, Cartão de Crédito, Poupança, Investimentos, Dinheiro, Outros",
        },
        {
          name: "balance",
          type: "number",
          required: false,
          defaultValue: 0,
          description: "Saldo inicial",
        },
      ],
      example: { name: "Poupança", type: "Poupança", balance: 5000 },
    },
    responseExample: {
      id: "789",
      name: "Poupança",
      type: "Poupança",
      balance: 5000,
    },
  },
  {
    method: "GET",
    path: "/api/v1/wallets/[id]",
    title: "Detalhes da Carteira",
    description: "Obter detalhes de uma carteira específica.",
    requiresAuth: true,
    category: "wallets",
    pathParams: ["id"],
    responseExample: {
      id: "123",
      name: "Conta Principal",
      type: "Conta Corrente",
      balance: 1500.0,
    },
  },
  {
    method: "PUT",
    path: "/api/v1/wallets/[id]",
    title: "Atualizar Carteira",
    description: "Atualizar detalhes de uma carteira.",
    requiresAuth: true,
    category: "wallets",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: false,
          description: "Novo nome",
        },
        {
          name: "type",
          type: "string",
          required: false,
          description: "Novo tipo",
        },
        {
          name: "balance",
          type: "number",
          required: false,
          description: "Ajuste manual de saldo",
        },
      ],
      example: { name: "Conta Salário", balance: 2000 },
    },
    responseExample: { success: true, id: "123", name: "Conta Salário" },
  },
  {
    method: "DELETE",
    path: "/api/v1/wallets/[id]",
    title: "Excluir Carteira",
    description: "Excluir uma carteira permanentemente.",
    requiresAuth: true,
    category: "wallets",
    pathParams: ["id"],
    responseExample: { success: true, message: "Wallet deleted" },
  },

  // ===== TRANSACTIONS =====
  {
    method: "GET",
    path: "/api/v1/transactions",
    title: "Listar Transações",
    description: "Obter as últimas 100 transações do usuário.",
    requiresAuth: true,
    category: "transactions",
    responseExample: [
      {
        id: "tx1",
        amount: 50.0,
        type: "expense",
        category: "Alimentação",
        item: "Almoço",
        date: "2024-12-14",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/transactions",
    title: "Criar Transação",
    description:
      "Criar uma nova transação (atualiza saldo da carteira automaticamente).",
    requiresAuth: true,
    category: "transactions",
    requestBody: {
      fields: [
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Valor da transação",
        },
        {
          name: "walletId",
          type: "string",
          required: true,
          description: "ID da carteira",
        },
        {
          name: "type",
          type: "string",
          required: true,
          description: "Tipo: income, expense, transfer",
        },
        {
          name: "category",
          type: "string",
          required: true,
          description: "Categoria",
        },
        {
          name: "item",
          type: "string",
          required: true,
          description: "Descrição do item",
        },
        {
          name: "date",
          type: "string",
          required: false,
          description: "Data (ISO 8601), padrão: hoje",
        },
        {
          name: "establishment",
          type: "string",
          required: false,
          description: "Estabelecimento",
        },
        {
          name: "subcategory",
          type: "string",
          required: false,
          description: "Subcategoria",
        },
      ],
      example: {
        amount: 150.0,
        walletId: "123",
        type: "expense",
        category: "Supermercado",
        item: "Compras do mês",
      },
    },
    responseExample: {
      id: "tx2",
      transaction: { amount: 150.0, type: "expense" },
    },
  },
  {
    method: "GET",
    path: "/api/v1/transactions/[id]",
    title: "Detalhes da Transação",
    description: "Obter detalhes de uma transação específica.",
    requiresAuth: true,
    category: "transactions",
    pathParams: ["id"],
    responseExample: {
      id: "tx1",
      amount: 50.0,
      type: "expense",
      category: "Alimentação",
    },
  },
  {
    method: "PUT",
    path: "/api/v1/transactions/[id]",
    title: "Atualizar Transação",
    description: "Atualizar uma transação (recalcula saldos automaticamente).",
    requiresAuth: true,
    category: "transactions",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "amount",
          type: "number",
          required: false,
          description: "Novo valor",
        },
        {
          name: "item",
          type: "string",
          required: false,
          description: "Nova descrição",
        },
        {
          name: "category",
          type: "string",
          required: false,
          description: "Nova categoria",
        },
      ],
      example: { amount: 60.0, item: "Almoço atualizado" },
    },
    responseExample: { success: true, transaction: { amount: 60.0 } },
  },
  {
    method: "DELETE",
    path: "/api/v1/transactions/[id]",
    title: "Excluir Transação",
    description: "Excluir uma transação (reverte saldo da carteira).",
    requiresAuth: true,
    category: "transactions",
    pathParams: ["id"],
    responseExample: { success: true, message: "Transaction deleted" },
  },

  // ===== BUDGETS =====
  {
    method: "GET",
    path: "/api/v1/budgets",
    title: "Listar Orçamentos",
    description: "Obter todos os orçamentos do usuário.",
    requiresAuth: true,
    category: "budgets",
    responseExample: [
      {
        id: "b1",
        name: "Alimentação Mensal",
        category: "Alimentação",
        amount: 800,
        period: "monthly",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/budgets",
    title: "Criar Orçamento",
    description: "Criar um novo orçamento por categoria.",
    requiresAuth: true,
    category: "budgets",
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Nome do orçamento",
        },
        {
          name: "category",
          type: "string",
          required: true,
          description: "Categoria a monitorar",
        },
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Limite de gastos",
        },
        {
          name: "period",
          type: "string",
          required: false,
          defaultValue: "monthly",
          description: "Período: monthly",
        },
      ],
      example: { name: "Transporte", category: "Transporte", amount: 500 },
    },
    responseExample: {
      id: "b2",
      name: "Transporte",
      category: "Transporte",
      amount: 500,
    },
  },
  {
    method: "GET",
    path: "/api/v1/budgets/[id]",
    title: "Detalhes do Orçamento",
    description: "Obter detalhes de um orçamento específico.",
    requiresAuth: true,
    category: "budgets",
    pathParams: ["id"],
    responseExample: {
      id: "b1",
      name: "Alimentação",
      category: "Alimentação",
      amount: 800,
    },
  },
  {
    method: "PUT",
    path: "/api/v1/budgets/[id]",
    title: "Atualizar Orçamento",
    description: "Atualizar um orçamento existente.",
    requiresAuth: true,
    category: "budgets",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: false,
          description: "Novo nome",
        },
        {
          name: "amount",
          type: "number",
          required: false,
          description: "Novo limite",
        },
      ],
      example: { amount: 600 },
    },
    responseExample: { success: true, id: "b1", amount: 600 },
  },
  {
    method: "DELETE",
    path: "/api/v1/budgets/[id]",
    title: "Excluir Orçamento",
    description: "Excluir um orçamento.",
    requiresAuth: true,
    category: "budgets",
    pathParams: ["id"],
    responseExample: { success: true, message: "Budget deleted" },
  },

  // ===== GOALS =====
  {
    method: "GET",
    path: "/api/v1/goals",
    title: "Listar Metas",
    description: "Obter todas as metas financeiras do usuário.",
    requiresAuth: true,
    category: "goals",
    responseExample: [
      {
        id: "g1",
        name: "Reserva de Emergência",
        targetAmount: 10000,
        currentAmount: 3500,
        monthlyDeposit: 500,
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/goals",
    title: "Criar Meta",
    description: "Criar uma nova meta financeira.",
    requiresAuth: true,
    category: "goals",
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Nome da meta",
        },
        {
          name: "targetAmount",
          type: "number",
          required: true,
          description: "Valor alvo",
        },
        {
          name: "currentAmount",
          type: "number",
          required: false,
          defaultValue: 0,
          description: "Valor atual",
        },
        {
          name: "monthlyDeposit",
          type: "number",
          required: false,
          description: "Depósito mensal planejado",
        },
        {
          name: "targetDate",
          type: "string",
          required: false,
          description: "Data alvo (ISO 8601)",
        },
      ],
      example: { name: "Viagem", targetAmount: 5000, monthlyDeposit: 400 },
    },
    responseExample: {
      id: "g2",
      name: "Viagem",
      targetAmount: 5000,
      currentAmount: 0,
    },
  },
  {
    method: "GET",
    path: "/api/v1/goals/[id]",
    title: "Detalhes da Meta",
    description: "Obter detalhes de uma meta específica.",
    requiresAuth: true,
    category: "goals",
    pathParams: ["id"],
    responseExample: {
      id: "g1",
      name: "Reserva",
      targetAmount: 10000,
      currentAmount: 3500,
    },
  },
  {
    method: "PUT",
    path: "/api/v1/goals/[id]",
    title: "Atualizar Meta",
    description: "Atualizar uma meta existente.",
    requiresAuth: true,
    category: "goals",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: false,
          description: "Novo nome",
        },
        {
          name: "targetAmount",
          type: "number",
          required: false,
          description: "Novo valor alvo",
        },
        {
          name: "currentAmount",
          type: "number",
          required: false,
          description: "Valor atual",
        },
        {
          name: "monthlyDeposit",
          type: "number",
          required: false,
          description: "Depósito mensal",
        },
      ],
      example: { currentAmount: 4000 },
    },
    responseExample: { success: true, id: "g1", currentAmount: 4000 },
  },
  {
    method: "POST",
    path: "/api/v1/goals/[id]/deposit",
    title: "Adicionar Depósito",
    description: "Adicionar um depósito a uma meta.",
    requiresAuth: true,
    category: "goals",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Valor do depósito",
        },
      ],
      example: { amount: 500 },
    },
    responseExample: {
      success: true,
      previousAmount: 3500,
      depositAmount: 500,
      newCurrentAmount: 4000,
      progress: 40,
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/goals/[id]",
    title: "Excluir Meta",
    description: "Excluir uma meta.",
    requiresAuth: true,
    category: "goals",
    pathParams: ["id"],
    responseExample: { success: true, message: "Goal deleted" },
  },

  // ===== INSTALLMENTS =====
  {
    method: "GET",
    path: "/api/v1/installments",
    title: "Listar Parcelamentos",
    description:
      "Obter todos os parcelamentos do usuário. Use ?action=summary para resumo.",
    requiresAuth: true,
    category: "installments",
    queryParams: [
      {
        name: "action",
        type: "string",
        required: false,
        description: "Ação: summary para resumo",
      },
    ],
    responseExample: [
      {
        id: "i1",
        name: 'TV 55"',
        totalInstallments: 12,
        installmentAmount: 250,
        payments: [],
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/installments",
    title: "Criar Parcelamento",
    description: "Criar um novo parcelamento ou despesa recorrente.",
    requiresAuth: true,
    category: "installments",
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Nome/descrição",
        },
        {
          name: "totalInstallments",
          type: "number",
          required: true,
          description: "Total de parcelas",
        },
        {
          name: "installmentAmount",
          type: "number",
          required: true,
          description: "Valor da parcela",
        },
        {
          name: "startDate",
          type: "string",
          required: true,
          description: "Data início (ISO 8601)",
        },
        {
          name: "category",
          type: "string",
          required: false,
          description: "Categoria",
        },
        {
          name: "isRecurring",
          type: "boolean",
          required: false,
          description: "Se é despesa fixa/recorrente",
        },
        {
          name: "walletId",
          type: "string",
          required: false,
          description: "ID da carteira",
        },
      ],
      example: {
        name: "Celular",
        totalInstallments: 10,
        installmentAmount: 300,
        startDate: "2024-12-01",
      },
    },
    responseExample: {
      id: "i2",
      name: "Celular",
      totalInstallments: 10,
      installmentAmount: 300,
    },
  },
  {
    method: "GET",
    path: "/api/v1/installments/[id]",
    title: "Detalhes do Parcelamento",
    description: "Obter detalhes de um parcelamento.",
    requiresAuth: true,
    category: "installments",
    pathParams: ["id"],
    responseExample: {
      id: "i1",
      name: "TV",
      totalInstallments: 12,
      installmentAmount: 250,
      payments: [],
    },
  },
  {
    method: "POST",
    path: "/api/v1/installments/[id]/pay",
    title: "Marcar Parcela como Paga",
    description: "Registrar pagamento de uma parcela.",
    requiresAuth: true,
    category: "installments",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "installmentNumber",
          type: "number",
          required: true,
          description: "Número da parcela (1-indexed)",
        },
        {
          name: "paidAmount",
          type: "number",
          required: false,
          description: "Valor pago (padrão: valor da parcela)",
        },
        {
          name: "paidDate",
          type: "string",
          required: false,
          description: "Data do pagamento",
        },
      ],
      example: { installmentNumber: 1 },
    },
    responseExample: {
      success: true,
      paidCount: 1,
      totalInstallments: 12,
      remaining: 11,
    },
  },
  {
    method: "PUT",
    path: "/api/v1/installments/[id]",
    title: "Atualizar Parcelamento",
    description: "Atualizar um parcelamento.",
    requiresAuth: true,
    category: "installments",
    pathParams: ["id"],
    requestBody: {
      fields: [
        {
          name: "name",
          type: "string",
          required: false,
          description: "Novo nome",
        },
        {
          name: "installmentAmount",
          type: "number",
          required: false,
          description: "Novo valor",
        },
      ],
      example: { name: "TV 55 polegadas" },
    },
    responseExample: { success: true, id: "i1" },
  },
  {
    method: "DELETE",
    path: "/api/v1/installments/[id]",
    title: "Excluir Parcelamento",
    description: "Excluir um parcelamento.",
    requiresAuth: true,
    category: "installments",
    pathParams: ["id"],
    responseExample: { success: true, message: "Installment deleted" },
  },

  // ===== REPORTS =====
  {
    method: "GET",
    path: "/api/v1/reports",
    title: "Listar Relatórios",
    description: "Obter relatórios gerados. Filtros opcionais: type, period.",
    requiresAuth: true,
    category: "reports",
    queryParams: [
      {
        name: "type",
        type: "string",
        required: false,
        description: "Tipo: monthly ou annual",
      },
      {
        name: "period",
        type: "string",
        required: false,
        description: "Período: 2024-12 ou 2024",
      },
    ],
    responseExample: [
      {
        id: "r1",
        type: "monthly",
        period: "2024-12",
        data: { totalIncome: 5000, totalExpense: 3000 },
      },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/reports",
    title: "Salvar Relatório",
    description: "Salvar ou atualizar um relatório.",
    requiresAuth: true,
    category: "reports",
    requestBody: {
      fields: [
        {
          name: "type",
          type: "string",
          required: true,
          description: "Tipo: monthly ou annual",
        },
        {
          name: "period",
          type: "string",
          required: true,
          description: "Período: 2024-12 ou 2024",
        },
        {
          name: "data",
          type: "object",
          required: true,
          description: "Dados do relatório",
        },
      ],
      example: {
        type: "monthly",
        period: "2024-12",
        data: { totalIncome: 5000, totalExpense: 3000 },
      },
    },
    responseExample: { id: "r1", type: "monthly", period: "2024-12" },
  },

  // ===== CATEGORIES =====
  {
    method: "GET",
    path: "/api/v1/categories",
    title: "Listar Categorias",
    description: "Obter categorias (padrão + customizadas) do usuário.",
    requiresAuth: true,
    category: "categories",
    responseExample: {
      categories: {
        Alimentação: ["Restaurante", "Supermercado"],
        Transporte: ["Combustível", "Uber"],
      },
      customCategories: {},
    },
  },
  {
    method: "POST",
    path: "/api/v1/categories",
    title: "Adicionar Categoria",
    description: "Adicionar categoria ou subcategoria customizada.",
    requiresAuth: true,
    category: "categories",
    requestBody: {
      fields: [
        {
          name: "category",
          type: "string",
          required: true,
          description: "Nome da categoria",
        },
        {
          name: "subcategory",
          type: "string",
          required: false,
          description: "Nome da subcategoria",
        },
      ],
      example: { category: "Pet", subcategory: "Ração" },
    },
    responseExample: { success: true, category: "Pet", subcategory: "Ração" },
  },
  {
    method: "DELETE",
    path: "/api/v1/categories",
    title: "Remover Categoria",
    description: "Remover categoria ou subcategoria customizada.",
    requiresAuth: true,
    category: "categories",
    queryParams: [
      {
        name: "category",
        type: "string",
        required: true,
        description: "Nome da categoria",
      },
      {
        name: "subcategory",
        type: "string",
        required: false,
        description: "Nome da subcategoria (opcional)",
      },
    ],
    responseExample: { success: true, removed: { category: "Pet" } },
  },

  // ===== SETTINGS =====
  {
    method: "GET",
    path: "/api/v1/settings",
    title: "Obter Configurações",
    description: "Obter configurações do usuário.",
    requiresAuth: true,
    category: "settings",
    responseExample: {
      userId: "abc123",
      categories: {},
      preferences: { currency: "BRL" },
      defaultWalletId: "123",
    },
  },
  {
    method: "PUT",
    path: "/api/v1/settings",
    title: "Atualizar Configurações",
    description: "Atualizar configurações do usuário.",
    requiresAuth: true,
    category: "settings",
    requestBody: {
      fields: [
        {
          name: "defaultWalletId",
          type: "string",
          required: false,
          description: "Carteira padrão",
        },
        {
          name: "currency",
          type: "string",
          required: false,
          description: "Moeda (BRL, USD, etc)",
        },
        {
          name: "locale",
          type: "string",
          required: false,
          description: "Localidade (pt-BR, en-US)",
        },
        {
          name: "preferences",
          type: "object",
          required: false,
          description: "Preferências gerais",
        },
      ],
      example: { defaultWalletId: "123", currency: "BRL" },
    },
    responseExample: {
      success: true,
      updated: ["defaultWalletId", "currency"],
    },
  },

  // ===== CREDITS =====
  {
    method: "GET",
    path: "/api/v1/credits",
    title: "Saldo de Créditos IA",
    description:
      "Obter saldo de créditos de IA. Use ?logs=true para incluir histórico.",
    requiresAuth: true,
    category: "credits",
    queryParams: [
      {
        name: "logs",
        type: "boolean",
        required: false,
        description: "Incluir histórico de uso",
      },
    ],
    responseExample: {
      aiCredits: 100,
      plan: "Infinity",
      logs: [
        {
          id: "l1",
          action: "Chat com Assistente",
          creditsUsed: 1,
          timestamp: "2024-12-14T10:00:00Z",
        },
      ],
    },
  },
];

// Category configuration
const categories = [
  { id: "auth", label: "Autenticação", icon: Key },
  { id: "wallets", label: "Carteiras", icon: Wallet },
  { id: "transactions", label: "Transações", icon: CreditCard },
  { id: "budgets", label: "Orçamentos", icon: PieChart },
  { id: "goals", label: "Metas", icon: Target },
  { id: "installments", label: "Parcelamentos", icon: Calendar },
  { id: "reports", label: "Relatórios", icon: FileText },
  { id: "categories", label: "Categorias", icon: Tag },
  { id: "settings", label: "Configurações", icon: Settings },
  { id: "credits", label: "Créditos IA", icon: CreditCard },
];

// Helper: Get/Set cookie for API docs token
function getApiDocsToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(`(^| )${API_DOCS_TOKEN_COOKIE}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[2]) : "";
}

function setApiDocsToken(token: string) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `${API_DOCS_TOKEN_COOKIE}=${encodeURIComponent(
      token
    )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = `${API_DOCS_TOKEN_COOKIE}=; path=/; max-age=0`;
  }
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          bgcolor: "background.paper",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {copied ? (
          <CheckCircle size={16} color="#4caf50" />
        ) : (
          <Copy size={16} />
        )}
      </IconButton>
      <Paper
        sx={{
          p: 2,
          bgcolor: "#1a1a2e",
          borderRadius: 2,
          overflow: "auto",
          maxHeight: 400,
        }}
      >
        <pre
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "#e0e0e0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <code>{code}</code>
        </pre>
      </Paper>
    </Box>
  );
}

function EndpointCard({
  endpoint,
  authToken,
  setAuthToken,
}: {
  endpoint: Endpoint;
  authToken: string;
  setAuthToken: (t: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});

  const initFields = () => {
    const initial: Record<string, any> = {};
    endpoint.requestBody?.fields.forEach((f) => {
      initial[f.name] = f.defaultValue !== undefined ? f.defaultValue : "";
    });
    setFormFields(initial);

    const pParams: Record<string, string> = {};
    endpoint.pathParams?.forEach((p) => {
      pParams[p] = "";
    });
    setPathParams(pParams);

    const qParams: Record<string, string> = {};
    endpoint.queryParams?.forEach((p) => {
      qParams[p.name] = "";
    });
    setQueryParams(qParams);
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handlePathParamChange = (name: string, value: string) => {
    setPathParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleQueryParamChange = (name: string, value: string) => {
    setQueryParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestRequest = async () => {
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };

      if (endpoint.requiresAuth && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      let finalPath = endpoint.path;
      if (endpoint.pathParams) {
        endpoint.pathParams.forEach((p) => {
          finalPath = finalPath.replace(`[${p}]`, pathParams[p] || "");
        });
      }

      // Add query params
      const validQueryParams = Object.entries(queryParams).filter(
        ([_, v]) => v !== ""
      );
      if (validQueryParams.length > 0) {
        const searchParams = new URLSearchParams();
        validQueryParams.forEach(([k, v]) => searchParams.append(k, v));
        finalPath += `?${searchParams.toString()}`;
      }

      const options: RequestInit = { method: endpoint.method, headers };

      if (
        (endpoint.method === "POST" ||
          endpoint.method === "PUT" ||
          endpoint.method === "PATCH") &&
        endpoint.requestBody
      ) {
        const bodyToSend: any = {};
        endpoint.requestBody.fields.forEach((f) => {
          let val = formFields[f.name];
          if (f.type === "number" && val !== "") val = Number(val);
          if (f.type === "boolean") val = val === "true" || val === true;
          if (val !== "" && val !== undefined) bodyToSend[f.name] = val;
        });
        options.body = JSON.stringify(bodyToSend);
      }

      const res = await fetch(finalPath, options);
      setResponseStatus(res.status);

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Failed to parse JSON response" };
      }
      setResponse(data);

      // Auto-save token on login success
      if (
        endpoint.path.includes("/login") &&
        res.ok &&
        data.tokens?.accessToken
      ) {
        setAuthToken(data.tokens.accessToken);
        setApiDocsToken(data.tokens.accessToken);
      }
    } catch (error: any) {
      setResponse({ error: error.message });
      setResponseStatus(500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => {
        setExpanded(isExpanded);
        if (isExpanded && Object.keys(formFields).length === 0) {
          initFields();
        }
      }}
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        mb: 1,
        "&:before": { display: "none" },
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={18} />}
        sx={{ "& .MuiAccordionSummary-content": { alignItems: "center" } }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} width="100%">
          <Chip
            label={endpoint.method}
            size="small"
            sx={{
              bgcolor: methodColors[endpoint.method],
              color: "white",
              fontWeight: 700,
              minWidth: 55,
              fontSize: "0.7rem",
            }}
          />
          <Typography
            sx={{
              fontFamily: "monospace",
              fontSize: "0.85rem",
              color: "text.primary",
              fontWeight: 500,
              flexGrow: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {endpoint.path}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", md: "block" } }}
          >
            {endpoint.title}
          </Typography>
          {endpoint.requiresAuth && (
            <Tooltip title={authToken ? "Autenticado" : "Requer autenticação"}>
              <Lock size={14} color={authToken ? "#4caf50" : "#ff9800"} />
            </Tooltip>
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {endpoint.description}
          </Typography>

          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 2, bgcolor: "action.hover" }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Terminal size={16} />
              <Typography variant="subtitle2" fontWeight="bold">
                Console de Teste
              </Typography>
            </Stack>

            {endpoint.requiresAuth && !authToken && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Autenticação necessária. Faça login primeiro.
              </Alert>
            )}

            <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
              {endpoint.pathParams?.map((param) => (
                <TextField
                  key={param}
                  label={`${param} (path)`}
                  size="small"
                  value={pathParams[param] || ""}
                  onChange={(e) => handlePathParamChange(param, e.target.value)}
                  required
                  color="warning"
                  sx={{ minWidth: 150 }}
                />
              ))}

              {endpoint.queryParams?.map((param) => (
                <TextField
                  key={param.name}
                  label={`${param.name} (query)`}
                  size="small"
                  value={queryParams[param.name] || ""}
                  onChange={(e) =>
                    handleQueryParamChange(param.name, e.target.value)
                  }
                  placeholder={param.description}
                  sx={{ minWidth: 150 }}
                />
              ))}

              {endpoint.requestBody?.fields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.name + (field.required ? " *" : "")}
                  size="small"
                  type={field.name.includes("password") ? "password" : "text"}
                  value={formFields[field.name] ?? ""}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.value)
                  }
                  placeholder={field.description}
                  sx={{
                    minWidth: field.type === "number" ? 100 : 180,
                    flexGrow: field.type === "object" ? 1 : 0,
                  }}
                />
              ))}
            </Stack>

            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Play size={16} />
                )
              }
              onClick={handleTestRequest}
              disabled={loading || (endpoint.requiresAuth && !authToken)}
              size="small"
            >
              {loading ? "Enviando..." : "Enviar"}
            </Button>

            {response && (
              <Box sx={{ mt: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">Resposta:</Typography>
                  <Chip
                    label={`Status: ${responseStatus}`}
                    color={
                      responseStatus &&
                      responseStatus >= 200 &&
                      responseStatus < 300
                        ? "success"
                        : "error"
                    }
                    size="small"
                  />
                </Stack>
                <CodeBlock code={JSON.stringify(response, null, 2)} />
              </Box>
            )}
          </Paper>

          {/* Example section */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Exemplo de Resposta:
          </Typography>
          <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />

          {endpoint.errors && endpoint.errors.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Possíveis Erros:
              </Typography>
              <Stack spacing={0.5}>
                {endpoint.errors.map((err, i) => (
                  <Typography key={i} variant="caption" color="text.secondary">
                    <strong>{err.code}</strong>: {err.message}
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ApiDocsPage() {
  const [authToken, setAuthToken] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("auth");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Load token from cookie on mount
  useEffect(() => {
    const savedToken = getApiDocsToken();
    if (savedToken) {
      setAuthToken(savedToken);
    }
  }, []);

  const handleLogout = () => {
    setAuthToken("");
    setApiDocsToken("");
  };

  const filteredEndpoints = endpoints.filter(
    (e) => e.category === selectedCategory
  );
  const currentCategory = categories.find((c) => c.id === selectedCategory);

  const sidebarContent = (
    <Box sx={{ width: 240, p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
        Recursos da API
      </Typography>
      <List dense>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count = endpoints.filter((e) => e.category === cat.id).length;
          return (
            <ListItem key={cat.id} disablePadding>
              <ListItemButton
                selected={selectedCategory === cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (isMobile) setDrawerOpen(false);
                }}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon size={18} />
                </ListItemIcon>
                <ListItemText primary={cat.label} />
                <Chip
                  label={count}
                  size="small"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" alignItems="center" gap={2}>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)}>
                <Menu size={20} />
              </IconButton>
            )}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              <Logo sx={{ width: 28, height: 28 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                API Docs
              </Typography>
            </Link>
            <Chip label="v1" size="small" color="primary" />
          </Stack>
          <Stack direction="row" alignItems="center" gap={1}>
            {authToken && (
              <Chip
                icon={<Shield size={14} />}
                label="Autenticado"
                color="success"
                size="small"
                onDelete={handleLogout}
                deleteIcon={<LogOut size={14} />}
              />
            )}
            <Button
              variant="outlined"
              component={Link}
              href="/"
              startIcon={<ArrowLeft size={16} />}
              size="small"
            >
              Voltar
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex" }}>
        {/* Sidebar */}
        {isMobile ? (
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {sidebarContent}
          </Drawer>
        ) : (
          <Paper
            sx={{
              width: 240,
              borderRadius: 0,
              borderRight: 1,
              borderColor: "divider",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            {sidebarContent}
          </Paper>
        )}

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 1 }}>
              {currentCategory && <currentCategory.icon size={24} />}
              <Typography variant="h4" fontWeight={700}>
                {currentCategory?.label}
              </Typography>
            </Stack>
            <Typography color="text.secondary">
              {filteredEndpoints.length} endpoint
              {filteredEndpoints.length !== 1 ? "s" : ""} disponível
            </Typography>
          </Box>

          {/* Auth Status */}
          {selectedCategory === "auth" && !authToken && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Como começar:</strong> Use o endpoint{" "}
                <code>/api/v1/login</code> abaixo para autenticar. O token será
                salvo automaticamente em um cookie separado (
                <code>{API_DOCS_TOKEN_COOKIE}</code>) para não conflitar com sua
                sessão normal do navegador.
              </Typography>
            </Alert>
          )}

          {/* Infinity Plan Warning */}
          <Alert severity="warning" sx={{ mb: 3 }} icon={<Shield size={20} />}>
            <Typography variant="body2">
              <strong>Acesso Restrito:</strong> A API v1 requer plano{" "}
              <strong>Infinity</strong>. A documentação é pública, mas apenas
              usuários Infinity podem testar as rotas.
            </Typography>
          </Alert>

          {/* Endpoints */}
          <Box>
            {filteredEndpoints.map((endpoint, index) => (
              <EndpointCard
                key={`${endpoint.method}-${endpoint.path}-${index}`}
                endpoint={endpoint}
                authToken={authToken}
                setAuthToken={setAuthToken}
              />
            ))}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              mt: 4,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Gastometria - API v1
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Base URL:{" "}
              <code>
                {typeof window !== "undefined" ? window.location.origin : ""}
                /api/v1
              </code>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
