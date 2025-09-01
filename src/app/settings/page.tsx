'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getOllamaModels, getAISettings, saveAISettings } from '@/app/actions';
import { AISettings, AIProvider, OpenAIModel } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings>({ 
    provider: 'ollama', 
    ollamaModel: 'llama3', 
    openAIModel: 'gpt-3.5-turbo' 
  });
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadInitialSettings() {
      setIsLoading(true);
      try {
        const loadedSettings = await getAISettings();
        setSettings(loadedSettings);

        if (loadedSettings.provider === 'ollama' || settings.provider === 'ollama') {
            const models = await getOllamaModels();
            if (models.length > 0) {
                setOllamaModels(models);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erro de Conexão com Ollama',
                    description: 'Não foi possível buscar os modelos do Ollama. Verifique se o serviço está em execução.',
                });
            }
        }
      } catch (error) {
        console.error('Falha ao carregar configurações:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao Carregar',
          description: 'Não foi possível carregar as configurações de IA do banco de dados.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialSettings();
  }, [toast, settings.provider]);

  const handleSave = async () => {
    setIsSaving(true);
    // Basic validation
    if (settings.provider === 'googleai' && !settings.googleAIApiKey) {
        toast({ variant: "destructive", title: "Chave de API do Google AI é obrigatória." });
        setIsSaving(false);
        return;
    }
    if (settings.provider === 'openai' && !settings.openAIApiKey) {
        toast({ variant: "destructive", title: "Chave de API da OpenAI é obrigatória." });
        setIsSaving(false);
        return;
    }

    try {
      await saveAISettings(settings);
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
  
  const handleOllamaModelChange = (model: string) => {
      setSettings(prev => ({ ...prev, ollamaModel: model }));
  };
  
  const handleOpenAIModelChange = (model: OpenAIModel) => {
    setSettings(prev => ({ ...prev, openAIModel: model }));
};

  const handleApiKeyChange = (provider: 'googleai' | 'openai') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setSettings(prev => {
        if (provider === 'googleai') {
            return { ...prev, googleAIApiKey: value };
        }
        return { ...prev, openAIApiKey: value };
      });
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
            Escolha e configure o serviço de IA que você deseja usar para as funcionalidades inteligentes do FinWise. Suas chaves são salvas de forma segura.
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
                    <SelectItem value="googleai">Google AI (Gemini)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

             {settings.provider === 'ollama' && (
                <div className="space-y-2 animate-in fade-in">
                    <Label htmlFor="ollama-model">Modelo Ollama</Label>
                    <Select value={settings.ollamaModel} onValueChange={handleOllamaModelChange} disabled={ollamaModels.length === 0}>
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
                        placeholder="Cole sua chave de API do Google AI Studio aqui"
                        value={settings.googleAIApiKey || ''}
                        onChange={handleApiKeyChange('googleai')}
                    />
                 </div>
            )}

            {settings.provider === 'openai' && (
                 <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-2">
                        <Label htmlFor="openai-model">Modelo OpenAI</Label>
                        <Select value={settings.openAIModel} onValueChange={(value) => handleOpenAIModelChange(value as OpenAIModel)}>
                            <SelectTrigger id="openai-model">
                                <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="openai-api-key">Chave de API da OpenAI</Label>
                        <Input 
                            id="openai-api-key" 
                            type="password" 
                            placeholder="Cole sua chave de API da OpenAI aqui"
                            value={settings.openAIApiKey || ''}
                            onChange={handleApiKeyChange('openai')}
                        />
                    </div>
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
