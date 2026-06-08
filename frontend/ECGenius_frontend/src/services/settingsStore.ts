// Local-only persistence for Settings-page preferences that have no backend
// counterpart yet (appearance, privacy/research consent). Mirrors the
// `notificationStore` pattern — `ecg:settings:*` keys, safe JSON parsing,
// sensible defaults — so these are ready to be backed by a real API later
// without changing any callers.

const APPEARANCE_KEY = 'ecg:settings:appearance';
const PRIVACY_KEY = 'ecg:settings:privacy';

export type ThemePreference = 'light' | 'dark' | 'system';
export type DensityPreference = 'comfortable' | 'compact';

export interface AppearancePreferences {
  theme: ThemePreference;
  density: DensityPreference;
}

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  theme: 'light',
  density: 'comfortable',
};

export interface PrivacyPreferences {
  shareAnonymizedDataForResearch: boolean;
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  shareAnonymizedDataForResearch: false,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...fallback, ...parsed };
  } catch {
    return { ...fallback };
  }
}

export function getAppearancePreferences(): AppearancePreferences {
  return readJson(APPEARANCE_KEY, DEFAULT_APPEARANCE_PREFERENCES);
}

export function saveAppearancePreferences(prefs: AppearancePreferences): void {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(prefs));
}

export function getPrivacyPreferences(): PrivacyPreferences {
  return readJson(PRIVACY_KEY, DEFAULT_PRIVACY_PREFERENCES);
}

export function savePrivacyPreferences(prefs: PrivacyPreferences): void {
  localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
}
