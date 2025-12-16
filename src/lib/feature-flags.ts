// src/lib/feature-flags.ts
// Feature flags para habilitar/desabilitar funcionalidades

/**
 * Verifica se o Open Finance está habilitado
 * Controlado pela variável de ambiente NEXT_PUBLIC_OPEN_FINANCE_ENABLED
 */
export function isOpenFinanceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OPEN_FINANCE_ENABLED === "true";
}

/**
 * Objeto com todas as feature flags
 * Útil para verificar múltiplas features de uma vez
 */
export const featureFlags = {
  openFinance: isOpenFinanceEnabled(),
} as const;

/**
 * Hook-friendly getter (para uso em componentes client)
 * Retorna o valor em tempo de build, não muda em runtime
 */
export function getFeatureFlags() {
  return {
    openFinance: process.env.NEXT_PUBLIC_OPEN_FINANCE_ENABLED === "true",
  };
}
