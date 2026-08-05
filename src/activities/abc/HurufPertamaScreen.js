import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
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

const KAK_LIMAU = require("../../../assets/mascot/kak-limau-pointing.png");

const TOTAL_ROUNDS = 10;
const NEXT_ROUND_DELAY = 850;
const DROP_TOLERANCE = 26;
const TILE_COLORS = ["#7657d6", "#e05b9d", "#13a6a6"];
const CELEBRATION_STARS = [
  { symbol: "★", color: "#ffd34e", left: "7%", top: "12%", size: 40 },
  { symbol: "✦", color: "#ef6ca8", left: "18%", top: "66%", size: 34 },
  { symbol: "★", color: "#36c7bd", left: "34%", top: "8%", size: 30 },
  { symbol: "✦", color: "#ffd34e", left: "61%", top: "13%", size: 38 },
  { symbol: "★", color: "#ef6ca8", left: "78%", top: "70%", size: 32 },
  { symbol: "✦", color: "#7657d6", left: "89%", top: "17%", size: 42 },
];

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

// Each session keeps the original question and answer generation, sampling ten
// unique records so the drag activity follows the shared progression length.
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
  tileColor,
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
    tileColor,
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
          {
            backgroundColor: tileColor,
            borderRadius: tileSize * 0.22,
            transform: [{ scale }],
          },
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

