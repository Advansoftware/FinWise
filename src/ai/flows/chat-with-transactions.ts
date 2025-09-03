
'use server';

import { ChatInput, ChatOutputSchema, ChatInputSchema } from '@/ai/ai-types';
import { createConfiguredAI, getModelReference } from '@/ai/genkit';
import { AICredential } from '@/lib/types';
import { ZodTypeAny } from 'zod';

const promptTemplate = `Você é FinWise, um assistente financeiro amigável e especialista. Sua principal tarefa é responder às perguntas do usuário sobre suas finanças com base nos dados fornecidos. Você deve responder em Português do Brasil.

Para otimizar suas respostas, você tem acesso a duas fontes de dados:

1.  **Relatórios Mensais (reports):** Um array JSON de resumos mensais pré-calculados. Estes relatórios contêm totais de receitas, despesas, balanço e gastos por categoria.
    - **USE ESTA FONTE PRIMARIAMENTE** para perguntas sobre meses passados ou períodos longos (ex: "Quanto gastei em Supermercado em Março?", "Qual foi meu balanço nos últimos 6 meses?"). É mais rápido e eficiente.

2.  **Transações Detalhadas (transactions):** Um array JSON com transações individuais.
    - **USE ESTA FONTE** para perguntas sobre o **mês atual**, para perguntas que exigem detalhes específicos que não estão nos relatórios (ex: "Liste minhas últimas 5 compras no iFood"), ou se um relatório para o mês solicitado não estiver disponível.

**Sua Estratégia de Resposta:**
- Primeiro, verifique se a pergunta pode ser respondida usando os 'reports'. Se sim, use-os.
- Se a pergunta for sobre o mês atual ou exigir detalhes granulares, use 'transactions'.
- Se não encontrar a informação em nenhuma das fontes, informe ao usuário de forma clara.
- Seja sempre claro, objetivo e amigável.

---

**Dados Disponíveis:**

**Histórico da Conversa:**
{{#each history}}
- {{role}}: {{content}}
{{/each}}

**Relatórios Mensais (para contexto histórico):**
{{{jsonStringify reports}}}

**Transações Detalhadas (para o período atual ou detalhes):**
{{{jsonStringify transactions}}}

---

**Pergunta do Usuário:** {{{prompt}}}

**Sua Resposta:**
`;


export async function chatWithTransactions(input: ChatInput, credential: AICredential) {
    const configuredAI = createConfiguredAI(credential);
    const modelRef = getModelReference(credential);

    const chatWithTransactionsPrompt = configuredAI.definePrompt({
        name: 'chatWithTransactionsPrompt',
        input: { schema: ChatInputSchema as unknown as ZodTypeAny },
        output: { schema: ChatOutputSchema as unknown as ZodTypeAny },
        model: modelRef, 
        prompt: promptTemplate,
    });

    const { output } = await chatWithTransactionsPrompt(input);

    if (!output) {
        throw new Error("IA não conseguiu gerar resposta.");
    }

    return output;
}
