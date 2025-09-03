// src/app/(app)/import/page.tsx
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, X, Loader2, Wand2, ChevronRight, ChevronLeft, Sparkles, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction, TransactionCategory } from '@/lib/types';
import { useTransactions } from "@/hooks/use-transactions";
import Papa from 'papaparse';
import { default as toJs } from 'ofx-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { suggestCategoryForItemAction } from '@/services/ai-actions';
import { useAuth } from '@/hooks/use-auth';
import { usePlan } from '@/hooks/use-plan';
import { ProUpgradeCard } from '@/components/pro-upgrade-card';

type ParsedTransaction = Omit<Transaction, 'id' | 'walletId'> & { walletId?: string };

type FileStage = 'upload' | 'mapping' | 'categorizing' | 'confirm' | 'importing';

const REQUIRED_FIELDS: (keyof ParsedTransaction)[] = ['date', 'item', 'amount'];

const MAPPABLE_FIELDS: Record<keyof Omit<Transaction, 'id' | 'type' | 'walletId' | 'toWalletId'>, string> = {
    date: 'Data*',
    item: 'Item/Descrição*',
    amount: 'Valor*',
    category: 'Categoria',
    subcategory: 'Subcategoria',
    establishment: 'Estabelecimento',
    quantity: 'Quantidade',
};

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'csv' | 'ofx' | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<keyof ParsedTransaction, string>>({
        date: '', item: '', amount: '', category: '', subcategory: '', quantity: '', establishment: '', type: 'expense', walletId: ''
    });
    const [transactionsToImport, setTransactionsToImport] = useState<ParsedTransaction[]>([]);
    const [stage, setStage] = useState<FileStage>('upload');
    const [isParsing, setIsParsing] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);
    
    const { toast } = useToast();
    const { user } = useAuth();
    const { addTransaction, categories: userCategories, subcategories: userSubcategories } = useTransactions();
    const { isPro, isPlus, isLoading: isPlanLoading } = usePlan();
    
    const canUseAICategorization = isPlus;

    if (!isPlanLoading && !isPro) {
        return <ProUpgradeCard featureName="Importação de Extratos" />;
    }

    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) return;

        const isCsv = selectedFile.type.includes('csv') || selectedFile.name.endsWith('.csv');
        const isOfx = ['application/ofx', 'text/ofx', 'application/x-ofx'].includes(selectedFile.type) || selectedFile.name.endsWith('.ofx')  || selectedFile.name.endsWith('.OFX');

        if (!isCsv && !isOfx) {
            toast({ variant: 'destructive', title: 'Arquivo Inválido', description: 'Por favor, selecione um arquivo .csv ou .ofx' });
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (isCsv) {
                setFileType('csv');
                parseCsv(content);
            } else {
                setFileType('ofx');
                parseOfx(content);
            }
        };
        
        if (isOfx) {
            const peekReader = new FileReader();
            peekReader.onload = (e) => {
                const peekContent = e.target?.result as string;
                if (peekContent.includes('ENCODING:UTF-8')) {
                    reader.readAsText(selectedFile, 'UTF-8');
                } else {
                    reader.readAsText(selectedFile, 'latin1');
                }
            };
            peekReader.readAsText(selectedFile.slice(0, 200)); 
        } else {
            reader.readAsText(selectedFile, 'UTF-8');
        }
    };

    const parseCsv = (content: string) => {
        Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                if(result.errors.length > 0) {
                     toast({ variant: 'destructive', title: 'Erro ao ler CSV', description: 'O arquivo parece estar mal formatado.' });
                     handleReset();
                     return;
                }
                setHeaders(result.meta.fields || []);
                setParsedData(result.data);
                setIsParsing(false);
                setStage('mapping');
            }
        });
    };

    const parseOfx = async (content: string) => {
        try {
            const ofxData = await toJs(content);
            let transactionList: any[];

            if (ofxData?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN) {
                transactionList = ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
            } else if (ofxData?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST?.STMTTRN) {
                transactionList = ofxData.OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST.STMTTRN;
            } else {
                throw new Error("Formato OFX não suportado ou nenhuma transação encontrada.");
            }

            transactionList = Array.isArray(transactionList) ? transactionList : [transactionList];

            const transactions = transactionList.map((t: any): ParsedTransaction => ({
                date: new Date(`${t.DTPOSTED.slice(0, 4)}-${t.DTPOSTED.slice(4, 6)}-${t.DTPOSTED.slice(6, 8)}T12:00:00Z`).toISOString(),
                item: t.MEMO,
                amount: Math.abs(parseFloat(t.TRNAMT)),
                type: parseFloat(t.TRNAMT) >= 0 ? 'income' : 'expense',
                category: "Outros" as TransactionCategory,
                quantity: 1,
            }));
            
            runCategorization(transactions);
        } catch (error) {
            console.error("OFX Parsing error:", error);
            toast({ variant: 'destructive', title: 'Erro ao Ler OFX', description: `O arquivo parece estar mal formatado ou não é suportado. Detalhes: ${error}`});
            handleReset();
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleProceedToCategorize = () => {
        const mappedTransactions = parsedData.map(row => {
            const transaction: Partial<ParsedTransaction> = {};
            for (const key in fieldMapping) {
                const typedKey = key as keyof ParsedTransaction;
                const mappedHeader = fieldMapping[typedKey];
                if (mappedHeader && row[mappedHeader]) {
                    const rawValue = row[mappedHeader];
                    if (typedKey === 'amount' || typedKey === 'quantity') {
                        const numericValue = parseFloat(String(rawValue).replace(/[^0-9.,-]+/g, '').replace(',', '.'));
                        (transaction[typedKey] as any) = isNaN(numericValue) ? undefined : numericValue;
                    } else {
                         (transaction[typedKey] as any) = rawValue;
                    }
                }
            }

            if (transaction.date && String(transaction.date).match(/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/)) {
                const parts = String(transaction.date).split(/[\/\- ]/);
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    transaction.date = `${year}-${month}-${day}T12:00:00Z`;
                }
            } else if (transaction.date) {
                 transaction.date = new Date(transaction.date).toISOString();
            }

            if (!transaction.item || !transaction.amount || !transaction.date) return null;
            if (!transaction.category) transaction.category = "Outros";
            if (!transaction.quantity || isNaN(transaction.quantity)) transaction.quantity = 1;
             transaction.amount = Math.abs(transaction.amount);

            return transaction as ParsedTransaction;
        }).filter((t): t is ParsedTransaction => t !== null);

        runCategorization(mappedTransactions);
    }
    
    const runCategorization = async (transactions: ParsedTransaction[]) => {
        if (!user) {
             toast({ variant: 'destructive', title: 'Usuário não autenticado.' });
             return;
        }

        if (!canUseAICategorization) {
            setTransactionsToImport(transactions);
            setStage('confirm');
            return;
        }

        setStage('categorizing');
        setIsCategorizing(true);
        const categoryStrings = userCategories as string[];
        
        try {
            const categorizedTransactions = await Promise.all(transactions.map(async (t) => {
                if (t.category && t.category !== "Outros") return t; // Skip if already categorized
                
                const suggestion = await suggestCategoryForItemAction({
                    itemName: t.item,
                    existingCategories: categoryStrings
                }, user.uid);
                
                return {
                    ...t,
                    category: suggestion.category as TransactionCategory || "Outros",
                    subcategory: suggestion.subcategory || ""
                };
            }));
            
            setTransactionsToImport(categorizedTransactions);
        } catch (error) {
            console.error("AI categorization error:", error);
            toast({ variant: "destructive", title: "Erro na categorização por IA", description: "As transações serão carregadas com a categoria padrão 'Outros'."});
            setTransactionsToImport(transactions);
        } finally {
            setIsCategorizing(false);
            setStage('confirm');
        }
    }

    const handleImport = async () => {
        setStage('importing');
        try {
            for (const transaction of transactionsToImport) {
                // Ensure walletId is set before adding
                if (!transaction.walletId) {
                    toast({ variant: 'destructive', title: 'Carteira não selecionada', description: `Selecione uma carteira para a transação "${transaction.item}".` });
                    setStage('confirm');
                    return;
                }
                await addTransaction(transaction as Transaction);
            }
            toast({ title: 'Sucesso!', description: `${transactionsToImport.length} transações importadas.` });
            handleReset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na Importação', description: `Não foi possível importar as transações. Verifique os dados. Erro: ${error}` });
            setStage('confirm');
        }
    };

    const handleReset = () => {
        setFile(null);
        setFileType(null);
        setParsedData([]);
        setHeaders([]);
        setFieldMapping({ date: '', item: '', amount: '', category: '', subcategory: '', quantity: '', establishment: '', type: 'expense', walletId: '' });
        setTransactionsToImport([]);
        setIsParsing(false);
        setIsCategorizing(false);
        setStage('upload');
    };

    const handleTransactionUpdate = (index: number, field: keyof ParsedTransaction, value: any) => {
        const updatedTransactions = [...transactionsToImport];
        updatedTransactions[index] = { ...updatedTransactions[index], [field]: value };
        if (field === 'category') {
            updatedTransactions[index].subcategory = ''; // Reset subcategory
        }
        setTransactionsToImport(updatedTransactions);
    };

    const isMappingComplete = useMemo(() => {
        return REQUIRED_FIELDS.every(field => !!fieldMapping[field]);
    }, [fieldMapping]);
    
    const renderUpload = () => (
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-foreground"><span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte</p>
                <p className="text-xs text-muted-foreground">CSV ou OFX (máx. 2MB)</p>
            </div>
            <input id="file-upload" type="file" className="hidden" accept=".csv,.ofx,.OFX" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
        </label> 
    );
    
    const renderMapping = () => (
         <div className="space-y-6">
             <div>
                <h3 className="text-lg font-semibold">Mapear Colunas do CSV</h3>
                <p className="text-sm text-muted-foreground">Associe as colunas do seu arquivo aos campos do FinWise. Campos com * são obrigatórios.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.entries(MAPPABLE_FIELDS).map(([key, label]) => {
                    const typedField = key as keyof typeof MAPPABLE_FIELDS;
                    return (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={key} className="capitalize flex items-center">
                            {label}
                        </Label>
                        <Select onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [key]: value }))} value={fieldMapping[typedField]}>
                          <SelectTrigger id={key}>
                            <SelectValue placeholder="Selecione uma coluna" />
                          </SelectTrigger>
                          <SelectContent>
                             {headers.map(header => (
                               <SelectItem key={header} value={header}>{header}</SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                 })}
             </div>
             <Button onClick={handleProceedToCategorize} disabled={!isMappingComplete}>
                {canUseAICategorization ? "Categorizar com IA" : "Revisar Transações"}
                {canUseAICategorization && <Sparkles className="ml-2 h-4 w-4" />}
             </Button>
         </div>
    );
    
    const renderConfirm = () => (
        <div className="space-y-4">
            <div className='flex justify-between items-start'>
                <div>
                    <h3 className="font-semibold">Revisão e Confirmação ({transactionsToImport.length} transações)</h3>
                    <p className="text-sm text-muted-foreground">
                        {canUseAICategorization ? "Revise os dados e as categorias sugeridas pela IA." : "Revise os dados importados."}
                        <br/>
                        Você deve selecionar uma carteira para cada transação antes de importar.
                    </p>
                </div>
                 {!canUseAICategorization && (
                    <ProUpgradeButton requiredPlan="Plus" tooltipContent="Desbloqueie a categorização automática com o plano Plus.">
                        <Button variant="outline" size="sm" disabled>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Categorizar com IA
                        </Button>
                    </ProUpgradeButton>
                 )}
            </div>
            <div className="max-h-96 overflow-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Data</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="w-[180px]">Categoria</TableHead>
                            <TableHead className="w-[180px]">Subcategoria</TableHead>
                            <TableHead className="w-[180px]">Carteira*</TableHead>
                            <TableHead className="text-right w-[120px]">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsToImport.map((t, i) => (
                            <TableRow key={i}>
                                <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{t.item}</TableCell>
                                <TableCell>
                                    <Select value={t.category} onValueChange={(val) => handleTransactionUpdate(i, 'category', val)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {userCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                 <TableCell>
                                    <Select value={t.subcategory} onValueChange={(val) => handleTransactionUpdate(i, 'subcategory', val)} disabled={(userSubcategories[t.category]?.length || 0) === 0}>
                                        <SelectTrigger><SelectValue placeholder="-"/></SelectTrigger>
                                        <SelectContent>
                                            {userSubcategories[t.category]?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                     <Select value={t.walletId} onValueChange={(val) => handleTransactionUpdate(i, 'walletId', val)}>
                                        <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                                        <SelectContent>
                                            {/* Wallets need to be fetched from a hook */}
                                            {/* For now, using a placeholder */}
                                            <SelectItem value="wallet1">Conta Principal</SelectItem>
                                            <SelectItem value="wallet2">Cartão de Crédito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right">R$ {t.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div className="flex flex-wrap gap-2">
                {fileType === 'csv' && (
                  <Button variant="outline" onClick={() => setStage('mapping')} disabled={stage === 'importing'}>
                     <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Mapeamento
                  </Button>
                )}
                 <Button onClick={handleImport} disabled={stage === 'importing'}>
                    {stage === 'importing' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Importar {transactionsToImport.length} Transações
                </Button>
             </div>
        </div>
    );
    
    const renderCategorizing = () => (
      <div className="flex flex-col items-center justify-center text-center gap-4 text-muted-foreground min-h-[20rem]">
        <Loader2 className="h-10 w-10 animate-spin text-primary"/>
        <h3 className="text-lg font-semibold text-foreground">Categorizando com IA</h3>
        <p>Aguarde enquanto analisamos e sugerimos categorias para suas transações. Isso pode levar um momento...</p>
      </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Importar Transações</h1>
                    <p className="text-muted-foreground">Faça o upload de um arquivo CSV ou OFX para adicionar transações em lote.</p>
                </div>
                {stage !== 'upload' && (
                    <Button variant="ghost" onClick={handleReset} disabled={stage === 'importing'}>
                        <X className="mr-2 h-4 w-4" /> Cancelar Importação
                    </Button>
                )}
            </div>
            
            <Card>
                <CardHeader>
                    {file && <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4"/> {file.name}</div>}
                </CardHeader>
                <CardContent className="min-h-[20rem] flex items-center justify-center">
                    {isParsing ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
                        <div className="w-full">
                           {stage === 'upload' && renderUpload()}
                           {stage === 'mapping' && renderMapping()}
                           {stage === 'categorizing' && renderCategorizing()}
                           {stage === 'confirm' && renderConfirm()}
                           {stage === 'importing' && renderCategorizing()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
