// src/app/(app)/settings/page.tsx
export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações da sua conta e da aplicação.</p>
            </div>
             <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">As abas de configurações (Geral, IA, etc.) serão implementadas aqui.</p>
            </div>
        </div>
    )
}
