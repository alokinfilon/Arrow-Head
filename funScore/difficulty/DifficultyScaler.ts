import { DifficultyReport } from './DifficultyReport';
import { TargetDifficultyProfile, DIFFICULTY_PROFILES } from './DifficultyProfile';

export interface FlowStateEvaluation {
    levelId?: string;
    flowZone: 'BOREDOM' | 'FLOW' | 'ANXIETY';
    isAcceptedForTarget: boolean;
    scoreDeltaFromTarget: number;
    recommendedAdjustment?: string;
}

/**
 * DifficultyScaler (Merged with Flow Theory)
 * Balances skill vs. challenge by evaluating candidate levels against target difficulty bands
 * to keep players inside the "Flow Zone" (neither boredom nor anxiety).
 */
export class DifficultyScaler {
    /**
     * Evaluates whether a level report fits into the target difficulty profile's Flow Zone.
     */
    public static evaluateFlowState(
        report: DifficultyReport,
        targetProfileName: 'CASUAL' | 'STANDARD' | 'CHALLENGE' = 'STANDARD'
    ): FlowStateEvaluation {
        const profile: TargetDifficultyProfile = DIFFICULTY_PROFILES[targetProfileName] ?? DIFFICULTY_PROFILES.STANDARD;
        const score = report.score.displayScore;

        let flowZone: 'BOREDOM' | 'FLOW' | 'ANXIETY' = 'FLOW';
        let isAcceptedForTarget = true;
        let recommendedAdjustment: string | undefined;

        if (score < profile.minScore) {
            flowZone = 'BOREDOM';
            isAcceptedForTarget = false;
            recommendedAdjustment = `Level difficulty (${score}) is below target min (${profile.minScore}). Add arrows or blocker dependencies.`;
        } else if (score > profile.maxScore) {
            flowZone = 'ANXIETY';
            isAcceptedForTarget = false;
            recommendedAdjustment = `Level difficulty (${score}) exceeds target max (${profile.maxScore}). Simplify arrow paths or reduce total count.`;
        }

        const midTarget = (profile.minScore + profile.maxScore) / 2;
        const scoreDeltaFromTarget = Number((score - midTarget).toFixed(1));

        return {
            levelId: report.levelId,
            flowZone,
            isAcceptedForTarget,
            scoreDeltaFromTarget,
            recommendedAdjustment
        };
    }

    /**
     * Filters a pool of candidate level reports to only those residing in the target Flow Zone.
     */
    public static filterFlowCandidates(
        reports: DifficultyReport[],
        targetProfileName: 'CASUAL' | 'STANDARD' | 'CHALLENGE' = 'STANDARD'
    ): DifficultyReport[] {
        return reports.filter(r => {
            const evalResult = this.evaluateFlowState(r, targetProfileName);
            return evalResult.isAcceptedForTarget;
        });
    }
}
