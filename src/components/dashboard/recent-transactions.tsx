import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Avatar, 
  Button, 
  Box, 
  Stack, 
  useTheme,
  alpha
} from '@mui/material';
import { CategoryIcon } from "../icons";
import { Transaction } from "@/lib/types";
import Link from "next/link";
import { ArrowRight, ArrowDown, ArrowUp } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 7);
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={<Typography variant="h6">Transações Recentes</Typography>}
        subheader={<Typography variant="body2" color="text.secondary">Você tem {transactions.length} movimentações neste período.</Typography>}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
        {transactions.length > 0 ? (
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                <Stack spacing={2}>
                {recentTransactions.map((transaction) => (
                    <Stack key={transaction.id} direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: transaction.type === 'income' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                            color: transaction.type === 'income' ? 'success.main' : 'error.main',
                            border: 1,
                            borderColor: transaction.type === 'income' ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.error.main, 0.2)
                          }}
                        >
                            {transaction.type === 'income' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                        </Avatar>
                    <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {transaction.item}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {transaction.category}
                            {transaction.subcategory && ` / ${transaction.subcategory}`}
                        </Typography>
                    </Stack>
                    <Typography 
                      variant="body2"
                      fontWeight="bold"
                      color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                      sx={{ flexShrink: 0 }}
                    >
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </Typography>
                    </Stack>
                ))}
                </Stack>
            </Box>
        ) : (
            <Stack 
              spacing={1}
              sx={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center', 
                color: 'text.secondary' 
              }}
            >
                <Typography variant="body1">Nenhuma transação encontrada.</Typography>
                <Typography variant="caption">Tente selecionar outra categoria ou período.</Typography>
            </Stack>
        )}
        <Button 
          component={Link} 
          href="/transactions" 
          variant="outlined" 
          fullWidth 
          endIcon={<ArrowRight size={16} />}
          sx={{ mt: 'auto' }}
        >
            Ver Todas as Transações
        </Button>
      </CardContent>
    </Card>
  );
}
