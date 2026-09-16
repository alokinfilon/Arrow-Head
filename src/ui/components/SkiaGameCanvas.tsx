import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { Canvas, Path, Skia, Group, RoundedRect } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
    useSharedValue,
    useDerivedValue,
    withTiming,
    withSequence,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { GameEngine } from '../../../engine/core/GameEngine';
import { ArrowEntity, Direction } from '../../../engine/core/Types';

interface SkiaCanvasProps {
    engine: GameEngine;
    gridWidth: number;
    gridHeight: number;
    mask?: boolean[][];
}

interface ArrowSkiaItemProps {
    arrow: ArrowEntity;
    boardOffsetX: number;
    boardOffsetY: number;
    cellSize: number;
    canvasBounds: { width: number; height: number };
    engine: GameEngine;
    onEscapeCompleted: (id: string) => void;
}

const DIRECTION_STEPS: Record<Direction, { x: number; y: number }> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

const DIRECTION_ROTATIONS: Record<Direction, number> = {
    UP: 0,
    RIGHT: Math.PI / 2,
    DOWN: Math.PI,
    LEFT: -Math.PI / 2,
};

const ArrowSkiaItem: React.FC<ArrowSkiaItemProps> = ({
    arrow,
    boardOffsetX,
    boardOffsetY,
    cellSize,
    canvasBounds,
    engine,
    onEscapeCompleted,
}) => {
    const escapeProgress = useSharedValue(0);
    const shudderX = useSharedValue(0);
    const shudderY = useSharedValue(0);

    useEffect(() => {
        const unbindEscape = engine.eventBus.on(
            'ARROW_ESCAPE_STARTED',
            ({ arrow: escapeArrow }: { arrow: ArrowEntity; trajectoryDistance: number }) => {
                if (escapeArrow.id !== arrow.id) return;

                escapeProgress.value = withTiming(
                    1,
                    {
                        duration: 3000,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    },
                    (finished) => {
                        'worklet';
                        if (finished) {
                            runOnJS(onEscapeCompleted)(arrow.id);
                        }
                    }
                );
            }
        );

        const unbindCollision = engine.eventBus.on(
            'ARROW_COLLISION',
            ({ arrow: colArrow }: { arrow: ArrowEntity; blocker: ArrowEntity }) => {
                if (colArrow.id !== arrow.id) return;

                const step = DIRECTION_STEPS[arrow.direction];
                const shudderDist = 12;

                shudderX.value = withSequence(
                    withTiming(step.x * shudderDist, { duration: 40 }),
                    withTiming(0, { duration: 130, easing: Easing.bounce })
                );
                shudderY.value = withSequence(
                    withTiming(step.y * shudderDist, { duration: 40 }),
                    withTiming(0, { duration: 130, easing: Easing.bounce })
                );
            }
        );

        return () => {
            unbindEscape();
            unbindCollision();
        };
    }, [arrow, engine, canvasBounds, onEscapeCompleted, escapeProgress, shudderX, shudderY]);

    // Build center points for all path segments
    const pts = (arrow.path || [{ x: arrow.gridX, y: arrow.gridY }]).map(pt => ({
        cx: boardOffsetX + pt.x * cellSize + cellSize / 2,
        cy: boardOffsetY + pt.y * cellSize + cellSize / 2,
    }));

    // Derived UI-thread state for 60fps GPU slithering animation
    const slitherState = useDerivedValue(() => {
        'worklet';
        const progress = escapeProgress.value;

        if (pts.length === 0) {
            return {
                bodyPath: Skia.Path.Make(),
                headPath: Skia.Path.Make(),
                headOrigin: { x: 0, y: 0 },
                headRotation: 0,
                opacity: 0,
            };
        }

        const step = DIRECTION_STEPS[arrow.direction];
        const travelDist = Math.max(canvasBounds.width, canvasBounds.height, 600) * 1.5;

        // Build chain of points: original path points + exit extension point
        const chain: { cx: number; cy: number }[] = [];
        for (let i = 0; i < pts.length; i++) {
            chain.push({ cx: pts[i].cx, cy: pts[i].cy });
        }
        const last = pts[pts.length - 1];
        chain.push({
            cx: last.cx + step.x * travelDist,
            cy: last.cy + step.y * travelDist,
        });

        // Compute cumulative distance along the point chain
        const cumDist: number[] = [0];
        for (let i = 1; i < chain.length; i++) {
            const dx = chain[i].cx - chain[i - 1].cx;
            const dy = chain[i].cy - chain[i - 1].cy;
            cumDist.push(cumDist[i - 1] + Math.sqrt(dx * dx + dy * dy));
        }

        const origLength = cumDist[pts.length - 1];
        const totalDist = cumDist[cumDist.length - 1];

        const currentTravel = progress * (origLength + travelDist);
        const tailDist = currentTravel;
        const headDist = Math.min(totalDist, origLength + currentTravel);

        if (tailDist >= totalDist || headDist <= tailDist) {
            return {
                bodyPath: Skia.Path.Make(),
                headPath: Skia.Path.Make(),
                headOrigin: { x: chain[chain.length - 1].cx, y: chain[chain.length - 1].cy },
                headRotation: DIRECTION_ROTATIONS[arrow.direction],
                opacity: 0,
            };
        }

        const samplePoint = (d: number) => {
            if (d <= 0) return { cx: chain[0].cx, cy: chain[0].cy };
            if (d >= totalDist) return { cx: chain[chain.length - 1].cx, cy: chain[chain.length - 1].cy };
            for (let i = 0; i < cumDist.length - 1; i++) {
                if (d >= cumDist[i] && d <= cumDist[i + 1]) {
                    const segLen = cumDist[i + 1] - cumDist[i];
                    const r = segLen > 0 ? (d - cumDist[i]) / segLen : 0;
                    return {
                        cx: chain[i].cx + r * (chain[i + 1].cx - chain[i].cx),
                        cy: chain[i].cy + r * (chain[i + 1].cy - chain[i].cy),
                    };
                }
            }
            return { cx: chain[chain.length - 1].cx, cy: chain[chain.length - 1].cy };
        };

        const activePts: { cx: number; cy: number }[] = [];
        activePts.push(samplePoint(tailDist));

        for (let i = 0; i < chain.length; i++) {
            if (cumDist[i] > tailDist && cumDist[i] < headDist) {
                activePts.push({ cx: chain[i].cx, cy: chain[i].cy });
            }
        }

        activePts.push(samplePoint(headDist));

        const bodyPath = Skia.Path.Make();
        if (activePts.length > 0) {
            bodyPath.moveTo(activePts[0].cx, activePts[0].cy);
            for (let i = 1; i < activePts.length; i++) {
                bodyPath.lineTo(activePts[i].cx, activePts[i].cy);
            }
        }

        const headPt = activePts[activePts.length - 1];

        // Heading angle of the leading segment
        let headRotation = DIRECTION_ROTATIONS[arrow.direction];
        if (activePts.length >= 2) {
            const prev = activePts[activePts.length - 2];
            const dx = headPt.cx - prev.cx;
            const dy = headPt.cy - prev.cy;
            if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
                headRotation = Math.atan2(dy, dx) + Math.PI / 2;
            }
        }

        const headPath = Skia.Path.Make();
        const headSize = cellSize * 0.28;
        headPath.moveTo(headPt.cx, headPt.cy - headSize * 1.25);
        headPath.lineTo(headPt.cx + headSize, headPt.cy + headSize * 0.4);
        headPath.lineTo(headPt.cx - headSize, headPt.cy + headSize * 0.4);
        headPath.close();

        // Arrow remains 100% solid until it's 85% through its journey off-screen, then gently fades out
        const opacity = progress > 0.85 ? Math.max(0, 1 - (progress - 0.85) / 0.15) : 1;

        return {
            bodyPath,
            headPath,
            headOrigin: { x: headPt.cx, y: headPt.cy },
            headRotation,
            opacity,
        };
    });

    const bodyPathDerived = useDerivedValue(() => slitherState.value.bodyPath);
    const headPathDerived = useDerivedValue(() => slitherState.value.headPath);
    const headOriginDerived = useDerivedValue(() => slitherState.value.headOrigin);
    const headRotationDerived = useDerivedValue(() => slitherState.value.headRotation);
    const opacityDerived = useDerivedValue(() => slitherState.value.opacity);

    const shudderTransform = useDerivedValue(() => [
        { translateX: shudderX.value },
        { translateY: shudderY.value },
    ]);

    const shadowTransform = useDerivedValue(() => [
        { rotate: headRotationDerived.value },
    ]);

    return (
        <Group opacity={opacityDerived} transform={shudderTransform}>
            {/* Folded Body Shadow */}
            <Path
                path={bodyPathDerived}
                style="stroke"
                strokeWidth={cellSize * 0.24}
                strokeCap="round"
                strokeJoin="round"
                color="rgba(15, 23, 42, 0.15)"
                transform={[{ translateY: 2 }]}
            />
            {/* Folded Body Main Stroke */}
            <Path
                path={bodyPathDerived}
                style="stroke"
                strokeWidth={cellSize * 0.24}
                strokeCap="round"
                strokeJoin="round"
                color="#2563EB"
            />
            {/* Arrowhead Shadow */}
            <Group transform={[{ translateY: 2 }]}>
                <Group origin={headOriginDerived} transform={shadowTransform}>
                    <Path path={headPathDerived} color="rgba(15, 23, 42, 0.15)" style="fill" />
                </Group>
            </Group>
            {/* Arrowhead Main */}
            <Group origin={headOriginDerived} transform={shadowTransform}>
                <Path path={headPathDerived} color="#2563EB" style="fill" />
            </Group>
        </Group>
    );
};

