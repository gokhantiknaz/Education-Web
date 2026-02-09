import type { Metadata } from "next";
import { PrimeReactProvider } from "primereact/api";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Egitim Platformu - Admin Panel",
  description: "Egitim Platformu Yonetim Paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </head>
      <body>
        <PrimeReactProvider>
          <AuthProvider>{children}</AuthProvider>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
