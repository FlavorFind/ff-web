import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackToTop } from "@/components/back-to-top";

/**
 * Shared layout for all inner pages (Cook, Dish, Regions, Pantry, etc.)
 * Wraps every page with the site header and footer.
 * The home page (/) uses its own layout via app/page.tsx directly.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
