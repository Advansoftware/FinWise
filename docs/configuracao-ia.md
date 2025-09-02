# Guia de Configuração da IA

Para usar os recursos inteligentes do FinWise, como o chat, dicas e escaneamento de notas, você precisa configurar um "provedor de IA". O FinWise suporta três opções: **Ollama** (para uso local, gratuito), **Google AI** e **OpenAI**.

Você pode ter várias configurações salvas, mas **apenas uma pode estar ativa por vez**.

Siga os passos abaixo na tela de **Configurações > Configurações de IA**:

## Passo 1: Criar uma Nova Credencial

1. Na tela de Configurações, clique no botão **"Nova Credencial"**.
2. Um formulário aparecerá. Preencha um **Nome da Configuração** (ex: "Minha Chave OpenAI" ou "Ollama em Casa").
3. Escolha o **Provedor** na lista: `Ollama`, `Google AI`, ou `OpenAI`.

## Passo 2: Configurar o Provedor Escolhido

### Opção A: Configurando o Ollama (Uso Local)

Ollama é um software que permite rodar modelos de IA poderosos diretamente no seu computador. É uma ótima opção gratuita e que mantém seus dados privados.

1.  **Instale o Ollama**: Se ainda não o fez, baixe e instale o Ollama em seu computador a partir do site oficial: [https://ollama.com/](https://ollama.com/).
2.  **Baixe um Modelo**: Após instalar, abra o terminal (ou prompt de comando) e baixe um modelo. Recomendamos o `llama3`. Execute o comando:
    ```bash
    ollama pull llama3
    ```
3.  **Preencha no FinWise**:
    *   **Nome da Configuração**: Dê um nome, como "Ollama Llama3".
    *   **Provedor**: Selecione `ollama`.
    *   **Endereço do Servidor Ollama**: O valor padrão `http://127.0.0.1:11434` geralmente funciona. Não altere a menos que você tenha configurado o Ollama de forma diferente.
    *   **Modelo Ollama**: Clique no botão com o ícone de recarregar para que o FinWise busque os modelos que você tem instalado. Selecione `llama3`.
4.  Clique em **Salvar**.

### Opção B: Configurando o Google AI (Gemini)

O Google oferece acesso a seus modelos de IA através de uma chave de API.

1.  **Obtenha uma Chave de API**:
    *   Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Faça login com sua conta do Google.
    *   Clique em **"Create API key"**.
    *   Copie a chave gerada. Ela será uma longa sequência de letras e números.
2.  **Preencha no FinWise**:
    *   **Nome da Configuração**: Dê um nome, como "Chave Google AI".
    *   **Provedor**: Selecione `googleai`.
    *   **Chave de API - Google AI**: Cole a chave que você copiou.
3.  Clique em **Salvar**.

### Opção C: Configurando o OpenAI (ChatGPT)

Você também pode usar os modelos da OpenAI, como o GPT-4o.

1.  **Obtenha uma Chave de API**:
    *   Acesse a [página de chaves de API da OpenAI](https://platform.openai.com/api-keys).
    *   Faça login com sua conta OpenAI.
    *   Clique em **"Create new secret key"**.
    *   Dê um nome à chave e copie-a.
    *   **Importante**: Para usar a API, você pode precisar ter créditos em sua conta OpenAI.
2.  **Preencha no FinWise**:
    *   **Nome da Configuração**: Dê um nome, como "Minha Chave OpenAI".
    *   **Provedor**: Selecione `openai`.
    *   **Modelo OpenAI**: Escolha um modelo da lista (recomendamos `gpt-4o`).
    *   **Chave de API - OpenAI**: Cole a chave que você copiou.
3.  Clique em **Salvar**.

## Passo 3: Ativar a Credencial

Após salvar, sua nova credencial aparecerá na lista. Se for a única, ela já estará ativa. Se houver outras, clique no botão **"Ativar"** ao lado da que você deseja usar. A credencial ativa terá um ícone de verificação verde ao lado.

Pronto! Agora todos os recursos de IA do FinWise usarão a configuração que você ativou.