// src/components/installments/monthly-installments-modal.tsx

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Tag
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface InstallmentDetail {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  establishment?: string;
  amount: number;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
}

interface MonthlyInstallmentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  month: string; // formato "YYYY-MM"
  monthName: string; // nome formatado do mês
  totalAmount: number;
  commitmentType?: 'fixed' | 'variable'; // tipo de compromisso para filtrar
}

export function MonthlyInstallmentsModal({
  isOpen,
  onOpenChange,
  month,
  monthName,
  totalAmount,
  commitmentType
}: MonthlyInstallmentsModalProps) {
  const [installments, setInstallments] = useState<InstallmentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && month && user?.uid) {
      loadMonthlyInstallments();
    }
  }, [isOpen, month, user?.uid, commitmentType]);

  const loadMonthlyInstallments = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const url = `/api/installments?userId=${user.uid}&action=monthly-details&month=${month}`;
      const urlWithType = commitmentType ? `${url}&type=${commitmentType}` : url;
      const response = await fetch(urlWithType);
      
      if (response.ok) {
        const data = await response.json();
        setInstallments(data);
      } else {
        console.error('Failed to fetch monthly installments');
        setInstallments([]);
      }
    } catch (error) {
      console.error('Error loading monthly installments:', error);
      setInstallments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Pago</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Em atraso</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const formatInstallmentInfo = (installmentNumber: number, totalInstallments: number) => {
    return `${installmentNumber}/${totalInstallments}`;
  };

  const paidCount = installments.filter(i => i.status === 'paid').length;
  const pendingCount = installments.filter(i => i.status === 'pending').length;
  const overdueCount = installments.filter(i => i.status === 'overdue').length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "w-full h-full max-w-none max-h-none m-0 p-0 rounded-none flex flex-col",
        "md:w-[90vw] md:h-[85vh] md:max-w-4xl md:max-h-[85vh] md:m-auto md:p-6 md:rounded-lg"
      )}>
        {/* Header fixo */}
        <DialogHeader className="flex-shrink-0 p-6 pb-4 md:p-0 md:pb-4 border-b md:border-b-0">
          <DialogTitle className="text-xl md:text-2xl">
            {commitmentType === 'fixed' 
              ? `Compromissos Fixos de ${monthName}`
              : commitmentType === 'variable'
              ? `Compromissos Variáveis de ${monthName}`
              : `Parcelamentos de ${monthName}`
            }
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards fixo */}
        <div className="flex-shrink-0 px-6 pb-4 md:px-0 border-b md:border-b-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pagos</p>
                  <p className="text-sm font-semibold">{paidCount}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-sm font-semibold">{pendingCount}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Atraso</p>
                  <p className="text-sm font-semibold">{overdueCount}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Área de scroll para a lista */}
        <div className="flex-1 min-h-0 px-6 md:px-0">
          <ScrollArea className="h-full">
            <div className="pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : installments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum parcelamento encontrado</h3>
                  <p className="text-muted-foreground text-center">
                    Não há parcelamentos registrados para este mês.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-6">
                  {installments.map((installment) => (
                    <Card key={`${installment.id}-${installment.installmentNumber}`} className="p-4">
                      <div className="flex flex-col space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base truncate">
                              {installment.name}
                            </h4>
                            {installment.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {installment.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            {getStatusIcon(installment.status)}
                            {getStatusBadge(installment.status)}
                          </div>
                        </div>

                        {/* Amount and Installment Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {formatCurrency(installment.amount)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formatInstallmentInfo(installment.installmentNumber, installment.totalInstallments)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(installment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>

                        {/* Category and Details */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{installment.category}</span>
                            {installment.subcategory && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">{installment.subcategory}</span>
                              </>
                            )}
                          </div>
                          
                          {installment.establishment && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{installment.establishment}</span>
                            </div>
                          )}
                        </div>

                        {/* Payment Info */}
                        {installment.status === 'paid' && installment.paidDate && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            Pago em {format(new Date(installment.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                            {installment.paidAmount && installment.paidAmount !== installment.amount && (
                              <span className="ml-2">
                                (Valor: {formatCurrency(installment.paidAmount)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}