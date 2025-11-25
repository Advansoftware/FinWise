// src/lib/nfce-utils.ts
// Funções utilitárias para NFCe (podem ser usadas no cliente)

// Padrões de URLs de NFCe
const NFCE_URL_PATTERNS = [
  /portalsped\.fazenda\.mg\.gov\.br/i,
  /nfce\.fazenda\.sp\.gov\.br/i,
  /satsp\.fazenda\.sp\.gov\.br/i,
  /nfce\.fazenda\.rj\.gov\.br/i,
  /nfce\.sefa\.pr\.gov\.br/i,
  /nfce\.sef\.sc\.gov\.br/i,
  /nfce\.sefaz\.rs\.gov\.br/i,
  /nfe\.sefaz\.ba\.gov\.br/i,
  /nfe\.sefaz\.go\.gov\.br/i,
  /nfce\.sefaz\.pe\.gov\.br/i,
  /nfce\.sefaz\.ce\.gov\.br/i,
  /nfce\.fazenda\.df\.gov\.br/i,
  /portalsped/i,
  /nfce/i,
  /qrcode/i,
];

/**
 * Verifica se a URL é de um portal de NFCe
 */
export function isNFCeUrl(url: string): boolean {
  return NFCE_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Converte data DD/MM/YYYY para ISO YYYY-MM-DD
 */
export function convertDateToISO(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return new Date().toISOString().split("T")[0];
}
