/** Silhueta cinza genérica até o usuário enviar uma foto. */
export const DEFAULT_AVATAR = "/avatar-placeholder.svg";

const MAX_AVATAR_BYTES = 900_000;

export function isDefaultAvatar(src: string | null | undefined) {
  if (!src) return true;
  return (
    src === DEFAULT_AVATAR ||
    src.trim() === "" ||
    // antigo avatar demo do Unsplash
    src.includes("images.unsplash.com/photo-1494790108377-be9c29b29330")
  );
}

export function resolveAvatar(src: string | null | undefined) {
  return isDefaultAvatar(src) ? DEFAULT_AVATAR : src!;
}

/** Prefere a foto do cadastro; agenda pode ter placeholder antigo. */
export function resolveAppointmentAvatar(
  appointmentAvatar: string | null | undefined,
  patientAvatar?: string | null,
) {
  if (patientAvatar && !isDefaultAvatar(patientAvatar)) {
    return resolveAvatar(patientAvatar);
  }
  return resolveAvatar(appointmentAvatar);
}

/** Redimensiona e comprime imagem para data URL (JPEG). */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem (JPG, PNG ou WEBP).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 8 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 512;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_AVATAR_BYTES && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_AVATAR_BYTES) {
    throw new Error("Não foi possível reduzir a imagem. Tente outra foto.");
  }
  return dataUrl;
}
