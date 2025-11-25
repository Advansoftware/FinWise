// src/services/nfce-service.ts
"use server";

import { TransactionCategory } from "@/lib/types";

// Item extraído que casa com campos de Transaction
export interface NFCeItem {
  item: string;           // Transaction.item
  amount: number;         // Transaction.amount
  quantity: number;       // Transaction.quantity
  category: TransactionCategory; // Transaction.category
  unitPrice: number;      // Preço unitário (informativo)
}

// Resultado completo que casa com Transaction
export interface NFCeExtractionResult {
  success: boolean;
  error?: string;
  establishment: string;  // Transaction.establishment
  date: string;           // Data no formato DD/MM/YYYY
  items: NFCeItem[];      // Cada item vira uma Transaction filha
  totalAmount: number;    // Soma dos amounts
  suggestedCategory: TransactionCategory; // Categoria mais frequente
}

// Mapeamento de palavras-chave para categorias
const CATEGORY_KEYWORDS: Record<TransactionCategory, string[]> = {
  Supermercado: [
    "arroz", "feijao", "feijão", "açucar", "acucar", "sal", "oleo", "óleo",
    "leite", "pao", "pão", "cafe", "café", "carne", "frango", "peixe",
    "verdura", "legume", "fruta", "banana", "maçã", "maca", "laranja",
    "tomate", "cebola", "alho", "batata", "cenoura", "alface",
    "queijo", "presunto", "mortadela", "manteiga", "margarina",
    "iogurte", "creme", "biscoito", "bolacha", "macarrão", "macarrao",
    "molho", "tempero", "farinha", "ovos", "ovo", "detergente",
    "sabao", "sabão", "desinfetante", "papel", "guardanapo",
    "cerveja", "refrigerante", "suco", "agua", "água",
    "achocolatado", "cereal", "granola", "aveia", "mel",
    "shampoo", "condicionador", "sabonete", "creme dental",
    "escova", "fralda", "absorvente", "papel higienico",
    "hortifruti", "mercado", "supermercado", "atacado"
  ],
  Restaurante: [
    "almoco", "almoço", "jantar", "lanche", "hamburguer", "hambúrguer",
    "pizza", "sushi", "churrasco", "rodizio", "rodízio", "buffet",
    "restaurante", "delivery", "prato", "porção", "porcao", "bebida",
    "padaria", "confeitaria", "cafeteria"
  ],
  Transporte: [
    "gasolina", "alcool", "álcool", "diesel", "combustivel", "combustível",
    "posto", "estacionamento", "vaga", "pedágio", "pedagio"
  ],
  Saúde: [
    "farmacia", "farmácia", "remedio", "remédio", "medicamento",
    "vitamina", "suplemento", "proteina", "proteína", "dipirona",
    "paracetamol", "ibuprofeno", "dorflex"
  ],
  Vestuário: [
    "roupa", "camisa", "camiseta", "calça", "calca", "short", "bermuda",
    "vestido", "saia", "blusa", "casaco", "jaqueta", "moletom",
    "sapato", "tenis", "tênis", "sandalia", "sandália", "chinelo"
  ],
  Educação: ["livro", "caderno", "apostila", "caneta", "lapis", "lápis"],
  Lazer: ["ingresso", "cinema", "teatro", "show", "parque"],
  Entretenimento: ["jogo", "game", "brinquedo"],
  Contas: [],
  Outros: [],
  Salário: [],
  Investimentos: [],
  Vendas: [],
  Transferência: []
};

// Padrões de URLs de NFCe
const NFCE_URL_PATTERNS = [
  /portalsped\.fazenda\.mg\.gov\.br/i,
  /nfce\.fazenda\.sp\.gov\.br/i,
  /satsp\.fazenda\.sp\.gov\.br/i,
  /nfce\.fazenda\.rj\.gov\.br/i,
  /nfce\.sefa\.pr\.gov\.br/i,
  /nfce\.sef\.sc\.gov\.br/i,
  /nfce\.sefaz\.rs\.gov\.br/i,
  /nfe\.sefaz\.ba\.gov\.br/i,
  /nfe\.sefaz\.go\.gov\.br/i,
  /nfce\.sefaz\.pe\.gov\.br/i,
  /nfce\.sefaz\.ce\.gov\.br/i,
  /nfce\.fazenda\.df\.gov\.br/i,
  /portalsped/i,
  /nfce/i,
  /qrcode/i,
];

