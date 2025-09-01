"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploadPlaceholder } from '@/components/import/file-upload-placeholder';
import { useState } from 'react';

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    // TODO: Process the file (CSV, OFX, or image)
    console.log('Selected file:', file);
    setSelectedFile(file);
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Importar Transações</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="csv">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="csv">Importar CSV</TabsTrigger>
              <TabsTrigger value="ofx">Importar OFX</TabsTrigger>
              <TabsTrigger value="ocr">Escanear Nota (OCR)</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivo CSV</CardTitle>
                  <CardDescription>
                    Envie seu extrato bancário em formato CSV. O próximo passo será mapear as colunas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadPlaceholder 
                    onFileSelect={handleFile} 
                    fileTypes="CSV" 
                    acceptedFormats=".csv,text/csv"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ofx" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivo OFX</CardTitle>
                  <CardDescription>
                    Envie seu extrato bancário no formato OFX para uma importação rápida e padronizada.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadPlaceholder 
                    onFileSelect={handleFile} 
                    fileTypes="OFX"
                    acceptedFormats=".ofx,application/x-ofx"
                   />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ocr" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Nota Fiscal</CardTitle>
                  <CardDescription>
                    Envie uma imagem (PNG, JPG) ou PDF da sua nota fiscal para extrair as transações.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadPlaceholder 
                    onFileSelect={handleFile} 
                    fileTypes="PNG, JPG ou PDF"
                    acceptedFormats="image/png,image/jpeg,application/pdf"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
