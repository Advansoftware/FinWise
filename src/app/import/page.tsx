// src/app/import/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload } from 'lucide-react';

function UploadPlaceholder() {
    return (
        <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-primary/30 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-primary" />
                    <p className="mb-2 text-sm text-foreground"><span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte</p>
                    <p className="text-xs text-muted-foreground">CSV, PDF, PNG ou JPG</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" />
            </label>
        </div>
    );
}

export default function ImportPage() {
  return (
    <>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Importar Transações</h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
              <Tabs defaultValue="csv">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="csv">Importar CSV</TabsTrigger>
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
                             <UploadPlaceholder />
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
                             <UploadPlaceholder />
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
          </CardContent>
        </Card>

      </main>
    </>
  );
}
