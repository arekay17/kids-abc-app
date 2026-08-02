import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LETTERS } from "../../data/letters";

const TOTAL_ROUNDS = 5;
const NEXT_ROUND_DELAY = 800;
const DROP_TOLERANCE = 26;

function shuffle(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

function createChoices(correctLetter) {
  const incorrectLetters = shuffle(
    LETTERS.filter((item) => item.letter !== correctLetter),
  )
    .slice(0, 2)
    .map((item) => item.letter);

  return shuffle([correctLetter, ...incorrectLetters]);
}

// Five unique records are sampled once per session, just as in the original
// tap activity. Only the way a child submits an answer changes below.
function createSession() {
  return shuffle(LETTERS)
    .slice(0, TOTAL_ROUNDS)
    .map((item) => ({
      ...item,
      choices: createChoices(item.letter),
    }));
}

function overlapsDropZone(tileBounds, targetBounds) {
  if (!targetBounds) {
    return false;
  }

  return (
    tileBounds.x < targetBounds.x + targetBounds.width + DROP_TOLERANCE &&
    tileBounds.x + tileBounds.width > targetBounds.x - DROP_TOLERANCE &&
    tileBounds.y < targetBounds.y + targetBounds.height + DROP_TOLERANCE &&
    tileBounds.y + tileBounds.height > targetBounds.y - DROP_TOLERANCE
  );
}

function DraggableLetter({
  choice,
  tileSize,
  disabled,
  activeChoice,
  onDragStart,
  onTargetChange,
  getTargetBounds,
  onWrongDrop,
  onCorrectDrop,
}) {
  // Translation starts at zero, so springing back to {0, 0} always returns the
  // tile to the exact flexbox position where React Native laid it out.
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tileRef = useRef(null);
  const origin = useRef(null);
  const isHidden = useRef(false);
  const hasGesture = useRef(false);
  const latest = useRef(null);

  latest.current = {
    choice,
    tileSize,
    disabled,
    activeChoice,
    onDragStart,
    onTargetChange,
    getTargetBounds,
    onWrongDrop,
    onCorrectDrop,
  };

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });

    return () => {
      position.stopAnimation();
      scale.stopAnimation();
    };
  }, [position, scale]);

  function springHome(showWrongFeedback) {
    position.stopAnimation();
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        tension: 75,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 75,
        useNativeDriver: true,
      }),
    ]).start(() => {
      latest.current.onTargetChange(false);
      latest.current.onDragStart(null);
    });

    if (showWrongFeedback) {
      latest.current.onWrongDrop();
    }
  }

  function currentTileBounds(gestureState) {
    if (!origin.current) {
      return null;
    }

    return {
      x: origin.current.x + gestureState.dx,
      y: origin.current.y + gestureState.dy,
      width: origin.current.width,
      height: origin.current.height,
    };
  }

  // PanResponder keeps gesture handling in Expo Go without another gesture
  // library. Gesture deltas map directly to the tile's animated translation,
  // avoiding a jump when the child first touches it.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const values = latest.current;
        return (
          !values.disabled &&
          (values.activeChoice === null || values.activeChoice === values.choice)
        );
      },
      onMoveShouldSetPanResponder: () => {
        const values = latest.current;
        return (
          !values.disabled &&
          (values.activeChoice === null || values.activeChoice === values.choice)
        );
      },
      onPanResponderGrant: () => {
        const values = latest.current;
        if (values.disabled || values.activeChoice !== null) {
          return;
        }

        if (values.onDragStart(values.choice) === false) {
          return;
        }

        hasGesture.current = true;
        position.stopAnimation();
        values.getTargetBounds(true);
        tileRef.current?.measureInWindow((x, y, width, height) => {
          origin.current = { x, y, width, height };
        });
        Animated.spring(scale, {
          toValue: 1.1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const values = latest.current;
        if (values.activeChoice !== values.choice || !origin.current) {
          return;
        }

        position.setValue({ x: gestureState.dx, y: gestureState.dy });
        const tileBounds = currentTileBounds(gestureState);
        values.onTargetChange(
          overlapsDropZone(tileBounds, values.getTargetBounds()),
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const values = latest.current;
        if (!hasGesture.current) {
          return;
        }
        hasGesture.current = false;

        if (values.activeChoice !== values.choice || !origin.current) {
          springHome(false);
          return;
        }

        const targetBounds = values.getTargetBounds(true);
        const isOverTarget = overlapsDropZone(
          currentTileBounds(gestureState),
          targetBounds,
        );

        if (!isOverTarget) {
          springHome(false);
          return;
        }

        if (!values.onCorrectDrop(values.choice)) {
          springHome(true);
          return;
        }

        // The target and tile origins are measured from the real rendered
        // layout. Their centre difference produces a responsive snap position.
        const snapX =
          targetBounds.x + targetBounds.width / 2 -
          (origin.current.x + origin.current.width / 2);
        const snapY =
          targetBounds.y + targetBounds.height / 2 -
          (origin.current.y + origin.current.height / 2);

        position.stopAnimation();
        Animated.parallel([
          Animated.spring(position, {
            toValue: { x: snapX, y: snapY },
            friction: 7,
            tension: 90,
            useNativeDriver: false,
          }),
          Animated.spring(scale, {
            toValue: 0.9,
            friction: 7,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isHidden.current = true;
          position.setValue({ x: snapX, y: snapY });
          values.onCorrectDrop(values.choice, true);
        });
      },
      onPanResponderTerminate: () => {
        if (hasGesture.current) {
          hasGesture.current = false;
          springHome(false);
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      ref={tileRef}
      accessibilityLabel={`Seret huruf ${choice}`}
      accessibilityRole="button"
      {...panResponder.panHandlers}
      style={[
        styles.tileMovement,
        { width: tileSize, height: tileSize },
        activeChoice === choice && styles.draggingMovement,
        {
          opacity: isHidden.current ? 0 : 1,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        },
      ]}
    >
      {/* Keeping scale on a child prevents its native-driven animation from
          taking ownership of the JS-driven translation node above. */}
      <Animated.View
        style={[
          styles.letterTile,
          { borderRadius: tileSize * 0.22, transform: [{ scale }] },
          activeChoice === choice && styles.draggingTile,
          disabled && activeChoice !== choice && styles.disabledTile,
        ]}
      >
        <Text style={[styles.tileText, { fontSize: tileSize * 0.48 }]}>
          {choice}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function HurufPertamaScreen({ onBack }) {
  const { width, height } = useWindowDimensions();
  const isShort = height < 390;
  const answerWidth = width * 0.46;
  const tileSize = Math.max(
    58,
    Math.min(isShort ? 76 : 92, (answerWidth - 48) / 3),
  );
  const [questions, setQuestions] = useState(createSession);
  const [roundNumber, setRoundNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [activeChoice, setActiveChoice] = useState(null);
  const [isTargetActive, setIsTargetActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const nextRoundTimer = useRef(null);
  const transitionLock = useRef(false);
  const activeDragLock = useRef(null);
  const dropZoneRef = useRef(null);
  const targetBounds = useRef(null);
  const targetShake = useRef(new Animated.Value(0)).current;
  const wordScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const currentQuestion = questions[roundNumber - 1];

  useEffect(() => {
    return () => {
      clearTimeout(nextRoundTimer.current);
      targetShake.stopAnimation();
      wordScale.stopAnimation();
      cardScale.stopAnimation();
    };
  }, [cardScale, targetShake, wordScale]);

  function resetDragState() {
    // Changing the round key remounts every tile with a fresh ValueXY. These
    // state resets clear the target and completion effects at the same time.
    setFeedback("");
    setActiveChoice(null);
    setIsTargetActive(false);
    setIsCompleted(false);
    setIsTransitioning(false);
    activeDragLock.current = null;
    targetBounds.current = null;
    targetShake.setValue(0);
    wordScale.setValue(1);
    cardScale.setValue(1);
  }

  function startNewSession() {
    clearTimeout(nextRoundTimer.current);
    setQuestions(createSession());
    setRoundNumber(1);
    setScore(0);
    setIsFinished(false);
    transitionLock.current = false;
    resetDragState();
  }

  // measureInWindow supplies target coordinates in the same coordinate space
  // as each tile measurement, so collision checks remain correct after safe
  // area insets, scrolling, or a different landscape screen width.
  function measureDropZone(refresh = false) {
    if (refresh) {
      dropZoneRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
        targetBounds.current = {
          x,
          y,
          width: measuredWidth,
          height: measuredHeight,
        };
      });
    }

    return targetBounds.current;
  }

  function handleDragStart(choice) {
    if (choice === null) {
      activeDragLock.current = null;
      setActiveChoice(null);
      return true;
    }

    if (activeDragLock.current !== null) {
      return false;
    }

    activeDragLock.current = choice;
    setActiveChoice(choice);
    return true;
  }

  function runWrongAnimation() {
    setFeedback("Cuba lagi");
    setIsTargetActive(false);
    Animated.sequence([
      Animated.timing(targetShake, {
        toValue: -7,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(targetShake, {
        toValue: 7,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(targetShake, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function runSuccessAnimation() {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(wordScale, {
          toValue: 1.14,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(wordScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.025,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function handleCorrectDrop(choice, snapFinished = false) {
    if (snapFinished) {
      if (!transitionLock.current) {
        return false;
      }

      setIsCompleted(true);
      setFeedback("Betul!");
      setScore((currentScore) => currentScore + 1);
      runSuccessAnimation();

      nextRoundTimer.current = setTimeout(() => {
        if (roundNumber === TOTAL_ROUNDS) {
          setIsFinished(true);
          transitionLock.current = false;
          return;
        }

        setRoundNumber((currentRound) => currentRound + 1);
        transitionLock.current = false;
        resetDragState();
      }, NEXT_ROUND_DELAY);

      return true;
    }

    if (transitionLock.current || choice !== currentQuestion.letter) {
      return false;
    }

    transitionLock.current = true;
    setIsTransitioning(true);
    setIsTargetActive(true);
    return true;
  }

  function handleBack() {
    clearTimeout(nextRoundTimer.current);
    transitionLock.current = true;
    onBack();
  }

  if (isFinished) {
    return (
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        style={styles.safeArea}
      >
        <ScrollView
          contentContainerStyle={[styles.container, styles.resultContainer]}
        >
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>Tahniah!</Text>
          <Text style={styles.resultScore}>
            Skor kamu: {score} / {TOTAL_ROUNDS}
          </Text>

          <Pressable onPress={startNewSession} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Main Lagi</Text>
          </Pressable>
          <Pressable onPress={handleBack} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              Kembali ke Aktiviti ABC
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={isShort && activeChoice === null}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← Kembali</Text>
            </Pressable>
            <Text style={[styles.title, isShort && styles.shortTitle]}>
              Huruf Pertama
            </Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Soalan {roundNumber} daripada {TOTAL_ROUNDS}
            </Text>
            <Text style={styles.progressText}>Skor: {score}</Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <Animated.View
            style={[styles.questionCard, { transform: [{ scale: cardScale }] }]}
          >
            <Text style={[styles.emoji, isShort && styles.shortEmoji]}>
              {currentQuestion.emoji}
            </Text>
            <Animated.View
              style={[
                styles.wordRow,
                { transform: [{ scale: wordScale }] },
              ]}
            >
              <Animated.View
                ref={dropZoneRef}
                onLayout={() => measureDropZone(true)}
                style={[
                  styles.dropZone,
                  isTargetActive && styles.activeDropZone,
                  isCompleted && styles.completedDropZone,
                  { transform: [{ translateX: targetShake }] },
                ]}
              >
                <Text
                  style={[
                    styles.dropZoneText,
                    isCompleted && styles.completedWord,
                  ]}
                >
                  {isCompleted ? currentQuestion.letter : "?"}
                </Text>
              </Animated.View>
              <Text
                style={[
                  styles.wordRemainder,
                  isCompleted && styles.completedWord,
                ]}
              >
                {currentQuestion.word.slice(1)}
              </Text>
            </Animated.View>
            <Text style={styles.instruction}>Seret huruf yang betul</Text>
          </Animated.View>

          <View style={styles.answerArea}>
            <View style={styles.choices}>
              {currentQuestion.choices.map((choice) => (
                <DraggableLetter
                  key={`${roundNumber}-${choice}`}
                  choice={choice}
                  tileSize={tileSize}
                  disabled={isTransitioning}
                  activeChoice={activeChoice}
                  onDragStart={handleDragStart}
                  onTargetChange={setIsTargetActive}
                  getTargetBounds={measureDropZone}
                  onWrongDrop={runWrongAnimation}
                  onCorrectDrop={handleCorrectDrop}
                />
              ))}
            </View>

            <Text
              style={[
                styles.feedback,
                feedback === "Betul!"
                  ? styles.correctFeedback
                  : styles.tryFeedback,
              ]}
            >
              {feedback || " "}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ecfdf5",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#ecfdf5",
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  resultContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    elevation: 2,
  },
  backText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14532d",
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontWeight: "900",
    color: "#14532d",
    textAlign: "center",
  },
  shortTitle: {
    fontSize: 27,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonSpacer: {
    width: 104,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#166534",
  },
  mainRow: {
    flex: 1,
    flexDirection: "row",
    gap: 22,
    alignItems: "stretch",
  },
  questionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    elevation: 4,
  },
  answerArea: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  emoji: {
    fontSize: 56,
  },
  shortEmoji: {
    fontSize: 48,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  dropZone: {
    width: 50,
    height: 58,
    borderRadius: 14,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#16a34a",
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3,
  },
  activeDropZone: {
    borderStyle: "solid",
    borderWidth: 4,
    borderColor: "#15803d",
    backgroundColor: "#bbf7d0",
  },
  completedDropZone: {
    borderStyle: "solid",
    backgroundColor: "#dcfce7",
  },
  dropZoneText: {
    fontSize: 30,
    fontWeight: "900",
    color: "#15803d",
  },
  wordRemainder: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1f2937",
  },
  completedWord: {
    color: "#15803d",
  },
  instruction: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "center",
    marginTop: 12,
  },
  choices: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    overflow: "visible",
  },
  letterTile: {
    flex: 1,
    width: "100%",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#14532d",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  tileMovement: {
    zIndex: 1,
  },
  draggingMovement: {
    zIndex: 20,
  },
  draggingTile: {
    elevation: 14,
    shadowOpacity: 0.32,
    shadowRadius: 9,
  },
  disabledTile: {
    opacity: 0.65,
  },
  tileText: {
    fontWeight: "900",
    color: "#14532d",
  },
  feedback: {
    minHeight: 42,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  correctFeedback: {
    color: "#15803d",
  },
  tryFeedback: {
    color: "#b45309",
  },
  resultEmoji: {
    fontSize: 82,
  },
  resultTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#14532d",
    marginTop: 12,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: "800",
    color: "#166534",
    marginTop: 10,
    marginBottom: 32,
  },
  primaryButton: {
    width: "70%",
    maxWidth: 520,
    backgroundColor: "#16a34a",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },
  secondaryButton: {
    width: "70%",
    maxWidth: 520,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#14532d",
  },
});
