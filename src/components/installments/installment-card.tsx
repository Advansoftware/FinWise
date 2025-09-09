// src/components/installments/installment-card.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit3,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Installment } from '@/core/ports/installments.port';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInstallments } from '@/hooks/use-installments';
import { PayInstallmentDialog } from './pay-installment-dialog';
import { EditInstallmentDialog } from './edit-installment-dialog';
import { MarkAsPaidDialog } from './mark-as-paid-dialog';

interface InstallmentCardProps {
  installment: Installment;
  showActions?: boolean;
}

export function InstallmentCard({ installment, showActions = true }: InstallmentCardProps) {
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarkAsPaidOpen, setIsMarkAsPaidOpen] = useState(false);
  const { deleteInstallment } = useInstallments();

  const progressPercentage = (installment.paidInstallments / installment.totalInstallments) * 100;
  
  // Buscar próximo pagamento (incluindo em atraso)
  const nextPayment = installment.payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  // Contar parcelas em atraso
  const overduePayments = installment.payments.filter(p => p.status === 'overdue');
  const overdueCount = overduePayments.length;

  const getStatusBadge = () => {
    if (installment.isCompleted) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
    }
    
    if (overdueCount > 0) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{overdueCount} Em Atraso</Badge>;
    }
    
    if (nextPayment) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Em Andamento</Badge>;
    }
    
    return <Badge variant="outline">Sem Parcelas</Badge>;
  };

  const handleDelete = async () => {
    await deleteInstallment(installment.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold line-clamp-1">
            {installment.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!installment.isCompleted && nextPayment && (
                    <DropdownMenuItem onClick={() => setIsPayDialogOpen(true)}>
                      Registrar Pagamento
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)} 
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {installment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {installment.description}
            </p>
          )}
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{installment.paidInstallments}/{installment.totalInstallments} parcelas</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="font-semibold">{formatCurrency(installment.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor da Parcela</p>
              <p className="font-semibold">{formatCurrency(installment.installmentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="font-semibold text-green-600">{formatCurrency(installment.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="font-semibold text-orange-600">{formatCurrency(installment.remainingAmount)}</p>
            </div>
          </div>
          
          {/* Next Payment */}
          {nextPayment && !installment.isCompleted && (
            <div className={`border-t pt-4 ${nextPayment.status === 'overdue' ? 'bg-destructive/5 dark:bg-destructive/5 border-destructive/20 dark:border-destructive/20 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg' : ''}`}>
              {/* Alerta de atraso */}
              {nextPayment.status === 'overdue' && (
                <div className="flex items-center gap-2 mb-3 text-destructive dark:text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Parcela em atraso!</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {nextPayment.status === 'overdue' ? 'Venceu em' : 'Próximo Vencimento'}
                  </p>
                  <p className={`font-semibold ${nextPayment.status === 'overdue' ? 'text-foreground dark:text-foreground' : ''}`}>
                    {format(parseISO(nextPayment.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  {nextPayment.status === 'overdue' && (
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                      {Math.floor((new Date().getTime() - parseISO(nextPayment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias de atraso
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Parcela {nextPayment.installmentNumber}</p>
                  <p className={`font-semibold ${nextPayment.status === 'overdue' ? 'text-foreground dark:text-foreground' : ''}`}>
                    {formatCurrency(nextPayment.scheduledAmount)}
                  </p>
                </div>
              </div>
              
              {/* Alertas adicionais para atraso */}
              {overdueCount > 1 && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Você tem <strong>{overdueCount} parcelas em atraso</strong>
                  </p>
                </div>
              )}
              
              {showActions && (
                <div className="space-y-2 mt-3">
                  <Button 
                    onClick={() => setIsPayDialogOpen(true)}
                    className={`w-full ${nextPayment.status === 'overdue' ? 'bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90' : ''}`}
                    size="sm"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {nextPayment.status === 'overdue' ? 'Pagar Atraso' : 'Registrar Pagamento'}
                  </Button>
                  
                  {/* Mostrar botão "Marcar como Pago" apenas para parcelas em atraso */}
                  {nextPayment.status === 'overdue' && (
                    <Button 
                      onClick={() => setIsMarkAsPaidOpen(true)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Pago
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Category and Establishment */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{installment.category}</Badge>
            {installment.subcategory && (
              <Badge variant="outline">{installment.subcategory}</Badge>
            )}
            {installment.establishment && (
              <Badge variant="outline">{installment.establishment}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <PayInstallmentDialog
        installment={installment}
        payment={nextPayment}
        open={isPayDialogOpen}
        onOpenChange={setIsPayDialogOpen}
      />

      {/* Edit Dialog */}
      <EditInstallmentDialog
        installment={installment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Mark as Paid Dialog */}
      <MarkAsPaidDialog
        installment={installment}
        payment={nextPayment}
        open={isMarkAsPaidOpen}
        onOpenChange={setIsMarkAsPaidOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o parcelamento "{installment.name}"? 
              Esta ação não pode ser desfeita e todas as informações de pagamento serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
