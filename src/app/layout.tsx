import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/lib/theme-context";
import { CompanyLogoProvider } from "@/lib/company-logo-context";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Imobiliário",
  description: "Sistema de gerenciamento imobiliário inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'atyp-font-family';
              src: url('/fonts/AtypDisplayTRIAL-Bold-BF65727125c8d1d.otf') format('opentype');
              font-weight: bold;
              font-style: normal;
              font-display: swap;
            }
          `
        }} />
      </head>
      <body className={`${inter.className} ${montserrat.className}`} suppressHydrationWarning>
        <ThemeProvider>
          <CompanyLogoProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </CompanyLogoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
