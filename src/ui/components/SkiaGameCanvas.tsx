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
import { ArrowEntity } from '../../../engine/core/Types';
import { MovementEngine } from '../../../engine/simulation/MovementEngine';

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

const ArrowSkiaItem: React.FC<ArrowSkiaItemProps> = ({
    arrow,
    boardOffsetX,
    boardOffsetY,
    cellSize,
    canvasBounds,
    engine,
    onEscapeCompleted,
}) => {
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        const unbindEscape = engine.eventBus.on(
            'ARROW_ESCAPE_STARTED',
            ({ arrow: escapeArrow }: { arrow: ArrowEntity; trajectoryDistance: number }) => {
                if (escapeArrow.id !== arrow.id) return;

                const step = MovementEngine.getStepVector(arrow.direction);
                const travelDist = Math.max(canvasBounds.width, canvasBounds.height, 500) * 1.5;

                offsetX.value = withTiming(step.x * travelDist, {
                    duration: 250,
                    easing: Easing.in(Easing.cubic),
                });
                offsetY.value = withTiming(step.y * travelDist, {
                    duration: 250,
                    easing: Easing.in(Easing.cubic),
                });
                opacity.value = withTiming(0, { duration: 220 }, (finished) => {
                    'worklet';
                    if (finished) {
                        runOnJS(onEscapeCompleted)(arrow.id);
                    }
                });
            }
        );

        const unbindCollision = engine.eventBus.on(
            'ARROW_COLLISION',
            ({ arrow: colArrow }: { arrow: ArrowEntity; blocker: ArrowEntity }) => {
                if (colArrow.id !== arrow.id) return;

                const step = MovementEngine.getStepVector(arrow.direction);
                const shudderDist = 12;

                offsetX.value = withSequence(
                    withTiming(step.x * shudderDist, { duration: 40 }),
                    withTiming(0, { duration: 130, easing: Easing.bounce })
                );
                offsetY.value = withSequence(
                    withTiming(step.y * shudderDist, { duration: 40 }),
                    withTiming(0, { duration: 130, easing: Easing.bounce })
                );
            }
        );

        return () => {
            unbindEscape();
            unbindCollision();
        };
    }, [arrow, engine, canvasBounds, onEscapeCompleted, offsetX, offsetY, opacity]);

    const transform = useDerivedValue(() => [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
    ]);

    // Build center points for all path segments
    const pts = (arrow.path || [{ x: arrow.gridX, y: arrow.gridY }]).map(pt => ({
        cx: boardOffsetX + pt.x * cellSize + cellSize / 2,
        cy: boardOffsetY + pt.y * cellSize + cellSize / 2,
    }));

    // Build continuous folded body path
    const bodyPath = Skia.Path.Make();
    if (pts.length > 0) {
        bodyPath.moveTo(pts[0].cx, pts[0].cy);
        for (let i = 1; i < pts.length; i++) {
            bodyPath.lineTo(pts[i].cx, pts[i].cy);
        }
    }

    // Build arrowhead at the final head segment
    const headPt = pts[pts.length - 1];
    const headRotation = MovementEngine.getRotationRadians(arrow.direction);
    const headPath = Skia.Path.Make();
    const headSize = cellSize * 0.28;

    headPath.moveTo(headPt.cx, headPt.cy - headSize * 1.25);
    headPath.lineTo(headPt.cx + headSize, headPt.cy + headSize * 0.4);
    headPath.lineTo(headPt.cx - headSize, headPt.cy + headSize * 0.4);
    headPath.close();

    return (
        <Group opacity={opacity} transform={transform}>
            {/* Folded Body Shadow */}
            <Path
                path={bodyPath}
                style="stroke"
                strokeWidth={cellSize * 0.24}
                strokeCap="round"
                strokeJoin="round"
                color="rgba(15, 23, 42, 0.15)"
                transform={[{ translateY: 2 }]}
            />
            {/* Folded Body Main Stroke */}
            <Path
                path={bodyPath}
                style="stroke"
                strokeWidth={cellSize * 0.24}
                strokeCap="round"
                strokeJoin="round"
                color="#2563EB"
            />
            {/* Arrowhead Shadow */}
            <Group transform={[{ translateY: 2 }]}>
                <Group origin={{ x: headPt.cx, y: headPt.cy }} transform={[{ rotate: headRotation }]}>
                    <Path path={headPath} color="rgba(15, 23, 42, 0.15)" style="fill" />
                </Group>
            </Group>
            {/* Arrowhead Main */}
            <Group origin={{ x: headPt.cx, y: headPt.cy }} transform={[{ rotate: headRotation }]}>
                <Path path={headPath} color="#2563EB" style="fill" />
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