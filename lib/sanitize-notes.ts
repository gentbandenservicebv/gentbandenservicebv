/**
 * Sanitizes internal technical payment metadata (e.g. Stripe checkout session IDs)
 * so they are never leaked or displayed to end users.
 */
export function formatUserNotes(notes?: string | null): string {
  if (!notes) return "";

  const cleaned = notes
    // 1. Transform bracketed Stripe payment logs into clean customer-friendly text
    .replace(/\[Online betaald via Stripe:\s*€([0-9.,]+)\s*-\s*Stripe:\s*[^\]]+\]/gi, "Betaald via Stripe (€$1)")
    .replace(/\[Online betaald via Stripe:\s*€([0-9.,]+)[^\]]*\]/gi, "Betaald via Stripe (€$1)")
    // 2. Strip any technical Stripe IDs (cs_test_..., cs_live_..., pi_test_..., etc.)
    .replace(/\s*-\s*Stripe:\s*cs_[a-zA-Z0-9_-]+/gi, "")
    .replace(/Stripe:\s*cs_[a-zA-Z0-9_-]+/gi, "")
    .replace(/Stripe\s+Session:\s*cs_[a-zA-Z0-9_-]+/gi, "")
    .replace(/cs_(?:test|live)_[a-zA-Z0-9_-]+/gi, "")
    .replace(/pi_(?:test|live)_[a-zA-Z0-9_-]+/gi, "")
    // 3. Remove leftover empty brackets
    .replace(/\[\s*\]/g, "")
    // 4. Clean up any extra empty lines and trim
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  return cleaned;
}
