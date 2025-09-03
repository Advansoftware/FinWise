---
title: "Guia de Importação"
order/docs/importacao.md: 7
---

# Guia de Importação de Extratos

Adicionar transações uma por uma pode ser demorado. A funcionalidade de **Importação** é a maneira mais rápida de adicionar um grande volume de transações ao FinWise de uma só vez, usando arquivos de extrato do seu banco.

## Formatos Suportados

O FinWise suporta os dois formatos de arquivo mais comuns oferecidos pelos bancos:

1.  **CSV** (Comma-Separated Values): Um formato de planilha simples, que pode ser aberto em programas como Excel ou Google Sheets. É altamente flexível.
2.  **OFX** (Open Financial Exchange): Um formato mais antigo, porém padronizado, usado por muitos bancos e softwares de finanças.

A maioria dos bancos permite que você baixe seu extrato de conta corrente ou fatura do cartão de crédito em um desses dois formatos.

## Como Importar Transações

O processo foi projetado para ser um passo a passo simples.

1.  **Acesse a Página de Importação**: Vá para a página **"Importar"** no menu lateral.

2.  **Faça o Upload do Arquivo**:
    -   Clique na área designada ou arraste e solte o arquivo `.csv` ou `.ofx` que você baixou do seu banco.

3.  **Mapeamento das Colunas (Apenas para CSV)**:
    -   Se você enviou um arquivo **OFX**, este passo é pulado, pois o formato já é padronizado.
    -   Se você enviou um arquivo **CSV**, a tela de mapeamento aparecerá. Cada banco formata o CSV de um jeito diferente. Aqui, você vai "ensinar" ao FinWise o que cada coluna do seu arquivo significa.
    -   Para cada campo do FinWise (como `Data`, `Item`, `Valor`), selecione a coluna correspondente do seu arquivo na lista suspensa.
    -   Os campos com asterisco (`*`) são obrigatórios.

4.  **Revisão dos Dados**:
    -   Após o mapeamento (ou diretamente, para OFX), o FinWise mostrará uma tabela com uma pré-visualização das transações que ele conseguiu ler e formatar.
    -   Confira se os dados (especialmente datas e valores) parecem corretos.

5.  **Importação Final**:
    -   Se tudo estiver certo, clique no botão **"Importar Transações"**.
    -   O FinWise adicionará todas as transações da lista ao seu histórico. Elas serão associadas à categoria padrão "Outros". Você pode editá-las depois, se necessário.

Pronto! Em poucos cliques, você pode ter meses de histórico financeiro adicionados ao seu painel.