export const SkiaGameCanvas: React.FC<SkiaCanvasProps> = ({ engine, gridWidth, gridHeight, mask }) => {
    const [canvasBounds, setCanvasBounds] = useState({ width: 0, height: 0 });

    const arrows = engine.getActiveArrows();

    // Dynamically calculate grid cell size and centering offsets
    const padding = 16;
    const availableWidth = Math.max(0, canvasBounds.width - padding * 2);
    const availableHeight = Math.max(0, canvasBounds.height - padding * 2);
    const cellSize = canvasBounds.width > 0 && canvasBounds.height > 0
        ? Math.floor(Math.min(availableWidth / gridWidth, availableHeight / gridHeight))
        : 50;

    const boardWidth = cellSize * gridWidth;
    const boardHeight = cellSize * gridHeight;
    const boardOffsetX = Math.max(padding, (canvasBounds.width - boardWidth) / 2);
    const boardOffsetY = Math.max(padding, (canvasBounds.height - boardHeight) / 2);

    const notifyEscapeFinished = useCallback((id: string) => {
        engine.eventBus.emit('ARROW_ESCAPE_COMPLETED', { arrowId: id });
    }, [engine]);

    const handleTap = useCallback((x: number, y: number) => {
        engine.handleInputCoord(x, y);
    }, [engine]);

    const tapGesture = Gesture.Tap().onEnd((e) => {
        const touchX = e.x - boardOffsetX;
        const touchY = e.y - boardOffsetY;

        if (touchX < 0 || touchY < 0) return;

        const targetGridX = Math.floor(touchX / cellSize);
        const targetGridY = Math.floor(touchY / cellSize);

        if (targetGridX >= 0 && targetGridX < gridWidth && targetGridY >= 0 && targetGridY < gridHeight) {
            runOnJS(handleTap)(targetGridX, targetGridY);
        }
    });

    const handleLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setCanvasBounds({ width, height });
    };

    return (
        <View style={styles.wrapper} onLayout={handleLayout}>
            {canvasBounds.width > 0 && canvasBounds.height > 0 && (
                <GestureDetector gesture={tapGesture}>
                    <Canvas style={styles.canvasContainer}>
                        {/* Board Outer Background Card (only if no custom mask) */}
                        {!mask && (
                            <>
                                <RoundedRect
                                    x={boardOffsetX - 8}
                                    y={boardOffsetY - 8}
                                    width={boardWidth + 16}
                                    height={boardHeight + 16}
                                    r={16}
                                    color="#E2E8F0"
                                />
                                <RoundedRect
                                    x={boardOffsetX - 4}
                                    y={boardOffsetY - 4}
                                    width={boardWidth + 8}
                                    height={boardHeight + 8}
                                    r={14}
                                    color="#FFFFFF"
                                />
                            </>
                        )}

                        {/* Render Grid Cells */}
                        {Array.from({ length: gridHeight }).map((_, row) =>
                            Array.from({ length: gridWidth }).map((_col, col) => {
                                if (mask && (!mask[row] || !mask[row][col])) {
                                    return null;
                                }
                                const cellX = boardOffsetX + col * cellSize;
                                const cellY = boardOffsetY + row * cellSize;
                                return (
                                    <RoundedRect
                                        key={`cell_${row}_${col}`}
                                        x={cellX + 2}
                                        y={cellY + 2}
                                        width={cellSize - 4}
                                        height={cellSize - 4}
                                        r={8}
                                        color="#F1F5F9"
                                    />
                                );
                            })
                        )}

                        {/* Render Arrow Entities */}
                        {arrows.map((arrow: ArrowEntity) => (
                            <ArrowSkiaItem
                                key={arrow.id}
                                arrow={arrow}
                                boardOffsetX={boardOffsetX}
                                boardOffsetY={boardOffsetY}
                                cellSize={cellSize}
                                canvasBounds={canvasBounds}
                                engine={engine}
                                onEscapeCompleted={notifyEscapeFinished}
                            />
                        ))}
                    </Canvas>
                </GestureDetector>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    canvasContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
});