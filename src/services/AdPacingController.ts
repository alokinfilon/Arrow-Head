// src/services/AdPacingController.ts

export class AdPacingController {
    private static readonly INTERSTITIAL_COOLDOWN_MS = 150 * 1000; // 150 seconds
    private static readonly ONBOARDING_LEVEL_BUFFER = 15; // Zero ads on early levels

    private lastInterstitialTime: number = 0;
    private isAdFreeUser: boolean = false;

    public setAdFreeStatus(isAdFree: boolean): void {
        this.isAdFreeUser = isAdFree;
    }

    public shouldShowInterstitial(completedLevel: number): boolean {
        if (this.isAdFreeUser) return false;
        if (completedLevel <= AdPacingController.ONBOARDING_LEVEL_BUFFER) return false;

        const now = Date.now();
        if (now - this.lastInterstitialTime >= AdPacingController.INTERSTITIAL_COOLDOWN_MS) {
            this.lastInterstitialTime = now;
            return true;
        }

        return false;
    }
}