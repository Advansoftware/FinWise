import { Transaction } from './types';

export const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-07-22', item: 'Compras no supermercado', category: 'Supermercado', amount: 125.50 },
  { id: '2', date: '2024-07-22', item: 'Passagem de ônibus', category: 'Transporte', amount: 2.75 },
  { id: '3', date: '2024-07-21', item: 'Ingressos de cinema', category: 'Entretenimento', amount: 32.00 },
  { id: '4', date: '2024-07-21', item: 'Six-pack de cerveja artesanal', category: 'Cerveja', amount: 18.99 },
  { id: '5', date: '2024-07-20', item: 'Conta de eletricidade', category: 'Contas', amount: 85.20 },
  { id: '6', date: '2024-07-20', item: 'Jantar com amigos', category: 'Restaurante', amount: 75.60 },
  { id: '7', date: '2024-07-19', item: 'Farmácia', category: 'Saúde', amount: 25.00 },
  { id: '8', date: '2024-07-18', item: 'Compras da semana', category: 'Supermercado', amount: 95.40 },
  { id: '9', date: '2024-07-18', item: 'Gasolina', category: 'Transporte', amount: 55.00 },
  { id: '10', date: '2024-07-17', item: 'Happy hour', category: 'Cerveja', amount: 45.00 },
];
