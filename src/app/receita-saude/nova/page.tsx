import { Suspense } from "react";
import NovaReceitaClient from "./NovaReceitaClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <NovaReceitaClient />
    </Suspense>
  );
}
