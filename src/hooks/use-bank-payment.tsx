// src/hooks/use-bank-payment.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  PaymentContact,
  UserDevice,
  PaymentRequest,
  PaymentData,
  SupportedBank,
  CreateContactInput,
  UpdateContactInput,
  PaymentRequestResult,
  BankDeepLink,
  PushConfig,
  DeviceType,
  DevicePlatform,
} from "@/core/ports/bank-payment.port";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { bankDeepLinkService } from "@/services/bank-deep-link.service";
import { v4 as uuidv4 } from "uuid";

// ==================== TIPOS ====================

interface BankPaymentContextType {
  // State
  contacts: PaymentContact[];
  favoriteContacts: PaymentContact[];
  devices: UserDevice[];
  currentDevice: UserDevice | null;
  paymentRequests: PaymentRequest[];
  pendingRequests: PaymentRequest[];
  pushConfig: PushConfig | null;
  isLoading: boolean;
  loading: boolean; // Alias para isLoading
  isPushSupported: boolean;
  isPushEnabled: boolean;
  isMobile: boolean;
  hasMobileDevice: boolean;
  paymentHistory: PaymentRequest[];

  // Contatos
  createContact: (data: CreateContactInput) => Promise<PaymentContact | null>;
  updateContact: (id: string, data: UpdateContactInput) => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
  searchContacts: (query: string) => Promise<PaymentContact[]>;
  toggleFavorite: (id: string) => Promise<boolean>;
  refreshContacts: () => Promise<void>;

  // Dispositivos
  registerCurrentDevice: () => Promise<UserDevice | null>;
  registerDevice: (
    name: string,
    type: DeviceType,
    enablePush?: boolean
  ) => Promise<UserDevice | null>;
  setAsPrimaryDevice: () => Promise<boolean>;
  setPrimaryDevice: (deviceId: string) => Promise<boolean>;
  removeDevice: (id: string) => Promise<boolean>;
  updateDevice: (id: string, data: Partial<UserDevice>) => Promise<boolean>;
  refreshDevices: () => Promise<void>;

  // Pagamentos
  requestPayment: (
    paymentData: PaymentData,
    preferredBank?: SupportedBank
  ) => Promise<PaymentRequestResult | null>;
  initiatePayment: (data: {
    amount: number;
    description?: string;
    receiverName?: string;
    receiverPixKey?: string;
    bank?: SupportedBank;
    installmentId?: string;
  }) => Promise<{
    deepLinkOpened: boolean;
    pushSent: boolean;
    fallbackUrl?: string;
    requestId?: string;
  }>;
  processPayment: (
    requestId: string
  ) => Promise<{ deepLinkOpened: boolean; fallbackUrl?: string }>;
  openBankApp: (deepLink: BankDeepLink) => Promise<boolean>;
  markPaymentCompleted: (requestId: string) => Promise<boolean>;
  cancelPaymentRequest: (requestId: string) => Promise<boolean>;
  getPaymentRequest: (id: string) => Promise<PaymentRequest | null>;
  refreshPaymentHistory: () => Promise<void>;

  // Push
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  updatePushConfig: (config: Partial<PushConfig>) => Promise<boolean>;

  // Deep Links
  generateDeepLink: (
    bank: SupportedBank,
    paymentData: PaymentData
  ) => BankDeepLink;
  generateAllDeepLinks: (paymentData: PaymentData) => BankDeepLink[];
  getBankInfo: (bank: SupportedBank) => {
    name: string;
    color: string;
    icon: string;
    supportsPixKey: boolean;
    supportsBoleto: boolean;
  };

  // Utilities
  isMobileDevice: () => boolean;
  refreshData: () => Promise<void>;
}

const BankPaymentContext = createContext<BankPaymentContextType | null>(null);

// ==================== HELPERS ====================

/**
 * Detecta se é dispositivo móvel
 */
function detectIsMobile(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
}

/**
 * Detecta tipo de dispositivo
 */
function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";

  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/i.test(userAgent)) {
    return "tablet";
  }

  if (
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  ) {
    return "mobile";
  }

  return "desktop";
}

