"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { criarSolicitacao } from "@/app/midia-kit/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const campos = [
  { name: "nome", label: "Seu Nome", type: "text", required: true, placeholder: "Como podemos te chamar?" },
  { name: "empresa", label: "Nome da Empresa", type: "text", required: true, placeholder: "Qual empresa você representa?" },
  { name: "email", label: "E-mail Corporativo", type: "email", required: true, placeholder: "seu@email.com" },
  { name: "whatsapp", label: "WhatsApp", type: "tel", required: false, placeholder: "(00) 00000-0000" },
  { name: "instagram_empresa", label: "Instagram da empresa", type: "text", required: false, placeholder: "@suaempresa" },
] as const;

export default function RequestForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const get = (k: string) => String(formData.get(k) ?? "").trim();

    if (!get("nome") || !get("empresa") || !get("email") || !get("descricao")) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!EMAIL_RE.test(get("email"))) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    const result = await criarSolicitacao(formData);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-10 text-center max-w-lg mx-auto"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Solicitação Recebida!
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Tudo certo. Nossa equipe de parcerias já recebeu seus dados e entrará em contato muito em breve para darmos o próximo passo.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.name} className={`space-y-2 ${campo.name === 'email' ? 'sm:col-span-2' : ''}`}>
              <label htmlFor={campo.name} className="block text-sm font-semibold text-foreground">
                {campo.label}
                {campo.required ? (
                  <span className="ml-0.5 text-primary">*</span>
                ) : (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(opcional)</span>
                )}
              </label>
              <input 
                id={campo.name} 
                name={campo.name} 
                type={campo.type} 
                placeholder={campo.placeholder}
                className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="descricao" className="block text-sm font-semibold text-foreground">
            Modelo de Parceria <span className="text-primary">*</span>
          </label>
          <textarea 
            id="descricao" 
            name="descricao" 
            rows={4} 
            placeholder="Conte-nos como imagina nossa parceria (ex: cupons de desconto, banners, divulgações nas redes...)"
            className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-y"
          />
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          {loading ? (
            "Enviando solicitação..."
          ) : (
            <>
              Enviar Solicitação de Mídia Kit
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" /> Resposta em até 24h úteis
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Seus dados ficam seguros
          </span>
        </div>
      </form>
    </motion.div>
  );
}
