// Shapes for the persisted /api/settings resource. One Settings document per
// user, covering appearance, notification, and privacy preferences that used
// to live in localStorage only.

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

export interface NotificationPreferences {
  diagnosisUpdates: boolean;
  reviewUpdates: boolean;
  emergencyAlerts: boolean;
  emailDigest: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  diagnosisUpdates: true,
  reviewUpdates: true,
  emergencyAlerts: true,
  emailDigest: false,
};

export interface PrivacyPreferences {
  shareAnonymizedDataForResearch: boolean;
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  shareAnonymizedDataForResearch: false,
};

export interface UserSettings {
  _id: string;
  userId: string;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  appearance?: Partial<AppearancePreferences>;
  notifications?: Partial<NotificationPreferences>;
  privacy?: Partial<PrivacyPreferences>;
}
