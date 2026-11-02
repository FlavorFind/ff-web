"use client";

import { BackToTop } from "@/components/back-to-top";
import { Counties } from "@/components/counties";
import { Cta } from "@/components/cta";
import { Hero } from "@/components/hero";
import { HomeAuth } from "@/components/home-auth";
import { LivePantry } from "@/components/live-pantry";
import { Marquee } from "@/components/marquee";
import { Pairs } from "@/components/pairs";
import { PlusBox } from "@/components/plus-box";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Steps } from "@/components/steps";
import { Trust } from "@/components/trust";
import { useAuth } from "@/lib/auth-context";

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <SiteHeader />
      <main id="top">
        {isLoading ? (
          /* Tiny spacer while session restores — prevents layout jump */
          <div style={{ minHeight: "100svh" }} aria-hidden="true" />
        ) : isAuthenticated ? (
          <HomeAuth />
        ) : (
          <>
            <Hero />
            <Marquee />
            <Trust />
            <Steps />
            <LivePantry />
            <Counties />
            <Pairs />
            <PlusBox />
            <Cta />
          </>
        )}
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
