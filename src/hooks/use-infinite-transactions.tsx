// src/hooks/use-infinite-transactions.tsx
"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { Transaction, DateRange } from "@/lib/types";
import { useMemo, useEffect } from "react";
import { useDataRefresh } from "./use-data-refresh";

interface TransactionsPage {
  transactions: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseInfiniteTransactionsOptions {
  dateRange?: DateRange;
  category?: string;
  subcategory?: string;
  enabled?: boolean;
  pageSize?: number;
}

async function fetchTransactionsPage(
  userId: string,
  cursor: string | null,
  options: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    subcategory?: string;
    limit: number;
  }
): Promise<TransactionsPage> {
  const params = new URLSearchParams({
    userId,
    limit: options.limit.toString(),
  });

  if (cursor) params.append("cursor", cursor);
  if (options.dateFrom) params.append("dateFrom", options.dateFrom);
  if (options.dateTo) params.append("dateTo", options.dateTo);
  if (options.category && options.category !== "all") {
    params.append("category", options.category);
  }
  if (options.subcategory && options.subcategory !== "all") {
    params.append("subcategory", options.subcategory);
  }

  const response = await fetch(`/api/transactions?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
}

export function useInfiniteTransactions(
  options: UseInfiniteTransactionsOptions = {}
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registerRefreshHandler, unregisterRefreshHandler } = useDataRefresh();
  const {
    dateRange,
    category,
    subcategory,
    enabled = true,
    pageSize = 20,
  } = options;

  const queryKey = useMemo(
    () => [
      "transactions",
      "infinite",
      user?.uid,
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString(),
      category,
      subcategory,
    ],
    [user?.uid, dateRange, category, subcategory]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (!user?.uid) throw new Error("User not authenticated");

      return fetchTransactionsPage(user.uid, pageParam, {
        dateFrom: dateRange?.from?.toISOString().split("T")[0],
        dateTo: dateRange?.to?.toISOString().split("T")[0],
        category,
        subcategory,
        limit: pageSize,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: enabled && !!user?.uid,
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: false,
  });

  // Flatten all pages into a single array
  const allTransactions = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => page.transactions);
  }, [query.data?.pages]);

  // Function to invalidate and refetch
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions", "infinite"] });
  };

  // Listen for global refresh events to invalidate cache
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", "infinite"] });
    };

    registerRefreshHandler("infinite-transactions", handleRefresh);

    return () => {
      unregisterRefreshHandler("infinite-transactions");
    };
  }, [queryClient, registerRefreshHandler, unregisterRefreshHandler]);

  return {
    transactions: allTransactions,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refresh,
    error: query.error,
  };
}
