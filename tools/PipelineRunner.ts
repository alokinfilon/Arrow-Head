import * as fs from 'fs';
import * as path from 'path';
import { ProceduralGenerator } from '../engine/generation/ProceduralGenerator';
import { PuzzleGenerator } from '../engine/generation/PuzzleGenerator';
import { SHAPE_TEMPLATES } from '../engine/generation/ShapeTemplates';
import { GreedySolver } from '../funScore/solver/GreedySolver';
import { DifficultyEngine } from '../funScore/difficulty/DifficultyEngine';
import { DifficultyScaler } from '../funScore/difficulty/DifficultyScaler';
import { TensionCurveSequencer, LevelCandidate } from '../funScore/psychology/TensionCurve';
import { evaluateAhaMoment } from '../funScore/psychology/AhaMomentEstimator';
import { calculateCognitiveLoad } from '../funScore/psychology/CognitiveLoad';
import { evaluateDecoyExploration } from '../funScore/psychology/DecoyExploration';
import { ArrowEntity } from '../engine/core/Types';

export interface ProcessedLevel {
    id: string;
    chapterIndex: number;
    stageIndex: number;
    stageIntensity: string;
    width: number;
    height: number;
    shapeTemplate?: string;
    arrows: ArrowEntity[];
    solution: string[];
    metrics: {
        difficultyScore: number;
        tier: string;
        averageBranching: number;
        cascadeSatisfaction: number;
        visualSymmetry: number;
        hasBottleneck: boolean;
        cognitiveLoad: number;
        decoyRatio: number;
    };
}

export interface ChapterOutput {
    chapterIndex: number;
    title: string;
    levels: ProcessedLevel[];
}

export class PipelineRunner {
    /**
     * Executes batch pipeline: Generate -> Solve -> Score -> Sequence -> Export
     */
    public static generateBatch(chapterCount: number = 2, outputPath?: string): ChapterOutput[] {
        const shapeKeys = Object.keys(SHAPE_TEMPLATES);
        const totalLevelsNeeded = chapterCount * 10;
        const candidatePool: Array<{
            id: string;
            width: number;
            height: number;
            shapeTemplate?: string;
            arrows: ArrowEntity[];
            solution: string[];
            score: number;
            tier: string;
            metrics: any;
        }> = [];

        let generatedCount = 0;
        let attempts = 0;
        const maxAttempts = totalLevelsNeeded * 10;

        while (candidatePool.length < totalLevelsNeeded * 1.5 && attempts < maxAttempts) {
            attempts++;
            const useShape = Math.random() > 0.4;
            let width = 8;
            let height = 8;
            let arrows: ArrowEntity[] = [];
            let shapeName: string | undefined;

            if (useShape) {
                shapeName = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
                const template = SHAPE_TEMPLATES[shapeName];
                const gen = ProceduralGenerator.generateShapeMaskLevel(template.mask);
                width = gen.width;
                height = gen.height;
                arrows = gen.arrows;
            } else {
                width = Math.floor(Math.random() * 3) + 6; // 6 to 8
                height = width;
                const arrowCount = Math.floor(Math.random() * 15) + 10; // 10 to 25
                arrows = PuzzleGenerator.generateSolvableLevel(width, height, arrowCount).arrows;
            }

            if (arrows.length === 0) continue;

            // 1. Solve level
            const solveResult = GreedySolver.solveLevel(arrows, { width, height });
            if (!solveResult.isSolvable) continue;

            // 2. Score difficulty
            const report = DifficultyEngine.evaluateLevel(arrows, {
                gridSize: { width, height },
                solutionMoves: solveResult.solutionSequence.length,
                unblockedProgression: solveResult.unblockedProgression,
                cascadeLengths: solveResult.cascadeLengths
            });

            // 3. Compute psychology metrics
            const cognitive = calculateCognitiveLoad(arrows, { width, height });
            const decoy = evaluateDecoyExploration(arrows, { width, height });
            const aha = report.metrics.ahaDifficulty;

            candidatePool.push({
                id: `level_cand_${generatedCount++}`,
                width,
                height,
                shapeTemplate: shapeName,
                arrows,
                solution: solveResult.solutionSequence,
                score: report.score.displayScore,
                tier: report.score.tier,
                metrics: {
                    difficultyScore: report.score.displayScore,
                    tier: report.score.tier,
                    averageBranching: report.metrics.branchingFactor.averageBranching,
                    cascadeSatisfaction: report.metrics.chainComplexity.satisfactionScore,
                    visualSymmetry: report.metrics.visualSymmetry.overallSymmetryScore,
                    hasBottleneck: aha.hasBottleneck,
                    cognitiveLoad: cognitive.cognitiveLoadScore,
                    decoyRatio: decoy.decoyRatio
                }
            });
        }

        // 4. Sequence into 10-stage Sawtooth Chapters
        const chapters: ChapterOutput[] = [];
        const levelCandidatesForSequencing: LevelCandidate[] = candidatePool.map(c => ({
            id: c.id,
            difficultyScore: c.score
        }));

        for (let ch = 0; ch < chapterCount; ch++) {
            const poolSlice = levelCandidatesForSequencing.slice(ch * 10, (ch + 1) * 10);
            if (poolSlice.length < 10) break;

            const sequenced = TensionCurveSequencer.sequenceChapter(poolSlice);
            const chapterLevels: ProcessedLevel[] = [];

            sequenced.levels.forEach(({ stage, level }) => {
                const fullCand = candidatePool.find(c => c.id === level.id)!;
                chapterLevels.push({
                    id: `ch${ch + 1}_st${stage.stageIndex}_${fullCand.id}`,
                    chapterIndex: ch + 1,
                    stageIndex: stage.stageIndex,
                    stageIntensity: stage.intensity,
                    width: fullCand.width,
                    height: fullCand.height,
                    shapeTemplate: fullCand.shapeTemplate,
                    arrows: fullCand.arrows,
                    solution: fullCand.solution,
                    metrics: fullCand.metrics
                });
            });

            chapters.push({
                chapterIndex: ch + 1,
                title: `Chapter ${ch + 1}: Sawtooth Pacing`,
                levels: chapterLevels
            });
        }

        // 5. Save to output file if specified
        if (outputPath) {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(outputPath, JSON.stringify(chapters, null, 2), 'utf-8');
        }

        return chapters;
    }
}
