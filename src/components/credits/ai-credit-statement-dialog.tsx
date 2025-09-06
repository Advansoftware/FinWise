"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, BarChart3, Bot, Image, MessageCircle, Settings } from "lucide-react"
import { useCreditTransparency } from "@/hooks/use-credit-transparency"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreditStatementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditStatementDialog({ open, onOpenChange }: CreditStatementDialogProps) {
  const { 
    currentCredits,
    plan,
    getAlternativeMessage,
    actions,
    willConsumeCredits,
    isUsingGastometriaAI
  } = useCreditTransparency()

  const alternativeSuggestion = getAlternativeMessage()

  const formatCreditCost = (cost: number) => `${cost} crédito${cost !== 1 ? 's' : ''}`
  const formatBalance = (balance: number) => `${balance} crédito${balance !== 1 ? 's' : ''}`

  // Estatísticas baseadas nas ações reais disponíveis
  const getStatisticsByCategory = () => {
    const categories = {
      simple: { actions: [] as Array<{ key: string } & typeof actions[string]>, totalCost: 0 },
      complex: { actions: [] as Array<{ key: string } & typeof actions[string]>, totalCost: 0 },
      image: { actions: [] as Array<{ key: string } & typeof actions[string]>, totalCost: 0 }
    }

    Object.entries(actions).forEach(([key, action]) => {
      categories[action.category].actions.push({ key, ...action })
      categories[action.category].totalCost += action.cost
    })

    return categories
  }

  const categoryStats = getStatisticsByCategory()
  
  // Simulação de uso - em produção isso viria do backend
  const mockUsageStats = {
    simple: { used: 12, spent: 15 },
    complex: { used: 3, spent: 15 },
    image: { used: 1, spent: 10 }
  }

  const totalActionsUsed = Object.values(mockUsageStats).reduce((sum, stat) => sum + stat.used, 0)
  const totalSpent = Object.values(mockUsageStats).reduce((sum, stat) => sum + stat.spent, 0)
  const averagePerAction = totalActionsUsed > 0 ? totalSpent / totalActionsUsed : 0

  const getCategoryIcon = (category: 'simple' | 'complex' | 'image') => {
    switch (category) {
      case 'simple':
        return <MessageCircle className="h-4 w-4" />
      case 'complex':
        return <BarChart3 className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: 'simple' | 'complex' | 'image') => {
    switch (category) {
      case 'simple':
        return 'Ações Simples'
      case 'complex':
        return 'Análises Complexas'
      case 'image':
        return 'Processamento de Imagens'
      default:
        return 'Outros'
    }
  }

  const getCategoryDescription = (category: 'simple' | 'complex' | 'image') => {
    switch (category) {
      case 'simple':
        return 'Conversas básicas e sugestões rápidas (1-2 créditos)'
      case 'complex':
        return 'Relatórios e análises detalhadas (5 créditos)'
      case 'image':
        return 'OCR e processamento de imagens (10 créditos)'
      default:
        return 'Outras funcionalidades IA'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Extrato de Créditos IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatBalance(currentCredits)}
                </div>
                <Badge 
                  variant={currentCredits > 10 ? "secondary" : "destructive"}
                  className="mt-1"
                >
                  {plan}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-600">
                  {formatCreditCost(totalSpent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Média por Ação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-600">
                  {formatCreditCost(Math.round(averagePerAction))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalActionsUsed} ações realizadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Aviso sobre Transparência */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Transparência Total:</strong> Mostramos exatamente quantos créditos cada ação consome. 
              Conversas simples custam 1 crédito, análises complexas custam 5 créditos.
            </AlertDescription>
          </Alert>

          {/* Detalhamento por Categoria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Uso por Categoria</h3>
            
            {Object.entries(categoryStats).map(([category, data]) => {
              const usage = mockUsageStats[category as keyof typeof mockUsageStats]
              const typedCategory = category as 'simple' | 'complex' | 'image'
              
              return (
                <Card key={category} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getCategoryIcon(typedCategory)}
                      {getCategoryLabel(typedCategory)}
                    </CardTitle>
                    <CardDescription>
                      {getCategoryDescription(typedCategory)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{usage.used}</span> ações realizadas
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Consumiu {formatCreditCost(usage.spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {usage.used > 0 ? Math.round(usage.spent / usage.used) : 0} créditos/ação
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Alternativas Gratuitas */}
          {alternativeSuggestion && (
            <div className="space-y-3">
              <Separator />
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Opções Gratuitas Disponíveis
              </h3>
              
              <Alert>
                <Bot className="h-4 w-4" />
                <AlertDescription>
                  <strong>Economia de Créditos:</strong> {alternativeSuggestion}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                // Implementar navegação para configurações de IA
                onOpenChange(false)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar IA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
