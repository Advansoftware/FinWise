// src/lib/encryption.ts
// Criptografia simples para dados sensíveis (CPF, dados bancários)

import crypto from 'crypto';

// Chave de criptografia (deve estar em variável de ambiente em produção)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-encryption-key-32-chars!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

// Garantir que a chave tenha 32 bytes
function getKey(): Buffer {
  const key = ENCRYPTION_KEY;
  if (key.length >= 32) {
    return Buffer.from(key.slice(0, 32));
  }
  // Pad key to 32 bytes
  return Buffer.from(key.padEnd(32, '0'));
}

/**
 * Criptografar dados sensíveis
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Descriptografar dados sensíveis
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Mascarar CPF para exibição (ex: ***.456.789-**)
 */
export function maskCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return '***.***.***-**';
  return `***.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-**`;
}

/**
 * Validar formato de CPF
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;

  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(numbers)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;

  return true;
}
