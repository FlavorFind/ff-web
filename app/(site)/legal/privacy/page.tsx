/**
 * /legal/privacy — Privacy Policy
 */

export default function PrivacyPage() {
  return (
    <div className="static-page">
      <section className="static-hero">
        <div className="wrap">
          <h1 className="static-title">Privacy Policy</h1>
          <p className="static-lead">Last updated: 1 November 2026</p>
        </div>
      </section>
      <div className="wrap static-body">
        <div className="static-prose legal-prose">

          <h2>1. Who we are</h2>
          <p>
            Flavor Find ("we", "us", "our") is a food-discovery service operated from Nairobi, Kenya.
            Contact: <a href="mailto:privacy@flavorfind.co.ke">privacy@flavorfind.co.ke</a>
          </p>

          <h2>2. What we collect</h2>
          <ul>
            <li><strong>Account data:</strong> email address, username, language preference.</li>
            <li><strong>Pantry data:</strong> ingredient names you add to your pantry.</li>
            <li><strong>Library data:</strong> saved recipes, collections, and cook history.</li>
            <li><strong>Profile data:</strong> household size, region, weekly budget — optional, used to personalise search.</li>
            <li><strong>Diet data:</strong> dietary tags and allergen exclusions — used only to filter search results.</li>
            <li><strong>Payment data:</strong> M-Pesa phone number for Plus subscribers. We do not store full card or PIN data.</li>
            <li><strong>Usage data:</strong> pages visited, search queries, device type. Used only in aggregate for improving the product.</li>
          </ul>

          <h2>3. What we don't collect</h2>
          <ul>
            <li>We don't collect your location beyond what you voluntarily provide as a "home region".</li>
            <li>We don't sell your data to third parties.</li>
            <li>We don't use your data for advertising profiling.</li>
            <li>We don't share ingredient or search data with the recipe engine in a way that identifies you — the engine sees only ingredient lists, never user IDs or emails.</li>
          </ul>

          <h2>4. How we use your data</h2>
          <ul>
            <li>To provide the service: search personalisation, pantry merge, diet exclusions, meal plans.</li>
            <li>To process payments: M-Pesa STK push for Plus subscriptions.</li>
            <li>To send transactional emails: email verification, password reset.</li>
            <li>To improve the product: aggregate analytics only.</li>
          </ul>

          <h2>5. Data retention</h2>
          <p>
            We keep your data for as long as your account is active. If you delete your account,
            we delete your personal data within 30 days. Anonymised aggregate data may be retained
            longer for analytics.
          </p>

          <h2>6. Your rights</h2>
          <ul>
            <li><strong>Access:</strong> Export all your data from Account → Privacy → Export data.</li>
            <li><strong>Deletion:</strong> Delete your account from Account → Privacy → Delete account.</li>
            <li><strong>Correction:</strong> Update your profile from Account → Profile.</li>
            <li><strong>Portability:</strong> Data export is available in JSON format.</li>
          </ul>

          <h2>7. Cookies</h2>
          <p>
            We use localStorage (not third-party cookies) to store your JWT refresh token and
            theme preference. No third-party tracking cookies.
          </p>

          <h2>8. Changes to this policy</h2>
          <p>
            We'll update this page when the policy changes. Material changes will be notified by
            email to registered users.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions: <a href="mailto:privacy@flavorfind.co.ke">privacy@flavorfind.co.ke</a>
          </p>

        </div>
      </div>
    </div>
  );
}
