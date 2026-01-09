// src/app/(app)/import/page.tsx
"use client";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TextField,
  MenuItem,
  Stack,
  Box,
  Typography,
  CircularProgress,
  Grid,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import {
  UploadCloud,
  FileText,
  X,
  Wand2,
  ChevronLeft,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Transaction, TransactionCategory } from "@/lib/types";
import { useTransactions } from "@/hooks/use-transactions";
import Papa from "papaparse";
import { default as toJs } from "ofx-js";
import { format } from "date-fns";
import { suggestCategory } from "@/services/ai-service-router";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { ProUpgradeCard } from "@/components/pro-upgrade-card";
import { ProUpgradeButton } from "@/components/pro-upgrade-button";
import { useWallets } from "@/hooks/use-wallets";

type ParsedTransaction = Omit<Transaction, "id" | "walletId"> & {
  walletId?: string;
};

type FileStage =
  | "upload"
  | "mapping"
  | "categorizing"
  | "confirm"
  | "importing";

const REQUIRED_FIELDS: (keyof ParsedTransaction)[] = ["date", "item", "amount"];

const MAPPABLE_FIELDS: Record<keyof Omit<Transaction, "id">, string> = {
  userId: "ID do Usuário",
  date: "Data*",
  item: "Item/Descrição*",
  amount: "Valor*",
  category: "Categoria*",
  subcategory: "Subcategoria",
  establishment: "Estabelecimento",
  quantity: "Quantidade",
  type: "Tipo",
  walletId: "Carteira",
  toWalletId: "Carteira Destino",
  parentId: "ID da Transação Pai",
  hasChildren: "Tem Subitens",
  childrenCount: "Quantidade de Subitens",
  groupName: "Nome do Grupo",
};

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "ofx" | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<
    Record<keyof ParsedTransaction, string>
  >({
    userId: "",
    date: "",
    item: "",
    amount: "",
    category: "",
    subcategory: "",
    quantity: "",
    establishment: "",
    type: "expense",
    walletId: "",
    toWalletId: "",
    parentId: "",
    hasChildren: "",
    childrenCount: "",
    groupName: "",
  });
  const [transactionsToImport, setTransactionsToImport] = useState<
    ParsedTransaction[]
  >([]);
  const [stage, setStage] = useState<FileStage>("upload");
  const [isParsing, setIsParsing] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const {
    addTransaction,
    categories: userCategories,
    subcategories: userSubcategories,
  } = useTransactions();
  const { wallets } = useWallets();
  const { isPro, isPlus, isLoading: isPlanLoading } = usePlan();

  const canUseAICategorization = isPlus;

  if (!isPlanLoading && !isPro) {
    return <ProUpgradeCard featureName="Importação de Extratos" />;
  }

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const isCsv =
      selectedFile.type.includes("csv") || selectedFile.name.endsWith(".csv");
    const isOfx =
      ["application/ofx", "text/ofx", "application/x-ofx"].includes(
        selectedFile.type
      ) ||
      selectedFile.name.endsWith(".ofx") ||
      selectedFile.name.endsWith(".OFX");

    if (!isCsv && !isOfx) {
      toast({
        variant: "error",
        title: "Arquivo Inválido",
        description: "Por favor, selecione um arquivo .csv ou .ofx",
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (isCsv) {
        setFileType("csv");
        parseCsv(content);
      } else {
        setFileType("ofx");
        parseOfx(content);
      }
    };

    if (isOfx) {
      const peekReader = new FileReader();
      peekReader.onload = (e) => {
        const peekContent = e.target?.result as string;
        if (peekContent.includes("ENCODING:UTF-8")) {
          reader.readAsText(selectedFile, "UTF-8");
        } else {
          reader.readAsText(selectedFile, "latin1");
        }
      };
      peekReader.readAsText(selectedFile.slice(0, 200));
    } else {
      reader.readAsText(selectedFile, "UTF-8");
    }
  };

  const parseCsv = (content: string) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          toast({
            variant: "error",
            title: "Erro ao ler CSV",
            description: "O arquivo parece estar mal formatado.",
          });
          handleReset();
          return;
        }
        setHeaders(result.meta.fields || []);
        setParsedData(result.data);
        setIsParsing(false);
        setStage("mapping");
      },
    });
  };

  const parseOfx = async (content: string) => {
    try {
      const ofxData = await toJs(content);
      let transactionList: any[];

      if (
        ofxData?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN
      ) {
        transactionList =
          ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
      } else if (
        ofxData?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST
          ?.STMTTRN
      ) {
        transactionList =
          ofxData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST
            .STMTTRN;
      } else {
        throw new Error(
          "Formato OFX não suportado ou nenhuma transação encontrada."
        );
      }

      transactionList = Array.isArray(transactionList)
        ? transactionList
        : [transactionList];

      const transactions = transactionList.map(
        (t: any): ParsedTransaction => ({
          userId: "",
          date: new Date(
            `${t.DTPOSTED.slice(0, 4)}-${t.DTPOSTED.slice(
              4,
              6
            )}-${t.DTPOSTED.slice(6, 8)}T12:00:00Z`
          ).toISOString(),
          item: t.MEMO,
          amount: Math.abs(parseFloat(t.TRNAMT)),
          type: parseFloat(t.TRNAMT) >= 0 ? "income" : "expense",
          category: "Outros" as TransactionCategory,
          quantity: 1,
        })
      );

      runCategorization(transactions);
    } catch (error) {
      console.error("OFX Parsing error:", error);
      toast({
        variant: "error",
        title: "Erro ao Ler OFX",
        description: `O arquivo parece estar mal formatado ou não é suportado. Detalhes: ${error}`,
      });
      handleReset();
    } finally {
      setIsParsing(false);
    }
  };

  const handleProceedToCategorize = () => {
    const mappedTransactions = parsedData
      .map((row) => {
        const transaction: Partial<ParsedTransaction> = {};
        for (const key in fieldMapping) {
          const typedKey = key as keyof ParsedTransaction;
          const mappedHeader = fieldMapping[typedKey];
          if (mappedHeader && row[mappedHeader]) {
            const rawValue = row[mappedHeader];
            if (typedKey === "amount" || typedKey === "quantity") {
              const numericValue = parseFloat(
                String(rawValue)
                  .replace(/[^0-9.,-]+/g, "")
                  .replace(",", ".")
              );
              (transaction[typedKey] as any) = isNaN(numericValue)
                ? undefined
                : numericValue;
            } else {
              (transaction[typedKey] as any) = rawValue;
            }
          }
        }

        if (
          transaction.date &&
          String(transaction.date).match(/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/)
        ) {
          const parts = String(transaction.date).split(/[\/\- ]/);
          if (parts.length === 3) {
            const day = parts[0].padStart(2, "0");
            const month = parts[1].padStart(2, "0");
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            transaction.date = `${year}-${month}-${day}T12:00:00Z`;
          }
        } else if (transaction.date) {
          transaction.date = new Date(transaction.date).toISOString();
        }

        if (!transaction.item || !transaction.amount || !transaction.date)
          return null;
        if (!transaction.category) transaction.category = "Outros";
        if (!transaction.quantity || isNaN(transaction.quantity))
          transaction.quantity = 1;
        transaction.amount = Math.abs(transaction.amount);

        return transaction as ParsedTransaction;
      })
      .filter((t): t is ParsedTransaction => t !== null);

    runCategorization(mappedTransactions);
  };

  const runCategorization = async (transactions: ParsedTransaction[]) => {
    if (!user) {
      toast({ variant: "error", title: "Usuário não autenticado." });
      return;
    }

    if (!canUseAICategorization) {
      setTransactionsToImport(transactions);
      setStage("confirm");
      return;
    }

    setStage("categorizing");
    setIsCategorizing(true);
    const categoryStrings = userCategories as string[];

    try {
      const categorizedTransactions = await Promise.all(
        transactions.map(async (t) => {
          if (t.category && t.category !== "Outros") return t;

          const suggestion = await suggestCategory(
            {
              itemName: t.item,
              existingCategories: categoryStrings,
            },
            user.uid
          );

          return {
            ...t,
            category: (suggestion.category as TransactionCategory) || "Outros",
            subcategory: suggestion.subcategory || "",
          };
        })
      );

      setTransactionsToImport(categorizedTransactions);
    } catch (error) {
      console.error("AI categorization error:", error);
      toast({
        variant: "error",
        title: "Erro na categorização por IA",
        description:
          "As transações serão carregadas com a categoria padrão 'Outros'.",
      });
      setTransactionsToImport(transactions);
    } finally {
      setIsCategorizing(false);
      setStage("confirm");
    }
  };

  const handleImport = async () => {
    setStage("importing");
    try {
      for (const transaction of transactionsToImport) {
        if (!transaction.walletId) {
          toast({
            variant: "error",
            title: "Carteira não selecionada",
            description: `Selecione uma carteira para a transação "${transaction.item}".`,
          });
          setStage("confirm");
          return;
        }
        await addTransaction(transaction as Omit<Transaction, "id" | "userId">);
      }
      toast({
        title: "Sucesso!",
        description: `${transactionsToImport.length} transações importadas.`,
      });
      handleReset();
    } catch (error) {
      toast({
        variant: "error",
        title: "Erro na Importação",
        description: `Não foi possível importar as transações. Verifique os dados. Erro: ${error}`,
      });
      setStage("confirm");
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileType(null);
    setParsedData([]);
    setHeaders([]);
    setFieldMapping({
      userId: "",
      date: "",
      item: "",
      amount: "",
      category: "",
      subcategory: "",
      quantity: "",
      establishment: "",
      type: "expense",
      walletId: "",
      toWalletId: "",
      parentId: "",
      hasChildren: "",
      childrenCount: "",
      groupName: "",
    });
    setTransactionsToImport([]);
    setIsParsing(false);
    setIsCategorizing(false);
    setStage("upload");
  };

  const handleTransactionUpdate = (
    index: number,
    field: keyof ParsedTransaction,
    value: any
  ) => {
    const updatedTransactions = [...transactionsToImport];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [field]: value,
    };
    if (field === "category") {
      updatedTransactions[index].subcategory = "";
    }
    setTransactionsToImport(updatedTransactions);
  };

  const isMappingComplete = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => !!fieldMapping[field]);
  }, [fieldMapping]);

  const renderUpload = () => (
    <label htmlFor="file-upload" style={{ width: "100%", cursor: "pointer" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 256,
          border: "2px dashed",
          borderColor: "divider",
          borderRadius: 2,
          "&:hover": { bgcolor: "action.hover" },
          transition: "background-color 0.2s",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pt: 5,
            pb: 6,
          }}
        >
          <UploadCloud size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography variant="body2" gutterBottom>
            <Box
              component="span"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              Clique para enviar
            </Box>{" "}
            ou arraste e solte
          </Typography>
          <Typography variant="caption" color="text.secondary">
            CSV ou OFX (máx. 2MB)
          </Typography>
        </Box>
        <input
          id="file-upload"
          type="file"
          accept=".csv,.ofx,.OFX"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
      </Box>
    </label>
  );

  const renderMapping = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" fontWeight="semibold">
          Mapear Colunas do CSV
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Associe as colunas do seu arquivo aos campos do Gastometria. Campos
          com * são obrigatórios.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {Object.entries(MAPPABLE_FIELDS).map(([key, label]) => {
          const typedField = key as keyof typeof MAPPABLE_FIELDS;
          return (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                fontWeight="medium"
                sx={{ display: "block", mb: 0.5, textTransform: "capitalize" }}
              >
                {label}
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={fieldMapping[typedField]}
                onChange={(e) =>
                  setFieldMapping((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                placeholder="Selecione uma coluna"
              >
                {headers.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          );
        })}
      </Grid>
      <Button
        variant="contained"
        onClick={handleProceedToCategorize}
        disabled={!isMappingComplete}
        startIcon={canUseAICategorization ? <Sparkles size={16} /> : undefined}
      >
        {canUseAICategorization ? "Categorizar com IA" : "Revisar Transações"}
      </Button>
    </Stack>
  );

  const renderConfirm = () => (
    <Stack spacing={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography variant="h6" fontWeight="semibold">
            Revisão e Confirmação ({transactionsToImport.length} transações)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {canUseAICategorization
              ? "Revise os dados e as categorias sugeridas pela IA."
              : "Revise os dados importados."}
            <br />
            Você deve selecionar uma carteira para cada transação antes de
            importar.
          </Typography>
        </Box>
        {!canUseAICategorization && (
          <ProUpgradeButton
            requiredPlan="Plus"
            tooltipContent="Desbloqueie a categorização automática com o plano Plus."
          >
            <Button
              variant="outlined"
              size="small"
              disabled
              startIcon={<Sparkles size={16} />}
            >
              Categorizar com IA
            </Button>
          </ProUpgradeButton>
        )}
      </Stack>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ maxHeight: 400 }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell width={120}>Data</TableCell>
              <TableCell>Item</TableCell>
              <TableCell width={180}>Categoria</TableCell>
              <TableCell width={180}>Subcategoria</TableCell>
              <TableCell width={180}>Carteira*</TableCell>
              <TableCell align="right" width={120}>
                Valor
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactionsToImport.map((t, i) => (
              <TableRow key={i}>
                <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.item}
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="standard"
                    value={t.category}
                    onChange={(e) =>
                      handleTransactionUpdate(i, "category", e.target.value)
                    }
                  >
                    {userCategories.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="standard"
                    value={t.subcategory}
                    onChange={(e) =>
                      handleTransactionUpdate(i, "subcategory", e.target.value)
                    }
                    disabled={
                      (userSubcategories[t.category]?.length || 0) === 0
                    }
                  >
                    <MenuItem value="">-</MenuItem>
                    {userSubcategories[t.category]?.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="standard"
                    value={t.walletId || ""}
                    onChange={(e) =>
                      handleTransactionUpdate(i, "walletId", e.target.value)
                    }
                    placeholder="Selecione"
                  >
                    {wallets.map((wallet) => (
                      <MenuItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell align="right">R$ {t.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {fileType === "csv" && (
          <Button
            variant="outlined"
            onClick={() => setStage("mapping")}
            disabled={stage === "importing"}
            startIcon={<ChevronLeft size={16} />}
          >
            Voltar ao Mapeamento
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={stage === "importing"}
        >
          {stage === "importing" && (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          )}
          Importar {transactionsToImport.length} Transações
        </Button>
      </Stack>
    </Stack>
  );

  const renderCategorizing = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        color: "text.secondary",
        minHeight: "20rem",
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="h6" color="text.primary">
        Categorizando com IA
      </Typography>
      <Typography variant="body2">
        Aguarde enquanto analisamos e sugerimos categorias para suas transações.
        Isso pode levar um momento...
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Importar Transações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Faça o upload de um arquivo CSV ou OFX para adicionar transações em
            lote.
          </Typography>
        </Box>
        {stage !== "upload" && (
          <Button
            variant="text"
            onClick={handleReset}
            disabled={stage === "importing"}
            startIcon={<X size={16} />}
          >
            Cancelar Importação
          </Button>
        )}
      </Stack>

      <Card>
        <CardHeader
          title={
            file && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: "0.875rem",
                  color: "text.secondary",
                }}
              >
                <FileText size={16} /> {file.name}
              </Box>
            )
          }
        />
        <CardContent
          sx={{
            minHeight: "20rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isParsing ? (
            <CircularProgress size={32} />
          ) : (
            <Box sx={{ width: "100%" }}>
              {stage === "upload" && renderUpload()}
              {stage === "mapping" && renderMapping()}
              {stage === "categorizing" && renderCategorizing()}
              {stage === "confirm" && renderConfirm()}
              {stage === "importing" && renderCategorizing()}
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
