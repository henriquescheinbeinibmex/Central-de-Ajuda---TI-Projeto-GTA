import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Central de Ajuda de TI",
  description: "Base de conhecimento e sistema de chamados de TI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
