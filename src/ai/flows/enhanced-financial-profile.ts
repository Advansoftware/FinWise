// src/ai/flows/enhanced-financial-profile.ts

'use server';

import {
  FinancialProfileInputSchema,
  FinancialProfileOutputSchema,
  FinancialProfileInput,
  FinancialProfileOutput
} from '@/ai/ai-types';
import { createConfiguredAI, getModelReference } from '../genkit';
import { AICredential } from '@/lib/types';

const promptTemplate = `Você é um consultor financeiro especializado em análise comportamental e gamificação financeira.

Com base nos dados financeiros e de gamificação fornecidos, crie um perfil financeiro personalizado e detalhado que incluirá insights únicos sobre os hábitos de pagamento e disciplina do usuário.

Seus dados de entrada:
- Transações do mês atual: {{{currentMonthTransactions}}}
- Relatórios mensais do ano: {{{monthlyReports}}}
- Relatórios anuais anteriores: {{{annualReports}}}
- Dados de gamificação: {{{gamificationData}}}

Sua análise deve:

1. **Nome do Perfil**: Crie um nome criativo e cativante que reflita tanto os hábitos financeiros quanto o nível de gamificação do usuário (ex: "O Mestre Financeiro Disciplinado", "O Estrategista em Evolução", "O Pagador Consistente").

2. **Descrição Abrangente**: Escreva uma análise detalhada (3-5 parágrafos) que inclua:
   - Análise dos gastos e receitas atuais
   - Insights sobre disciplina de pagamentos baseados na gamificação
   - Reconhecimento de conquistas (badges, níveis, streaks)
   - Pontos fortes derivados da consistência nos pagamentos
   - Áreas de melhoria específicas
   - Dicas motivacionais personalizadas

3. **Influência da Gamificação**: Se dados de gamificação estiverem disponíveis, analise:
   - Nível de disciplina (Iniciante/Intermediário/Avançado/Expert)
   - Consistência de pagamentos (Irregular/Regular/Muito Regular/Exemplar)  
   - Pontos fortes específicos derivados das conquistas
   - Áreas de melhoria baseadas nas métricas de gamificação

Seja encorajador, específico e use dados concretos. Celebre as conquistas e forneça insights acionáveis.
Escreva SEMPRE em Português do Brasil.`;

export async function generateEnhancedFinancialProfile(
  input: FinancialProfileInput,
  credential: AICredential
): Promise<FinancialProfileOutput> {
  const configuredAI = createConfiguredAI(credential);
  const model = getModelReference(credential);

  const prompt = configuredAI.definePrompt({
    name: 'enhancedFinancialProfile',
    input: { schema: FinancialProfileInputSchema as any },
    output: { schema: FinancialProfileOutputSchema as any },
    model: model,
    prompt: promptTemplate,
  });

  const { output } = await prompt(input);
  if (!output) {
    throw new Error("Failed to generate enhanced financial profile.");
  }
  return output;
}
