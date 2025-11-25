// src/services/bank-deep-link.service.ts

import {
  SupportedBank,
  PaymentData,
  BankDeepLink,
  IBankDeepLinkService,
} from '@/core/ports/bank-payment.port';

/**
 * Informações dos bancos brasileiros
 */
const BANK_INFO: Record<SupportedBank, {
  name: string;
  color: string;
  icon: string;
  supportsPixKey: boolean;
  supportsBoleto: boolean;
  scheme: string;
  packageAndroid?: string;
  appStoreId?: string;
  webUrl?: string;
}> = {
  nubank: {
    name: 'Nubank',
    color: '#820AD1',
    icon: '💜',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'nubank',
    packageAndroid: 'com.nu.production',
    appStoreId: '814456780',
    webUrl: 'https://nubank.com.br',
  },
  itau: {
    name: 'Itaú',
    color: '#003399',
    icon: '🧡',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'itau',
    packageAndroid: 'com.itau',
    appStoreId: '474505665',
    webUrl: 'https://www.itau.com.br',
  },
  bradesco: {
    name: 'Bradesco',
    color: '#CC092F',
    icon: '❤️',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'bradesco',
    packageAndroid: 'com.bradesco',
    appStoreId: '330893542',
    webUrl: 'https://banco.bradesco',
  },
  santander: {
    name: 'Santander',
    color: '#EC0000',
    icon: '🔴',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'santander',
    packageAndroid: 'com.santander.app',
    appStoreId: '495496702',
    webUrl: 'https://www.santander.com.br',
  },
  inter: {
    name: 'Banco Inter',
    color: '#FF7A00',
    icon: '🟠',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'bancointer',
    packageAndroid: 'br.com.intermedium',
    appStoreId: '1007712080',
    webUrl: 'https://www.bancointer.com.br',
  },
  bb: {
    name: 'Banco do Brasil',
    color: '#FFCC00',
    icon: '💛',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'bb',
    packageAndroid: 'br.com.bb.android',
    appStoreId: '330943784',
    webUrl: 'https://www.bb.com.br',
  },
  caixa: {
    name: 'Caixa Econômica',
    color: '#005CA9',
    icon: '💙',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'caixa',
    packageAndroid: 'br.com.gabba.Caixa',
    appStoreId: '490aboradir506045',
    webUrl: 'https://www.caixa.gov.br',
  },
  c6bank: {
    name: 'C6 Bank',
    color: '#242424',
    icon: '⬛',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'c6bank',
    packageAndroid: 'com.c6bank.app',
    appStoreId: '1436329058',
    webUrl: 'https://www.c6bank.com.br',
  },
  picpay: {
    name: 'PicPay',
    color: '#21C25E',
    icon: '💚',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'picpay',
    packageAndroid: 'com.picpay',
    appStoreId: '561524159',
    webUrl: 'https://www.picpay.com',
  },
  mercadopago: {
    name: 'Mercado Pago',
    color: '#009EE3',
    icon: '🔵',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'mercadopago',
    packageAndroid: 'com.mercadopago.wallet',
    appStoreId: '925436649',
    webUrl: 'https://www.mercadopago.com.br',
  },
  pagbank: {
    name: 'PagBank',
    color: '#00A651',
    icon: '💚',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'pagbank',
    packageAndroid: 'br.com.uol.ps.myaccount',
    appStoreId: '1446281937',
    webUrl: 'https://pagseguro.uol.com.br',
  },
  neon: {
    name: 'Neon',
    color: '#0DC5FF',
    icon: '🩵',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'neon',
    packageAndroid: 'br.com.neon',
    appStoreId: '1260498498',
    webUrl: 'https://www.neon.com.br',
  },
  next: {
    name: 'Next',
    color: '#00D47B',
    icon: '💚',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'next',
    packageAndroid: 'br.com.bradesco.next',
    appStoreId: '1251174498',
    webUrl: 'https://next.me',
  },
  original: {
    name: 'Banco Original',
    color: '#00853D',
    icon: '💚',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'original',
    packageAndroid: 'br.com.original.bank',
    appStoreId: '988448706',
    webUrl: 'https://www.original.com.br',
  },
  sicoob: {
    name: 'Sicoob',
    color: '#003641',
    icon: '🌲',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'sicoob',
    packageAndroid: 'br.com.sicoobnet.homolog',
    appStoreId: '492082496',
    webUrl: 'https://www.sicoob.com.br',
  },
  sicredi: {
    name: 'Sicredi',
    color: '#00A651',
    icon: '💚',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'sicredi',
    packageAndroid: 'br.com.sicredi.app',
    appStoreId: '981508006',
    webUrl: 'https://www.sicredi.com.br',
  },
  banrisul: {
    name: 'Banrisul',
    color: '#0056A8',
    icon: '💙',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'banrisul',
    packageAndroid: 'br.com.banrisul',
    appStoreId: '464882726',
    webUrl: 'https://www.banrisul.com.br',
  },
  c6: {
    name: 'C6 Bank',
    color: '#242424',
    icon: '⬛',
    supportsPixKey: true,
    supportsBoleto: true,
    scheme: 'c6bank',
    packageAndroid: 'com.c6bank.app',
    appStoreId: '1436329058',
    webUrl: 'https://www.c6bank.com.br',
  },
  outros: {
    name: 'Outro Banco',
    color: '#666666',
    icon: '🏦',
    supportsPixKey: true,
    supportsBoleto: false,
    scheme: '',
    webUrl: '',
  },
};

