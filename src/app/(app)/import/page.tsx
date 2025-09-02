'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, X, Loader2, Wand2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction } from '@/lib/types';
import { useTransactions } from "@/hooks/use-transactions";
import Papa from 'papaparse';
import { default as toJs } from 'ofx-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

type ParsedTransaction = Omit<Transaction, 'id'>;

type FileStage = 'upload' | 'mapping' | 'confirm' | 'importing';
const REQUIRED_FIELDS: (keyof ParsedTransaction)[] = ['date', 'item', 'amount'];

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>("");
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<keyof ParsedTransaction, string>>({
        date: '', item: '', amount: '', category: '', subcategory: '', quantity: ''
    });
    const [transactionsToImport, setTransactionsToImport] = useState<ParsedTransaction[]>([]);
    const [stage, setStage] = useState<FileStage>('upload');
    const [isParsing, setIsParsing] = useState(false);
    
    const { toast } = useToast();
    const { addTransaction, refreshAllData } = useTransactions();

    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) return;

        if (!['text/csv', 'application/vnd.ms-excel', 'application/ofx', 'text/ofx'].includes(selectedFile.type) && !selectedFile.name.endsWith('.ofx')) {
            toast({ variant: 'destructive', title: 'Arquivo Inválido', description: 'Por favor, selecione um arquivo .csv ou .ofx' });
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setFileContent(content);
            if (selectedFile.type.includes('csv') || selectedFile.name.endsWith('.csv')) {
                parseCsv(content);
            } else {
                parseOfx(content);
            }
        };
        reader.readAsText(selectedFile, 'latin1'); // latin1 for better OFX compatibility
    };

    const parseCsv = (content: string) => {
        Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
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
            const account = ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS;
            const transactions = account.BANKTRANLIST.STMTTRN.map((t: any) => ({
                date: format(new Date(`${t.DTPOSTED.slice(0, 4)}-${t.DTPOSTED.slice(4, 6)}-${t.DTPOSTED.slice(6, 8)}`), 'yyyy-MM-dd'),
                item: t.MEMO,
                amount: Math.abs(parseFloat(t.TRNAMT)), // always positive
            }));
            setTransactionsToImport(transactions);
            setIsParsing(false);
            setStage('confirm');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Ler OFX', description: 'O arquivo parece estar mal formatado.' });
            handleReset();
        }
    };
    
    const handleProceedToConfirm = () => {
        const mappedTransactions = parsedData.map(row => {
            const transaction: ParsedTransaction = { date: '', item: '', amount: 0 };
            for (const key in fieldMapping) {
                const typedKey = key as keyof ParsedTransaction;
                const mappedHeader = fieldMapping[typedKey];
                if (mappedHeader && row[mappedHeader]) {
                    if(typedKey === 'amount' || typedKey === 'quantity') {
                         (transaction[typedKey] as any) = parseFloat(String(row[mappedHeader]).replace(',', '.'));
                    } else {
                         (transaction[typedKey] as any) = row[mappedHeader];
                    }
                }
            }
            // Fix date format if needed (DD/MM/YYYY -> YYYY-MM-DD)
            if (transaction.date && transaction.date.includes('/')) {
                const parts = transaction.date.split('/');
                if (parts.length === 3) {
                    transaction.date = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            return transaction;
        }).filter(t => t.date && t.item && t.amount > 0);

        setTransactionsToImport(mappedTransactions);
        setStage('confirm');
    }

    const handleImport = async () => {
        setStage('importing');
        try {
            for (const transaction of transactionsToImport) {
                await addTransaction(transaction);
            }
            toast({ title: 'Sucesso!', description: `${transactionsToImport.length} transações importadas.` });
            await refreshAllData();
            handleReset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na Importação', description: 'Não foi possível importar as transações.' });
            setStage('confirm');
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedData([]);
        setHeaders([]);
        setFieldMapping({ date: '', item: '', amount: '', category: '', subcategory: '', quantity: '' });
        setTransactionsToImport([]);
        setIsParsing(false);
        setStage('upload');
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
            <input id="file-upload" type="file" className="hidden" accept=".csv,.ofx" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
        </label> 
    );
    
    const renderMapping = () => (
         <div className="space-y-6">
             <div>
                <h3 className="text-lg font-semibold">Mapear Colunas</h3>
                <p className="text-sm text-muted-foreground">Associe as colunas do seu arquivo aos campos de transação.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.keys(fieldMapping).map(field => {
                    const isRequired = REQUIRED_FIELDS.includes(field as keyof ParsedTransaction);
                    return (
                      <div key={field} className="space-y-1">
                        <Label htmlFor={field} className="capitalize flex items-center">{field} {isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                        <Select onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [field]: value }))}>
                          <SelectTrigger id={field}>
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
             <Button onClick={handleProceedToConfirm} disabled={!isMappingComplete}>
                Revisar Transações <ChevronRight className="ml-2 h-4 w-4" />
             </Button>
         </div>
    );
    
    const renderConfirm = () => (
        <div className="space-y-4">
            <h3 className="font-semibold">Pré-visualização dos Dados ({transactionsToImport.length} transações)</h3>
            <div className="max-h-80 overflow-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsToImport.map((t, i) => (
                            <TableRow key={i}>
                                <TableCell>{t.date}</TableCell>
                                <TableCell>{t.item}</TableCell>
                                <TableCell>{t.category}</TableCell>
                                <TableCell className="text-right">R$ {t.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <Button onClick={handleImport}>
                Importar {transactionsToImport.length} Transações
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Importar Transações</h1>
                    <p className="text-muted-foreground">Faça o upload de um arquivo CSV ou OFX para adicionar transações.</p>
                </div>
                {stage !== 'upload' && (
                    <Button variant="ghost" onClick={handleReset} disabled={stage === 'importing'}>
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                )}
            </div>
            
            <Card>
                <CardHeader>
                    {file && <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4"/> {file.name}</div>}
                </CardHeader>
                <CardContent className="min-h-[20rem] flex items-center justify-center">
                    {isParsing || stage === 'importing' ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
                        <div className="w-full">
                           {stage === 'upload' && renderUpload()}
                           {stage === 'mapping' && renderMapping()}
                           {stage === 'confirm' && renderConfirm()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
