import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SvgSprite } from "@/components/icons";
import { ScrollProgress } from "@/components/scroll-progress";
import { LangProvider } from "@/lib/lang-context";
import { AuthProvider } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Flavor Find: what’s in your kitchen tonight?",
  description: "Tell Flavor Find what you have. It shows you what Kenya cooks with it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(fraunces.variable, inter.variable)} suppressHydrationWarning>
      <head>
        {/* No-flash theme script — runs before paint, reads localStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ff-theme');if(t&&['forest','light','dark'].includes(t))document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <SvgSprite />
        <ScrollProgress />
        <LangProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
