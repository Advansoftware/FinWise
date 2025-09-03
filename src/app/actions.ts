
'use server';

import { Transaction, AICredential, MonthlyReport, UserPlan } from '@/lib/types';
import { z } from 'zod';
import { generateSpendingTip } from '@/ai/flows/ai-powered-spending-tips';
import { chatWithTransactions } from '@/ai/flows/chat-with-transactions';
import { extractReceiptInfo } from '@/ai/flows/extract-receipt-info';
import { suggestCategoryForItem } from '@/ai/flows/suggest-category';
import { generateMonthlyReport } from '@/ai/flows/generate-monthly-report';
import { generateAnnualReport } from '@/ai/flows/generate-annual-report';
import { suggestBudgetAmount } from '@/ai/flows/suggest-budget-amount';
import { projectGoalCompletion } from '@/ai/flows/project-goal-completion';
import { generateAutomaticBudgets } from '@/ai/flows/generate-automatic-budgets';
import { predictFutureBalance } from '@/ai/flows/predict-future-balance';
import {
  ChatInput,
  ReceiptInfoInput,
  ReceiptInfoOutput,
  SuggestCategoryInput,
  SuggestCategoryOutput,
  FinancialProfileInput,
  FinancialProfileInputSchema,
  FinancialProfileOutputSchema,
  AnalyzeTransactionsInputSchema,
  AnalyzeTransactionsOutputSchema,
  GenerateReportInput,
  GenerateReportOutput,
  GenerateAnnualReportInput,
  GenerateAnnualReportOutput,
  SuggestBudgetInput,
  SuggestBudgetOutput,
  ProjectGoalCompletionInput,
  ProjectGoalCompletionOutput,
  GenerateAutomaticBudgetsInput,
  GenerateAutomaticBudgetsOutput,
  PredictFutureBalanceInput,
  PredictFutureBalanceOutput,
  AICreditLogAction
} from '@/ai/ai-types';
import { createConfiguredAI, getModelReference } from '@/ai/genkit';
import { getAdminApp } from '@/lib/firebase-admin';
import { FieldValue, increment } from 'firebase-admin/firestore';

// Default AI settings for fallback ONLY.
const DEFAULT_AI_CREDENTIAL: AICredential = {
  id: 'default-fallback',
  name: 'Default Fallback Ollama',
  provider: 'ollama',
  ollamaModel: 'llama3',
  ollamaServerAddress: 'http://127.0.0.1:11434',
  openAIModel: 'gpt-3.5-turbo'
};