export default function HurufPertamaScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 760 || height < 390;
  const answerWidth = width * (isCompact ? 0.34 : 0.36);
  const tileSize = Math.max(
    58,
    Math.min(isCompact ? 76 : 92, (answerWidth - 32) / 3),
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
  const mascotFloat = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.8)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const starAnimations = useRef(
    CELEBRATION_STARS.map(() => new Animated.Value(0)),
  ).current;
  const activeAnimations = useRef([]);
  const currentQuestion = questions[roundNumber - 1];

  useEffect(() => {
    return () => {
      clearTimeout(nextRoundTimer.current);
      targetShake.stopAnimation();
      wordScale.stopAnimation();
      cardScale.stopAnimation();
      activeAnimations.current.forEach((animation) => animation.stop());
    };
  }, [cardScale, targetShake, wordScale]);

  useEffect(() => {
    if (isFinished) {
      mascotFloat.stopAnimation();
      mascotFloat.setValue(0);
      return undefined;
    }

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, {
          toValue: -5,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mascotFloat, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    floatAnimation.start();
    return () => floatAnimation.stop();
  }, [isFinished, mascotFloat]);

  useEffect(() => {
    if (!isFinished) {
      return undefined;
    }

    celebrationScale.setValue(0.8);
    celebrationOpacity.setValue(0);
    starAnimations.forEach((value) => value.setValue(0));

    const celebrationAnimation = Animated.parallel([
      Animated.parallel([
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        85,
        starAnimations.map((value) =>
          Animated.spring(value, {
            toValue: 1,
            friction: 4,
            tension: 90,
            useNativeDriver: true,
          }),
        ),
      ),
    ]);

    activeAnimations.current = [celebrationAnimation];
    celebrationAnimation.start();
    return () => celebrationAnimation.stop();
  }, [
    celebrationOpacity,
    celebrationScale,
    isFinished,
    starAnimations,
  ]);

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
    activeAnimations.current.forEach((animation) => animation.stop());
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
    navigation.goBack();
  }

  if (isFinished) {
    return (
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
        <View pointerEvents="none" style={styles.celebrationDecorations}>
          {CELEBRATION_STARS.map((star, index) => {
            const animation = starAnimations[index];
            return (
              <Animated.Text
                key={`${star.symbol}-${star.left}`}
                style={[
                  styles.celebrationStar,
                  {
                    color: star.color,
                    fontSize: star.size,
                    left: star.left,
                    top: star.top,
                    opacity: animation,
                    transform: [
                      { scale: animation },
                      {
                        rotate: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["-35deg", "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {star.symbol}
              </Animated.Text>
            );
          })}
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.resultCard,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              },
            ]}
          >
            <View style={styles.resultMascotWrap}>
              <Image
                accessibilityLabel="Kak Limau meraikan kejayaan"
                resizeMode="contain"
                source={KAK_LIMAU}
                style={styles.resultMascot}
              />
            </View>

            <View style={styles.resultContent}>
              <Text style={styles.resultEyebrow}>★ Huruf Pertama ★</Text>
              <Text style={styles.resultTitle}>Tahniah!</Text>
              <View style={styles.resultScorePill}>
                <Text style={styles.resultScoreLabel}>Skor kamu</Text>
                <Text style={styles.resultScore}>
                  {score} / {TOTAL_ROUNDS}
                </Text>
              </View>

              <View style={[styles.resultButtons, isCompact && styles.resultButtonsCompact]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={startNewSession}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>↻ Main Lagi</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>← Kembali</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundDecorations}>
        <View style={[styles.backgroundDot, styles.backgroundDotOne]} />
        <View style={[styles.backgroundDot, styles.backgroundDotTwo]} />
        <Text style={[styles.backgroundLetter, styles.backgroundLetterOne]}>A</Text>
        <Text style={[styles.backgroundLetter, styles.backgroundLetterTwo]}>B</Text>
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.container}
        scrollEnabled={isCompact && activeChoice === null}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isCompact && styles.headerCompact]}>
          <Pressable
            accessibilityLabel="Kembali"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backText}>Kembali</Text>
          </Pressable>

          <View style={styles.titleArea}>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              Huruf Pertama
            </Text>
            <View style={styles.roundPill}>
              <Text style={styles.roundText}>
                Pusingan {roundNumber}/{TOTAL_ROUNDS}
              </Text>
            </View>
          </View>

          <View accessibilityLabel={`Skor ${score}`} style={styles.scorePill}>
            <Text style={styles.scoreStar}>★</Text>
            <Text style={styles.scoreText}>Skor {score}</Text>
          </View>
        </View>

        <View
          style={[
            styles.mainContentRow,
            isCompact && styles.mainContentRowCompact,
          ]}
        >
          <View style={[styles.mascotPanel, isCompact && styles.mascotPanelCompact]}>
            <View style={[styles.speechBubble, isCompact && styles.speechBubbleCompact]}>
              <Text style={[styles.speechText, isCompact && styles.speechTextCompact]}>
                Pilih huruf pertama!
              </Text>
              <View style={styles.speechTail} />
            </View>
            <Animated.View
              style={[
                styles.mascotAnimation,
                { transform: [{ translateY: mascotFloat }] },
              ]}
            >
              <Image
                accessibilityLabel="Kak Limau membantu memilih huruf pertama"
                resizeMode="contain"
                source={KAK_LIMAU}
                style={styles.mascot}
              />
            </Animated.View>
          </View>

          <View style={[styles.gamePanel, isCompact && styles.gamePanelCompact]}>
            <Animated.View
              style={[
                styles.questionCard,
                isCompact && styles.questionCardCompact,
                { transform: [{ scale: cardScale }] },
              ]}
            >
              <View style={styles.questionLabel}>
                <Text style={styles.questionLabelText}>Huruf pertama</Text>
              </View>
              <Text style={[styles.emoji, isCompact && styles.emojiCompact]}>
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
                    isCompact && styles.dropZoneCompact,
                    isTargetActive && styles.activeDropZone,
                    isCompleted && styles.completedDropZone,
                    { transform: [{ translateX: targetShake }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropZoneText,
                      isCompact && styles.dropZoneTextCompact,
                      isCompleted && styles.completedWord,
                    ]}
                  >
                    {isCompleted ? currentQuestion.letter : "?"}
                  </Text>
                </Animated.View>
                <Text
                  style={[
                    styles.wordRemainder,
                    isCompact && styles.wordRemainderCompact,
                    isCompleted && styles.completedWord,
                  ]}
                >
                  {currentQuestion.word.slice(1)}
                </Text>
              </Animated.View>
              <Text style={[styles.instruction, isCompact && styles.instructionCompact]}>
                Seret huruf yang betul
              </Text>
            </Animated.View>

            <View style={[styles.answerArea, isCompact && styles.answerAreaCompact]}>
              <Text style={[styles.answerHeading, isCompact && styles.answerHeadingCompact]}>
                Pilih dan seret huruf
              </Text>
              <View style={[styles.choices, isCompact && styles.choicesCompact]}>
                {currentQuestion.choices.map((choice, index) => (
                  <DraggableLetter
                    key={`${roundNumber}-${choice}`}
                    choice={choice}
                    tileColor={TILE_COLORS[index]}
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

              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.feedbackArea,
                  feedback === "Betul!" && styles.correctFeedbackArea,
                  feedback === "Cuba lagi" && styles.tryFeedbackArea,
                ]}
              >
                <Text
                  style={[
                    styles.feedback,
                    feedback === "Betul!"
                      ? styles.correctFeedback
                      : styles.tryFeedback,
                  ]}
                >
                  {feedback === "Betul!" ? "★ Betul!" : feedback || "Seret satu huruf"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2edff",
  },
  backgroundDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  backgroundDot: {
    position: "absolute",
    borderRadius: 999,
  },
  backgroundDotOne: {
    width: 180,
    height: 180,
    left: -65,
    bottom: -85,
    backgroundColor: "#ffe79a",
  },
  backgroundDotTwo: {
    width: 115,
    height: 115,
    right: -30,
    top: 68,
    backgroundColor: "#c8f3ee",
  },
  backgroundLetter: {
    position: "absolute",
    color: "rgba(112, 78, 190, 0.08)",
    fontSize: 90,
    fontWeight: "900",
  },
  backgroundLetterOne: {
    left: "3%",
    top: "31%",
    transform: [{ rotate: "-12deg" }],
  },
  backgroundLetterTwo: {
    right: "3%",
    bottom: "3%",
    transform: [{ rotate: "12deg" }],
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  header: {
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: "#6953bd",
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#453489",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  headerCompact: {
    minHeight: 46,
    borderRadius: 16,
    paddingVertical: 5,
  },
  backButton: {
    minHeight: 40,
    minWidth: 112,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 30,
    marginRight: 3,
  },
  backText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  headerButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  titleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
  },
  titleCompact: {
    fontSize: 20,
  },
  roundPill: {
    backgroundColor: "#ffe36e",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  roundText: {
    color: "#604700",
    fontSize: 15,
    fontWeight: "900",
  },
  scorePill: {
    minHeight: 40,
    minWidth: 112,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  scoreStar: {
    color: "#f4aa2e",
    fontSize: 19,
    marginRight: 6,
  },
  scoreText: {
    color: "#55439a",
    fontSize: 15,
    fontWeight: "900",
  },
  mainContentRow: {
    flex: 1,
    minHeight: 265,
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },
  mainContentRowCompact: {
    marginTop: 9,
    gap: 8,
  },
  mascotPanel: {
    width: "29%",
    minWidth: 0,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#d2c7fa",
    backgroundColor: "#e9e3ff",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 0,
    overflow: "hidden",
    shadowColor: "#5943a5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  mascotPanelCompact: {
    width: "28%",
    borderRadius: 22,
    paddingHorizontal: 2,
    paddingTop: 5,
  },
  speechBubble: {
    zIndex: 2,
    width: "92%",
    maxWidth: 240,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#b8a8ef",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
    shadowColor: "#5943a5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  speechBubbleCompact: {
    borderRadius: 15,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  speechText: {
    color: "#4f3c89",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  speechTextCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  speechTail: {
    position: "absolute",
    bottom: -8,
    left: "47%",
    width: 14,
    height: 14,
    backgroundColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#b8a8ef",
    transform: [{ rotate: "45deg" }],
  },
  mascotAnimation: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  mascot: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.08 }],
  },
  gamePanel: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 12,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.46)",
    padding: 8,
  },
  gamePanelCompact: {
    gap: 8,
    borderRadius: 22,
    padding: 6,
  },
  questionCard: {
    flex: 0.92,
    minWidth: 0,
    height: "100%",
    borderRadius: 26,
    borderWidth: 4,
    borderColor: "#42c7bd",
    backgroundColor: "#e4fbf8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: "#168d86",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.17,
    shadowRadius: 6,
    elevation: 4,
  },
  questionCardCompact: {
    borderRadius: 21,
    borderWidth: 3,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  questionLabel: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  questionLabelText: {
    color: "#57419c",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  emoji: {
    fontSize: 58,
    lineHeight: 70,
  },
  emojiCompact: {
    fontSize: 46,
    lineHeight: 54,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dropZone: {
    width: 52,
    height: 58,
    borderRadius: 14,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#d94b91",
    backgroundColor: "#fff0f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3,
  },
  dropZoneCompact: {
    width: 44,
    height: 49,
    borderRadius: 12,
  },
  activeDropZone: {
    borderStyle: "solid",
    borderWidth: 4,
    borderColor: "#8c55d8",
    backgroundColor: "#eee5ff",
  },
  completedDropZone: {
    borderStyle: "solid",
    borderColor: "#20a99f",
    backgroundColor: "#d7f8f3",
  },
  dropZoneText: {
    color: "#cb3d82",
    fontSize: 30,
    fontWeight: "900",
  },
  dropZoneTextCompact: {
    fontSize: 25,
  },
  wordRemainder: {
    color: "#3f3556",
    fontSize: 30,
    fontWeight: "900",
  },
  wordRemainderCompact: {
    fontSize: 24,
  },
  completedWord: {
    color: "#168e85",
  },
  instruction: {
    color: "#4a3d5f",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 9,
  },
  instructionCompact: {
    fontSize: 14,
    marginTop: 6,
  },
  answerArea: {
    flex: 1.28,
    minWidth: 0,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: "center",
  },
  answerAreaCompact: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  answerHeading: {
    color: "#5a478f",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  answerHeadingCompact: {
    fontSize: 14,
    marginBottom: 8,
  },
  choices: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    overflow: "visible",
  },
  choicesCompact: {
    gap: 8,
  },
  tileMovement: {
    zIndex: 1,
  },
  draggingMovement: {
    zIndex: 20,
  },
  letterTile: {
    flex: 1,
    width: "100%",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#493477",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  draggingTile: {
    borderColor: "#fff5a8",
    elevation: 14,
    shadowOpacity: 0.34,
    shadowRadius: 9,
  },
  disabledTile: {
    opacity: 0.62,
  },
  tileText: {
    color: "#ffffff",
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.14)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  feedbackArea: {
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#f1eff8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
    paddingHorizontal: 10,
  },
  correctFeedbackArea: {
    backgroundColor: "#daf7ec",
  },
  tryFeedbackArea: {
    backgroundColor: "#fff0dc",
  },
  feedback: {
    color: "#6c6680",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },
  correctFeedback: {
    color: "#16885f",
  },
  tryFeedback: {
    color: "#b75d19",
  },
  celebrationDecorations: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  celebrationStar: {
    position: "absolute",
    fontWeight: "900",
    textShadowColor: "rgba(70,55,100,0.14)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
  },
  resultContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  resultCard: {
    width: "76%",
    maxWidth: 850,
    minWidth: 520,
    minHeight: 285,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: "#ffd34e",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    shadowColor: "#543d9f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  resultMascotWrap: {
    width: "37%",
    height: 240,
    borderRadius: 24,
    backgroundColor: "#eee9ff",
    overflow: "hidden",
  },
  resultMascot: {
    width: "100%",
    height: "100%",
  },
  resultContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  resultEyebrow: {
    color: "#d64b8d",
    fontSize: 18,
    fontWeight: "900",
  },
  resultTitle: {
    color: "#684ebd",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 2,
  },
  resultScorePill: {
    minWidth: 180,
    borderRadius: 18,
    backgroundColor: "#f0ecff",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 8,
    marginTop: 8,
  },
  resultScoreLabel: {
    color: "#6d6485",
    fontSize: 13,
    fontWeight: "800",
  },
  resultScore: {
    color: "#df5599",
    fontSize: 28,
    fontWeight: "900",
  },
  resultButtons: {
    marginTop: 15,
    flexDirection: "row",
    gap: 10,
  },
  resultButtonsCompact: {
    marginTop: 10,
  },
  primaryButton: {
    minWidth: 135,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#7657d6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#493294",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  secondaryButton: {
    minWidth: 125,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ad9ce6",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#624cac",
    fontSize: 17,
    fontWeight: "900",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
