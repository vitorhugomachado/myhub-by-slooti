import { currentUser, todaySchedule } from "@/lib/mock-data";

export function Welcome() {
  const firstName = currentUser.name.split(" ")[0];
  const nextUp =
    todaySchedule.find((a) => a.status === "now") ??
    todaySchedule.find((a) => a.status === "upcoming");
  const remaining = todaySchedule.filter((a) => a.status !== "done").length;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">
        Olá, {firstName}.
      </h1>
      <p className="text-[13px] font-medium text-muted">
        {nextUp ? (
          <>
            Você tem {remaining} atendimento{remaining > 1 ? "s" : ""} restante
            {remaining > 1 ? "s" : ""} hoje ·{" "}
            {nextUp.status === "now" ? "em andamento" : `próximo às ${nextUp.start}`}
          </>
        ) : (
          "Nenhum atendimento restante hoje."
        )}
      </p>
    </div>
  );
}
