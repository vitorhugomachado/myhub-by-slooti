import { Suspense } from "react";
import { PatientsPage } from "@/components/patients/PatientsPage";

export default function PacientesRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg text-[13px] text-muted">
          Carregando pacientes…
        </div>
      }
    >
      <PatientsPage />
    </Suspense>
  );
}