/**
 * Formata valor em centavos para o formato esperado pelos deep links
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace('.', '');
}

/**
 * Formata valor para exibição
 */
function formatAmountDecimal(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Gera URL encode para parâmetros
 */
function encodeParam(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Serviço de Deep Links para bancos brasileiros
 */
export class BankDeepLinkService implements IBankDeepLinkService {
  /**
   * Gera deep link para um banco específico
   */
  generateDeepLink(bank: SupportedBank, paymentData: PaymentData): BankDeepLink {
    const bankInfo = BANK_INFO[bank];

    if (bank === 'outros' || !bankInfo.scheme) {
      // Para bancos não suportados, gerar PIX Copia e Cola
      return this.generatePixCopiaECola(paymentData);
    }

    let url = '';
    let androidIntent = '';
    let iosUniversalLink = '';
    let fallbackUrl = bankInfo.webUrl;

    switch (bank) {
      case 'nubank':
        url = this.generateNubankDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'itau':
        url = this.generateItauDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'bradesco':
        url = this.generateBradescoDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'santander':
        url = this.generateSantanderDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'inter':
        url = this.generateInterDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'bb':
        url = this.generateBBDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'caixa':
        url = this.generateCaixaDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'c6bank':
        url = this.generateC6DeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'picpay':
        url = this.generatePicPayDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'mercadopago':
        url = this.generateMercadoPagoDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'pagbank':
        url = this.generatePagBankDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'neon':
        url = this.generateNeonDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      case 'next':
        url = this.generateNextDeepLink(paymentData);
        androidIntent = this.generateAndroidIntent(bankInfo.packageAndroid!, url);
        break;

      default:
        // Para outros bancos, tentar abrir app genérico
        url = `${bankInfo.scheme}://`;
        break;
    }

    return {
      bank,
      scheme: bankInfo.scheme,
      url,
      fallbackUrl,
      androidIntent,
      iosUniversalLink,
    };
  }

  /**
   * Gera deep links para todos os bancos suportados
   */
  generateAllDeepLinks(paymentData: PaymentData): BankDeepLink[] {
    const banks: SupportedBank[] = [
      'nubank', 'itau', 'bradesco', 'santander', 'inter',
      'bb', 'caixa', 'c6bank', 'picpay', 'mercadopago',
      'pagbank', 'neon', 'next'
    ];

    return banks.map(bank => this.generateDeepLink(bank, paymentData));
  }

  /**
   * Detecta bancos instalados (só funciona no client-side)
   */
  async detectInstalledBanks(): Promise<SupportedBank[]> {
    // Esta função precisa ser executada no cliente
    // Usamos uma técnica de tentar abrir o deep link e verificar se funciona
    const installedBanks: SupportedBank[] = [];

    // Em ambiente de produção, isso seria feito através de:
    // 1. Android: PackageManager.getInstalledPackages()
    // 2. iOS: UIApplication.canOpenURL()
    // Como estamos em PWA, dependemos do fallback

    return installedBanks;
  }

  /**
   * Abre o app do banco (client-side)
   */
  async openBankApp(deepLink: BankDeepLink): Promise<boolean> {
    try {
      // Detectar plataforma
      const isAndroid = /android/i.test(navigator.userAgent);
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

      // Timeout para detectar se o app abriu
      let appOpened = false;

      const handleVisibilityChange = () => {
        if (document.hidden) {
          appOpened = true;
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Primeiro tentar o deep link nativo (scheme://)
      // Isso tenta abrir o app diretamente se instalado
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Tentar abrir via iframe (funciona melhor em alguns devices)
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.location.href = deepLink.url;
        }
      } catch {
        // Silently ignore - some browsers block this
      }

      // Também tentar via window.location para garantir
      window.location.href = deepLink.url;

      // Aguardar um pouco para ver se o app abriu
      await new Promise(resolve => setTimeout(resolve, 2000));

      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Limpar iframe
      try {
        document.body.removeChild(iframe);
      } catch {
        // Ignore if already removed
      }

      // Se o app não abriu (página ainda visível), o app não está instalado
      // NÃO abrir fallback automaticamente - deixar o deep link tentar
      if (!appOpened) {
        // Tentar novamente com Android Intent se disponível
        if (isAndroid && deepLink.androidIntent) {
          // Pequeno delay antes de tentar o intent
          await new Promise(resolve => setTimeout(resolve, 500));
          window.location.href = deepLink.androidIntent;
          return true; // Assumir que o intent vai funcionar
        }

        // No iOS, o deep link já deveria ter funcionado
        // Se chegou aqui, o app provavelmente não está instalado
        // Mas não abrir fallback automaticamente para evitar ir para Play Store
        console.log('App pode não estar instalado, mas não abriremos fallback automaticamente');
        return false;
      }

      return appOpened;
    } catch (error) {
      console.error('Erro ao abrir app do banco:', error);
      // NÃO abrir fallback automaticamente
      return false;
    }
  }

  /**
   * Retorna informações do banco
   */
  getBankInfo(bank: SupportedBank) {
    const info = BANK_INFO[bank];
    return {
      name: info.name,
      color: info.color,
      icon: info.icon,
      supportsPixKey: info.supportsPixKey,
      supportsBoleto: info.supportsBoleto,
    };
  }

  // ==================== DEEP LINKS POR BANCO ====================

  private generateNubankDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      const params = new URLSearchParams();
      params.set('amount', formatAmountDecimal(data.amount));
      params.set('key', data.pixKey);
      if (data.receiverName) params.set('name', data.receiverName);
      if (data.description) params.set('description', data.description);

      // O Nubank usa nubank:// para abrir o app diretamente
      // nuapp:// é para links que funcionam via web
      return `nubank://pix/transfer?${params.toString()}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `nubank://boleto/pay?code=${encodeParam(data.barcode)}`;
    }

    // Abre a tela inicial do app
    return 'nubank://';
  }

  private generateItauDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `itau://pagamento?tipo=pix&valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `itau://boleto?codigo=${encodeParam(data.barcode)}`;
    }

    return 'itau://';
  }

  private generateBradescoDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `bradesco://pix?valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `bradesco://boleto?codigo=${encodeParam(data.barcode)}`;
    }

    return 'bradesco://';
  }

  private generateSantanderDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `santander://pix?amount=${formatAmountDecimal(data.amount)}&key=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `santander://boleto?barcode=${encodeParam(data.barcode)}`;
    }

    return 'santander://';
  }

  private generateInterDeepLink(data: PaymentData): string {
    // Banco Inter tem uma API aberta - pode ser integrado diretamente
    if (data.type === 'pix' && data.pixKey) {
      return `bancointer://pix?valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `bancointer://boleto?codigo=${encodeParam(data.barcode)}`;
    }

    return 'bancointer://';
  }

  private generateBBDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `bb://pix?valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `bb://boleto?codigo=${encodeParam(data.barcode)}`;
    }

    return 'bb://';
  }

  private generateCaixaDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `caixa://pix?valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `caixa://boleto?codigo=${encodeParam(data.barcode)}`;
    }

    return 'caixa://';
  }

  private generateC6DeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `c6bank://pix?amount=${formatAmountDecimal(data.amount)}&pixKey=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `c6bank://boleto?barcode=${encodeParam(data.barcode)}`;
    }

    return 'c6bank://';
  }

  private generatePicPayDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `picpay://pix?value=${formatAmountDecimal(data.amount)}&pixKey=${encodeParam(data.pixKey)}`;
    }

    return 'picpay://';
  }

  private generateMercadoPagoDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `mercadopago://pix?amount=${formatAmountDecimal(data.amount)}&key=${encodeParam(data.pixKey)}`;
    }

    return 'mercadopago://';
  }

  private generatePagBankDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `pagbank://pix?valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    if (data.type === 'boleto' && data.barcode) {
      return `pagbank://boleto?codigo=${encodeParam(data.barcode)}`;
    }

    return 'pagbank://';
  }

  private generateNeonDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `neon://pix?valor=${formatAmountDecimal(data.amount)}&chave=${encodeParam(data.pixKey)}`;
    }

    return 'neon://';
  }

  private generateNextDeepLink(data: PaymentData): string {
    if (data.type === 'pix' && data.pixKey) {
      return `next://pix?amount=${formatAmountDecimal(data.amount)}&pixKey=${encodeParam(data.pixKey)}`;
    }

    return 'next://';
  }

  /**
   * Gera Android Intent URI para fallback
   * O formato S.browser_fallback_url evita que vá para Play Store automaticamente
   */
  private generateAndroidIntent(packageName: string, deepLink: string): string {
    const scheme = deepLink.split('://')[0];
    const path = deepLink.replace(/^[a-z]+:\/\//, '');
    // Remover o fallback para Play Store - queremos que tente abrir o app diretamente
    return `intent://${path}#Intent;scheme=${scheme};package=${packageName};end`;
  }

  /**
   * Gera PIX Copia e Cola para bancos não suportados
   */
  private generatePixCopiaECola(data: PaymentData): BankDeepLink {
    // Gerar código PIX BR Code (EMV)
    // Este é um formato simplificado - em produção deveria usar a lib @pixkey/qrcode-static
    let pixCode = '';

    if (data.pixKey) {
      // Formato simplificado do BR Code
      const payload = {
        merchantAccountInformation: data.pixKey,
        merchantName: data.receiverName || 'Destinatario',
        merchantCity: 'Brasil',
        transactionAmount: data.amount.toFixed(2),
        additionalDataFieldTemplate: data.description || '',
      };

      // Em produção, usar uma lib para gerar o BR Code corretamente
      pixCode = `PIX:${data.pixKey}:${data.amount.toFixed(2)}`;
    }

    return {
      bank: 'outros',
      scheme: '',
      url: `pix:${pixCode}`,
      fallbackUrl: undefined,
    };
  }
}

// Singleton para uso no cliente
export const bankDeepLinkService = new BankDeepLinkService();
