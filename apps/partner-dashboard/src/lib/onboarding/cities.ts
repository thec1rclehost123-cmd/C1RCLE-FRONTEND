/**
 * ─── Indian cities for the onboarding city field ───────────────────────────
 *
 * `country-state-city` is not a dependency of this workspace and deliberately
 * so: shipping a searchable control is a UI decision, while an npm-installed
 * gazetteer is a data-supply decision, and this wizard only needs "a city the
 * applicant recognises, ordered sensibly as they type". A curated, committed
 * list gives that with no install step, no runtime fetch, and no 300 KB
 * JSON-shaped dependency in the client bundle.
 *
 * Two design notes:
 *
 * - **Tier** ranks the default ordering, because an empty search box that
 *   starts at "Aizawl" is technically correct and practically useless. Tier 1
 *   is the metros a nightlife/event venue would actually be in.
 * - **Aliases** exist so a value the *backend already holds* still resolves.
 *   `profile.city` is a free-form string on the contract, so drafts written
 *   before this list existed can say "Bangalore" or "Bombay"; rejecting those
 *   on resume would lock an applicant out of their own application. The
 *   resolver canonicalises instead of failing.
 */

/** 1 = metro (shown first by default), 2 = major city, 3 = other notable city. */
export type CityTier = 1 | 2 | 3;

export interface CityEntry {
  /** Canonical label — the exact string persisted to `profile.city`. */
  readonly name: string;
  /** State or union territory, shown as the group heading. */
  readonly state: string;
  readonly tier: CityTier;
  /** Historical / colloquial spellings that must resolve to {@link name}. */
  readonly aliases?: readonly string[];
}

/**
 * Ordered by tier within each state; {@link searchCities} re-ranks at query
 * time, so this order only decides the no-query default.
 */
