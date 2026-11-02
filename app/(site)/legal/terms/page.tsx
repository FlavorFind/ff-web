/**
 * /legal/terms — Terms of Service
 */

export default function TermsPage() {
  return (
    <div className="static-page">
      <section className="static-hero">
        <div className="wrap">
          <h1 className="static-title">Terms of Service</h1>
          <p className="static-lead">Last updated: 1 November 2026 · Version 2026-10</p>
        </div>
      </section>
      <div className="wrap static-body">
        <div className="static-prose legal-prose">

          <h2>1. Agreement</h2>
          <p>
            By using Flavor Find ("the service", "we", "us") you agree to these terms.
            If you don't agree, don't use the service.
          </p>

          <h2>2. The service</h2>
          <p>
            Flavor Find is a food-discovery platform. It matches ingredients you provide to Kenyan
            and East African recipes in our database. Search is free and unlimited.
          </p>

          <h2>3. Your account</h2>
          <ul>
            <li>You must be 13 years or older to create an account.</li>
            <li>You're responsible for keeping your account credentials secure.</li>
            <li>You may not create accounts for others without their consent.</li>
            <li>One account per person for free tier. Plus subscriptions are per-account.</li>
          </ul>

          <h2>4. Acceptable use</h2>
          <p>You may not:</p>
          <ul>
            <li>Scrape or bulk-download our recipe data.</li>
            <li>Use the API in ways that damage the service or other users.</li>
            <li>Submit false, misleading, or copyrighted recipes as community submissions.</li>
            <li>Attempt to reverse-engineer the recipe engine or its data.</li>
            <li>Use the service for commercial purposes without a commercial licence.</li>
          </ul>

          <h2>5. Plus subscription</h2>
          <ul>
            <li>Plus is KES 199/month, billed monthly via M-Pesa.</li>
            <li>You can cancel any time by emailing help@flavorfind.co.ke.</li>
            <li>Cancellations take effect at the end of the current billing period. No partial refunds.</li>
            <li>We reserve the right to change Plus pricing with 30 days' notice.</li>
          </ul>

          <h2>6. Content you submit</h2>
          <p>
            By submitting a recipe or other content, you grant us a non-exclusive, royalty-free,
            worldwide licence to use, adapt, and publish that content as part of the Flavor Find
            dataset. You retain ownership. You confirm the content is your original work or that
            you have the right to submit it.
          </p>

          <h2>7. Data accuracy</h2>
          <p>
            Nutrition and cost figures are estimates. They are clearly labelled as estimates
            throughout the service. Do not use them for medical or clinical dietary planning.
            Allergen information is for guidance only — always confirm with the kitchen or label.
          </p>

          <h2>8. Availability</h2>
          <p>
            We aim for high availability but don't guarantee uninterrupted service. The recipe
            engine may be temporarily unavailable. Cached results will be shown where possible.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate your account if you breach these terms. You may delete
            your account at any time from Account → Privacy.
          </p>

          <h2>10. Limitation of liability</h2>
          <p>
            Flavor Find is provided "as is". We are not liable for any direct or indirect damages
            arising from use of the service, reliance on recipe data, or service unavailability.
          </p>

          <h2>11. Governing law</h2>
          <p>
            These terms are governed by the laws of Kenya. Disputes will be resolved in Kenyan courts.
          </p>

          <h2>12. Contact</h2>
          <p>
            <a href="mailto:legal@flavorfind.co.ke">legal@flavorfind.co.ke</a>
          </p>

        </div>
      </div>
    </div>
  );
}
