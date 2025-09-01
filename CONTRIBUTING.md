# Guia de Contribuição do FinWise

Ficamos felizes com seu interesse em contribuir para o FinWise! Este documento fornece diretrizes para garantir que o processo de contribuição seja o mais suave e eficaz possível.

## Como Contribuir

A forma mais comum de contribuição é através de Pull Requests (PRs). Siga os passos abaixo:

1.  **Faça um Fork do Repositório**: Clique no botão "Fork" no canto superior direito da página do GitHub.
2.  **Clone seu Fork**:
    ```bash
    git clone https://github.com/SEU_USUARIO/finwise-dashboard.git
    ```
3.  **Crie uma Branch**: Crie uma branch descritiva para sua nova funcionalidade ou correção.
    ```bash
    git checkout -b minha-nova-feature
    ```
4.  **Faça suas Alterações**: Implemente sua funcionalidade ou corrija o bug.
5.  **Commit suas Alterações**: Escreva uma mensagem de commit clara e concisa. Use o padrão [Conventional Commits](https://www.conventionalcommits.org/).
    ```bash
    git commit -m "feat: Adiciona funcionalidade X"
    git commit -m "fix: Corrige bug na renderização do gráfico"
    ```
6.  **Envie para seu Fork**:
    ```bash
    git push origin minha-nova-feature
    ```
7.  **Abra um Pull Request**: Vá para o repositório original e abra um Pull Request, detalhando as alterações que você fez.

## Padrões de Código

- **TypeScript**: Todo o código deve ser escrito em TypeScript. Utilize tipagens fortes sempre que possível, aproveitando os tipos definidos em `src/lib/types.ts`.
- **ESLint & Prettier**: O projeto está configurado com ESLint para garantir a qualidade do código e Prettier para a formatação. Certifique-se de que seu código segue as regras configuradas rodando `npm run lint` antes de commitar.
- **Nomenclatura**:
  - **Componentes**: Use PascalCase (ex: `MyComponent.tsx`).
  - **Hooks**: Use camelCase com o prefixo `use` (ex: `useTransactions.ts`).
  - **Arquivos de Fluxos/Ações**: Use kebab-case (ex: `get-spending-tip.ts`).
- **Comentários**: Adicione comentários apenas quando a lógica for complexa e não for autoexplicativa.

## Processo de Revisão de Pull Request

- Um mantenedor do projeto revisará seu PR.
- Esteja aberto a feedback e disposto a fazer alterações se necessário.
- Assim que o PR for aprovado, ele será mesclado à branch principal.

Agradecemos sua contribuição para tornar o FinWise ainda melhor!
