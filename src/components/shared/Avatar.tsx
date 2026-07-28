"use client";

import Image from "next/image";
import { resolveAvatar } from "@/lib/avatar";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

export function Avatar({
  src,
  alt = "",
  size = 40,
  className = "rounded-full object-cover",
}: AvatarProps) {
  const resolved = resolveAvatar(src);
  const unoptimized =
    resolved.startsWith("data:") ||
    resolved.startsWith("blob:") ||
    resolved.endsWith(".svg") ||
    resolved.includes("ui-avatars.com");

  return (
    <Image
      src={resolved}
      alt={alt}
      width={size}
      height={size}
      unoptimized={unoptimized}
      className={className}
    />
  );
}
