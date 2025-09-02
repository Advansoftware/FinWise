// src/app/(app)/profile/page.tsx
export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
                <p className="text-muted-foreground">Atualize suas informações pessoais.</p>
            </div>
             <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Os formulários para atualizar nome e senha serão implementados aqui.</p>
            </div>
        </div>
    )
}
