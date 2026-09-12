import { DEFAULT_FEATURE_FLAGS, FeatureFlagsContract } from '../types/contracts';

const STORAGE_KEY = 'sahara_feature_flags';

/**
 * List of features that are incomplete/under active development.
 * In production/public runtime, these flags are strictly locked to FALSE
 * and CANNOT be overridden by localStorage, querystring, or client-side tampering.
 */
export const UNFINISHED_FEATURE_FLAGS: ReadonlyArray<keyof FeatureFlagsContract> = [
  'enableFavorites',
  'enableCompare',
  'enableGuides',
  'enableSaharaMatch',
  'enableBrandDetail',
  'enableCart',
  'enableCheckout',
  'enableOnlinePayment',
  'enableInstallmentCalc',
  'enableStoreReservation',
  'enableLiveChat',
  'enableCompareDifferenceMode',
];

export class FeatureFlagManager {
  private flags: FeatureFlagsContract;

  constructor() {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.loadFromStorage();
  }

  private isProductionMode(): boolean {
    // Treat as production unless explicitly in test environment with test overrides
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return false;
    }
    return true;
  }

  private sanitizeFlags(incoming: Partial<FeatureFlagsContract>): FeatureFlagsContract {
    const sanitized = { ...DEFAULT_FEATURE_FLAGS, ...incoming };

    // Strict Enforcement: Incomplete features can never be enabled via client storage
    if (this.isProductionMode()) {
      for (const key of UNFINISHED_FEATURE_FLAGS) {
        sanitized[key] = false;
      }
    }

    return sanitized;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = this.sanitizeFlags(parsed);
      }
    } catch {
      this.flags = { ...DEFAULT_FEATURE_FLAGS };
    }
  }

  public isEnabled(flag: keyof FeatureFlagsContract): boolean {
    if (this.isProductionMode() && UNFINISHED_FEATURE_FLAGS.includes(flag)) {
      return false;
    }
    return !!this.flags[flag];
  }

  public getFlags(): FeatureFlagsContract {
    if (this.isProductionMode()) {
      const locked = { ...this.flags };
      for (const key of UNFINISHED_FEATURE_FLAGS) {
        locked[key] = false;
      }
      return locked;
    }
    return { ...this.flags };
  }

  public setFlag(flag: keyof FeatureFlagsContract, value: boolean): void {
    if (this.isProductionMode() && UNFINISHED_FEATURE_FLAGS.includes(flag) && value === true) {
      console.warn(`[FeatureFlags] '${flag}' hazırda tamamlanmayıb və aktivləşdirilə bilməz.`);
      return;
    }
    this.flags[flag] = value;
    this.saveToStorage();
  }

  public setFlags(partial: Partial<FeatureFlagsContract>): void {
    this.flags = this.sanitizeFlags({ ...this.flags, ...partial });
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getFlags()));
    } catch {}
  }
}

export const featureFlags = new FeatureFlagManager();
