import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LETTERS } from "../../data/letters";

const TOTAL_ROUNDS = 5;
const NEXT_ROUND_DELAY = 800;

// Fisher-Yates creates a new shuffled array without changing the source data.
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

function getRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

// Every round contains the target plus two different letters chosen from the
// rest of the shared alphabet data.
function generateRound() {
  const target = getRandomItem(LETTERS).letter;
  const incorrectLetters = shuffle(
    LETTERS.filter((item) => item.letter !== target),
  )
    .slice(0, 2)
    .map((item) => item.letter);

  return {
    target,
    choices: shuffle([target, ...incorrectLetters]),
  };
}

export default function CariHurufScreen({ onBack }) {
  const [roundNumber, setRoundNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(generateRound);
  const [feedback, setFeedback] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const nextRoundTimer = useRef(null);
  const transitionLock = useRef(false);

  // Clear a pending transition when the activity unmounts, including when the
  // child leaves using the back button before the delay has finished.
  useEffect(() => {
    return () => clearTimeout(nextRoundTimer.current);
  }, []);

  function startNewSession() {
    clearTimeout(nextRoundTimer.current);
    setRoundNumber(1);
    setScore(0);
    setRound(generateRound());
    setFeedback("");
    setSelectedChoice(null);
    setIsTransitioning(false);
    setIsFinished(false);
    transitionLock.current = false;
  }

  function handleAnswer(choice) {
    // This guard prevents fast repeated taps from awarding more than one point
    // or scheduling more than one transition for the same round.
    if (transitionLock.current) {
      return;
    }

    setSelectedChoice(choice);

    if (choice !== round.target) {
      setFeedback("Cuba lagi");
      return;
    }

    setFeedback("Betul!");
    transitionLock.current = true;
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
      setRound(generateRound());
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
      <View style={[styles.container, styles.resultContainer]}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backText}>← Kembali</Text>
      </Pressable>

      <Text style={styles.title}>Cari Huruf</Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Soalan {roundNumber} daripada {TOTAL_ROUNDS}
        </Text>
        <Text style={styles.progressText}>Skor: {score}</Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.instruction}>Cari huruf</Text>
        <Text style={styles.targetLetter}>{round.target}</Text>
      </View>

      <View style={styles.choices}>
        {round.choices.map((choice) => {
          const isCorrect =
            selectedChoice === choice && choice === round.target;
          const isIncorrect =
            selectedChoice === choice && choice !== round.target;

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
          feedback === "Betul!" ? styles.correctFeedback : styles.tryFeedback,
        ]}
      >
        {feedback || " "}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    paddingTop: 48,
    paddingHorizontal: 18,
  },
  resultContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
    elevation: 2,
  },
  backText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14532d",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#14532d",
    textAlign: "center",
    marginBottom: 18,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#166534",
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    alignItems: "center",
    padding: 24,
    marginBottom: 28,
    elevation: 4,
  },
  instruction: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f2937",
  },
  targetLetter: {
    fontSize: 82,
    fontWeight: "900",
    color: "#16a34a",
    marginTop: 4,
  },
  choices: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  choiceButton: {
    width: "30%",
    aspectRatio: 1,
    maxHeight: 110,
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
    marginTop: 24,
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
    width: "100%",
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
    width: "100%",
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
