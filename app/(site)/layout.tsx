"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackToTop } from "@/components/back-to-top";
import { BottomTabs } from "@/components/bottom-tabs";

/**
 * Shared layout for all inner pages (Cook, Dish, Regions, Pantry, etc.)
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="main-content">{children}</main>
      <SiteFooter />
      <BackToTop />
      <BottomTabs />
    </>
  );
}
