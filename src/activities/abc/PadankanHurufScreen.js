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
const PAIRS_PER_ROUND = 3;
const MAX_SCORE = TOTAL_ROUNDS * PAIRS_PER_ROUND;
const NEXT_ROUND_DELAY = 1050;
const DROP_TOLERANCE = 24;

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

// Each round gets three unique letters. Adjacent rounds avoid using the exact
// same set, while the lowercase target order is shuffled independently.
function createSession() {
  const rounds = [];
  let previousSignature = "";

  for (let roundIndex = 0; roundIndex < TOTAL_ROUNDS; roundIndex += 1) {
    let letters;
    let signature;

    do {
      letters = shuffle(LETTERS).slice(0, PAIRS_PER_ROUND);
      signature = letters
        .map((item) => item.letter)
        .sort()
        .join("");
    } while (signature === previousSignature);

    rounds.push({
      uppercase: letters.map((item) => item.letter),
      lowercase: shuffle(letters.map((item) => item.letter.toLowerCase())),
    });
    previousSignature = signature;
  }

  return rounds;
}

function overlapsTarget(tile, target) {
  return (
    tile.x < target.x + target.width + DROP_TOLERANCE &&
    tile.x + tile.width > target.x - DROP_TOLERANCE &&
    tile.y < target.y + target.height + DROP_TOLERANCE &&
    tile.y + tile.height > target.y - DROP_TOLERANCE
  );
}

