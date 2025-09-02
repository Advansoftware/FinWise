// src/app/(app)/transactions/page.tsx
export default function TransactionsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
                <p className="text-muted-foreground">Visualize e gerencie suas transações.</p>
            </div>
            {/* O conteúdo da tabela de transações irá aqui */}
            <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">A tabela de transações com filtros e paginação será implementada aqui.</p>
            </div>
        </div>
    )
}
