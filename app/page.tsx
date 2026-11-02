import { BackToTop } from "@/components/back-to-top";
import { Counties } from "@/components/counties";
import { Cta } from "@/components/cta";
import { Hero } from "@/components/hero";
import { LivePantry } from "@/components/live-pantry";
import { Marquee } from "@/components/marquee";
import { Pairs } from "@/components/pairs";
import { PlusBox } from "@/components/plus-box";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Steps } from "@/components/steps";
import { Story } from "@/components/story";
import { Trust } from "@/components/trust";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <Hero />
        <Marquee />
        <Story />
        <Trust />
        <Steps />
        <LivePantry />
        <Counties />
        <Pairs />
        <PlusBox />
        <Cta />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
