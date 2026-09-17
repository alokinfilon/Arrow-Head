import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SHAPE_TEMPLATES } from '../../../engine/generation/ShapeTemplates';
import { ProceduralGenerator } from '../../../engine/generation/ProceduralGenerator';
import { PuzzleGenerator } from '../../../engine/generation/PuzzleGenerator';
import { GreedySolver } from '../../../funScore/solver/GreedySolver';
import { DifficultyEngine } from '../../../funScore/difficulty/DifficultyEngine';
import { calculateCognitiveLoad } from '../../../funScore/psychology/CognitiveLoad';
import { evaluateDecoyExploration } from '../../../funScore/psychology/DecoyExploration';
import { ArrowEntity } from '../../../engine/core/Types';
import { DifficultyReport } from '../../../funScore/difficulty/DifficultyReport';

export const LevelInspectorScreen: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('DOG');
    const [levelArrows, setLevelArrows] = useState<ArrowEntity[]>([]);
    const [gridBounds, setGridBounds] = useState<{ width: number; height: number }>({ width: 8, height: 8 });
    const [report, setReport] = useState<DifficultyReport | null>(null);
    const [cognitiveScore, setCognitiveScore] = useState<number | null>(null);
    const [decoyRatio, setDecoyRatio] = useState<number | null>(null);

    const handleGenerate = () => {
        let width = 8;
        let height = 8;
        let arrows: ArrowEntity[] = [];

        if (selectedTemplate === 'RECT') {
            const result = PuzzleGenerator.generateSolvableLevel(8, 8, 16);
            arrows = result.arrows;
        } else if (SHAPE_TEMPLATES[selectedTemplate]) {
            const template = SHAPE_TEMPLATES[selectedTemplate];
            const result = ProceduralGenerator.generateShapeMaskLevel(template.mask);
            width = result.width;
            height = result.height;
            arrows = result.arrows;
        }

        setGridBounds({ width, height });
        setLevelArrows(arrows);

        // Solve and evaluate metrics
        const solveResult = GreedySolver.solveLevel(arrows, { width, height });
        const diffReport = DifficultyEngine.evaluateLevel(arrows, {
            gridSize: { width, height },
            solutionMoves: solveResult.solutionSequence.length,
            unblockedProgression: solveResult.unblockedProgression,
            cascadeLengths: solveResult.cascadeLengths
        });

        const cog = calculateCognitiveLoad(arrows, { width, height });
        const dec = evaluateDecoyExploration(arrows, { width, height });

        setReport(diffReport);
        setCognitiveScore(cog.cognitiveLoadScore);
        setDecoyRatio(dec.decoyRatio);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Level Generator & Inspector</Text>

            <View style={styles.templatePicker}>
                <Text style={styles.subtitle}>Select Template:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['RECT', ...Object.keys(SHAPE_TEMPLATES)].map(tKey => (
                        <TouchableOpacity
                            key={tKey}
                            style={[
                                styles.chip,
                                selectedTemplate === tKey && styles.activeChip
                            ]}
                            onPress={() => setSelectedTemplate(tKey)}
                        >
                            <Text style={selectedTemplate === tKey ? styles.activeChipText : styles.chipText}>
                                {tKey}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
                <Text style={styles.generateButtonText}>⚡ Generate & Analyze Level</Text>
            </TouchableOpacity>

            {report && (
                <View style={styles.reportContainer}>
                    <Text style={styles.sectionHeader}>funScore Diagnostic Metrics</Text>
                    
                    <View style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>Overall Difficulty: {report.score.displayScore} / 100</Text>
                        <Text style={styles.tierText}>Tier: {report.score.tier}</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Total Arrows:</Text>
                        <Text style={styles.metricValue}>{report.metrics.solutionDepth.totalArrows}</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Avg Branching Factor (b):</Text>
                        <Text style={styles.metricValue}>{report.metrics.branchingFactor.averageBranching}</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Visual Symmetry:</Text>
                        <Text style={styles.metricValue}>{(report.metrics.visualSymmetry.overallSymmetryScore * 100).toFixed(0)}%</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Cognitive Load:</Text>
                        <Text style={styles.metricValue}>{cognitiveScore !== null ? (cognitiveScore * 100).toFixed(0) : 'N/A'}%</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Boundary Decoy Ratio:</Text>
                        <Text style={styles.metricValue}>{decoyRatio !== null ? (decoyRatio * 100).toFixed(0) : 'N/A'}%</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Aha! Bottleneck Collapse:</Text>
                        <Text style={styles.metricValue}>{report.metrics.ahaDifficulty.hasBottleneck ? 'YES ✅' : 'NO ❌'}</Text>
                    </View>

                    {report.warnings.length > 0 && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>Warnings:</Text>
                            {report.warnings.map((w, idx) => (
                                <Text key={idx} style={styles.warningText}>• {w}</Text>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#121212' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
    subtitle: { fontSize: 14, color: '#AAA', marginBottom: 6 },
    templatePicker: { marginBottom: 16 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#2A2A2A', marginRight: 8 },
    activeChip: { backgroundColor: '#4F46E5' },
    chipText: { color: '#CCC', fontSize: 13 },
    activeChipText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    generateButton: { backgroundColor: '#10B981', padding: 14, borderRadius: 8, alignItems: 'center', marginVertical: 12 },
    generateButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    reportContainer: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 8, marginTop: 16 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
    scoreBadge: { backgroundColor: '#312E81', padding: 12, borderRadius: 6, marginBottom: 12, alignItems: 'center' },
    scoreText: { color: '#818CF8', fontSize: 18, fontWeight: 'bold' },
    tierText: { color: '#C7D2FE', fontSize: 14, marginTop: 4 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2D2D2D' },
    metricLabel: { color: '#AAA', fontSize: 14 },
    metricValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    warningBox: { backgroundColor: '#451A1A', padding: 10, borderRadius: 6, marginTop: 12 },
    warningTitle: { color: '#F87171', fontWeight: 'bold', marginBottom: 4 },
    warningText: { color: '#FCA5A5', fontSize: 13 }
});