export const INDIAN_CITIES: readonly CityEntry[] = [
  /* ── Maharashtra ── */
  { name: 'Mumbai', state: 'Maharashtra', tier: 1, aliases: ['Bombay'] },
  { name: 'Pune', state: 'Maharashtra', tier: 1, aliases: ['Poona', 'Pimpri-Chinchwad'] },
  { name: 'Nagpur', state: 'Maharashtra', tier: 2 },
  { name: 'Nashik', state: 'Maharashtra', tier: 2, aliases: ['Nasik'] },
  { name: 'Aurangabad', state: 'Maharashtra', tier: 3, aliases: ['Chhatrapati Sambhajinagar'] },
  { name: 'Thane', state: 'Maharashtra', tier: 2 },
  { name: 'Kolhapur', state: 'Maharashtra', tier: 3 },
  { name: 'Solapur', state: 'Maharashtra', tier: 3 },
  { name: 'Navi Mumbai', state: 'Maharashtra', tier: 2 },
  { name: 'Vasai-Virar', state: 'Maharashtra', tier: 3 },
  { name: 'Mira-Bhayandar', state: 'Maharashtra', tier: 3 },
  { name: 'Pimpri-Chinchwad', state: 'Maharashtra', tier: 3 },
  { name: 'Amravati', state: 'Maharashtra', tier: 3 },
  { name: 'Nanded', state: 'Maharashtra', tier: 3 },
  { name: 'Satara', state: 'Maharashtra', tier: 3 },
  { name: 'Ahmednagar', state: 'Maharashtra', tier: 3 },
  { name: 'Latur', state: 'Maharashtra', tier: 3 },
  { name: 'Ratnagiri', state: 'Maharashtra', tier: 3 },
  { name: 'Gondia', state: 'Maharashtra', tier: 3 },

  /* ── Karnataka ── */
  { name: 'Bengaluru', state: 'Karnataka', tier: 1, aliases: ['Bangalore'] },
  { name: 'Mysuru', state: 'Karnataka', tier: 2, aliases: ['Mysore'] },
  { name: 'Hubballi', state: 'Karnataka', tier: 3, aliases: ['Hubli'] },
  { name: 'Mangaluru', state: 'Karnataka', tier: 2, aliases: ['Mangalore'] },
  { name: 'Belagavi', state: 'Karnataka', tier: 3, aliases: ['Belgaum'] },
  { name: 'Kalaburagi', state: 'Karnataka', tier: 3, aliases: ['Gulbarga'] },
  { name: 'Davanagere', state: 'Karnataka', tier: 3 },
  { name: 'Dharwad', state: 'Karnataka', tier: 3 },
  { name: 'Ballari', state: 'Karnataka', tier: 3, aliases: ['Bellary'] },
  { name: 'Udupi', state: 'Karnataka', tier: 3 },
  { name: 'Shivamogga', state: 'Karnataka', tier: 3, aliases: ['Shimoga'] },
  { name: 'Tumakuru', state: 'Karnataka', tier: 3, aliases: ['Tumkur'] },
  { name: 'Hassan', state: 'Karnataka', tier: 3 },

  /* ── Delhi & NCR ── */
  {
    name: 'Delhi',
    state: 'Delhi',
    tier: 1,
    aliases: ['New Delhi', 'NCR', 'National Capital Territory'],
  },
  { name: 'Gurugram', state: 'Haryana', tier: 1, aliases: ['Gurgaon'] },
  { name: 'Noida', state: 'Uttar Pradesh', tier: 1 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', tier: 2 },
  { name: 'Faridabad', state: 'Haryana', tier: 2 },
  { name: 'Greater Noida', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Gurgaon Rural', state: 'Haryana', tier: 3 },

  /* ── Telangana & Andhra Pradesh ── */
  { name: 'Hyderabad', state: 'Telangana', tier: 1 },
  { name: 'Warangal', state: 'Telangana', tier: 3 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', tier: 2 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', tier: 2, aliases: ['Vizag'] },
  { name: 'Guntur', state: 'Andhra Pradesh', tier: 3 },
  { name: 'Nellore', state: 'Andhra Pradesh', tier: 3 },
  { name: 'Tirupati', state: 'Andhra Pradesh', tier: 3 },
  { name: 'Kakinada', state: 'Andhra Pradesh', tier: 3 },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', tier: 3 },
  { name: 'Tiruppur', state: 'Tamil Nadu', tier: 3 },

  /* ── Tamil Nadu ── */
  { name: 'Chennai', state: 'Tamil Nadu', tier: 1, aliases: ['Madras'] },
  { name: 'Coimbatore', state: 'Tamil Nadu', tier: 2 },
  { name: 'Madurai', state: 'Tamil Nadu', tier: 2 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', tier: 3, aliases: ['Trichy', 'Tiruchy'] },
  { name: 'Salem', state: 'Tamil Nadu', tier: 3 },
  { name: 'Tirunelveli', state: 'Tamil Nadu', tier: 3 },
  { name: 'Erode', state: 'Tamil Nadu', tier: 3 },
  { name: 'Vellore', state: 'Tamil Nadu', tier: 3 },
  { name: 'Thanjavur', state: 'Tamil Nadu', tier: 3 },
  { name: 'Dindigul', state: 'Tamil Nadu', tier: 3 },
  { name: 'Thoothukudi', state: 'Tamil Nadu', tier: 3 },

  /* ── Gujarat ── */
  { name: 'Ahmedabad', state: 'Gujarat', tier: 1 },
  { name: 'Surat', state: 'Gujarat', tier: 2 },
  { name: 'Vadodara', state: 'Gujarat', tier: 2, aliases: ['Baroda'] },
  { name: 'Rajkot', state: 'Gujarat', tier: 3 },
  { name: 'Gandhinagar', state: 'Gujarat', tier: 3 },
  { name: 'Bhavnagar', state: 'Gujarat', tier: 3 },
  { name: 'Jamnagar', state: 'Gujarat', tier: 3 },
  { name: 'Anand', state: 'Gujarat', tier: 3 },
  { name: 'Bharuch', state: 'Gujarat', tier: 3 },

  /* ── Uttar Pradesh & Uttarakhand ── */
  { name: 'Lucknow', state: 'Uttar Pradesh', tier: 1 },
  { name: 'Kanpur', state: 'Uttar Pradesh', tier: 2 },
  { name: 'Agra', state: 'Uttar Pradesh', tier: 2 },
  { name: 'Varanasi', state: 'Uttar Pradesh', tier: 2, aliases: ['Kashi', 'Banaras'] },
  { name: 'Prayagraj', state: 'Uttar Pradesh', tier: 2, aliases: ['Allahabad'] },
  { name: 'Meerut', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Bareilly', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Aligarh', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Moradabad', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Saharanpur', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', tier: 3 },
  { name: 'Dehradun', state: 'Uttarakhand', tier: 3 },
  { name: 'Haridwar', state: 'Uttarakhand', tier: 3 },
  { name: 'Haldwani', state: 'Uttarakhand', tier: 3 },

  /* ── Rajasthan ── */
  { name: 'Jaipur', state: 'Rajasthan', tier: 1 },
  { name: 'Jodhpur', state: 'Rajasthan', tier: 2 },
  { name: 'Udaipur', state: 'Rajasthan', tier: 2 },
  { name: 'Kota', state: 'Rajasthan', tier: 3 },
  { name: 'Ajmer', state: 'Rajasthan', tier: 3 },
  { name: 'Bikaner', state: 'Rajasthan', tier: 3 },
  { name: 'Jaisalmer', state: 'Rajasthan', tier: 3 },
  { name: 'Pushkar', state: 'Rajasthan', tier: 3 },

  /* ── West Bengal ── */
  { name: 'Kolkata', state: 'West Bengal', tier: 1, aliases: ['Calcutta'] },
  { name: 'Siliguri', state: 'West Bengal', tier: 3 },
  { name: 'Howrah', state: 'West Bengal', tier: 3 },
  { name: 'Durgapur', state: 'West Bengal', tier: 3 },
  { name: 'Asansol', state: 'West Bengal', tier: 3 },
  { name: 'Darjeeling', state: 'West Bengal', tier: 3 },
  { name: 'Kharagpur', state: 'West Bengal', tier: 3 },

  /* ── Kerala ── */
  { name: 'Kochi', state: 'Kerala', tier: 1, aliases: ['Cochin'] },
  { name: 'Thiruvananthapuram', state: 'Kerala', tier: 2, aliases: ['Trivandrum'] },
  { name: 'Kozhikode', state: 'Kerala', tier: 2, aliases: ['Calicut'] },
  { name: 'Thrissur', state: 'Kerala', tier: 3 },
  { name: 'Kollam', state: 'Kerala', tier: 3 },
  { name: 'Kottayam', state: 'Kerala', tier: 3 },
  { name: 'Kannur', state: 'Kerala', tier: 3 },
  { name: 'Alappuzha', state: 'Kerala', tier: 3 },

  /* ── Punjab, Haryana, Himachal, Chandigarh, J&K, Ladakh ── */
  { name: 'Ludhiana', state: 'Punjab', tier: 2 },
  { name: 'Amritsar', state: 'Punjab', tier: 3 },
  { name: 'Jalandhar', state: 'Punjab', tier: 3 },
  { name: 'Patiala', state: 'Punjab', tier: 3 },
  { name: 'Bathinda', state: 'Punjab', tier: 3 },
  { name: 'Panipat', state: 'Haryana', tier: 3 },
  { name: 'Ambala', state: 'Haryana', tier: 3 },
  { name: 'Hisar', state: 'Haryana', tier: 3 },
  { name: 'Rohtak', state: 'Haryana', tier: 3 },
  { name: 'Shimla', state: 'Himachal Pradesh', tier: 3 },
  { name: 'Dharamshala', state: 'Himachal Pradesh', tier: 3 },
  { name: 'Manali', state: 'Himachal Pradesh', tier: 3 },
  { name: 'Solan', state: 'Himachal Pradesh', tier: 3 },
  { name: 'Chandigarh', state: 'Chandigarh', tier: 2 },
  { name: 'Mohali', state: 'Punjab', tier: 3 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', tier: 2 },
  { name: 'Jammu', state: 'Jammu & Kashmir', tier: 3 },
  { name: 'Anantnag', state: 'Jammu & Kashmir', tier: 3 },
  { name: 'Baramulla', state: 'Jammu & Kashmir', tier: 3 },
  { name: 'Leh', state: 'Ladakh', tier: 3 },

  /* ── Odisha, Chhattisgarh, Jharkhand, Bihar ── */
  { name: 'Bhubaneswar', state: 'Odisha', tier: 2 },
  { name: 'Cuttack', state: 'Odisha', tier: 3 },
  { name: 'Rourkela', state: 'Odisha', tier: 3 },
  { name: 'Puri', state: 'Odisha', tier: 3 },
  { name: 'Raipur', state: 'Chhattisgarh', tier: 2 },
  { name: 'Bhilai', state: 'Chhattisgarh', tier: 3 },
  { name: 'Bilaspur', state: 'Chhattisgarh', tier: 3 },
  { name: 'Ranchi', state: 'Jharkhand', tier: 2 },
  { name: 'Jamshedpur', state: 'Jharkhand', tier: 2 },
  { name: 'Dhanbad', state: 'Jharkhand', tier: 3 },
  { name: 'Bokaro', state: 'Jharkhand', tier: 3 },
  { name: 'Deoghar', state: 'Jharkhand', tier: 3 },
  { name: 'Patna', state: 'Bihar', tier: 1 },
  { name: 'Gaya', state: 'Bihar', tier: 3 },
  { name: 'Bhagalpur', state: 'Bihar', tier: 3 },
  { name: 'Muzaffarpur', state: 'Bihar', tier: 3 },
  { name: 'Darbhanga', state: 'Bihar', tier: 3 },

  /* ── Madhya Pradesh ── */
  { name: 'Indore', state: 'Madhya Pradesh', tier: 1 },
  { name: 'Bhopal', state: 'Madhya Pradesh', tier: 1 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', tier: 2 },
  { name: 'Gwalior', state: 'Madhya Pradesh', tier: 2 },
  { name: 'Ujjain', state: 'Madhya Pradesh', tier: 3 },
  { name: 'Rewa', state: 'Madhya Pradesh', tier: 3 },
  { name: 'Sagar', state: 'Madhya Pradesh', tier: 3 },

  /* ── North-East ── */
  { name: 'Guwahati', state: 'Assam', tier: 2 },
  { name: 'Dibrugarh', state: 'Assam', tier: 3 },
  { name: 'Silchar', state: 'Assam', tier: 3 },
  { name: 'Jorhat', state: 'Assam', tier: 3 },
  { name: 'Imphal', state: 'Manipur', tier: 2 },
  { name: 'Shillong', state: 'Meghalaya', tier: 2 },
  { name: 'Aizawl', state: 'Mizoram', tier: 2 },
  { name: 'Agartala', state: 'Tripura', tier: 2 },
  { name: 'Kohima', state: 'Nagaland', tier: 2 },
  { name: 'Itanagar', state: 'Arunachal Pradesh', tier: 2 },
  { name: 'Gangtok', state: 'Sikkim', tier: 2 },

  /* ── Union territories & hill stations ── */
  { name: 'Panaji', state: 'Goa', tier: 2, aliases: ['Goa', 'Panjim'] },
  { name: 'Margao', state: 'Goa', tier: 3 },
  { name: 'Vasco da Gama', state: 'Goa', tier: 3 },
  { name: 'Porbandar', state: 'Gujarat', tier: 3 },
  { name: 'Puducherry', state: 'Puducherry', tier: 2, aliases: ['Pondicherry'] },
  { name: 'Karaikal', state: 'Puducherry', tier: 3 },
  { name: 'Port Blair', state: 'Andaman & Nicobar', tier: 3 },
  { name: 'Kavaratti', state: 'Lakshadweep', tier: 3 },
  { name: 'Daman', state: 'Dadra & Nagar Haveli and Daman & Diu', tier: 3 },
  { name: 'Diu', state: 'Dadra & Nagar Haveli and Daman & Diu', tier: 3 },
];

/** Ranked tiers, cheapest first — an equality scan over ~260 entries is nothing. */
const BY_NAME_LOWER = new Map<string, CityEntry>();
for (const city of INDIAN_CITIES) {
  BY_NAME_LOWER.set(city.name.toLowerCase(), city);
  for (const alias of city.aliases ?? []) {
    BY_NAME_LOWER.set(alias.toLowerCase(), city);
  }
}

/** Cached default ordering: tier 1 metros first, then tier 2, then tier 3. */
const DEFAULT_ORDER = [...INDIAN_CITIES].sort((left, right) => left.tier - right.tier);

/**
 * Canonical label for a city name or alias, case- and whitespace-insensitive.
 *
 * @returns the canonical `name`, or `null` when the value is not in the list.
 * A `null` is not automatically an error — see {@link resolveKnownCity}.
 */
export function findCity(value: string): CityEntry | null {
  return BY_NAME_LOWER.get(value.trim().replace(/\s+/gu, ' ').toLowerCase()) ?? null;
}

/**
 * Resolve whatever the backend already stored to a canonical city name, falling
 * back to the input when it is not a name this list knows.
 *
 * The fallback is the point: `profile.city` is a free-form string on the
 * contract, so a draft saved before this list existed (or by an admin console
 * that is less opinionated) can hold something perfectly serviceable like
 * "Bangalore". Echoing that value back into the control keeps the applicant
 * able to resubmit; silently blanking the field would strand them on an
 * unsatisfiable "Please select a city".
 */
export function resolveKnownCity(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return findCity(trimmed)?.name ?? trimmed;
}

/** How a candidate matched the query. Lower sorts first. */
const enum MatchRank {
  Exact = 0,
  AliasExact = 1,
  NamePrefix = 2,
  StatePrefix = 3,
  NameContains = 4,
  AliasContains = 5,
}

function rank(city: CityEntry, needle: string): MatchRank | null {
  const name = city.name.toLowerCase();
  const aliases = city.aliases ?? [];

  if (name === needle) {
    return MatchRank.Exact;
  }
  if (aliases.some((alias) => alias.toLowerCase() === needle)) {
    return MatchRank.AliasExact;
  }
  if (name.startsWith(needle)) {
    return MatchRank.NamePrefix;
  }
  if (city.state.toLowerCase().startsWith(needle)) {
    return MatchRank.StatePrefix;
  }
  if (name.includes(needle)) {
    return MatchRank.NameContains;
  }
  return aliases.some((alias) => alias.toLowerCase().includes(needle))
    ? MatchRank.AliasContains
    : null;
}

/**
 * Ranked city search.
 *
 * Ranks exact name, then alias, then name prefix, then a *state* prefix (so
 * "ma" surfaces the Maharashtra cities before Mangaluru would have matched by
 * name), then substring hits. Ties break toward the lower tier, so "Pu" leads
 * with Pune rather than Puducherry.
 *
 * @param query Raw input; case- and whitespace-insensitive.
 * @param limit Maximum results. `0` is treated as "no cap".
 */
export function searchCities(query: string, limit = 8): readonly CityEntry[] {
  const needle = query.trim().replace(/\s+/gu, ' ').toLowerCase();

  if (needle.length === 0) {
    const cap = limit > 0 ? limit : DEFAULT_ORDER.length;
    return DEFAULT_ORDER.slice(0, cap);
  }

  const scored: { readonly city: CityEntry; readonly rank: MatchRank }[] = [];
  for (const city of INDIAN_CITIES) {
    const match = rank(city, needle);
    if (match !== null) {
      scored.push({ city, rank: match });
    }
  }

  scored.sort((left, right) => left.rank - right.rank || left.city.tier - right.city.tier);

  const cap = limit > 0 ? limit : scored.length;
  return scored.slice(0, cap).map((entry) => entry.city);
}

/** Flat, canonical city names — used by tests and by anything needing a plain array. */
export const CITY_NAMES: readonly string[] = INDIAN_CITIES.map((city) => city.name);
