import { FooterWord } from "./footer-word";
import { useLang } from "@/lib/lang-context";

const COLUMNS = [
  {
    title: "Product",
    links: [
      ["Cook", "/cook"],
      ["47 Counties", "/regions"],
      ["Plus", "/plus"],
      ["Saved recipes", "/saved"],
      ["My pantry", "/pantry"],
    ],
  },
  {
    title: "Discover",
    links: [
      ["Pilau", "/dishes/pilau"],
      ["Mshikaki", "/dishes/mshikaki"],
      ["Chapati", "/dishes/chapati"],
      ["Coconut rice", "/dishes/kenyan-coconut-rice"],
      ["Submit a recipe", "/community"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Help & FAQ", "/help"],
      ["Privacy", "/legal/privacy"],
      ["Terms", "/legal/terms"],
      ["Sign up free", "/auth/sign-up"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="fcols">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h3>{c.title}</h3>
              <ul>
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <FooterWord text="Flavor Find" />
        <p className="legal">
          Find the flavor. Fill the table. Nutrition and cost figures are estimates.
          Always confirm allergens with the cook or the label.
        </p>
      </div>
    </footer>
  );
}
