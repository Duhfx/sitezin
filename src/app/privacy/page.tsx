import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Aline Carreiro",
  description: "Política de privacidade e tratamento de dados da plataforma de parcerias de Aline Carreiro.",
};

const LAST_UPDATED = "12 de junho de 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-5 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-accent2/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-24 w-full">
        <header className="mb-12">
          <p className="text-sm text-muted-foreground mb-2">Última atualização: {LAST_UPDATED}</p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">
            Política de Privacidade
          </h1>
        </header>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como <strong className="text-foreground">Aline Carreiro</strong>{" "}
              (&quot;Operadora&quot;, &quot;nós&quot;) coleta, utiliza, armazena e protege as informações obtidas por meio desta
              Plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">2. Dados Coletados de Usuários Externos</h2>
            <p>
              Para usuários que solicitam o mídia kit ou navegam pelas páginas públicas, coletamos:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong className="text-foreground">Dados fornecidos voluntariamente:</strong> nome, e-mail,
                empresa/marca e mensagem enviados pelo formulário de solicitação de mídia kit.
              </li>
              <li>
                <strong className="text-foreground">Dados de acesso:</strong> endereço IP e data/hora de
                visualização do link de mídia kit (para controle interno de acessos).
              </li>
            </ul>
            <p>
              Não coletamos dados de navegação, cookies de rastreamento ou informações além das estritamente
              necessárias para o funcionamento da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">3. Integração com TikTok (Login Kit)</h2>
            <p>
              A Plataforma integra-se à API do TikTok por meio do{" "}
              <strong className="text-foreground">TikTok Login Kit</strong> exclusivamente para uso da própria
              Operadora. Essa integração:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                É iniciada manualmente pela Operadora no painel administrativo restrito — usuários externos
                não têm acesso a esse fluxo.
              </li>
              <li>
                Coleta os seguintes dados da conta TikTok da Operadora via OAuth:{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">display_name</span>,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">avatar_url</span>,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">username</span>,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">follower_count</span>,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">likes_count</span>,{" "}
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">video_count</span> e
                metadados de vídeos recentes (visualizações, curtidas, comentários, compartilhamentos).
              </li>
              <li>
                Os tokens de acesso e refresh tokens são armazenados de forma segura no banco de dados
                (Supabase, com Row-Level Security) e nunca são expostos publicamente.
              </li>
              <li>
                Nenhum dado de seguidores, fãs ou outros usuários do TikTok é coletado ou armazenado.
              </li>
              <li>
                Os dados coletados via TikTok são utilizados exclusivamente para exibir métricas no
                painel administrativo da Operadora e no mídia kit enviado a potenciais parceiros.
              </li>
            </ul>
            <p>
              O uso desta integração também está sujeito à{" "}
              <a
                href="https://www.tiktok.com/legal/page/global/privacy-policy/en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de Privacidade do TikTok
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">4. Integração com Instagram (Meta Graph API)</h2>
            <p>
              De forma similar ao TikTok, a Plataforma conecta-se à conta Instagram da Operadora via
              Meta Graph API exclusivamente para sincronização de métricas (seguidores, alcance,
              engajamento, demografia da audiência). Nenhum dado de seguidores individuais é coletado.
            </p>
            <p>
              O uso desta integração também está sujeito à{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de Privacidade da Meta
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">5. Finalidade e Base Legal do Tratamento</h2>
            <p>Os dados coletados são tratados com as seguintes finalidades e bases legais (LGPD):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-foreground font-medium">Dado</th>
                    <th className="text-left py-2 pr-4 text-foreground font-medium">Finalidade</th>
                    <th className="text-left py-2 text-foreground font-medium">Base Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 pr-4">Nome e e-mail (formulário)</td>
                    <td className="py-2 pr-4">Responder solicitações de parceria</td>
                    <td className="py-2">Consentimento / Legítimo interesse</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">IP e timestamp (acesso ao mídia kit)</td>
                    <td className="py-2 pr-4">Controle interno de acessos</td>
                    <td className="py-2">Legítimo interesse</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Métricas TikTok / Instagram</td>
                    <td className="py-2 pr-4">Exibição no painel e no mídia kit</td>
                    <td className="py-2">Consentimento (da própria Operadora)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">6. Armazenamento e Segurança</h2>
            <p>
              Os dados são armazenados no{" "}
              <strong className="text-foreground">Supabase</strong> (infraestrutura em nuvem com servidores
              na AWS). Adotamos medidas técnicas para proteger as informações, incluindo criptografia em
              trânsito (HTTPS/TLS), Row-Level Security no banco de dados e acesso administrativo
              autenticado por senha.
            </p>
            <p>
              Os tokens de acesso de redes sociais são armazenados de forma criptografada e nunca são
              transmitidos a terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">7. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong className="text-foreground">Provedores de infraestrutura:</strong> Supabase (banco
                de dados) e Vercel (hospedagem), estritamente para operação da Plataforma.
              </li>
              <li>
                <strong className="text-foreground">Obrigação legal:</strong> quando exigido por lei ou
                ordem judicial.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">8. Seus Direitos (LGPD)</h2>
            <p>
              Se você forneceu dados por meio do formulário de solicitação, você tem o direito de:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Solicitar acesso, correção ou exclusão dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar a portabilidade dos dados.</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato pelo e-mail disponível no perfil público
              da Operadora nas redes sociais.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">9. Retenção de Dados</h2>
            <p>
              Dados de solicitações de mídia kit são retidos pelo tempo necessário para resposta comercial
              e, no máximo, por 2 (dois) anos. Dados de acesso (IP/timestamp) são retidos por até 6 meses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">10. Alterações nesta Política</h2>
            <p>
              Esta Política pode ser atualizada periodicamente. A data da última atualização é indicada
              no topo desta página. O uso continuado da Plataforma após alterações constitui aceitação
              da Política revisada.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl text-foreground">11. Contato</h2>
            <p>
              Para dúvidas, solicitações ou reclamações relacionadas a esta Política, entre em contato
              pelo e-mail disponível no perfil público da Operadora nas redes sociais ou pelo DM
              no Instagram ou TikTok.
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
