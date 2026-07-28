import { DEFAULT_AVATAR } from "@/lib/avatar";
import { readUserStorage } from "@/lib/user-storage";

export { navItems } from "@/lib/navigation";

export const currentUser = {
  name: "Ana Silva",
  email: "ana.silva@myhub.app",
  avatar: DEFAULT_AVATAR,
};

export type AppointmentStatus = "done" | "now" | "upcoming" | "cancelled";

export type Appointment = {
  id: number;
  start: string;
  end: string;
  patient: string;
  /** FK opcional para o cadastro de paciente */
  patientId?: string;
  type: string;
  mode: "Presencial" | "Online";
  status: AppointmentStatus;
  avatar: string;
};

/** @deprecated Use Patient from loadPatients / findPatientByName. */
export type PatientProfile = {
  appointmentId: number;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  since: string;
  notes: string;
};

/** @deprecated Prefer cadastro em localStorage (Patient). Mantido só para legado. */
export const patientProfiles: PatientProfile[] = [];

// Agenda do dia (ordenada por horário). "now" = atendimento atual.
export const todaySchedule: Appointment[] = [
  {
    id: 1,
    start: "08:00",
    end: "08:50",
    patient: "Carla Mendes",
    type: "Ansiedade",
    mode: "Presencial",
    status: "done",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 2,
    start: "09:00",
    end: "09:50",
    patient: "Roberto Lima",
    type: "Terapia Cognitiva",
    mode: "Online",
    status: "done",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 3,
    start: "10:30",
    end: "11:20",
    patient: "Marina Alves",
    type: "Avaliação inicial",
    mode: "Online",
    status: "now",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 4,
    start: "14:00",
    end: "14:50",
    patient: "Julia Costa",
    type: "Terapia de casal",
    mode: "Online",
    status: "upcoming",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 5,
    start: "16:00",
    end: "16:50",
    patient: "Pedro Santos",
    type: "Retorno",
    mode: "Online",
    status: "upcoming",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  },
  {
    id: 6,
    start: "17:30",
    end: "18:20",
    patient: "Lucas Rocha",
    type: "Ansiedade",
    mode: "Presencial",
    status: "upcoming",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop&crop=face",
  },
];

export type UpcomingDay = {
  id: string;
  day: string;
  date: string;
  count: number;
  range: string;
  appointments: Appointment[];
};

export const upcomingDays: UpcomingDay[] = [
  {
    id: "amanha",
    day: "Amanhã",
    date: "23 Jul",
    count: 5,
    range: "09:00 – 18:00",
    appointments: [
      {
        id: 101,
        start: "09:00",
        end: "09:50",
        patient: "Beatriz Nunes",
        type: "Ansiedade",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 102,
        start: "10:30",
        end: "11:20",
        patient: "Felipe Andrade",
        type: "Retorno",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 103,
        start: "14:00",
        end: "14:50",
        patient: "Sofia Martins",
        type: "Avaliação inicial",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 104,
        start: "16:00",
        end: "16:50",
        patient: "Diego Freitas",
        type: "Terapia Cognitiva",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 105,
        start: "17:30",
        end: "18:20",
        patient: "Helena Dias",
        type: "Casal",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1524504388940-b1c17226555e?w=80&h=80&fit=crop&crop=face",
      },
    ],
  },
  {
    id: "sexta",
    day: "Sexta",
    date: "24 Jul",
    count: 3,
    range: "10:00 – 15:00",
    appointments: [
      {
        id: 201,
        start: "10:00",
        end: "10:50",
        patient: "Amanda Reis",
        type: "Ansiedade",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 202,
        start: "11:30",
        end: "12:20",
        patient: "Bruno Teixeira",
        type: "Retorno",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 203,
        start: "14:00",
        end: "14:50",
        patient: "Camila Borges",
        type: "Avaliação inicial",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=80&h=80&fit=crop&crop=face",
      },
    ],
  },
  {
    id: "segunda",
    day: "Segunda",
    date: "27 Jul",
    count: 6,
    range: "08:00 – 19:00",
    appointments: [
      {
        id: 301,
        start: "08:00",
        end: "08:50",
        patient: "Eduardo Pinto",
        type: "Ansiedade",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 302,
        start: "09:30",
        end: "10:20",
        patient: "Fernanda Lopes",
        type: "Terapia Cognitiva",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 303,
        start: "11:00",
        end: "11:50",
        patient: "Gustavo Melo",
        type: "Retorno",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 304,
        start: "14:00",
        end: "14:50",
        patient: "Isabela Castro",
        type: "Casal",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1548142813-c348350df52b?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 305,
        start: "16:00",
        end: "16:50",
        patient: "João Victor",
        type: "Avaliação inicial",
        mode: "Online",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face",
      },
      {
        id: 306,
        start: "18:00",
        end: "18:50",
        patient: "Larissa Prado",
        type: "Ansiedade",
        mode: "Presencial",
        status: "upcoming",
        avatar:
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop&crop=face",
      },
    ],
  },
];

export const reminders = [
  { id: 1, text: "Enviar devolutiva para Carla Mendes", tag: "Hoje" },
  { id: 2, text: "Concluir prontuário de Roberto Lima", tag: "Hoje" },
  { id: 3, text: "Confirmar sessão de Julia Costa", tag: "14:00" },
] as const;

export function getAppointmentById(id: number) {
  if (typeof window !== "undefined") {
    try {
      const raw = readUserStorage("myhub_schedule_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { id: number }[];
        const live = parsed.find((a) => a.id === id);
        if (live) return live as Appointment;
      }
    } catch {
      /* ignore */
    }
  }
  const fromToday = todaySchedule.find((a) => a.id === id);
  if (fromToday) return fromToday;
  for (const day of upcomingDays) {
    const found = day.appointments.find((a) => a.id === id);
    if (found) return found;
  }
  return undefined;
}

/** @deprecated Prefer findPatientByName / Patient em localStorage. */
export function getPatientProfile(
  appointmentId: number,
  fallback?: Appointment,
) {
  const appointment = getAppointmentById(appointmentId) ?? fallback;
  if (!appointment) return null;

  return {
    appointmentId,
    fullName: appointment.patient,
    email: "",
    phone: "",
    birthDate: "—",
    cpf: "—",
    since: "—",
    notes: "Use o cadastro em Pacientes para dados completos.",
  };
}