/**
 * Verifica se a URL é de um portal de NFCe
 */
export function isNFCeUrl(url: string): boolean {
  return NFCE_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Normaliza texto para comparação
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Verifica se duas categorias são similares (sinônimos)
 */
function areSimilarCategories(cat1: string, cat2: string): boolean {
  const synonyms: Record<string, string[]> = {
    supermercado: ["mercado", "compras", "alimentacao", "alimentos", "comida"],
    restaurante: ["alimentacao", "comida", "refeicao", "lanche"],
    transporte: ["combustivel", "gasolina", "uber", "mobilidade", "veiculo", "carro"],
    saude: ["farmacia", "medicamento", "remedio", "hospital", "medico"],
    casa: ["moradia", "residencia", "lar", "domestico", "manutencao"],
    vestuario: ["roupas", "calcados", "acessorios", "moda"],
    educacao: ["estudo", "escola", "faculdade", "curso", "livros"],
    lazer: ["entretenimento", "diversao", "hobby", "cultura"],
    eletronicos: ["tecnologia", "informatica", "gadgets", "dispositivos"],
    pet: ["animal", "animais", "cachorro", "gato", "veterinario"],
  };

  const normalizedCat1 = normalizeText(cat1);
  const normalizedCat2 = normalizeText(cat2);

  for (const [key, values] of Object.entries(synonyms)) {
    const allTerms = [key, ...values];
    // Verificar se ambas categorias estão relacionadas ao mesmo grupo
    const cat1Match = allTerms.some((term) =>
      normalizedCat1.includes(term) || term.includes(normalizedCat1)
    );
    const cat2Match = allTerms.some((term) =>
      normalizedCat2.includes(term) || term.includes(normalizedCat2)
    );
    if (cat1Match && cat2Match) {
      return true;
    }
  }

  return false;
}

/**
 * Encontra a categoria por keywords (usa mapeamento interno)
 */
function findCategoryByKeywords(normalizedItem: string): TransactionCategory | null {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const keywordNorm = normalizeText(keyword);
      if (normalizedItem.includes(keywordNorm)) {
        return category as TransactionCategory;
      }
    }
  }
  return null;
}

/**
 * Categoriza um item pelo nome, usando categorias do usuário se disponíveis
 * @param itemName Nome do item
 * @param userCategories Categorias disponíveis do usuário (opcional)
 */
function categorizeItem(
  itemName: string,
  userCategories?: TransactionCategory[]
): TransactionCategory {
  const normalizedItem = normalizeText(itemName);

  // Se não há categorias do usuário, usar lógica padrão com keywords
  if (!userCategories || userCategories.length === 0) {
    return findCategoryByKeywords(normalizedItem) || "Supermercado";
  }

  // Normalizar categorias do usuário para comparação
  const normalizedUserCategories = userCategories.map((cat) => ({
    original: cat,
    normalized: normalizeText(cat),
  }));

  // 1. Primeiro, tentar encontrar correspondência direta
  for (const { original, normalized } of normalizedUserCategories) {
    // Verificar se o nome do item contém o nome da categoria
    if (normalizedItem.includes(normalized) || normalized.includes(normalizedItem.split(" ")[0])) {
      return original;
    }
  }

  // 2. Usar keywords para encontrar uma sugestão de categoria
  const suggestedCategory = findCategoryByKeywords(normalizedItem);

  if (suggestedCategory) {
    const normalizedSuggestion = normalizeText(suggestedCategory);

    // Tentar encontrar uma categoria do usuário que corresponda à sugestão
    for (const { original, normalized } of normalizedUserCategories) {
      // Verificar correspondência parcial ou sinônimos
      if (
        normalized.includes(normalizedSuggestion) ||
        normalizedSuggestion.includes(normalized) ||
        areSimilarCategories(normalized, normalizedSuggestion)
      ) {
        return original;
      }
    }
  }

  // 3. Se não encontrou, retornar "Outros" se existir, ou a primeira categoria
  const outrosCategory = userCategories.find(
    (cat) => normalizeText(cat) === "outros"
  );

  return outrosCategory || userCategories[0] || "Supermercado";
}

/**
 * Encontra categoria mais frequente
 */
