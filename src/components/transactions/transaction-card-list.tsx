
'use client';
import {useState} from 'react';
import {Transaction} from '@/lib/types';
import {Card, CardContent, CardHeader, Typography, CardActions} from '@mui/material';
import {Chip} from '@mui/material';
import {CategoryIcon} from '../icons';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {MoreVertical, Pen, Trash2, ArrowUp, ArrowDown} from 'lucide-react';
import {Button} from '@mui/material';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '../ui/dropdown-menu';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '../ui/alert-dialog';
import {EditTransactionSheet} from './edit-transaction-sheet';
import {useTransactions} from '@/hooks/use-transactions';
import {useToast} from '@/hooks/use-toast';
import {Box, Stack, Typography} from '@mui/material';

interface TransactionCardListProps {
  transactions: Transaction[];
}

export function TransactionCardList({ transactions }: TransactionCardListProps) {
  if (transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 12, px: 4, color: 'text.secondary' }}>
        <Typography variant="body1" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}>Nenhuma transação encontrada.</Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mt: 2 }}>Tente selecionar outro período ou filtro.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={{ xs: 3, sm: 4 }}>
      {transactions.map(transaction => (
        <TransactionCard key={transaction.id} transaction={transaction} />
      ))}
    </Stack>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { deleteTransaction } = useTransactions();
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteTransaction(transaction);
            toast({ title: "Transação excluída com sucesso." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir transação." });
        }
    };

  return (
    <>
      <EditTransactionSheet 
          transaction={transaction} 
          isOpen={isEditSheetOpen} 
          setIsOpen={setIsEditSheetOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação "{transaction.item}".
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Card sx={{ transition: 'colors', '&:hover': { bgcolor: 'action.hover' } }}>
        <CardHeader sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={{ xs: 2, sm: 3 }} sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                borderRadius: '50%', 
                flexShrink: 0,
                bgcolor: transaction.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'action.selected'
              }}>
                {transaction.type === 'income' ? 
                  <ArrowDown style={{ width: '1rem', height: '1rem', color: '#10b981' }} className="sm:h-5 sm:w-5" /> : 
                  <CategoryIcon category={transaction.category} className="h-4 w-4 sm:h-5 sm:w-5" />
                }
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{transaction.item}</Typography>
                {transaction.establishment && (
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{transaction.establishment}</Typography>
                )}
              </Box>
            </Stack>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="text" size="icon" sx={{ height: '2rem', width: '2rem', flexShrink: 0 }}>
                  <MoreVertical style={{ width: '1rem', height: '1rem' }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
                  <Pen style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
                  <Trash2 style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Stack>
        </CardHeader>
        
        <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Valor</Typography>
              <Typography variant="h6" sx={{ 
                fontSize: { xs: '1.125rem', sm: '1.25rem' }, 
                fontWeight: 700,
                color: transaction.type === 'income' ? '#10b981' : '#f87171'
              }}>
                {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-end', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <Badge variant="outlined" sx={{ fontSize: '0.75rem' }}>{transaction.category}</Badge>
                {transaction.subcategory && (
                  <Badge variant="contained" color="secondary" sx={{ fontSize: '0.75rem' }}>{transaction.subcategory}</Badge>
                )}
            </Stack>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ p: { xs: 3, sm: 4 }, fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'action.hover', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
              <Typography component="span" variant="body2" sx={{ fontSize: '0.75rem' }}>{format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</Typography>
              {(transaction.quantity && transaction.quantity > 1) && (
                <Typography component="span" variant="body2" sx={{ fontSize: '0.75rem' }}>Qtd: {transaction.quantity}</Typography>
              )}
            </Stack>
        </CardActions>
      </Card>
    </>
  );
}