async function consumeAICredits(userId: string, cost: number, action: AICreditLogAction): Promise<void> {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    
    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${userId}`);

    try {
        await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error("Usuário não encontrado.");
            }
            
            const userData = userDoc.data();
            const currentPlan = userData?.plan || 'Básico';
            const currentCredits = userData?.aiCredits || 0;

            if (currentPlan === 'Básico') {
                 throw new Error("Este recurso está disponível apenas para assinantes dos planos Pro ou Plus. Faça upgrade para continuar.");
            }

            if (cost > 0 && currentCredits < cost) {
                throw new Error(`Créditos de IA insuficientes. Você precisa de ${cost} créditos, mas tem apenas ${currentCredits}. Considere comprar mais créditos ou aguardar a renovação mensal.`);
            }

            // Decrement credits and log the action
            if (cost > 0) {
              transaction.update(userRef, { aiCredits: increment(-cost) });
            }

            const logRef = adminDb.collection('users').doc(userId).collection('aiCreditLogs').doc();
            transaction.set(logRef, {
              action,
              cost,
              timestamp: new Date().toISOString(), // Use ISO string for consistency
            });
        });
    } catch (error) {
        // Re-throw the original error to be displayed to the user
        throw error;
    }
}


// Server action to get AI settings using Admin SDK
export async function getActiveAICredential(userId: string): Promise<AICredential> {
  if (!userId) {
    console.warn("getActiveAICredential called without a userId. Returning default settings.");
    return DEFAULT_AI_CREDENTIAL;
  }

  try {
    const adminDb = getAdminApp().firestore();
    const settingsRef = adminDb.doc(`users/${userId}/settings/ai`);
    const docSnap = await settingsRef.get();

    if (docSnap.exists()) {
        const settings = docSnap.data();
        if (settings && settings.activeCredentialId && settings.credentials) {
            const activeCredential = settings.credentials.find((c: AICredential) => c.id === settings.activeCredentialId);
            if (activeCredential) {
                // Merge with defaults to ensure all fields are present
                return { ...DEFAULT_AI_CREDENTIAL, ...activeCredential };
            }
        }
    }
    
    // No active/valid credential found for this user, return defaults
    return DEFAULT_AI_CREDENTIAL;
  } catch (error) {
    console.error("Error getting AI settings from Firestore with Admin SDK:", error);
    // In case of error (e.g., permissions), return defaults to avoid breaking the app
    return DEFAULT_AI_CREDENTIAL;
  }
}


// --- AI Actions ---

export async function getSpendingTip(transactions: Transaction[], userId: string, forceRefresh: boolean = false): Promise<string> {
  const cost = forceRefresh ? 1 : 0;
  await consumeAICredits(userId, cost, 'Dica Rápida');
  try {
    const credential = await getActiveAICredential(userId);
    const result = await generateSpendingTip({
      transactions: JSON.stringify(transactions, null, 2)
    }, credential);

    return result.tip;
  } catch (error) {
    console.error('Error generating spending tip:', error);
    if (error instanceof Error) return error.message;
    return "Desculpe, não consegui gerar uma dica agora. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function getFinancialProfile(input: FinancialProfileInput, userId: string, forceRefresh: boolean = false): Promise<string> {
  const cost = forceRefresh ? 5 : 0;
  await consumeAICredits(userId, cost, 'Perfil Financeiro');
  try {
    const credential = await getActiveAICredential(userId);
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'financialProfilePrompt',
      input: { schema: FinancialProfileInputSchema },
      output: { schema: FinancialProfileOutputSchema },
      model: modelRef,
      prompt: `Você é um analista financeiro sagaz e positivo. Sua tarefa é criar um perfil financeiro para o usuário.

Para isso, você tem uma hierarquia de dados:
1.  **Relatórios Anuais (annualReports):** Resumos de anos anteriores. Use-os para entender tendências de longo prazo.
2.  **Relatórios Mensais (monthlyReports):** Resumos de meses do ano corrente. Use-os para entender o comportamento no ano atual.
3.  **Transações do Mês Atual (currentMonthTransactions):** Dados do mês corrente. Use-os para entender os hábitos mais recentes.

Com base na combinação dessas informações, defina um perfil financeiro para o usuário. Dê um nome criativo e uma descrição que resuma seus padrões de gastos de forma amigável e perspicaz. Foque em fornecer uma narrativa, não apenas números. Toda a saída deve ser em Português do Brasil.

Relatórios de Anos Anteriores:
{{{annualReports}}}

Relatórios Mensais do Ano Corrente:
{{{monthlyReports}}}

Transações do Mês Atual:
{{{currentMonthTransactions}}}
`,
    });

    const { output } = await prompt(input);

    if (!output) {
      return "Não foi possível gerar seu perfil. Tente novamente.";
    }

    return `**${output.profileName}**\n\n${output.profileDescription}`;
  } catch (error) {
    console.error('Error generating financial profile:', error);
    if (error instanceof Error) return error.message;
    return "Não foi possível gerar seu perfil. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function analyzeTransactions(transactions: Transaction[], userId: string): Promise<string> {
  await consumeAICredits(userId, 5, 'Análise de Transações');
  try {
    const credential = await getActiveAICredential(userId);
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const prompt = configuredAI.definePrompt({
      name: 'analyzeTransactionsPrompt',
      input: { schema: AnalyzeTransactionsInputSchema },
      output: { schema: AnalyzeTransactionsOutputSchema },
      model: modelRef,
      prompt: `You are a meticulous financial auditor. Analyze this small batch of transactions and provide a brief analysis in markdown. Look for anomalies (e.g., unusually high amounts), patterns (e.g., frequent small purchases), or potential recategorization (e.g., a "Padaria" purchase in "Restaurante" could be "Supermercado"). Be concise. All output must be in Brazilian Portuguese.

Transactions:
{{{txns}}}
`,
    });

    const { output } = await prompt({ txns: JSON.stringify(transactions, null, 2) });
    return output?.analysis || "Nenhuma análise pôde ser gerada.";
  } catch (error) {
    console.error('Error analyzing transactions:', error);
    if (error instanceof Error) return error.message;
    return "Ocorreu um erro ao analisar as transações. Verifique suas configurações de IA.";
  }
}

export async function getChatbotResponse(input: ChatInput, userId: string): Promise<string> {
  await consumeAICredits(userId, 1, 'Chat com Assistente');
  try {
    const credential = await getActiveAICredential(userId);
    const result = await chatWithTransactions(input, credential);
    return result.response;
  } catch (error) {
    console.error("Error in getChatbotResponse:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    if (errorMessage.includes("ECONNREFUSED")){
       return "Não foi possível conectar ao servidor Ollama. Verifique se ele está em execução e acessível.";
    }
     if (error instanceof Error) return error.message;
    return "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique suas configurações de IA e tente novamente.";
  }
}

export async function extractReceiptInfoAction(input: ReceiptInfoInput, userId: string): Promise<ReceiptInfoOutput> {
    await consumeAICredits(userId, 10, 'Leitura de Nota Fiscal (OCR)');
    const credential = await getActiveAICredential(userId);
    return await extractReceiptInfo(input, credential);
}

export async function suggestCategoryForItemAction(input: SuggestCategoryInput, userId: string): Promise<SuggestCategoryOutput> {
    await consumeAICredits(userId, 1, 'Sugestão de Categoria');
    const credential = await getActiveAICredential(userId);
    return suggestCategoryForItem(input, credential);
}

export async function generateMonthlyReportAction(input: GenerateReportInput, userId: string): Promise<GenerateReportOutput> {
  await consumeAICredits(userId, 5, 'Relatório Mensal');
  const credential = await getActiveAICredential(userId);
  return generateMonthlyReport(input, credential);
}

export async function generateAnnualReportAction(input: GenerateAnnualReportInput, userId: string): Promise<GenerateAnnualReportOutput> {
  await consumeAICredits(userId, 10, 'Relatório Anual');
  const credential = await getActiveAICredential(userId);
  return generateAnnualReport(input, credential);
}

export async function suggestBudgetAmountAction(input: SuggestBudgetInput, userId: string): Promise<SuggestBudgetOutput> {
    await consumeAICredits(userId, 2, 'Sugestão de Orçamento');
    const credential = await getActiveAICredential(userId);
    return suggestBudgetAmount(input, credential);
}

export async function projectGoalCompletionAction(input: ProjectGoalCompletionInput, userId: string): Promise<ProjectGoalCompletionOutput> {
    await consumeAICredits(userId, 3, 'Projeção de Meta');
    const credential = await getActiveAICredential(userId);
    return projectGoalCompletion(input, credential);
}

export async function generateAutomaticBudgetsAction(input: GenerateAutomaticBudgetsInput, userId: string): Promise<GenerateAutomaticBudgetsOutput> {
    await consumeAICredits(userId, 5, 'Criação de Orçamentos Automáticos');
    const credential = await getActiveAICredential(userId);
    return generateAutomaticBudgets(input, credential);
}

export async function predictFutureBalanceAction(input: PredictFutureBalanceInput, userId: string, forceRefresh: boolean = false): Promise<PredictFutureBalanceOutput> {
    const cost = forceRefresh ? 3 : 0;
    await consumeAICredits(userId, cost, 'Previsão de Saldo');
    const credential = await getActiveAICredential(userId);
    return predictFutureBalance(input, credential);
}

export async function getPlanAction(userId: string): Promise<UserPlan> {
    if (!userId) return 'Básico'; // Default to Básico if no user
    try {
        const adminDb = getAdminApp().firestore();
        const userDocRef = adminDb.doc(`users/${userId}`);
        const userDocSnap = await userDocRef.get();
        if (userDocSnap.exists()) {
            return userDocSnap.data()?.plan || 'Básico';
        }
        return 'Básico';
    } catch (error) {
        console.error("Error getting user plan:", error);
        return 'Básico';
    }
}

export async function updateUserPlanAction(userId: string, plan: UserPlan): Promise<void> {
    if (!userId) {
        throw new Error("Usuário não autenticado.");
    }
    const adminDb = getAdminApp().firestore();
    const userRef = adminDb.doc(`users/${userId}`);
    
    // In a real scenario, this would involve payment processing via Stripe, etc.
    // For this app, we just update the plan. Credit refills would be handled
    // by a separate webhook from the payment provider.
    const creditsMap = {
        'Básico': 0,
        'Pro': 100,
        'Plus': 300,
    };

    await userRef.update({
        plan: plan,
        aiCredits: creditsMap[plan], // Reset credits on plan change
    });
}