function getMostFrequentCategory(items: NFCeItem[]): TransactionCategory {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  let maxCategory: TransactionCategory = "Supermercado";
  let maxCount = 0;

  for (const [category, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = category as TransactionCategory;
    }
  }
  return maxCategory;
}

/**
 * Converte data DD/MM/YYYY para ISO YYYY-MM-DD
 */
export function convertDateToISO(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return new Date().toISOString().split("T")[0];
}

// Tipo interno para parsing
interface ParseResult {
  establishment?: string;
  date?: string;
  items: NFCeItem[];
  total?: number;
}

/**
 * Parser para Minas Gerais (Portal SPED)
 */
function parseMG(html: string, userCategories?: TransactionCategory[]): ParseResult {
  const items: NFCeItem[] = [];

  const estabelecimentoMatch = html.match(/<h4>\s*<b>([^<]+)<\/b>\s*<\/h4>/i);
  const dataMatch = html.match(/(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}:\d{2}/);

  const produtosRegex = /<h7>([^<]+)<\/h7>.*?Qtde total de ítens:\s*([\d.,]+).*?UN:\s*(\w+).*?Valor total R\$:\s*R\$\s*([\d.,]+)/gs;

  let match;
  while ((match = produtosRegex.exec(html)) !== null) {
    const nome = match[1].trim();
    const quantidade = parseFloat(match[2].replace(",", "."));
    const valorTotal = parseFloat(match[4].replace(",", "."));
    const valorUnitario = valorTotal / quantidade;

    if (!isNaN(quantidade) && !isNaN(valorTotal) && nome.length > 1) {
      items.push({
        item: nome,
        amount: valorTotal,
        quantity: quantidade,
        unitPrice: Number(valorUnitario.toFixed(2)),
        category: categorizeItem(nome, userCategories)
      });
    }
  }

  const totalMatch = html.match(/Valor total R\$\s*<\/strong>.*?<strong>([\d.,]+)<\/strong>/s);

  return {
    establishment: estabelecimentoMatch?.[1]?.trim(),
    date: dataMatch?.[1],
    items,
    total: totalMatch?.[1] ? parseFloat(totalMatch[1].replace(",", ".")) : undefined
  };
}

/**
 * Parser para São Paulo
 */
function parseSP(html: string, userCategories?: TransactionCategory[]): ParseResult {
  const items: NFCeItem[] = [];

  const estabelecimentoMatch = html.match(/class="txtTopo"[^>]*>([^<]+)<\/div>/i);
  const dataMatch = html.match(/Emissão:\s*(\d{2}\/\d{2}\/\d{4})/i);

  const produtosRegex = /<span class="txtTit">([^<]+)<\/span>.*?Qtde\.\s*([\d.,]+).*?Vl\. Unit\.\s*R\$\s*([\d.,]+).*?Vl\. Total\s*R\$\s*([\d.,]+)/gs;

  let match;
  while ((match = produtosRegex.exec(html)) !== null) {
    const nome = match[1].trim();
    const quantidade = parseFloat(match[2].replace(",", "."));
    const valorUnitario = parseFloat(match[3].replace(",", "."));
    const valorTotal = parseFloat(match[4].replace(",", "."));

    if (!isNaN(quantidade) && !isNaN(valorTotal) && nome.length > 1) {
      items.push({
        item: nome,
        amount: valorTotal,
        quantity: quantidade,
        unitPrice: valorUnitario,
        category: categorizeItem(nome, userCategories)
      });
    }
  }

  const totalMatch = html.match(/Total\s*R\$\s*([\d.,]+)/i);

  return {
    establishment: estabelecimentoMatch?.[1]?.trim(),
    date: dataMatch?.[1],
    items,
    total: totalMatch?.[1] ? parseFloat(totalMatch[1].replace(",", ".")) : undefined
  };
}

/**
 * Parser genérico
 */
