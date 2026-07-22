import { Suspense } from "react";
import NovoProntuarioClient from "./NovoProntuarioClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <NovoProntuarioClient />
    </Suspense>
  );
}
