import { DEFAULT_FEATURE_FLAGS, FeatureFlagsContract } from '../types/contracts';

const STORAGE_KEY = 'sahara_feature_flags';

export class FeatureFlagManager {
  private flags: FeatureFlagsContract;

  constructor() {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...DEFAULT_FEATURE_FLAGS, ...parsed };
      }
    } catch {
      this.flags = { ...DEFAULT_FEATURE_FLAGS };
    }
  }

  public isEnabled(flag: keyof FeatureFlagsContract): boolean {
    return !!this.flags[flag];
  }

  public getFlags(): FeatureFlagsContract {
    return { ...this.flags };
  }

  public setFlag(flag: keyof FeatureFlagsContract, value: boolean): void {
    this.flags[flag] = value;
    this.saveToStorage();
  }

  public setFlags(partial: Partial<FeatureFlagsContract>): void {
    this.flags = { ...this.flags, ...partial };
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
    } catch {}
  }
}

export const featureFlags = new FeatureFlagManager();
