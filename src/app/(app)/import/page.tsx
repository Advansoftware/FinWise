// src/app/(app)/import/page.tsx
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction } from '@/lib/types';
import { addTransaction } from '@/app/actions';
import { useTransactions } from '@/hooks/use-transactions';

type ParsedTransaction = Omit<Transaction, 'id'>;

export default function ImportPage() {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();
    const { refreshTransactions } = useTransactions();

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            if (file.type !== 'text/csv') {
                toast({ variant: 'destructive', title: 'Arquivo Inválido', description: 'Por favor, selecione um arquivo .csv' });
                return;
            }
            setCsvFile(file);
            parseCsv(file);
        }
    };

    const parseCsv = (file: File) => {
        setIsParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1); // Ignora o cabeçalho
            const transactions: ParsedTransaction[] = [];
            for (const row of rows) {
                if (!row) continue;
                const [date, item, amount, category, subcategory] = row.split(',');
                if (date && item && amount && category) {
                    transactions.push({
                        date,
                        item: item.trim(),
                        amount: parseFloat(amount.trim()),
                        category: category.trim() as any, // Adicionar validação se necessário
                        subcategory: subcategory ? subcategory.trim() : undefined,
                    });
                }
            }
            setParsedData(transactions);
            setIsParsing(false);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            for (const transaction of parsedData) {
                await addTransaction(transaction);
            }
            toast({ title: 'Sucesso!', description: `${parsedData.length} transações importadas.` });
            await refreshTransactions();
            handleReset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na Importação', description: 'Não foi possível importar as transações.' });
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setCsvFile(null);
        setParsedData([]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileChange(e.dataTransfer.files);
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Importar Transações</h1>
                <p className="text-muted-foreground">Faça o upload de um arquivo CSV para adicionar suas transações em massa.</p>
            </div>
            
            <Card onDragOver={handleDragOver} onDrop={handleDrop}>
                <CardHeader>
                    <CardTitle>Upload de Arquivo</CardTitle>
                    <CardDescription>Selecione ou arraste um arquivo .csv. O formato esperado é: data,item,valor,categoria,subcategoria</CardDescription>
                </CardHeader>
                <CardContent>
                    {!csvFile ? (
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-foreground"><span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte</p>
                                    <p className="text-xs text-muted-foreground">CSV (máx. 800kB)</p>
                                </div>
                                <input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e.target.files)} />
                            </label>
                        </div> 
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <File className="h-5 w-5 text-primary" />
                                    <span className="font-medium">{csvFile.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReset} disabled={isImporting}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {isParsing && <p>Analisando arquivo...</p>}

                            {parsedData.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Pré-visualização dos Dados</h3>
                                    <div className="max-h-64 overflow-auto border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Valor</TableHead>
                                                    <TableHead>Categoria</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {parsedData.slice(0, 5).map((t, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{t.date}</TableCell>
                                                        <TableCell>{t.item}</TableCell>
                                                        <TableCell>R$ {t.amount.toFixed(2)}</TableCell>
                                                        <TableCell>{t.category}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <Button onClick={handleImport} disabled={isImporting}>
                                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Importar {parsedData.length} Transações
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}