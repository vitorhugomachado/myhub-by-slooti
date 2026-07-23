/** Utilitários de endereço (ViaCEP). */

export type AddressFromCep = {
  zip: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatZip(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export async function lookupCep(
  zip: string,
  signal?: AbortSignal,
): Promise<AddressFromCep | null> {
  const cep = onlyDigits(zip);
  if (cep.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro || !data.localidade) return null;

  return {
    zip: formatZip(data.cep || cep),
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}
