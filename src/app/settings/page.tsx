'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Em um app real, você faria uma chamada a um endpoint do seu backend
        // que por sua vez se comunica com o Ollama.
        // Para este exemplo, vamos simular os modelos disponíveis.
        const models = ['llama3', 'mistral', 'codellama', 'llama2'];
        setOllamaModels(models);
        
        const storedModel = localStorage.getItem('ollama_model') || models[0];
        setSelectedModel(storedModel);

      } catch (error) {
        console.error('Falha ao buscar modelos do Ollama:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de Conexão',
          description: 'Não foi possível buscar os modelos do Ollama. Verifique se o serviço está em execução.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [toast]);

  const handleSave = () => {
    localStorage.setItem('ollama_model', selectedModel);
    toast({
      title: 'Configurações Salvas!',
      description: `O modelo padrão do Ollama foi definido como "${selectedModel}".`,
    });
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Modelo de IA</CardTitle>
          <CardDescription>
            Selecione o modelo do Ollama que você deseja usar para gerar dicas financeiras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Buscando modelos...</span>
            </div>
          ) : (
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="ollama-model">Modelo Ollama</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="ollama-model">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ollamaModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
