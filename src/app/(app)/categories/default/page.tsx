
'use client';

import {useState} from 'react';
import {Card, CardContent, CardHeader, Button, Chip} from '@mui/material';
import {Typography} from '@mui/material';
import {CategoryIcon} from '@/components/icons';
import {DEFAULT_CATEGORIES} from '@/lib/default-categories';
import {TransactionCategory} from '@/lib/types';
import {ChevronDown, ChevronRight, Users, Package, Settings} from 'lucide-react';
import {useAuth} from '@/hooks/use-auth';
import {useToast} from '@/hooks/use-toast';
import {apiClient} from '@/lib/api-client';

export default function DefaultCategoriesPreview() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleApplyToUser = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado"
      });
      return;
    }

    try {
      // Usar API route em vez de import direto do serviço
      const response = await fetch('/api/categories/apply-defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Falha ao aplicar categorias padrão');
      }

      toast({
        title: "Sucesso!",
        description: "Categorias padrão aplicadas com sucesso ao seu perfil!"
      });

      // Recarrega a página após 1 segundo para mostrar as novas categorias
      setTimeout(() => {
        window.location.href = '/categories';
      }, 1000);
    } catch (error) {
      console.error('Erro ao aplicar categorias:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao aplicar categorias padrão. Tente novamente."
      });
    }
  };

  const getCategoryType = (category: TransactionCategory): string => {
    if (['Salário', 'Investimentos', 'Vendas'].includes(category)) {
      return 'Receitas';
    }
    if (['Contas', 'Supermercado', 'Transporte', 'Saúde'].includes(category)) {
      return 'Essenciais';
    }
    if (['Restaurante', 'Entretenimento', 'Vestuário', 'Educação', 'Lazer'].includes(category)) {
      return 'Pessoais';
    }
    return 'Outros';
  };

  const getCategoryTypeColor = (type: string): string => {
    switch (type) {
      case 'Receitas': return 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/50';
      case 'Essenciais': return 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'Pessoais': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      default: return 'bg-gray-100 dark:bg-gray-950/50 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-900/50';
    }
  };

  const totalCategories = Object.keys(DEFAULT_CATEGORIES).length;
  const totalSubcategories = Object.values(DEFAULT_CATEGORIES).reduce(
    (sum, subcategories) => sum + subcategories.length, 
    0
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias Padrão do Gastometria</h1>
            <p className="text-muted-foreground">
              Categorias e subcategorias que são criadas automaticamente para novos usuários
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <Typography variant="h6" className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total de Categorias
              </Typography>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Typography variant="h6" className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Subcategorias
              </Typography>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubcategories}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Typography variant="h6" className="text-sm font-medium">Ações</Typography>
            </CardHeader>
            <CardContent>
              <Button onClick={handleApplyToUser} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Aplicar ao Meu Usuário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(DEFAULT_CATEGORIES).map(([category, subcategories]) => {
          const categoryKey = category as TransactionCategory;
          const isExpanded = expandedCategories.has(category);
          const categoryType = getCategoryType(categoryKey);
          
          return (
            <Card key={category} className="hover:shadow-md transition-shadow">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={categoryKey} className="h-6 w-6 text-primary" />
                    <div>
                      <Typography variant="h6">{category}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge 
                          variant="outlined" 
                          className={getCategoryTypeColor(categoryType)}
                        >
                          {categoryType}
                        </Badge>
                        <span>{subcategories.length} subcategorias</span>
                      </Typography>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Subcategorias incluídas:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((subcategory) => (
                        <Badge 
                          key={subcategory} 
                          variant="contained" color="secondary"
                          className="text-xs"
                        >
                          {subcategory}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <Typography variant="h6" className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Como funciona
          </Typography>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-medium text-green-600">✓</span>
              <span>Quando um novo usuário se cadastra, essas categorias são criadas automaticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-green-600">✓</span>
              <span>Usuários existentes sem categorias também recebem essas configurações padrão</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-blue-600">ℹ</span>
              <span>Usuários podem adicionar, editar ou remover categorias livremente após a criação</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-blue-600">ℹ</span>
              <span>As categorias são organizadas por tipo: Receitas, Essenciais, Pessoais e Outros</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

    