// src/app/(app)/import/page.tsx
export default function ImportPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Importar Transações</h1>
                <p className="text-muted-foreground">Faça o upload de um arquivo CSV para importar suas transações.</p>
            </div>
             <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">A funcionalidade de importação de CSV será implementada aqui.</p>
            </div>
        </div>
    )
}
