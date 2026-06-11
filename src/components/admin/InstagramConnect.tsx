import Link from "next/link";
import InstagramSyncButton from "@/components/admin/InstagramSyncButton";

type Props = {
  username: string | null;
  followers: number | null;
  posts: number | null;
  syncedAt: string | null;
  status?: string;
};

export default function InstagramConnect({
  username,
  followers,
  posts,
  syncedAt,
  status,
}: Props) {
  const isConnected = !!username;

  const syncedDate = syncedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(syncedAt))
    : null;

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-muted-foreground">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-sm font-medium text-foreground">Instagram</span>
          {isConnected ? (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              Conectado
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Não conectado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConnected && <InstagramSyncButton />}
          <Link
            href="/api/auth/meta"
            className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {isConnected ? "Reconectar" : "Conectar"}
          </Link>
        </div>
      </div>

      {isConnected && (
        <div className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Usuário</p>
            <p className="text-sm font-medium text-foreground">@{username}</p>
          </div>
          {followers !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Seguidores</p>
              <p className="text-sm font-medium text-foreground">
                {followers.toLocaleString("pt-BR")}
              </p>
            </div>
          )}
          {posts !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Posts</p>
              <p className="text-sm font-medium text-foreground">{posts}</p>
            </div>
          )}
          {syncedDate && (
            <div>
              <p className="text-xs text-muted-foreground">Última sync</p>
              <p className="text-sm text-muted-foreground">{syncedDate}</p>
            </div>
          )}
        </div>
      )}

      {status === "conectado" && (
        <p className="mt-2 text-xs font-medium text-success">
          Instagram conectado com sucesso!
        </p>
      )}
      {status === "sem-pagina" && (
        <p className="mt-2 text-xs text-destructive">
          Nenhuma Página do Facebook encontrada. Crie uma página vinculada à conta Instagram.
        </p>
      )}
      {status === "sem-instagram" && (
        <p className="mt-2 text-xs text-destructive">
          A Página do Facebook não tem uma conta Instagram Business vinculada.
        </p>
      )}
      {status === "erro" && (
        <p className="mt-2 text-xs text-destructive">
          Erro ao conectar. Tente novamente.
        </p>
      )}
    </div>
  );
}
