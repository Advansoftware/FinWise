'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getOllamaModels, saveAISettings, getAISettings } from '@/app/actions';
import { AISettings, AIProvider } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<AISettings>>({});
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadInitialSettings() {
      setIsLoading(true);
      try {
        const [loadedSettings, models] = await Promise.all([
          getAISettings(),
          getOllamaModels()
        ]);
        
        setSettings(loadedSettings || { provider: 'ollama', ollamaModel: 'llama3' });
        
        if(models.length > 0) {
            setOllamaModels(models);
        } else if (loadedSettings?.provider === 'ollama') {
            toast({
                variant: 'destructive',
                title: 'Erro de Conexão com Ollama',
                description: 'Não foi possível buscar os modelos do Ollama. Verifique se o serviço está em execução.',
            });
        }
      } catch (error) {
        console.error('Falha ao carregar configurações:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao Carregar',
          description: 'Não foi possível carregar as configurações de IA.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAISettings(settings as AISettings);
      toast({
        title: 'Configurações Salvas!',
        description: 'Suas configurações de IA foram salvas no banco de dados.',
      });
    } catch (error) {
       console.error('Falha ao salvar configurações:', error);
       toast({
          variant: 'destructive',
          title: 'Erro ao Salvar',
          description: 'Não foi possível salvar as configurações. Tente novamente.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    setSettings(prev => ({ ...prev, provider }));
  };
  
  const handleModelChange = (model: string) => {
      setSettings(prev => ({ ...prev, ollamaModel: model }));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings(prev => ({ ...prev, googleAIApiKey: e.target.value }));
  }


  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background/50">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações de IA</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Provedor de Inteligência Artificial</CardTitle>
          <CardDescription>
            Escolha e configure o serviço de IA que você deseja usar para as funcionalidades inteligentes do FinWise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando configurações...</span>
            </div>
          ) : (
            <div className="space-y-6 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="ai-provider">Provedor de IA</Label>
                <Select value={settings.provider} onValueChange={(value) => handleProviderChange(value as AIProvider)}>
                  <SelectTrigger id="ai-provider">
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    <SelectItem value="googleai">Google AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

             {settings.provider === 'ollama' && (
                <div className="space-y-2 animate-in fade-in">
                    <Label htmlFor="ollama-model">Modelo Ollama</Label>
                    <Select value={settings.ollamaModel} onValueChange={handleModelChange} disabled={ollamaModels.length === 0}>
                        <SelectTrigger id="ollama-model">
                            <SelectValue placeholder={ollamaModels.length > 0 ? "Selecione um modelo" : "Nenhum modelo Ollama encontrado"} />
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
             )}

            {settings.provider === 'googleai' && (
                 <div className="space-y-2 animate-in fade-in">
                    <Label htmlFor="google-api-key">Chave de API do Google AI</Label>
                    <Input 
                        id="google-api-key" 
                        type="password" 
                        placeholder="Cole sua chave de API aqui"
                        value={settings.googleAIApiKey || ''}
                        onChange={handleApiKeyChange}
                    />
                 </div>
            )}


              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
