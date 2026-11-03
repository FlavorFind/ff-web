"use client";

/**
 * /account — Account settings
 *
 * Tabs: Profile | Diet & Allergens | Subscription | Devices | Privacy
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProfile, updateProfile,
  getDiet, updateDiet,
  getDevices, getSubscription,
  deleteAccount, exportData,
  type UserProfile, type DietSettings, type Device, type Subscription,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Tab = "profile" | "diet" | "subscription" | "devices" | "privacy";

function ExportButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  async function handleExport() {
    setState("loading");
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flavorfind-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }
  return (
    <button
      type="button"
      className="btn out ac-export-btn"
      onClick={handleExport}
      disabled={state === "loading"}
    >
      {state === "loading" ? "Preparing export…"
       : state === "done"    ? "✓ Downloaded"
       : state === "error"   ? "Export failed — try again"
       : "Download my data"}
    </button>
  );
}

const DIET_TAGS = [
  { slug: "vegetarian",  label: "Vegetarian" },
  { slug: "vegan",       label: "Vegan" },
  { slug: "gluten-free", label: "Gluten-free" },
  { slug: "halal",       label: "Halal" },
  { slug: "dairy-free",  label: "Dairy-free" },
  { slug: "nut-free",    label: "Nut-free" },
];

const ALLERGENS = [
  "Gluten","Dairy","Eggs","Nuts","Peanuts","Shellfish","Fish","Soya","Sesame",
];

export default function AccountPage() {
  const { isAuthenticated, isLoading, user, setUser, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [diet,         setDiet]         = useState<DietSettings | null>(null);
  const [devices,      setDevices]      = useState<Device[] | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSavedMsg]     = useState<string | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Profile form state
  const [hsz,    setHsz]    = useState("");
  const [region, setRegion] = useState("");
  const [budg,   setBudg]   = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/sign-in");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getProfile().then((p) => {
      setProfile(p);
      setHsz(String(p.household_size ?? ""));
      setRegion(p.region ?? "");
      setBudg(String(p.budget_kes ?? ""));
    }).catch(() => {});
    getDiet().then(setDiet).catch(() => {});
    getDevices().then(setDevices).catch(() => {});
    getSubscription().then(setSubscription).catch(() => {});
  }, [isAuthenticated]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      const updated = await updateProfile({
        household_size: hsz ? parseInt(hsz) : null,
        region: region || null,
        budget_kes: budg ? parseInt(budg) : null,
      });
      setProfile(updated);
      setSavedMsg("Saved!");
      setTimeout(() => setSavedMsg(null), 2500);
    } catch { setSavedMsg("Save failed."); }
    finally { setSaving(false); }
  }

  async function toggleDietTag(slug: string) {
    if (!diet) return;
    const next = diet.diet_tags.includes(slug)
      ? diet.diet_tags.filter((t) => t !== slug)
      : [...diet.diet_tags, slug];
    const updated = { ...diet, diet_tags: next };
    setDiet(updated);
    try { await updateDiet({ diet_tags: next }); } catch { getDiet().then(setDiet).catch(() => {}); }
  }

  async function toggleAllergen(a: string) {
    if (!diet) return;
    const key = a.toLowerCase();
    const next = diet.allergen_exclusions.includes(key)
      ? diet.allergen_exclusions.filter((x) => x !== key)
      : [...diet.allergen_exclusions, key];
    const updated = { ...diet, allergen_exclusions: next };
    setDiet(updated);
    try { await updateDiet({ allergen_exclusions: next }); } catch { getDiet().then(setDiet).catch(() => {}); }
  }

  async function handleDeleteAccount() {
    if (!confirm("This will permanently delete your account and all your data. This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? This is irreversible.")) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      router.replace("/");
    } catch { setDeleting(false); }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="ac-page">

      {/* ── Header ── */}
      <section className="ac-hero">
        <div className="wrap">
          <div className="ac-hero-inner">
            <div className="ac-avatar">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="ac-title">{user?.username}</h1>
              <p className="ac-sub">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap ac-body">

        {/* ── Tabs ── */}
        <div className="ac-tabs" role="tablist">
          {([
            ["profile",      "Profile"],
            ["diet",         "Diet & Allergens"],
            ["subscription", "Subscription"],
            ["devices",      "Devices"],
            ["privacy",      "Privacy"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={cn("ac-tab", tab === t && "ac-tab-on")}
              onClick={() => setTab(t)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {tab === "profile" && (
          <div className="ac-panel" role="tabpanel">
            <h2 className="ac-panel-title">Profile</h2>
            <form className="ac-form" onSubmit={saveProfile}>
              <div className="ac-field">
                <label htmlFor="ac-hsz">Household size</label>
                <input
                  id="ac-hsz"
                  type="number"
                  min="1"
                  max="20"
                  className="ac-input"
                  placeholder="e.g. 4"
                  value={hsz}
                  onChange={(e) => setHsz(e.target.value)}
                />
                <p className="ac-field-hint">We use this to scale recipe servings.</p>
              </div>
              <div className="ac-field">
                <label htmlFor="ac-region">Home region</label>
                <input
                  id="ac-region"
                  type="text"
                  className="ac-input"
                  placeholder="e.g. nairobi"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
                <p className="ac-field-hint">Your county or region — used to boost local dishes in search.</p>
              </div>
              <div className="ac-field">
                <label htmlFor="ac-budg">Weekly budget (KES)</label>
                <input
                  id="ac-budg"
                  type="number"
                  min="0"
                  className="ac-input"
                  placeholder="e.g. 1000"
                  value={budg}
                  onChange={(e) => setBudg(e.target.value)}
                />
              </div>
              <div className="ac-form-footer">
                <button className="btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {saved && <span className={cn("ac-save-msg", saved === "Save failed." && "ac-save-msg-err")}>{saved}</span>}
              </div>
            </form>
          </div>
        )}

        {/* ── Diet & Allergens tab ── */}
        {tab === "diet" && (
          <div className="ac-panel" role="tabpanel">
            <h2 className="ac-panel-title">Diet & Allergens</h2>
            <p className="ac-panel-sub">
              These apply to every search automatically. You never need to set them per-search.
            </p>

            <div className="ac-diet-section">
              <h3 className="ac-diet-title">Dietary preferences</h3>
              <div className="ac-diet-chips">
                {diet === null ? (
                  Array.from({ length: 6 }, (_, i) => <div key={i} className="ac-diet-chip ac-diet-chip-sk" />)
                ) : (
                  DIET_TAGS.map((dt) => (
                    <button
                      key={dt.slug}
                      type="button"
                      className={cn("ac-diet-chip", diet.diet_tags.includes(dt.slug) && "ac-diet-chip-on")}
                      onClick={() => toggleDietTag(dt.slug)}
                      aria-pressed={diet.diet_tags.includes(dt.slug)}
                    >
                      {diet.diet_tags.includes(dt.slug) && <span className="ac-diet-check">✓ </span>}
                      {dt.label}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="ac-diet-section">
              <h3 className="ac-diet-title">Allergen exclusions</h3>
              <p className="ac-diet-sub">Dishes containing these will be excluded from your results.</p>
              <div className="ac-diet-chips">
                {diet === null ? (
                  Array.from({ length: 9 }, (_, i) => <div key={i} className="ac-diet-chip ac-diet-chip-sk" />)
                ) : (
                  ALLERGENS.map((a) => {
                    const key = a.toLowerCase();
                    return (
                      <button
                        key={key}
                        type="button"
                        className={cn("ac-diet-chip ac-allergen-chip", diet.allergen_exclusions.includes(key) && "ac-allergen-chip-on")}
                        onClick={() => toggleAllergen(a)}
                        aria-pressed={diet.allergen_exclusions.includes(key)}
                      >
                        {diet.allergen_exclusions.includes(key) && <span className="ac-diet-check">✗ </span>}
                        {a}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <p className="ac-allergen-disclaimer">
              Allergen information is for guidance only. Always confirm with the kitchen before ordering.
            </p>
          </div>
        )}

        {/* ── Subscription tab ── */}
        {tab === "subscription" && (
          <div className="ac-panel" role="tabpanel">
            <h2 className="ac-panel-title">Subscription</h2>
            {subscription === null ? (
              <div className="ac-sub-loading">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="ac-sk-line" />)}
              </div>
            ) : subscription.plan_code === "plus" ? (
              <div className="ac-sub-plus">
                <div className="ac-sub-header">
                  <span className="ac-sub-badge">✦ Plus</span>
                  <span className={cn("ac-sub-status", `ac-sub-status-${subscription.status}`)}>
                    {subscription.status}
                  </span>
                </div>
                {subscription.renews_at && (
                  <p className="ac-sub-renew">
                    Renews {new Date(subscription.renews_at).toLocaleDateString("en-KE", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                )}
                {subscription.trial_ends_at && (
                  <p className="ac-sub-trial">
                    Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString("en-KE", {
                      day: "numeric", month: "long",
                    })}
                  </p>
                )}
                <p className="ac-sub-manage-note">
                  To cancel, contact support at help@flavorfind.co.ke. You keep Plus until the end of your paid month.
                </p>
              </div>
            ) : (
              <div className="ac-sub-free">
                <h3 className="ac-sub-free-title">You're on the Free plan</h3>
                <p className="ac-sub-free-sub">
                  Upgrade to Plus for meal plans, budget mode, nutrition details, offline access, and no ads.
                </p>
                <Link href="/plus" className="btn">Upgrade to Plus — KES 199/month</Link>
              </div>
            )}
          </div>
        )}

        {/* ── Devices tab ── */}
        {tab === "devices" && (
          <div className="ac-panel" role="tabpanel">
            <h2 className="ac-panel-title">Devices</h2>
            <p className="ac-panel-sub">All devices where you've signed in.</p>
            {devices === null ? (
              <div className="ac-devices-list">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="ac-device-sk" />)}
              </div>
            ) : devices.length === 0 ? (
              <p className="ac-devices-empty">No devices found.</p>
            ) : (
              <div className="ac-devices-list">
                {devices.map((d) => (
                  <div key={d.id} className="ac-device-row">
                    <div className="ac-device-icon">📱</div>
                    <div className="ac-device-body">
                      <p className="ac-device-name">{d.device_name || "Unknown device"}</p>
                      <p className="ac-device-meta">
                        {d.platform} · Last seen {new Date(d.last_seen).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Privacy tab ── */}
        {tab === "privacy" && (
          <div className="ac-panel" role="tabpanel">
            <h2 className="ac-panel-title">Privacy & Data</h2>

            <div className="ac-privacy-section">
              <h3 className="ac-privacy-title">Export your data</h3>
              <p className="ac-privacy-sub">Download everything Flavor Find holds about you — pantry, saved recipes, cook history, profile.</p>
              <ExportButton />
            </div>

            <div className="ac-privacy-section">
              <h3 className="ac-privacy-title">Legal</h3>
              <div className="ac-privacy-links">
                <Link href="/legal/privacy">Privacy Policy →</Link>
                <Link href="/legal/terms">Terms of Service →</Link>
              </div>
            </div>

            <div className="ac-privacy-section ac-danger-section">
              <h3 className="ac-privacy-title ac-danger-title">Delete account</h3>
              <p className="ac-privacy-sub">
                Permanently deletes your account, pantry, saved recipes, and all associated data.
                This cannot be undone.
              </p>
              <button
                className="ac-delete-btn"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
