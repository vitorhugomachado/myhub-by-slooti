import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade e LGPD — Neura",
  description:
    "Como a Neura trata dados pessoais e clínicos em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Voltar ao login
        </Link>

        <header className="mt-6 flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-card">
            <Shield className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
              Política de Privacidade e LGPD
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Neura by Slooti · Atualizado em julho de 2026
            </p>
          </div>
        </header>

        <article className="card mt-6 space-y-6 p-5 text-[14px] leading-relaxed text-brand sm:p-8">
          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">1. Quem somos</h2>
            <p className="text-muted">
              A Neura é uma plataforma de gestão para profissionais de
              psicologia (agenda, pacientes, relatos de sessão e financeiro).
              Esta política explica como tratamos dados pessoais e informações
              clínicas, em linha com a Lei Geral de Proteção de Dados (LGPD —
              Lei nº 13.709/2018).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">2. Dados que tratamos</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-muted">
              <li>
                <span className="font-semibold text-brand">Conta:</span> nome,
                e-mail, senha (armazenada de forma criptografada) e, se
                autorizado, dados do login Google.
              </li>
              <li>
                <span className="font-semibold text-brand">Pacientes:</span>{" "}
                cadastro, contatos, dados clínicos e relatos que você registrar.
              </li>
              <li>
                <span className="font-semibold text-brand">Agenda e financeiro:</span>{" "}
                sessões, status e lançamentos vinculados à sua conta.
              </li>
              <li>
                <span className="font-semibold text-brand">Uso técnico:</span>{" "}
                cookies de sessão necessários para autenticação.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">3. Finalidade e base legal</h2>
            <p className="text-muted">
              Tratamos os dados para prestar o serviço contratado (execução de
              contrato / legítimo interesse operacional) e, no caso de dados
              sensíveis de saúde, com base no exercício regular de direitos e
              deveres do profissional de saúde, conforme a LGPD. Você é o
              controlador dos dados dos seus pacientes; a Neura atua como
              operador técnico da plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">4. Compartilhamento</h2>
            <p className="text-muted">
              Não vendemos dados pessoais. Podemos usar provedores de
              infraestrutura (hospedagem, banco de dados) estritamente para
              operar o serviço, sob obrigação de confidencialidade. Integrações
              opcionais (ex.: Google Meet/login) só ocorrem com sua autorização.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">5. Segurança e retenção</h2>
            <p className="text-muted">
              Adotamos medidas técnicas razoáveis (isolamento por conta,
              autenticação, comunicação HTTPS). Os dados permanecem enquanto sua
              conta estiver ativa ou pelo tempo necessário para cumprimento de
              obrigações legais. Você pode solicitar exclusão da conta e dos
              dados associados, observados deveres profissionais de guarda de
              prontuário.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">6. Seus direitos (LGPD)</h2>
            <p className="text-muted">
              Titulares podem solicitar confirmação de tratamento, acesso,
              correção, anonimização, portabilidade, eliminação e informação
              sobre compartilhamentos, nos termos da lei. Para exercer direitos
              sobre dados da sua conta Neura, entre em contato conosco. Para
              dados de pacientes, o canal principal é o profissional
              responsável pelo atendimento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[16px] font-bold">7. Contato</h2>
            <p className="text-muted">
              Dúvidas sobre privacidade ou LGPD: use o e-mail de suporte da sua
              conta Neura / Slooti. Esta página pode ser atualizada; a data no
              topo indica a versão vigente.
            </p>
          </section>
        </article>

        <p className="mt-6 text-center text-[12px] text-muted">
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
