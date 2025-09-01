import { Transaction } from './types';

export const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-07-22', item: 'Supermarket haul', category: 'Groceries', amount: 125.50 },
  { id: '2', date: '2024-07-22', item: 'Bus fare', category: 'Transport', amount: 2.75 },
  { id: '3', date: '2024-07-21', item: 'Movie tickets', category: 'Entertainment', amount: 32.00 },
  { id: '4', date: '2024-07-21', item: 'Six-pack of craft beer', category: 'Beer', amount: 18.99 },
  { id: '5', date: '2024-07-20', item: 'Electricity bill', category: 'Utilities', amount: 85.20 },
  { id: '6', date: '2024-07-20', item: 'Dinner with friends', category: 'Dining', amount: 75.60 },
  { id: '7', date: '2024-07-19', item: 'Pharmacy', category: 'Health', amount: 25.00 },
  { id: '8', date: '2024-07-18', item: 'Weekly groceries', category: 'Groceries', amount: 95.40 },
  { id: '9', date: '2024-07-18', item: 'Gasoline', category: 'Transport', amount: 55.00 },
  { id: '10', date: '2024-07-17', item: 'Happy hour drinks', category: 'Beer', amount: 45.00 },
];