function DraggableUppercase({
  letter,
  roundNumber,
  tileSize,
  matched,
  isFloating,
  activeLetter,
  onDragLock,
  getTargets,
  onTargetChange,
  onWrongTarget,
  onReserveMatch,
  onFinishMatch,
  onShowOverlay,
  onHideOverlay,
}) {
  // This ValueXY belongs only to movement controlled by PanResponder. Every
  // spring using it stays JS-driven, and scale is rendered on a child node.
  const dragPosition = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tileRef = useRef(null);
  const origin = useRef(null);
  const gestureActive = useRef(false);
  const latest = useRef(null);

  latest.current = {
    letter,
    matched,
    isFloating,
    activeLetter,
    onDragLock,
    getTargets,
    onTargetChange,
    onWrongTarget,
    onReserveMatch,
    onFinishMatch,
    onShowOverlay,
    onHideOverlay,
  };

  useEffect(() => {
    dragPosition.setValue({ x: 0, y: 0 });

    return () => {
      dragPosition.stopAnimation();
      scale.stopAnimation();
    };
  }, [dragPosition, roundNumber, scale]);

  function releaseDragLock() {
    latest.current.onTargetChange(null);
    latest.current.onDragLock(null);
  }

  function springHome() {
    dragPosition.stopAnimation();
    Animated.parallel([
      Animated.spring(dragPosition, {
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
    ]).start(({ finished }) => {
      if (finished) {
        latest.current.onHideOverlay();
        releaseDragLock();
      }
    });
  }

  function tileBounds(gestureState) {
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

  function findOverlappedTarget(gestureState) {
    const tile = tileBounds(gestureState);
    if (!tile) {
      return null;
    }

    return (
      latest.current
        .getTargets()
        .find((target) => !target.matched && overlapsTarget(tile, target)) ?? null
    );
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const values = latest.current;
        return (
          !values.matched &&
          (values.activeLetter === null || values.activeLetter === values.letter)
        );
      },
      onMoveShouldSetPanResponder: () => {
        const values = latest.current;
        return (
          !values.matched &&
          (values.activeLetter === null || values.activeLetter === values.letter)
        );
      },
      onPanResponderGrant: () => {
        const values = latest.current;
        if (values.matched || values.onDragLock(values.letter) === false) {
          return;
        }

        gestureActive.current = true;
        dragPosition.stopAnimation();
        values.getTargets(true);
        tileRef.current?.measureInWindow((x, y, width, height) => {
          origin.current = { x, y, width, height };
          values.onShowOverlay({
            letter: values.letter,
            x,
            y,
            width,
            height,
            dragPosition,
            scale,
          });
        });
        Animated.spring(scale, {
          toValue: 1.08,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (!gestureActive.current || !origin.current) {
          return;
        }

        dragPosition.setValue({ x: gestureState.dx, y: gestureState.dy });
        onTargetChange(findOverlappedTarget(gestureState)?.letter ?? null);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!gestureActive.current) {
          return;
        }
        gestureActive.current = false;

        const target = findOverlappedTarget(gestureState);
        if (!target) {
          springHome();
          return;
        }

        if (target.letter !== letter.toLowerCase()) {
          onWrongTarget(target.letter);
          springHome();
          return;
        }

        if (!onReserveMatch(letter)) {
          springHome();
          return;
        }

        const snapX =
          target.x + target.width / 2 -
          (origin.current.x + origin.current.width / 2);
        const snapY =
          target.y + target.height / 2 -
          (origin.current.y + origin.current.height / 2);

        dragPosition.stopAnimation();
        Animated.parallel([
          Animated.spring(dragPosition, {
            toValue: { x: snapX, y: snapY },
            friction: 7,
            tension: 90,
            useNativeDriver: false,
          }),
          Animated.spring(scale, {
            toValue: 0.92,
            friction: 7,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (!finished) {
            return;
          }

          onHideOverlay();
          onFinishMatch(letter);
          requestAnimationFrame(() => {
            dragPosition.setValue({ x: 0, y: 0 });
            scale.setValue(1);
          });
        });
      },
      onPanResponderTerminate: () => {
        if (gestureActive.current) {
          gestureActive.current = false;
          springHome();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      ref={tileRef}
      accessibilityLabel={`Seret huruf besar ${letter}`}
      accessibilityRole="button"
      {...panResponder.panHandlers}
      style={[
        styles.dragMovement,
        { width: tileSize, height: tileSize },
        activeLetter === letter && styles.activeMovement,
        isFloating && styles.hiddenOriginalTile,
      ]}
    >
      <Animated.View
        style={[
          styles.uppercaseTile,
          { borderRadius: tileSize * 0.22, transform: [{ scale }] },
          matched && styles.matchedUppercaseTile,
          activeLetter === letter && styles.draggingTile,
        ]}
      >
        <Text
          style={[
            styles.uppercaseText,
            { fontSize: tileSize * 0.48 },
            matched && styles.matchedText,
          ]}
        >
          {letter}
        </Text>
        {matched && <Text style={styles.tileCheck}>✓</Text>}
      </Animated.View>
    </Animated.View>
  );
}

export default function PadankanHurufScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isShort = height < 390;
  const tileGap = width < 700 ? 16 : width < 1000 ? 20 : 24;
  const widthBasedSize = (width - 100 - tileGap * 2) / 3;
  const heightBasedSize = (height - (isShort ? 205 : 230)) / 2;
  const maximumTileSize = width >= 1000 ? 104 : isShort ? 70 : 88;
  const tileSize = Math.max(
    60,
    Math.min(maximumTileSize, widthBasedSize, heightBasedSize),
  );
  const [session, setSession] = useState(createSession);
  const [roundNumber, setRoundNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [matchedLetters, setMatchedLetters] = useState([]);
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [wrongTarget, setWrongTarget] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [floatingDrag, setFloatingDrag] = useState(null);
  const targetRefs = useRef({});
  const targetBounds = useRef({});
  const matchedLock = useRef(new Set());
  const activeDragLock = useRef(null);
  const roundTimer = useRef(null);
  const wrongTargetTimer = useRef(null);
  const targetShake = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const overlayHostRef = useRef(null);
  const overlayOrigin = useRef({ x: 0, y: 0 });
  const currentRound = session[roundNumber - 1];

  useEffect(() => {
    return () => {
      clearTimeout(roundTimer.current);
      clearTimeout(wrongTargetTimer.current);
      targetShake.stopAnimation();
      celebrationScale.stopAnimation();
    };
  }, [celebrationScale, targetShake]);

  function resetRoundState() {
    clearTimeout(wrongTargetTimer.current);
    matchedLock.current = new Set();
    activeDragLock.current = null;
    targetBounds.current = {};
    setMatchedLetters([]);
    setActiveLetter(null);
    setActiveTarget(null);
    setWrongTarget(null);
    setFeedback("");
    setFloatingDrag(null);
    targetShake.setValue(0);
    celebrationScale.setValue(1);
  }

  function startNewSession() {
    clearTimeout(roundTimer.current);
    setSession(createSession());
    setRoundNumber(1);
    setScore(0);
    setIsFinished(false);
    resetRoundState();
  }

  function measureTarget(letter) {
    targetRefs.current[letter]?.measureInWindow(
      (x, y, measuredWidth, measuredHeight) => {
        targetBounds.current[letter] = {
          letter,
          x,
          y,
          width: measuredWidth,
          height: measuredHeight,
        };
      },
    );
  }

  function measureOverlayHost() {
    overlayHostRef.current?.measureInWindow((x, y) => {
      overlayOrigin.current = { x, y };
    });
  }

  function showFloatingOverlay(drag) {
    setFloatingDrag({
      ...drag,
      left: drag.x - overlayOrigin.current.x,
      top: drag.y - overlayOrigin.current.y,
    });
  }

  function hideFloatingOverlay() {
    setFloatingDrag(null);
  }

  // Every target and draggable tile is measured in window coordinates, making
  // collision checks independent of safe-area insets and device width.
  function getTargets(refresh = false) {
    if (refresh) {
      currentRound.lowercase.forEach(measureTarget);
    }

    return currentRound.lowercase
      .map((letter) => targetBounds.current[letter])
      .filter(Boolean)
      .map((target) => ({
        ...target,
        matched: matchedLock.current.has(target.letter.toUpperCase()),
      }));
  }

  function handleDragLock(letter) {
    if (letter === null) {
      activeDragLock.current = null;
      setActiveLetter(null);
      return true;
    }

    if (activeDragLock.current !== null || matchedLock.current.has(letter)) {
      return false;
    }

    activeDragLock.current = letter;
    setActiveLetter(letter);
    return true;
  }

  function handleWrongTarget(letter) {
    setFeedback("Cuba lagi");
    setWrongTarget(letter);
    setActiveTarget(null);
    targetShake.setValue(0);
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

    clearTimeout(wrongTargetTimer.current);
    wrongTargetTimer.current = setTimeout(() => setWrongTarget(null), 420);
  }

  // The ref reserves a pair immediately, before React renders, so repeated
  // release events cannot score the same uppercase letter twice.
  function reserveMatch(letter) {
    if (matchedLock.current.has(letter)) {
      return false;
    }

    matchedLock.current.add(letter);
    setActiveTarget(letter.toLowerCase());
    return true;
  }

  function finishMatch(letter) {
    const nextMatched = [...matchedLock.current];
    setMatchedLetters(nextMatched);
    setScore((currentScore) => currentScore + 1);
    setActiveTarget(null);
    handleDragLock(null);

    if (nextMatched.length < PAIRS_PER_ROUND) {
      setFeedback("Betul! ✓");
      return;
    }

    setFeedback("Hebat! Semua betul!");
    Animated.sequence([
      Animated.spring(celebrationScale, {
        toValue: 1.12,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    roundTimer.current = setTimeout(() => {
      if (roundNumber === TOTAL_ROUNDS) {
        setIsFinished(true);
        return;
      }

      setRoundNumber((currentRoundNumber) => currentRoundNumber + 1);
      resetRoundState();
    }, NEXT_ROUND_DELAY);
  }

  function handleBack() {
    clearTimeout(roundTimer.current);
    clearTimeout(wrongTargetTimer.current);
    navigation.goBack();
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
            Skor kamu: {score} / {MAX_SCORE}
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
        scrollEnabled={isShort && activeLetter === null}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← Kembali</Text>
            </Pressable>
            <Text style={[styles.title, isShort && styles.shortTitle]}>
              Padankan Huruf
            </Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Pusingan {roundNumber} daripada {TOTAL_ROUNDS}
            </Text>
            <Text style={styles.progressText}>Skor: {score} / {MAX_SCORE}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.gameBoard,
            isShort && styles.shortGameBoard,
            { transform: [{ scale: celebrationScale }] },
          ]}
        >
          <View style={[styles.rowPanel, isShort && styles.shortRowPanel]}>
            <Text style={[styles.rowLabel, isShort && styles.shortRowLabel]}>
              Huruf Besar
            </Text>
            <View style={[styles.tileRow, { gap: tileGap }]}>
              {currentRound.uppercase.map((letter) => (
                <DraggableUppercase
                  key={`${roundNumber}-${letter}`}
                  letter={letter}
                  roundNumber={roundNumber}
                  tileSize={tileSize}
                  matched={matchedLetters.includes(letter)}
                  isFloating={floatingDrag?.letter === letter}
                  activeLetter={activeLetter}
                  onDragLock={handleDragLock}
                  getTargets={getTargets}
                  onTargetChange={setActiveTarget}
                  onWrongTarget={handleWrongTarget}
                  onReserveMatch={reserveMatch}
                  onFinishMatch={finishMatch}
                  onShowOverlay={showFloatingOverlay}
                  onHideOverlay={hideFloatingOverlay}
                />
              ))}
            </View>
          </View>

          <View
            style={[
              styles.rowPanel,
              styles.targetPanel,
              isShort && styles.shortRowPanel,
            ]}
          >
            <Text style={[styles.rowLabel, isShort && styles.shortRowLabel]}>
              Huruf Kecil
            </Text>
            <View style={[styles.tileRow, { gap: tileGap }]}>
              {currentRound.lowercase.map((letter) => {
                const uppercase = letter.toUpperCase();
                const isMatched = matchedLetters.includes(uppercase);
                const isActive = activeTarget === letter;
                const isWrong = wrongTarget === letter;

                return (
                  <Animated.View
                    key={letter}
                    ref={(node) => {
                      targetRefs.current[letter] = node;
                    }}
                    onLayout={() => measureTarget(letter)}
                    accessible
                    accessibilityLabel={`Padankan dengan huruf kecil ${letter}${
                      isMatched ? ", sudah dipadankan" : ""
                    }`}
                    style={[
                      styles.lowercaseTarget,
                      {
                        width: tileSize,
                        height: tileSize,
                        borderRadius: tileSize * 0.22,
                      },
                      isActive && styles.activeTarget,
                      isMatched && styles.matchedTarget,
                      isWrong && styles.wrongTarget,
                      isWrong && { transform: [{ translateX: targetShake }] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.lowercaseText,
                        { fontSize: tileSize * 0.44 },
                        isMatched && styles.matchedText,
                      ]}
                    >
                      {letter}
                    </Text>
                    {isMatched && <Text style={styles.targetCheck}>✓</Text>}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <Text
          style={[
            styles.feedback,
            feedback.startsWith("Cuba")
              ? styles.tryFeedback
              : styles.correctFeedback,
          ]}
        >
          {feedback || "Seret huruf besar ke huruf kecil yang betul"}
        </Text>
      </ScrollView>

      {/* This sibling sits above both row panels on Android. Window-based tile
          coordinates are converted to this host's local coordinate space. */}
      <View
        ref={overlayHostRef}
        collapsable={false}
        pointerEvents="none"
        onLayout={measureOverlayHost}
        style={styles.overlayHost}
      >
        {floatingDrag && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatingMovement,
              {
                left: floatingDrag.left,
                top: floatingDrag.top,
                width: floatingDrag.width,
                height: floatingDrag.height,
                transform: [
                  { translateX: floatingDrag.dragPosition.x },
                  { translateY: floatingDrag.dragPosition.y },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.uppercaseTile,
                styles.floatingTile,
                {
                  borderRadius: floatingDrag.width * 0.22,
                  transform: [{ scale: floatingDrag.scale }],
                },
              ]}
            >
              <Text
                style={[
                  styles.uppercaseText,
                  { fontSize: floatingDrag.width * 0.48 },
                ]}
              >
                {floatingDrag.letter}
              </Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>
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
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  resultContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  header: {
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 30,
    fontWeight: "900",
    color: "#14532d",
    textAlign: "center",
  },
  shortTitle: {
    fontSize: 25,
  },
  backButtonSpacer: {
    width: 104,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  progressText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#166534",
  },
  gameBoard: {
    flex: 1,
    minHeight: 230,
    alignItems: "stretch",
    justifyContent: "center",
    gap: 14,
  },
  shortGameBoard: {
    minHeight: 200,
    gap: 10,
  },
  rowPanel: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 3,
    overflow: "visible",
  },
  shortRowPanel: {
    paddingVertical: 5,
  },
  targetPanel: {
    backgroundColor: "#d1fae5",
  },
  rowLabel: {
    fontSize: 19,
    fontWeight: "900",
    color: "#14532d",
    marginBottom: 5,
  },
  shortRowLabel: {
    fontSize: 17,
    marginBottom: 3,
  },
  tileRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    overflow: "visible",
  },
  dragMovement: {
    zIndex: 1,
  },
  activeMovement: {
    zIndex: 30,
  },
  hiddenOriginalTile: {
    opacity: 0,
  },
  overlayHost: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    zIndex: 999,
    elevation: 20,
  },
  floatingMovement: {
    position: "absolute",
    zIndex: 999,
    elevation: 20,
  },
  floatingTile: {
    elevation: 20,
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  uppercaseTile: {
    flex: 1,
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#14532d",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  draggingTile: {
    elevation: 14,
    shadowOpacity: 0.32,
    shadowRadius: 9,
  },
  matchedUppercaseTile: {
    backgroundColor: "#16a34a",
    borderColor: "#15803d",
  },
  uppercaseText: {
    fontWeight: "900",
    color: "#14532d",
  },
  tileCheck: {
    position: "absolute",
    right: 7,
    top: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
  },
  lowercaseTarget: {
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: "#16a34a",
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTarget: {
    borderStyle: "solid",
    borderWidth: 4,
    borderColor: "#15803d",
    backgroundColor: "#86efac",
  },
  matchedTarget: {
    borderStyle: "solid",
    backgroundColor: "#16a34a",
  },
  wrongTarget: {
    borderStyle: "solid",
    borderColor: "#f97316",
    backgroundColor: "#ffedd5",
  },
  lowercaseText: {
    fontWeight: "900",
    color: "#14532d",
  },
  matchedText: {
    color: "#ffffff",
  },
  targetCheck: {
    position: "absolute",
    right: 7,
    top: 3,
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
  },
  feedback: {
    height: 42,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
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
