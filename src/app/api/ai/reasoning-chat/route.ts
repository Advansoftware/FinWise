// src/app/api/ai/reasoning-chat/route.ts
import { NextRequest } from 'next/server';
import { getActiveAICredential } from '@/services/settings-service';
import { checkAICredits } from '@/services/credits-service';
import { ChatInput } from '@/ai/ai-types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, prompt, userId, transactions, monthlyReports, annualReports } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obter credencial ativa
    const credential = await getActiveAICredential(userId);

    // Verificar se é modelo Ollama (requisito para linha de raciocínio)
    if (credential.provider !== 'ollama') {
      return new Response(
        JSON.stringify({ error: 'Linha de raciocínio disponível apenas para modelos Ollama' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // IMPORTANTE: Não verificar créditos para Ollama do usuário
    // Créditos só são consumidos na Gastometria AI padrão
    // Quando o usuário usa seu próprio Ollama, é ilimitado    // Preparar prompt para o modelo
    const chatInput: ChatInput = {
      history,
      prompt,
      transactions,
      monthlyReports,
      annualReports
    };

    const systemPrompt = buildSystemPrompt(chatInput);

    // Fazer requisição para o Ollama
    const ollamaUrl = credential.ollamaServerAddress || 'http://127.0.0.1:11434';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: credential.ollamaModel || 'llama3',
        prompt: systemPrompt,
        stream: true,
        options: {
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API erro: ${response.status}`);
    }

    // Configurar stream response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line);
                  if (data.response) {
                    // Enviar chunk para o cliente
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
                    );
                  }

                  if (data.done) {
                    controller.enqueue(
                      new TextEncoder().encode('data: [DONE]\n\n')
                    );
                    controller.close();
                    return;
                  }
                } catch (e) {
                  // Ignorar erros de parsing
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro no streaming:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Erro na API de raciocínio:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function buildSystemPrompt(input: ChatInput): string {
  const historyText = input.history.map(msg =>
    `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
  ).join('\n');

  const transactionsText = input.transactions?.length > 0
    ? input.transactions.map(t => `- ${t.date}: ${t.item} - R$ ${t.amount} (${t.category})`).join('\n')
    : 'Nenhuma transação disponível para este mês.';

  const monthlyReportsText = input.monthlyReports && input.monthlyReports.length > 0
    ? input.monthlyReports.map(r => `- ${r.monthName}/${r.year}: Receitas R$ ${r.totalIncome}, Despesas R$ ${r.totalExpense}`).join('\n')
    : 'Nenhum relatório mensal disponível.';

  const annualReportsText = input.annualReports && input.annualReports.length > 0
    ? input.annualReports.map(r => `- Ano ${r.year}: Receitas R$ ${r.totalIncome}, Despesas R$ ${r.totalExpense}, Saldo R$ ${r.balance}`).join('\n')
    : 'Nenhum relatório anual disponível.';

  return `Você é um assistente financeiro inteligente especializado em análise de gastos e planejamento financeiro.

**Histórico da Conversa:**
${historyText}

**Relatórios Anuais (para contexto de anos anteriores):**
${annualReportsText}

**Relatórios Mensais (para contexto do ano atual):**
${monthlyReportsText}

**Transações Detalhadas (para o mês atual):**
${transactionsText}

**Pergunta do Usuário:** ${input.prompt}

**Instruções:**
- Responda de forma clara e útil sobre finanças pessoais
- Use os dados fornecidos para dar insights precisos
- Se for um modelo de raciocínio, mostre seu processo de pensamento entre <think></think>
- Seja direto e prático nas suas respostas

**Sua Resposta:**`;
}