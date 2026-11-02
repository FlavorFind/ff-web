/**
 * /about — About Flavor Find
 */

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="static-page">
      <section className="static-hero">
        <div className="wrap">
          <h1 className="static-title">About Flavor Find</h1>
          <p className="static-lead">
            A food-discovery platform built for Kenya's kitchens.
          </p>
        </div>
      </section>

      <div className="wrap static-body">
        <div className="static-prose">

          <h2>What we do</h2>
          <p>
            Flavor Find takes the ingredients you have at home and shows you what Kenyan and East African
            dishes you can cook with them — matched strictly against real recipes, never guessing.
          </p>
          <p>
            No scroll through irrelevant results. No "maybe try adding chicken." Just: here's what
            you can make right now, from what's already in your kitchen.
          </p>

          <h2>The recipe engine</h2>
          <p>
            Behind the search is a purpose-built recipe engine with 300 Kenyan and East African dishes,
            878 ingredients, and 1,498 local names across English, Swahili, and Sheng. It understands
            "nyanya" and "tomato" and "nyanya ya saladi" as the same thing.
          </p>
          <p>
            Search results come in tiers: exact matches (you have everything), can-make (you have
            everything plus assumed staples like salt and oil), and almost (1–2 ingredients away).
          </p>

          <h2>The counties</h2>
          <p>
            Kenya has 47 counties, each with its own food traditions. Nyanza fishes differently from
            the Rift Valley. The coast has a different spice rack from Central. We've built regional
            stories and regional dish data to reflect that.
          </p>
          <p>
            The <Link href="/regions">Taste of 47 Counties</Link> section maps these traditions county
            by county, with editorial stories written from the ground up.
          </p>

          <h2>Who built this</h2>
          <p>
            Flavor Find is an independent product built in Nairobi. The data is curated, not scraped —
            every dish, ingredient, substitution, and pairing in the engine has been reviewed by hand.
          </p>

          <h2>Data quality</h2>
          <p>
            Every dish in the engine has a quality level: <em>verified</em> (fully reviewed, tested)
            or <em>reviewed</em> (reviewed but not independently tested). Nutrition and cost figures
            are estimates — we label them clearly, everywhere.
          </p>

          <h2>Get in touch</h2>
          <p>
            Questions, corrections, partnership enquiries:{" "}
            <a href="mailto:hello@flavorfind.co.ke">hello@flavorfind.co.ke</a>
          </p>
          <p>
            Found a dish that's wrong or missing?{" "}
            <Link href="/community">Submit a correction or recipe.</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
