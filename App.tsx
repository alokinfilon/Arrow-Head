import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameEngine } from './engine/core/GameEngine';
import { ProceduralGenerator } from './engine/generation/ProceduralGenerator';
import { DOG_SHAPE_MASK } from './engine/generation/ShapeMasks';
import { SkiaGameCanvas } from './src/ui/components/SkiaGameCanvas';

const DEFAULT_GRID_SIZE = 6;
const ARROW_COUNT = 10;

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <GameScreen />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function GameScreen() {
  const [hearts, setHearts] = useState(3);
  const [status, setStatus] = useState<string>('PLAYING');
  const [level, setLevel] = useState(1);
  const [isDogMode, setIsDogMode] = useState(true);
  const [gridConfig, setGridConfig] = useState<{ width: number; height: number; mask?: boolean[][] }>({
    width: DOG_SHAPE_MASK[0].length,
    height: DOG_SHAPE_MASK.length,
    mask: DOG_SHAPE_MASK,
  });

  // Initialize Game Engine instance dynamically
  const engine = useMemo(() => new GameEngine(16, 18, 3), []);

  const loadNewLevel = useCallback((lvlNum: number, dogMode: boolean) => {
    if (dogMode) {
      const { width, height, arrows } = ProceduralGenerator.generateShapeMaskLevel(DOG_SHAPE_MASK);
      setGridConfig({ width, height, mask: DOG_SHAPE_MASK });
      engine.loadLevel(lvlNum, width, height, arrows);
    } else {
      const arrows = ProceduralGenerator.generateSolvableLevel(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE, ARROW_COUNT);
      setGridConfig({ width: DEFAULT_GRID_SIZE, height: DEFAULT_GRID_SIZE, mask: undefined });
      engine.loadLevel(lvlNum, DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE, arrows);
    }
    setHearts(3);
    setStatus('PLAYING');
  }, [engine]);

  useEffect(() => {
    loadNewLevel(1, isDogMode);

    const unbindHearts = engine.eventBus.on('HEARTS_CHANGED', ({ currentHearts }) => {
      setHearts(currentHearts);
    });

    const unbindCompleted = engine.eventBus.on('LEVEL_COMPLETED', () => {
      setStatus('WON');
    });

    const unbindGameOver = engine.eventBus.on('GAME_OVER', () => {
      setStatus('LOST');
    });

    return () => {
      unbindHearts();
      unbindCompleted();
      unbindGameOver();
    };
  }, [engine, loadNewLevel, isDogMode]);

  const handleNextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    loadNewLevel(nextLvl, isDogMode);
  };

  const toggleDogMode = () => {
    const newMode = !isDogMode;
    setIsDogMode(newMode);
    loadNewLevel(level, newMode);
  };

  const handleHint = () => {
    const hint = engine.requestHint();
    if (hint) {
      console.log('Hint arrow:', hint.id, hint.gridX, hint.gridY);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titleText}>PROJECT ARROW ENGINE</Text>
          <Text style={styles.levelText}>
            Level {level} {isDogMode ? '🐶 DOG' : '🟩 GRID'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.modeToggle} onPress={toggleDogMode}>
            <Text style={styles.modeToggleText}>{isDogMode ? '🟩 RECT' : '🐶 DOG'}</Text>
          </TouchableOpacity>
          <View style={styles.heartsContainer}>
            <Text style={styles.heartsText}>❤️ {hearts}</Text>
          </View>
        </View>
      </View>

      {/* Status Overlay Banner */}
      {status !== 'PLAYING' && (
        <View style={[styles.statusBanner, status === 'WON' ? styles.winBanner : styles.loseBanner]}>
          <Text style={styles.statusText}>
            {status === 'WON' ? '🎉 LEVEL CLEARED!' : '💔 GAME OVER'}
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleNextLevel}>
            <Text style={styles.actionButtonText}>
              {status === 'WON' ? 'NEXT LEVEL' : 'RETRY LEVEL'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skia GPU Game Canvas Container */}
      <View style={styles.canvasWrapper}>
        <SkiaGameCanvas
          engine={engine}
          gridWidth={gridConfig.width}
          gridHeight={gridConfig.height}
          mask={gridConfig.mask}
        />
      </View>

      {/* Bottom Control Bar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleHint}>
          <Text style={styles.controlButtonText}>💡 HINT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => loadNewLevel(level, isDogMode)}>
          <Text style={styles.controlButtonText}>🔄 RESET</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  levelText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeToggle: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  heartsContainer: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heartsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E11D48',
  },
  statusBanner: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  winBanner: {
    backgroundColor: '#DCFCE7',
  },
  loseBanner: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  canvasWrapper: {
    flex: 1,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  controlButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
});