/**
 * Detecta plataforma
 */
function detectPlatform(): DevicePlatform {
  if (typeof window === "undefined") return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macos";
  if (/linux/i.test(userAgent)) return "linux";

  return "unknown";
}

/**
 * Gera ou recupera device ID persistente
 */
function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let deviceId = localStorage.getItem("gastometria_device_id");

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("gastometria_device_id", deviceId);
  }

  return deviceId;
}

/**
 * Gera nome amigável para o dispositivo
 */
function getDeviceName(): string {
  if (typeof window === "undefined") return "Dispositivo";

  const platform = detectPlatform();
  const type = detectDeviceType();

  const platformNames: Record<DevicePlatform, string> = {
    ios: "iPhone/iPad",
    android: "Android",
    windows: "Windows",
    macos: "Mac",
    linux: "Linux",
    unknown: "Desconhecido",
  };

  const typeNames: Record<DeviceType, string> = {
    mobile: "Celular",
    tablet: "Tablet",
    desktop: "Computador",
  };

  return `${typeNames[type]} ${platformNames[platform]}`;
}

// ==================== PROVIDER ====================

export function BankPaymentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // State
  const [contacts, setContacts] = useState<PaymentContact[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<UserDevice | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [pushConfig, setPushConfig] = useState<PushConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Ref para evitar múltiplas inicializações
  const initialized = useRef(false);

  // Verificar suporte a push
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPushSupported(
        "PushManager" in window && "serviceWorker" in navigator
      );
    }
  }, []);

  // Computed values
  const favoriteContacts = contacts.filter((c) => c.isFavorite);
  const pendingRequests = paymentRequests.filter((r) =>
    ["pending", "sent", "opened"].includes(r.status)
  );

  // ==================== DATA FETCHING ====================

  const fetchContacts = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(
        `/api/bank-payment/contacts?userId=${user.uid}`
      );
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    }
  }, [user?.uid]);

  const fetchDevices = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(
        `/api/bank-payment/devices?userId=${user.uid}`
      );
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);

        // Encontrar dispositivo atual
        const deviceId = getDeviceId();
        const current = data.devices?.find(
          (d: UserDevice) => d.deviceId === deviceId
        );
        setCurrentDevice(current || null);
      }
    } catch (error) {
      console.error("Erro ao buscar dispositivos:", error);
    }
  }, [user?.uid]);

  const fetchPaymentRequests = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(
        `/api/bank-payment/requests?userId=${user.uid}`
      );
      if (response.ok) {
        const data = await response.json();
        setPaymentRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    }
  }, [user?.uid]);

  const fetchPushConfig = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch("/api/bank-payment/push-config");
      if (response.ok) {
        const data = await response.json();
        setPushConfig(data.config || null);
        setIsPushEnabled(data.config?.enabled || false);
      }
    } catch (error) {
      console.error("Erro ao buscar config de push:", error);
    }
  }, [user?.uid]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchContacts(),
      fetchDevices(),
      fetchPaymentRequests(),
      fetchPushConfig(),
    ]);
    setIsLoading(false);
  }, [fetchContacts, fetchDevices, fetchPaymentRequests, fetchPushConfig]);

  // Inicialização
  useEffect(() => {
    if (user?.uid && !initialized.current) {
      initialized.current = true;
      refreshData();
    }
  }, [user?.uid, refreshData]);

  // ==================== CONTATOS ====================

  const createContact = useCallback(
    async (data: CreateContactInput): Promise<PaymentContact | null> => {
      if (!user?.uid) return null;

      try {
        const response = await fetch(
          `/api/bank-payment/contacts?userId=${user.uid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const { contact } = await response.json();
          setContacts((prev) => [...prev, contact]);
          toast({
            title: "Contato criado",
            description: `${contact.name} foi adicionado aos seus contatos.`,
          });
          return contact;
        } else {
          const error = await response.json();
          throw new Error(error.message);
        }
      } catch (error: any) {
        toast({
          title: "Erro ao criar contato",
          description: error.message,
          variant: "error",
        });
        return null;
      }
    },
    [user?.uid, toast]
  );

  const updateContact = useCallback(
    async (id: string, data: UpdateContactInput): Promise<boolean> => {
      if (!user?.uid) return false;
      try {
        const response = await fetch(
          `/api/bank-payment/contacts/${id}?userId=${user.uid}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const { contact } = await response.json();
          setContacts((prev) => prev.map((c) => (c.id === id ? contact : c)));
          toast({
            title: "Contato atualizado",
            description: "As informações foram salvas.",
          });
          return true;
        }
        return false;
      } catch (error) {
        toast({
          title: "Erro ao atualizar contato",
          variant: "error",
        });
        return false;
      }
    },
    [user?.uid, toast]
  );

  const deleteContact = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.uid) return false;
      try {
        const response = await fetch(
          `/api/bank-payment/contacts/${id}?userId=${user.uid}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setContacts((prev) => prev.filter((c) => c.id !== id));
          toast({
            title: "Contato removido",
          });
          return true;
        }
        return false;
      } catch (error) {
        toast({
          title: "Erro ao remover contato",
          variant: "error",
        });
        return false;
      }
    },
    [user?.uid, toast]
  );

  const searchContacts = useCallback(
    async (query: string): Promise<PaymentContact[]> => {
      if (!user?.uid || !query.trim()) return [];

      try {
        const response = await fetch(
          `/api/bank-payment/contacts/search?q=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          return data.contacts || [];
        }
        return [];
      } catch {
        return [];
      }
    },
    [user?.uid]
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return false;

      return updateContact(id, { isFavorite: !contact.isFavorite });
    },
    [contacts, updateContact]
  );

  // ==================== DISPOSITIVOS ====================

  const registerCurrentDevice =
    useCallback(async (): Promise<UserDevice | null> => {
      if (!user?.uid) return null;

      try {
        const deviceData = {
          deviceId: getDeviceId(),
          name: getDeviceName(),
          type: detectDeviceType(),
          platform: detectPlatform(),
          userAgent: navigator.userAgent,
        };

        const response = await fetch("/api/bank-payment/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
        });

        if (response.ok) {
          const { device } = await response.json();
          setCurrentDevice(device);
          setDevices((prev) => {
            const existing = prev.findIndex(
              (d) => d.deviceId === device.deviceId
            );
            if (existing >= 0) {
              return prev.map((d) =>
                d.deviceId === device.deviceId ? device : d
              );
            }
            return [...prev, device];
          });
          return device;
        }
        return null;
      } catch (error) {
        console.error("Erro ao registrar dispositivo:", error);
        return null;
      }
    }, [user?.uid]);

  const setAsPrimaryDevice = useCallback(async (): Promise<boolean> => {
    if (!currentDevice) return false;

    try {
      const response = await fetch(
        `/api/bank-payment/devices/${currentDevice.id}/set-primary`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        setDevices((prev) =>
          prev.map((d) => ({
            ...d,
            isPrimary: d.id === currentDevice.id,
          }))
        );
        setCurrentDevice((prev) =>
          prev ? { ...prev, isPrimary: true } : null
        );
        toast({
          title: "Dispositivo principal",
          description:
            "Este dispositivo agora receberá as notificações de pagamento.",
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentDevice, toast]);

  const removeDevice = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.uid) return false;
      try {
        const response = await fetch(
          `/api/bank-payment/devices/${id}?userId=${user.uid}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setDevices((prev) => prev.filter((d) => d.id !== id));
          if (currentDevice?.id === id) {
            setCurrentDevice(null);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [user?.uid, currentDevice]
  );

  // ==================== PAGAMENTOS ====================

  const requestPayment = useCallback(
    async (
      paymentData: PaymentData,
      preferredBank?: SupportedBank
    ): Promise<PaymentRequestResult | null> => {
      if (!user?.uid) return null;

      const isMobile = detectIsMobile();

      // Se é mobile, abrir banco diretamente sem criar request
      if (isMobile && preferredBank) {
        const deepLink = bankDeepLinkService.generateDeepLink(
          preferredBank,
          paymentData
        );

        toast({
          title: "Abrindo banco...",
          description: `Redirecionando para ${
            bankDeepLinkService.getBankInfo(preferredBank).name
          }`,
        });

        // Abrir o app do banco
        await bankDeepLinkService.openBankApp(deepLink);

        // Criar request para histórico
        try {
          const response = await fetch("/api/bank-payment/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentData,
              preferredBank,
              originDevice: "mobile",
            }),
          });

          if (response.ok) {
            const { request } = await response.json();
            setPaymentRequests((prev) => [request, ...prev]);

            return {
              paymentRequest: request,
              deepLink,
            };
          }
        } catch (error) {
          console.error("Erro ao registrar pagamento:", error);
        }

        return null;
      }

      // Se é desktop, criar request e enviar push para celular
      try {
        const response = await fetch("/api/bank-payment/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentData,
            preferredBank,
            originDevice: "desktop",
            sendPush: true, // Indica que deve enviar push
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setPaymentRequests((prev) => [result.paymentRequest, ...prev]);

          if (result.pushSent) {
            toast({
              title: "📱 Notificação enviada!",
              description: `Abra a notificação no seu ${
                result.targetDevice?.name || "celular"
              } para pagar.`,
            });
          } else {
            toast({
              title: "Nenhum dispositivo móvel",
              description:
                "Registre seu celular para receber notificações de pagamento.",
              variant: "error",
            });
          }

          return result;
        }
        return null;
      } catch (error: any) {
        toast({
          title: "Erro ao solicitar pagamento",
          description: error.message,
          variant: "error",
        });
        return null;
      }
    },
    [user?.uid, toast]
  );

  const openBankApp = useCallback(
    async (deepLink: BankDeepLink): Promise<boolean> => {
      return bankDeepLinkService.openBankApp(deepLink);
    },
    []
  );

  const markPaymentCompleted = useCallback(
    async (requestId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/bank-payment/requests/${requestId}/complete`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          setPaymentRequests((prev) =>
            prev.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: "completed",
                    completedAt: new Date().toISOString(),
                  }
                : r
            )
          );
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const cancelPaymentRequest = useCallback(
    async (requestId: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/bank-payment/requests/${requestId}/cancel`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          setPaymentRequests((prev) =>
            prev.map((r) =>
              r.id === requestId ? { ...r, status: "cancelled" } : r
            )
          );
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const getPaymentRequest = useCallback(
    async (id: string): Promise<PaymentRequest | null> => {
      try {
        const response = await fetch(`/api/bank-payment/requests/${id}`);
        if (response.ok) {
          const { request } = await response.json();
          return request;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  // ==================== PUSH NOTIFICATIONS ====================

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !user?.uid) return false;

    try {
      // Pedir permissão
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          title: "Permissão negada",
          description:
            "Você precisa permitir notificações para receber alertas de pagamento.",
          variant: "error",
        });
        return false;
      }

      // Registrar no service worker
      const registration = await navigator.serviceWorker.ready;

      // Obter chave pública VAPID
      const vapidResponse = await fetch("/api/bank-payment/vapid-public-key");
      const { publicKey } = await vapidResponse.json();

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      // Registrar dispositivo com subscription
      const deviceId = getDeviceId();
      const response = await fetch("/api/bank-payment/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          name: getDeviceName(),
          type: detectDeviceType(),
          platform: detectPlatform(),
          userAgent: navigator.userAgent,
          pushSubscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("p256dh")!)
                )
              ),
              auth: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("auth")!)
                )
              ),
            },
          },
        }),
      });

      if (response.ok) {
        const { device } = await response.json();
        setCurrentDevice(device);
        setIsPushEnabled(true);

        // Atualizar config
        await fetch("/api/bank-payment/push-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: true }),
        });

        toast({
          title: "🔔 Notificações ativadas!",
          description: "Você receberá alertas de pagamento neste dispositivo.",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao ativar push:", error);
      toast({
        title: "Erro ao ativar notificações",
        variant: "error",
      });
      return false;
    }
  }, [isPushSupported, user?.uid, toast]);

  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch("/api/bank-payment/push-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      });

      setIsPushEnabled(false);
      toast({
        title: "Notificações desativadas",
      });
      return true;
    } catch {
      return false;
    }
  }, [toast]);

  const updatePushConfigHandler = useCallback(
    async (config: Partial<PushConfig>): Promise<boolean> => {
      try {
        const response = await fetch("/api/bank-payment/push-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          const { config: newConfig } = await response.json();
          setPushConfig(newConfig);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  // ==================== DEEP LINKS ====================

  const generateDeepLink = useCallback(
    (bank: SupportedBank, paymentData: PaymentData): BankDeepLink => {
      return bankDeepLinkService.generateDeepLink(bank, paymentData);
    },
    []
  );

  const generateAllDeepLinks = useCallback(
    (paymentData: PaymentData): BankDeepLink[] => {
      return bankDeepLinkService.generateAllDeepLinks(paymentData);
    },
    []
  );

  const getBankInfo = useCallback((bank: SupportedBank) => {
    return bankDeepLinkService.getBankInfo(bank);
  }, []);

  // ==================== UTILITIES ====================

  const isMobileDevice = useCallback((): boolean => {
    return detectIsMobile();
  }, []);

  // ==================== NOVAS FUNÇÕES ====================

  // Alias e computed values
  const isMobile = detectIsMobile();
  const hasMobileDevice = devices.some(
    (d) => d.type === "mobile" && d.pushEndpoint
  );
  const paymentHistory = paymentRequests;

  // Refresh individual
  const refreshContacts = fetchContacts;
  const refreshDevices = fetchDevices;
  const refreshPaymentHistory = fetchPaymentRequests;

  // Register device com parâmetros
  const registerDevice = useCallback(
    async (
      name: string,
      type: DeviceType,
      enablePush: boolean = false
    ): Promise<UserDevice | null> => {
      if (!user?.uid) return null;

      try {
        const deviceData: any = {
          deviceId: getDeviceId(),
          name,
          type,
          platform: detectPlatform(),
          userAgent: navigator.userAgent,
        };

        // Se enablePush, obter subscription primeiro
        if (enablePush && isPushSupported) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            const vapidResponse = await fetch(
              "/api/bank-payment/vapid-public-key"
            );
            const { publicKey } = await vapidResponse.json();

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: publicKey,
            });

            deviceData.pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: btoa(
                  String.fromCharCode(
                    ...new Uint8Array(subscription.getKey("p256dh")!)
                  )
                ),
                auth: btoa(
                  String.fromCharCode(
                    ...new Uint8Array(subscription.getKey("auth")!)
                  )
                ),
              },
            };
          }
        }

        const response = await fetch(
          `/api/bank-payment/devices?userId=${user.uid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deviceData),
          }
        );

        if (response.ok) {
          const { device } = await response.json();
          setCurrentDevice(device);
          toast({
            title: "Dispositivo cadastrado!",
            description: `${name} foi adicionado com sucesso.`,
          });
          setDevices((prev) => {
            const existing = prev.findIndex(
              (d) => d.deviceId === device.deviceId
            );
            if (existing >= 0) {
              return prev.map((d) =>
                d.deviceId === device.deviceId ? device : d
              );
            }
            return [...prev, device];
          });
          return device;
        }
        return null;
      } catch (error) {
        console.error("Erro ao registrar dispositivo:", error);
        return null;
      }
    },
    [user?.uid, isPushSupported]
  );

  // Set primary device por ID
  const setPrimaryDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      if (!user?.uid) return false;
      try {
        const response = await fetch(
          `/api/bank-payment/devices/${deviceId}/set-primary?userId=${user.uid}`,
          {
            method: "POST",
          }
        );

        if (response.ok) {
          setDevices((prev) =>
            prev.map((d) => ({
              ...d,
              isPrimary: d.id === deviceId,
            }))
          );
          toast({
            title: "Dispositivo principal",
            description:
              "Este dispositivo agora receberá as notificações de pagamento.",
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [user?.uid, toast]
  );

  // Update device
  const updateDevice = useCallback(
    async (id: string, data: Partial<UserDevice>): Promise<boolean> => {
      if (!user?.uid) return false;
      try {
        const response = await fetch(
          `/api/bank-payment/devices/${id}?userId=${user.uid}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (response.ok) {
          const { device } = await response.json();
          setDevices((prev) => prev.map((d) => (d.id === id ? device : d)));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [user?.uid]
  );

  // Initiate payment (para PaymentButton)
  const initiatePayment = useCallback(
    async (data: {
      amount: number;
      description?: string;
      receiverName?: string;
      receiverPixKey?: string;
      bank?: SupportedBank;
      installmentId?: string;
    }): Promise<{
      deepLinkOpened: boolean;
      pushSent: boolean;
      fallbackUrl?: string;
      requestId?: string;
    }> => {
      const paymentData: PaymentData = {
        type: "pix",
        amount: data.amount,
        description: data.description,
        receiverName: data.receiverName,
        receiverPixKey: data.receiverPixKey,
        pixKey: data.receiverPixKey,
        bank: data.bank,
        installmentId: data.installmentId,
      };

      const result = await requestPayment(paymentData, data.bank);

      if (isMobile && result?.deepLink) {
        return {
          deepLinkOpened: true,
          pushSent: false,
          fallbackUrl: result.deepLink.fallbackUrl,
          requestId: result.paymentRequest?.id,
        };
      }

      return {
        deepLinkOpened: false,
        pushSent: result?.pushSent || false,
        fallbackUrl: undefined,
        requestId: result?.paymentRequest?.id,
      };
    },
    [requestPayment, isMobile]
  );

  // Process payment (para página de confirmação)
  const processPayment = useCallback(
    async (
      requestId: string
    ): Promise<{ deepLinkOpened: boolean; fallbackUrl?: string }> => {
      const request = await getPaymentRequest(requestId);
      if (!request) {
        throw new Error("Solicitação não encontrada");
      }

      const bank = request.preferredBank || "nubank";
      const deepLink = bankDeepLinkService.generateDeepLink(
        bank,
        request.paymentData
      );

      const opened = await bankDeepLinkService.openBankApp(deepLink);

      // Atualizar status
      await fetch(`/api/bank-payment/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "opened" }),
      });

      return {
        deepLinkOpened: opened,
        fallbackUrl: deepLink.fallbackUrl,
      };
    },
    [getPaymentRequest]
  );

  // ==================== CONTEXT VALUE ====================

  const value: BankPaymentContextType = {
    // State
    contacts,
    favoriteContacts,
    devices,
    currentDevice,
    paymentRequests,
    pendingRequests,
    pushConfig,
    isLoading,
    loading: isLoading,
    isPushSupported,
    isPushEnabled,
    isMobile,
    hasMobileDevice,
    paymentHistory,

    // Contatos
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    toggleFavorite,
    refreshContacts,

    // Dispositivos
    registerCurrentDevice,
    registerDevice,
    setAsPrimaryDevice,
    setPrimaryDevice,
    removeDevice,
    updateDevice,
    refreshDevices,

    // Pagamentos
    requestPayment,
    initiatePayment,
    processPayment,
    openBankApp,
    markPaymentCompleted,
    cancelPaymentRequest,
    getPaymentRequest,
    refreshPaymentHistory,

    // Push
    enablePushNotifications,
    disablePushNotifications,
    updatePushConfig: updatePushConfigHandler,

    // Deep Links
    generateDeepLink,
    generateAllDeepLinks,
    getBankInfo,

    // Utilities
    isMobileDevice,
    refreshData,
  };

  return (
    <BankPaymentContext.Provider value={value}>
      {children}
    </BankPaymentContext.Provider>
  );
}

// ==================== HOOK ====================

export function useBankPayment() {
  const context = useContext(BankPaymentContext);

  if (!context) {
    throw new Error(
      "useBankPayment deve ser usado dentro de BankPaymentProvider"
    );
  }

  return context;
}
