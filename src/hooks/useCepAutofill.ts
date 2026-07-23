"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatZip,
  lookupCep,
  onlyDigits,
  type AddressFromCep,
} from "@/lib/address";

type CepFields = {
  zip: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

/**
 * Ao completar 8 dígitos do CEP, busca endereço no ViaCEP e preenche o form.
 */
export function useCepAutofill<T extends CepFields>(
  zip: string,
  apply: (address: AddressFromCep) => void,
) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const lastFetched = useRef("");
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    const digits = onlyDigits(zip);
    if (digits.length !== 8) {
      setStatus("idle");
      setMessage("");
      return;
    }
    if (digits === lastFetched.current) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      setMessage("Buscando CEP…");
      void lookupCep(digits, controller.signal)
        .then((address) => {
          if (controller.signal.aborted) return;
          if (!address) {
            setStatus("error");
            setMessage("CEP não encontrado. Preencha o endereço manualmente.");
            return;
          }
          lastFetched.current = digits;
          applyRef.current(address);
          setStatus("ok");
          setMessage("Endereço preenchido pelo CEP.");
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setStatus("error");
          setMessage("Não foi possível consultar o CEP. Tente novamente.");
        });
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [zip]);

  return { status, message, formatZip };
}
