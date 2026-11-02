/**
 * /help — Help & FAQ
 */

import Link from "next/link";

const SECTIONS = [
  {
    title: "Search & Recipes",
    faqs: [
      ["Why am I getting no results?",
       "Try fewer ingredients — the engine looks for dishes that need what you have. Start with 2–3 core ingredients and add more. Also try switching from Strict to Explore mode to see dishes you're 1–2 ingredients away from."],
      ["What's the difference between Strict and Explore mode?",
       "Strict only shows dishes where you have all the required ingredients (plus assumed kitchen staples like salt, oil, and water). Explore also shows dishes where you're missing 1 or 2 ingredients, so you can decide whether it's worth buying them."],
      ["What does 'ambiguous' mean?",
       "Some ingredient names match multiple things — 'unga' could be maize flour or wheat flour. When that happens, we ask you to pick which one you mean before searching. This keeps results accurate."],
      ["Why does the engine show 'Can make' instead of 'Exact'?",
       "'Can make' means you have all the required ingredients, but the dish also needs kitchen staples (salt, oil, water, etc.) that we assume most kitchens have. If you genuinely don't have those, you'd need to get them."],
      ["Is search really free?",
       "Yes. Search is always free and unlimited. Plus gates meal plans, budget mode, nutrition details, and offline sync — not the core product."],
    ],
  },
  {
    title: "Account & Pantry",
    faqs: [
      ["Do I need an account to search?",
       "No. You can search, view dish pages, and browse regions without an account. An account is needed for saving recipes, the pantry, meal plans, and cook history."],
      ["How does the pantry work?",
       "Save the ingredients you have at home to your pantry. On the Cook page, your pantry items are added to your search automatically — so you don't have to type them every time."],
      ["Why am I getting logged out?",
       "Sessions last 24 hours from login, or 3 hours of inactivity, whichever comes first. After that you'll need to sign in again."],
    ],
  },
  {
    title: "Plus",
    faqs: [
      ["What does Plus include?",
       "Meal plans, shopping lists, budget mode, nutrition details on every dish, offline sync, and no ads. KES 199/month."],
      ["How do I pay?",
       "M-Pesa Daraja STK push. Enter your Safaricom number on the Plus page and we send a payment request to your phone."],
      ["Can I cancel?",
       "Yes, any time. Email help@flavorfind.co.ke to cancel. You keep Plus until the end of your paid month."],
      ["Is there a trial?",
       "Not currently. The free tier is fully functional — search is unlimited and pantry is included."],
    ],
  },
  {
    title: "Data & Privacy",
    faqs: [
      ["Are nutrition figures accurate?",
       "They're estimates from our recipe engine, based on standard ingredient nutritional data. They're clearly labelled as estimates everywhere. Don't use them for medical dietary planning."],
      ["Are cost estimates accurate?",
       "They're engine estimates based on approximate market prices. Actual costs vary by market, season, and vendor. We label them as estimates everywhere."],
      ["How do I delete my account?",
       "Go to Account → Privacy → Delete account. This permanently deletes your data and cannot be undone."],
      ["How do I export my data?",
       "Account → Privacy → Request data export. Downloads a JSON file of your pantry, saved recipes, cook history, and profile."],
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="static-page">
      <section className="static-hero">
        <div className="wrap">
          <h1 className="static-title">Help & FAQ</h1>
          <p className="static-lead">
            Common questions about Flavor Find. Can't find what you need?{" "}
            <a href="mailto:help@flavorfind.co.ke">Email us.</a>
          </p>
        </div>
      </section>

      <div className="wrap static-body">
        <div className="help-sections">
          {SECTIONS.map((sec) => (
            <section key={sec.title} className="help-section">
              <h2 className="help-section-title">{sec.title}</h2>
              <div className="help-faq-list">
                {sec.faqs.map(([q, a]) => (
                  <details key={q} className="help-faq-item">
                    <summary className="help-faq-q">{q}</summary>
                    <p className="help-faq-a">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="help-contact">
          <h2>Still stuck?</h2>
          <p>
            Email us at <a href="mailto:help@flavorfind.co.ke">help@flavorfind.co.ke</a> and we'll
            get back to you within 24 hours.
          </p>
          <p>
            Found a dish error or a missing recipe?{" "}
            <Link href="/community">Submit it here.</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
