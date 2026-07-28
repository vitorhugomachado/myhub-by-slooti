/**
 * Configuração do mega menu.
 * Para adicionar submenus: inclua itens em `columns` de um grupo,
 * ou crie um novo grupo em `megaNavItems`.
 */

export type MegaNavLink = {
  label: string;
  description: string;
  href: string;
  /** Mostra como bloqueado (Pro) se o plano não tiver financeiro */
  requiresFinance?: boolean;
  /** Preenchido em runtime por filterMegaNav */
  locked?: boolean;
};

export type MegaNavColumn = {
  title: string;
  /** Destaca a coluna (fundo suave) */
  highlight?: boolean;
  items: MegaNavLink[];
};

export type MegaNavItem = {
  id: string;
  label: string;
  /** Link direto (sem painel). Use sozinho ou junto com columns. */
  href?: string;
  columns?: MegaNavColumn[];
  /** Marca item como Pro bloqueado se o plano não tiver financeiro */
  requiresFinance?: boolean;
  locked?: boolean;
};

export const megaNavItems: MegaNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
  },
  {
    id: "agenda",
    label: "Agenda",
    href: "/agenda",
    columns: [
      {
        title: "Sessões",
        items: [
          {
            label: "Agenda",
            description: "Calendário e horários do dia",
            href: "/agenda",
          },
        ],
      },
      {
        title: "Fluxo clínico",
        items: [
          {
            label: "Relatos de sessões",
            description: "Resumos e evoluções salvos",
            href: "/pacientes/relatos",
          },
          {
            label: "Prontuários",
            description: "Histórico clínico por paciente",
            href: "/pacientes/prontuarios",
          },
        ],
      },
      {
        title: "Em breve",
        highlight: true,
        items: [
          {
            label: "Lista de espera",
            description: "Fila de encaixes e vagas",
            href: "/agenda",
          },
        ],
      },
    ],
  },
  {
    id: "pacientes",
    label: "Pacientes",
    href: "/pacientes",
    columns: [
      {
        title: "Cadastro",
        items: [
          {
            label: "Lista de pacientes",
            description: "Buscar, filtrar e editar fichas",
            href: "/pacientes",
          },
          {
            label: "Novo paciente",
            description: "Abrir cadastro completo",
            href: "/pacientes?new=1",
          },
        ],
      },
      {
        title: "Clínico",
        items: [
          {
            label: "Relatos de sessões",
            description: "Resumos e evoluções por atendimento",
            href: "/pacientes/relatos",
          },
          {
            label: "Prontuários",
            description: "Queixa, diagnóstico e histórico clínico",
            href: "/pacientes/prontuarios",
          },
        ],
      },
      {
        title: "Atalhos",
        highlight: true,
        items: [
          {
            label: "Pacientes ativos",
            description: "Ver só quem está em acompanhamento",
            href: "/pacientes?status=ativo",
          },
          {
            label: "Novo relato",
            description: "Preencher após a sessão",
            href: "/prontuario/novo",
          },
        ],
      },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    href: "/financeiro",
    requiresFinance: true,
  },
  {
    id: "gestao",
    label: "Gestão",
    columns: [
      {
        title: "Clínica",
        items: [
          {
            label: "Dashboard",
            description: "Visão geral do dia",
            href: "/",
          },
        ],
      },
      {
        title: "Em breve",
        highlight: true,
        items: [
          {
            label: "Receita Saúde",
            description: "Emissão fiscal em desenvolvimento",
            href: "#",
          },
        ],
      },
    ],
  },
];

/** Flat links (compatível com usos antigos / mobile simplificado). */
export const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Agenda", href: "/agenda" },
  { label: "Pacientes", href: "/pacientes" },
  { label: "Financeiro", href: "/financeiro" },
] as const;

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "#") return false;
  const pathOnly = href.split("?")[0] ?? href;
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export function megaItemIsActive(pathname: string, item: MegaNavItem) {
  if (item.href && isActivePath(pathname, item.href)) return true;
  return (item.columns ?? []).some((col) =>
    col.items.some((link) => isActivePath(pathname, link.href)),
  );
}

/** Mantém todos os itens; marca financeiro como locked quando !showFinance. */
export function filterMegaNav(items: MegaNavItem[], showFinance: boolean) {
  return items.map((item) => {
    const locked = Boolean(item.requiresFinance && !showFinance);
    if (!item.columns) return { ...item, locked };
    return {
      ...item,
      locked,
      columns: item.columns.map((col) => ({
        ...col,
        items: col.items.map((link) => ({
          ...link,
          locked: Boolean(link.requiresFinance && !showFinance),
        })),
      })),
    };
  });
}
