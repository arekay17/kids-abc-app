import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LETTERS } from "../../data/letters";

const KAK_LIMAU = require("../../../assets/mascot/kak-limau-abc-activity2.png");

const TOTAL_ROUNDS = 10;
const NEXT_ROUND_DELAY = 850;
const CHOICE_COLORS = ["#1f9eea", "#367be8", "#168fb3"];
const CELEBRATION_STARS = [
  { symbol: "★", color: "#ffc83d", left: "7%", top: "12%", size: 40 },
  { symbol: "✦", color: "#ff8a3d", left: "18%", top: "66%", size: 34 },
  { symbol: "★", color: "#49b8f2", left: "34%", top: "8%", size: 30 },
  { symbol: "✦", color: "#ffc83d", left: "61%", top: "13%", size: 38 },
  { symbol: "★", color: "#ff8a3d", left: "78%", top: "70%", size: 32 },
  { symbol: "✦", color: "#49b8f2", left: "89%", top: "17%", size: 42 },
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

function createChoices(target) {
  const incorrectLetters = shuffle(
    LETTERS.filter((item) => item.letter !== target),
  )
    .slice(0, 2)
    .map((item) => item.letter);

  return shuffle([target, ...incorrectLetters]);
}

// Ten unique target letters make each session feel varied while every round
// still contains the target and two different distractors.
function createSession() {
  return shuffle(LETTERS)
    .slice(0, TOTAL_ROUNDS)
    .map((item) => ({
      target: item.letter,
      choices: createChoices(item.letter),
    }));
}

export default function CariHurufScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 760 || height < 390;
  const [session, setSession] = useState(createSession);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const nextRoundTimer = useRef(null);
  const transitionLock = useRef(false);
  const feedbackScale = useRef(new Animated.Value(1)).current;
  const feedbackX = useRef(new Animated.Value(0)).current;
  const targetScale = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0.8)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const starAnimations = useRef(
    CELEBRATION_STARS.map(() => new Animated.Value(0)),
  ).current;
  const activeAnimations = useRef([]);
  const round = session[roundIndex];

  useEffect(() => {
    return () => {
      clearTimeout(nextRoundTimer.current);
      activeAnimations.current.forEach((animation) => animation.stop());
    };
  }, []);

  useEffect(() => {
    if (!isFinished) {
      return undefined;
    }

    celebrationScale.setValue(0.8);
    celebrationOpacity.setValue(0);
    starAnimations.forEach((value) => value.setValue(0));

    const cardAnimation = Animated.parallel([
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
    ]);
    const starsAnimation = Animated.stagger(
      85,
      starAnimations.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          friction: 4,
          tension: 90,
          useNativeDriver: true,
        }),
      ),
    );
    const celebrationAnimation = Animated.parallel([
      cardAnimation,
      starsAnimation,
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

  function animateIncorrectFeedback() {
    feedbackX.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(feedbackX, {
        toValue: -7,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackX, {
        toValue: 7,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackX, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]);

    activeAnimations.current = [animation];
    animation.start();
  }

  function animateCorrectFeedback() {
    feedbackScale.setValue(0.8);
    targetScale.setValue(1);
    const animation = Animated.parallel([
      Animated.spring(feedbackScale, {
        toValue: 1,
        friction: 4,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(targetScale, {
          toValue: 1.08,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(targetScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
    ]);

    activeAnimations.current = [animation];
    animation.start();
  }

  function startNewSession() {
    clearTimeout(nextRoundTimer.current);
    activeAnimations.current.forEach((animation) => animation.stop());
    setSession(createSession());
    setRoundIndex(0);
    setScore(0);
    setFeedback("");
    setSelectedChoice(null);
    setIsTransitioning(false);
    setIsFinished(false);
    transitionLock.current = false;
  }

  function handleAnswer(choice) {
    // Lock only after a correct answer so an incorrect choice can be retried,
    // while rapid taps cannot award duplicate points or queue extra rounds.
    if (transitionLock.current) {
      return;
    }

    setSelectedChoice(choice);

    if (choice !== round.target) {
      setFeedback("Cuba lagi");
      animateIncorrectFeedback();
      return;
    }

    setFeedback("Betul!");
    transitionLock.current = true;
    setIsTransitioning(true);
    setScore((currentScore) => currentScore + 1);
    animateCorrectFeedback();

    nextRoundTimer.current = setTimeout(() => {
      if (roundIndex === TOTAL_ROUNDS - 1) {
        setIsFinished(true);
        setIsTransitioning(false);
        transitionLock.current = false;
        return;
      }

      setRoundIndex((currentRound) => currentRound + 1);
      setFeedback("");
      setSelectedChoice(null);
      setIsTransitioning(false);
      transitionLock.current = false;
    }, NEXT_ROUND_DELAY);
  }

  function handleBack() {
    clearTimeout(nextRoundTimer.current);
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
              <Text style={styles.resultEyebrow}>★ Bagus sekali! ★</Text>
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
            <Text style={[styles.title, isCompact && styles.titleCompact]}>Cari Huruf</Text>
            <View style={styles.roundPill}>
              <Text style={styles.roundText}>
                Pusingan {roundIndex + 1}/{TOTAL_ROUNDS}
              </Text>
            </View>
          </View>

          <View accessibilityLabel={`Skor ${score}`} style={styles.scorePill}>
            <Text style={styles.scoreStar}>★</Text>
            <Text style={styles.scoreText}>Skor {score}</Text>
          </View>
        </View>

        <View style={[styles.mainRow, isCompact && styles.mainRowCompact]}>
          <View style={styles.guideArea}>
            <View style={[styles.questionCard, isCompact && styles.questionCardCompact]}>
              <View style={styles.instructionPill}>
                <Text style={[styles.instruction, isCompact && styles.instructionCompact]}>
                  Cari huruf ini!
                </Text>
              </View>
              <Animated.Text
                accessibilityLabel={`Cari huruf ${round.target}`}
                style={[
                  styles.targetLetter,
                  isCompact && styles.targetLetterCompact,
                  { transform: [{ scale: targetScale }] },
                ]}
              >
                {round.target}
              </Animated.Text>
              <View style={styles.targetUnderline} />
            </View>

            <Image
              accessibilityLabel="Kak Limau membantu mencari huruf"
              resizeMode="contain"
              source={KAK_LIMAU}
              style={[styles.mascot, isCompact && styles.mascotCompact]}
            />
          </View>

          <View style={styles.answerArea}>
            <Text style={[styles.answerHeading, isCompact && styles.answerHeadingCompact]}>
              Tekan huruf yang sama
            </Text>
            <View style={styles.choices}>
              {round.choices.map((choice, index) => {
                const isCorrect =
                  selectedChoice === choice && choice === round.target;
                const isIncorrect =
                  selectedChoice === choice && choice !== round.target;

                return (
                  <Pressable
                    accessibilityLabel={`Huruf ${choice}`}
                    accessibilityRole="button"
                    disabled={isTransitioning}
                    key={choice}
                    onPress={() => handleAnswer(choice)}
                    style={({ pressed }) => [
                      styles.choiceButton,
                      isCompact && styles.choiceButtonCompact,
                      { backgroundColor: CHOICE_COLORS[index] },
                      isCorrect && styles.correctChoice,
                      isIncorrect && styles.incorrectChoice,
                      pressed && !isTransitioning && styles.choicePressed,
                    ]}
                  >
                    <View style={styles.choiceShine} />
                    <Text style={[styles.choiceText, isCompact && styles.choiceTextCompact]}>
                      {choice}
                    </Text>
                    {isCorrect && <Text style={styles.choiceBadge}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>

            <Animated.View
              accessibilityLiveRegion="polite"
              style={[
                styles.feedbackArea,
                feedback === "Betul!" && styles.correctFeedbackArea,
                feedback === "Cuba lagi" && styles.tryFeedbackArea,
                {
                  transform: [
                    { translateX: feedbackX },
                    { scale: feedbackScale },
                  ],
                },
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
                {feedback === "Betul!" ? "★ Betul!" : feedback || "Pilih satu huruf"}
              </Text>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eaf8ff",
  },
  backgroundDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  backgroundDot: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#fff2a8",
  },
  backgroundDotOne: {
    width: 180,
    height: 180,
    left: -65,
    bottom: -85,
  },
  backgroundDotTwo: {
    width: 105,
    height: 105,
    right: -25,
    top: 62,
    backgroundColor: "#cceeff",
  },
  backgroundLetter: {
    position: "absolute",
    color: "rgba(54, 123, 232, 0.08)",
    fontSize: 90,
    fontWeight: "900",
    transform: [{ rotate: "-12deg" }],
  },
  backgroundLetterOne: {
    left: "3%",
    top: "31%",
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
    backgroundColor: "#167dcc",
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0b609c",
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
    fontSize: 21,
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
    color: "#ffae28",
    fontSize: 19,
    marginRight: 6,
  },
  scoreText: {
    color: "#15568d",
    fontSize: 15,
    fontWeight: "900",
  },
  headerButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  mainRow: {
    flex: 1,
    minHeight: 265,
    marginTop: 12,
    flexDirection: "row",
    gap: 18,
  },
  mainRowCompact: {
    marginTop: 9,
    gap: 12,
  },
  guideArea: {
    flex: 1.18,
    minWidth: 0,
    position: "relative",
    justifyContent: "center",
  },
  questionCard: {
    width: "84%",
    height: "100%",
    borderRadius: 28,
    borderWidth: 5,
    borderColor: "#ffca3a",
    backgroundColor: "#fff7c9",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
    paddingRight: "24%",
    paddingVertical: 12,
    shadowColor: "#d79c00",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  questionCardCompact: {
    width: "86%",
    borderRadius: 22,
    borderWidth: 4,
    paddingLeft: 8,
    paddingRight: "24%",
    paddingVertical: 8,
  },
  instructionPill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  instruction: {
    color: "#664500",
    fontSize: 21,
    fontWeight: "900",
  },
  instructionCompact: {
    fontSize: 17,
  },
  targetLetter: {
    color: "#f06d2f",
    fontSize: 116,
    fontWeight: "900",
    lineHeight: 132,
    textShadowColor: "rgba(173, 70, 21, 0.18)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 1,
  },
  targetLetterCompact: {
    fontSize: 86,
    lineHeight: 96,
  },
  targetUnderline: {
    width: "45%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ffca3a",
  },
  mascot: {
    position: "absolute",
    right: -6,
    bottom: -4,
    width: "50%",
    height: "94%",
  },
  mascotCompact: {
    right: -4,
    bottom: -2,
    width: "52%",
    height: "92%",
  },
  answerArea: {
    flex: 0.92,
    minWidth: 280,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  answerHeading: {
    color: "#275676",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  answerHeadingCompact: {
    fontSize: 15,
    marginBottom: 8,
  },
  choices: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 11,
  },
  choiceButton: {
    flex: 1,
    maxWidth: 145,
    minHeight: 118,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#14598b",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 5,
  },
  choiceButtonCompact: {
    minHeight: 86,
    borderRadius: 19,
  },
  choiceShine: {
    position: "absolute",
    top: 8,
    left: 10,
    right: 10,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  correctChoice: {
    backgroundColor: "#38b968",
    borderColor: "#d9ffe6",
  },
  incorrectChoice: {
    backgroundColor: "#f09a54",
    borderColor: "#fff0dc",
  },
  choicePressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.92,
  },
  choiceText: {
    color: "#ffffff",
    fontSize: 61,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  choiceTextCompact: {
    fontSize: 45,
  },
  choiceBadge: {
    position: "absolute",
    right: 8,
    top: 6,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    color: "#23874a",
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  feedbackArea: {
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#edf7fc",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
    paddingHorizontal: 12,
  },
  correctFeedbackArea: {
    backgroundColor: "#dcf7e6",
  },
  tryFeedbackArea: {
    backgroundColor: "#fff1dc",
  },
  feedback: {
    color: "#52758a",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  correctFeedback: {
    color: "#23874a",
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
    textShadowColor: "rgba(70,75,90,0.14)",
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
    borderColor: "#ffcc3d",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    shadowColor: "#166da6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.23,
    shadowRadius: 10,
    elevation: 8,
  },
  resultMascotWrap: {
    width: "37%",
    height: 240,
    borderRadius: 24,
    backgroundColor: "#f0f9d8",
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
    color: "#e07924",
    fontSize: 18,
    fontWeight: "900",
  },
  resultTitle: {
    color: "#146fae",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 2,
  },
  resultScorePill: {
    minWidth: 180,
    borderRadius: 18,
    backgroundColor: "#e9f7ff",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 8,
    marginTop: 8,
  },
  resultScoreLabel: {
    color: "#4a728c",
    fontSize: 13,
    fontWeight: "800",
  },
  resultScore: {
    color: "#ef792f",
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
    backgroundColor: "#f48a34",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#b65312",
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
    borderColor: "#79bfe9",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#176ca5",
    fontSize: 17,
    fontWeight: "900",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
