import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LETTERS } from "../../data/letters";

const TOTAL_ROUNDS = 5;
const NEXT_ROUND_DELAY = 800;

// Fisher-Yates returns a shuffled copy, so the shared LETTERS array is never
// changed by this activity.
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

// Sampling the five records at session start prevents the same object or word
// from appearing twice. Each question also receives its own shuffled choices.
function createSession() {
  return shuffle(LETTERS)
    .slice(0, TOTAL_ROUNDS)
    .map((item) => ({
      ...item,
      choices: createChoices(item.letter),
    }));
}

export default function HurufPertamaScreen({ onBack }) {
  const { height } = useWindowDimensions();
  const isShort = height < 390;
  const [questions, setQuestions] = useState(createSession);
  const [roundNumber, setRoundNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const nextRoundTimer = useRef(null);
  const transitionLock = useRef(false);
  const currentQuestion = questions[roundNumber - 1];

  // A pending round change must not run after the child leaves this activity.
  useEffect(() => {
    return () => clearTimeout(nextRoundTimer.current);
  }, []);

  function startNewSession() {
    clearTimeout(nextRoundTimer.current);
    setQuestions(createSession());
    setRoundNumber(1);
    setScore(0);
    setFeedback("");
    setSelectedChoice(null);
    setIsTransitioning(false);
    setIsFinished(false);
    transitionLock.current = false;
  }

  function handleAnswer(choice) {
    // The ref locks immediately, before React renders again, which prevents
    // rapid correct taps from awarding multiple points.
    if (transitionLock.current) {
      return;
    }

    setSelectedChoice(choice);

    if (choice !== currentQuestion.letter) {
      setFeedback("Cuba lagi");
      return;
    }

    transitionLock.current = true;
    setFeedback("Betul!");
    setIsTransitioning(true);
    setScore((currentScore) => currentScore + 1);

    nextRoundTimer.current = setTimeout(() => {
      if (roundNumber === TOTAL_ROUNDS) {
        setIsFinished(true);
        setIsTransitioning(false);
        transitionLock.current = false;
        return;
      }

      setRoundNumber((currentRound) => currentRound + 1);
      setFeedback("");
      setSelectedChoice(null);
      setIsTransitioning(false);
      transitionLock.current = false;
    }, NEXT_ROUND_DELAY);
  }

  function handleBack() {
    clearTimeout(nextRoundTimer.current);
    onBack();
  }

  if (isFinished) {
    return (
      <ScrollView contentContainerStyle={[styles.container, styles.resultContainer]}>
        <Text style={styles.resultEmoji}>🎉</Text>
        <Text style={styles.resultTitle}>Tahniah!</Text>
        <Text style={styles.resultScore}>
          Skor kamu: {score} / {TOTAL_ROUNDS}
        </Text>

        <Pressable onPress={startNewSession} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Main Lagi</Text>
        </Pressable>
        <Pressable onPress={handleBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Kembali ke Aktiviti ABC</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <View style={styles.questionCard}>
          <Text style={styles.emoji}>{currentQuestion.emoji}</Text>
          <Text style={styles.word}>{currentQuestion.word}</Text>
          <Text style={styles.instruction}>
            Apakah huruf pertama bagi {currentQuestion.word}?
          </Text>
        </View>

        <View style={styles.answerArea}>
          <View style={styles.choices}>
            {currentQuestion.choices.map((choice) => {
              const isCorrect =
                selectedChoice === choice && choice === currentQuestion.letter;
              const isIncorrect =
                selectedChoice === choice && choice !== currentQuestion.letter;

              return (
                <Pressable
                  key={choice}
                  disabled={isTransitioning}
                  onPress={() => handleAnswer(choice)}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    isCorrect && styles.correctChoice,
                    isIncorrect && styles.incorrectChoice,
                    pressed && !isTransitioning && styles.pressedChoice,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      (isCorrect || isIncorrect) && styles.selectedChoiceText,
                    ]}
                  >
                    {choice}
                  </Text>
                </Pressable>
              );
            })}
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
  );
}

const styles = StyleSheet.create({
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
  mainRow: {
    flex: 1,
    flexDirection: "row",
    gap: 22,
    alignItems: "stretch",
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
  word: {
    fontSize: 29,
    fontWeight: "900",
    color: "#16a34a",
    marginTop: 4,
  },
  instruction: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "center",
    marginTop: 8,
  },
  choices: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  choiceButton: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 130,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  correctChoice: {
    backgroundColor: "#16a34a",
  },
  incorrectChoice: {
    backgroundColor: "#ef4444",
  },
  pressedChoice: {
    transform: [{ scale: 0.96 }],
  },
  choiceText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#14532d",
  },
  selectedChoiceText: {
    color: "#ffffff",
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
