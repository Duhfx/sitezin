import Link from "next/link";
import TiktokSyncButton from "@/components/admin/TiktokSyncButton";

type Props = {
  username: string | null;
  followers: number | null;
  likes: number | null;
  videos: number | null;
  syncedAt: string | null;
  status?: string;
};

export default function TiktokConnect({
  username,
  followers,
  likes,
  videos,
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
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-muted-foreground">
            <path d="M16.5 3a5.6 5.6 0 0 0 3.9 1.6V8a8.9 8.9 0 0 1-3.9-.9v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.2a2.6 2.6 0 0 0-.9-.2 2.6 2.6 0 1 0 2.6 2.6V3h3.1Z" />
          </svg>
          <span className="text-sm font-medium text-foreground">TikTok</span>
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
          {isConnected && <TiktokSyncButton />}
          <Link
            href="/api/auth/tiktok"
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
          {likes !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Curtidas (total)</p>
              <p className="text-sm font-medium text-foreground">
                {likes.toLocaleString("pt-BR")}
              </p>
            </div>
          )}
          {videos !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Vídeos</p>
              <p className="text-sm font-medium text-foreground">{videos}</p>
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
          TikTok conectado com sucesso!
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
