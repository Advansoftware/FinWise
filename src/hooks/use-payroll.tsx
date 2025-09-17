'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PayrollData } from '@/lib/types';

export function usePayroll() {
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPayrollData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/payroll/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setPayrollData(data);
      } else if (response.status === 404) {
        // No payroll data exists
        setPayrollData(null);
      } else {
        throw new Error('Failed to fetch payroll data');
      }
    } catch (err) {
      console.error('Error fetching payroll data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [user]);

  const hasValidPayrollData = () => {
    return payrollData && 
           payrollData.grossSalary > 0 && 
           payrollData.netSalary > 0;
  };

  const refetch = () => {
    fetchPayrollData();
  };

  return {
    payrollData,
    loading,
    error,
    hasValidPayrollData,
    refetch,
  };
}