import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthGate } from "@/components/auth/AuthGate";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Neura — Hub para Psicólogos",
  description: "Neura: gestão de pacientes, sessões e agenda para psicólogos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-foreground">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
