// String utility functions

/**
 * Safely converts a string to lowercase, handling null/undefined values
 * @param value - The string value to convert (can be null or undefined)
 * @returns The lowercase string, or empty string if value is null/undefined
 */
export function safeLowerCase(value: string | undefined | null): string {
  return (value || '').toLowerCase();
}

/**
 * Safely trims a string, handling null/undefined values
 * @param value - The string value to trim (can be null or undefined)
 * @returns The trimmed string, or empty string if value is null/undefined
 */
export function safeTrim(value: string | undefined | null): string {
  return (value || '').trim();
}

/**
 * Checks if a string includes a substring (case-insensitive), handling null/undefined
 * @param value - The string to search in (can be null or undefined)
 * @param search - The substring to search for
 * @returns true if the substring is found, false otherwise
 */
export function safeIncludesLower(value: string | undefined | null, search: string): boolean {
  return safeLowerCase(value).includes(search.toLowerCase());
}
