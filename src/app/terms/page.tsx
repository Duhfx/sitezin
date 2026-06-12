import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Serviço | Aline Carreiro",
  description: "Termos e condições de uso da plataforma de parcerias de Aline Carreiro.",
};

const LAST_UPDATED = "12 de junho de 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-5 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-accent2/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-24 w-full">
        <header className="mb-12">
          <p className="text-sm text-muted-foreground mb-2">Última atualização: {LAST_UPDATED}</p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">
            Termos de Serviço
          </h1>
        </header>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar esta plataforma (&quot;Plataforma&quot;), você concorda em ficar vinculado a estes
              Termos de Serviço. A Plataforma é operada por <strong className="text-foreground">Aline Carreiro</strong>,
              criadora de conteúdo de lifestyle e viagens (&quot;nós&quot; ou &quot;Operador&quot;). Se você não concordar com
              qualquer parte destes termos, não utilize a Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">2. Descrição do Serviço</h2>
            <p>
              A Plataforma oferece as seguintes funcionalidades:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Exibição de cupons e códigos de parceria para o público em geral.</li>
              <li>Solicitação de mídia kit por marcas e parceiros comerciais interessados em colaborações.</li>
              <li>Painel administrativo restrito à Operadora para gerenciamento de conteúdo, métricas e solicitações.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">3. Uso Permitido</h2>
            <p>
              Você concorda em utilizar a Plataforma apenas para fins legítimos e de acordo com estes Termos.
              É proibido:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Usar a Plataforma para fins fraudulentos ou ilegais.</li>
              <li>Tentar acessar áreas restritas sem autorização.</li>
              <li>Enviar informações falsas ou enganosas em solicitações de mídia kit.</li>
              <li>Reproduzir, redistribuir ou explorar comercialmente o conteúdo sem permissão expressa.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">4. Integrações com Redes Sociais</h2>
            <p>
              A Plataforma pode se conectar às redes sociais da Operadora (Instagram via Meta Graph API e
              TikTok via TikTok Login Kit) para sincronizar métricas e estatísticas da conta. Essas conexões:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>São de uso exclusivo da Operadora, não de usuários externos.</li>
              <li>Coletam apenas dados da conta pública da Operadora (seguidores, visualizações, engajamento).</li>
              <li>Não acessam dados de terceiros ou seguidores de forma individual.</li>
            </ul>
            <p>
              O uso dessas integrações está sujeito também aos termos de serviço da Meta Platforms, Inc. e
              da TikTok Pte. Ltd., respectivamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo disponível na Plataforma — incluindo textos, imagens, logotipos e design —
              é de propriedade da Operadora ou de seus parceiros licenciantes. Nenhum conteúdo pode ser
              reproduzido, distribuído ou utilizado comercialmente sem autorização prévia por escrito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">6. Limitação de Responsabilidade</h2>
            <p>
              A Plataforma é fornecida &quot;no estado em que se encontra&quot;, sem garantias de qualquer tipo.
              A Operadora não se responsabiliza por danos diretos, indiretos ou consequentes decorrentes
              do uso ou da impossibilidade de uso da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">7. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações entrarão
              em vigor imediatamente após a publicação na Plataforma. O uso continuado da Plataforma após
              as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">8. Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pela legislação brasileira. Qualquer disputa decorrente destes Termos
              será submetida ao foro da Comarca de Blumenau, Santa Catarina, Brasil, com renúncia a qualquer
              outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">9. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos, entre em contato pelo e-mail disponível no perfil público
              da Operadora nas redes sociais.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <a href="/" className="text-sm text-primary hover:underline">← Voltar para a página inicial</a>
        </div>
      </div>
    </main>
  );
}