function parseGeneric(html: string, userCategories?: TransactionCategory[]): ParseResult {
  const items: NFCeItem[] = [];

  // Estabelecimento
  const estabelecimentoPatterns = [
    /<h4[^>]*>\s*<b>([^<]+)<\/b>/i,
    /class="txtTopo"[^>]*>([^<]+)</i,
    /Razão Social[^:]*:\s*([^<\n]+)/i,
    /Nome[^:]*:\s*([^<\n]+)/i,
  ];

  let establishment: string | undefined;
  for (const pattern of estabelecimentoPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      establishment = match[1].trim();
      break;
    }
  }

  // Data
  const dataPatterns = [
    /(\d{2}\/\d{2}\/\d{4})\s*\d{2}:\d{2}/,
    /Emissão[^:]*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /Data[^:]*:\s*(\d{2}\/\d{2}\/\d{4})/i,
  ];

  let date: string | undefined;
  for (const pattern of dataPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      date = match[1];
      break;
    }
  }

  // Produtos
  const tablePattern = /<tr[^>]*>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>([\d.,]+)<\/td>.*?<td[^>]*>R?\$?\s*([\d.,]+)<\/td>.*?<td[^>]*>R?\$?\s*([\d.,]+)<\/td>/gs;

  let match;
  while ((match = tablePattern.exec(html)) !== null) {
    const nome = match[1].trim();
    const quantidade = parseFloat(match[2].replace(",", "."));
    const valorUnitario = parseFloat(match[3].replace(",", "."));
    const valorTotal = parseFloat(match[4].replace(",", "."));

    if (!isNaN(quantidade) && !isNaN(valorTotal) && nome.length > 2) {
      items.push({
        item: nome,
        amount: valorTotal,
        quantity: quantidade,
        unitPrice: valorUnitario,
        category: categorizeItem(nome, userCategories)
      });
    }
  }

  // Total
  const totalPatterns = [
    /Valor total[^:]*[:\s]*R?\$?\s*([\d.,]+)/i,
    /Total[^:]*[:\s]*R?\$?\s*([\d.,]+)/i,
  ];

  let total: number | undefined;
  for (const pattern of totalPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      total = parseFloat(match[1].replace(",", "."));
      break;
    }
  }

  return { establishment, date, items, total };
}

/**
 * Extrai dados de uma NFCe a partir da URL do QR Code
 * @param url URL do QR Code da NFCe
 * @param userCategories Categorias do usuário para sugestão (opcional)
 */
export async function extractNFCeData(
  url: string,
  userCategories?: TransactionCategory[]
): Promise<NFCeExtractionResult> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`nfceService: Tentativa ${attempt}/${maxRetries} - URL: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log("nfceService: HTML recebido, tamanho:", html.length);

      // Detectar parser
      let result: ParseResult;
      if (url.includes("fazenda.mg.gov.br")) {
        result = parseMG(html, userCategories);
      } else if (url.includes("fazenda.sp.gov.br")) {
        result = parseSP(html, userCategories);
      } else {
        result = parseGeneric(html, userCategories);
      }

      // Se não tem itens mas tem total, criar item genérico
      if (result.items.length === 0 && result.total) {
        const defaultCategory = userCategories?.find(
          (cat) => normalizeText(cat) === "supermercado"
        ) || userCategories?.[0] || "Supermercado";

        result.items = [{
          item: result.establishment || "Compra",
          amount: result.total,
          quantity: 1,
          unitPrice: result.total,
          category: defaultCategory
        }];
      }

      // Se não tem total mas tem itens, calcular
      if (!result.total && result.items.length > 0) {
        result.total = result.items.reduce((sum, item) => sum + item.amount, 0);
      }

      // Usar data atual se não encontrou
      const finalDate = result.date || new Date().toLocaleDateString("pt-BR");
      const finalEstablishment = result.establishment || "Compra NFCe";

      console.log("nfceService: Extração concluída:", {
        establishment: finalEstablishment,
        date: finalDate,
        items: result.items.length,
        total: result.total
      });

      return {
        success: true,
        establishment: finalEstablishment,
        date: finalDate,
        items: result.items,
        totalAmount: result.total || 0,
        suggestedCategory: getMostFrequentCategory(result.items)
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`nfceService: Tentativa ${attempt} falhou:`, lastError.message);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  const defaultCategory = userCategories?.find(
    (cat) => normalizeText(cat) === "supermercado"
  ) || userCategories?.[0] || "Supermercado";

  return {
    success: false,
    error: lastError?.message || "Falha ao extrair dados da NFCe",
    establishment: "",
    date: "",
    items: [],
    totalAmount: 0,
    suggestedCategory: defaultCategory
  };
}
