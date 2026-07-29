// Displays the Mengenal Semua Huruf activity after it is chosen from the ABC
// activities menu. This learning screen now lives in src/activities/abc so it
// is kept separate from screens that mainly provide navigation choices.
// App supplies the selected letter plus callbacks for selecting a letter and
// going back; shared LETTERS data fills the grid and selected-letter details.
import { useRef } from "react";
import { useAudioPlayer } from "expo-audio";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
// These project imports reuse the individual letter button and shared letter
// data plus its matching static audio assets.
import LetterButton from "../../components/LetterButton";
import { LETTER_AUDIO } from "../../data/letterAudio";
import { LETTERS } from "../../data/letters";

// Props let the parent keep control of state and navigation. selectedLetter is
// the current state value; the callbacks ask the parent to update it or leave
// this screen, which causes React to render the appropriate screen again.
export default function MengenalSemuaHurufScreen({
  selectedLetter,
  onSelectLetter,
  onBack,
}) {
  // One hook-managed player prevents sounds from overlapping and releases its
  // native resources automatically when this screen unmounts.
  const letterPlayer = useAudioPlayer(null);
  const loadedLetter = useRef(null);
  const playbackRequest = useRef(0);
  const selectionAnimation = useRef(null);
  const letterScale = useRef(new Animated.Value(1)).current;
  const emojiTranslateY = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const wordOpacity = useRef(new Animated.Value(1)).current;

  function resetAnimationValues() {
    letterScale.setValue(1);
    emojiTranslateY.setValue(0);
    cardScale.setValue(1);
    wordOpacity.setValue(1);
  }

  function runSelectionAnimation() {
    // Stop the previous group before resetting so rapid taps always begin from
    // known values and cannot leave an element between its resting positions.
    selectionAnimation.current?.stop();
    resetAnimationValues();
    wordOpacity.setValue(0);

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(letterScale, {
          toValue: 1.15,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(letterScale, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(emojiTranslateY, {
          toValue: -9,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(emojiTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.025,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 170,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(wordOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    selectionAnimation.current = animation;
    animation.start(() => {
      // Ignore a stopped animation's callback if a newer tap has replaced it.
      if (selectionAnimation.current === animation) {
        resetAnimationValues();
        selectionAnimation.current = null;
      }
    });
  }

  async function playLetterSound(letter) {
    const requestId = playbackRequest.current + 1;
    playbackRequest.current = requestId;

    try {
      // Pause before seeking or replacing so only the newest sound can play.
      letterPlayer.pause();

      if (loadedLetter.current === letter) {
        await letterPlayer.seekTo(0);
      } else {
        letterPlayer.replace(LETTER_AUDIO[letter]);
        loadedLetter.current = letter;
      }

      // A newer tap may arrive while seekTo is finishing. Only the latest
      // request is allowed to start playback.
      if (playbackRequest.current === requestId) {
        letterPlayer.play();
      }
    } catch (error) {
      console.warn(`Tidak dapat memainkan audio huruf ${letter}.`, error);
    }
  }

  function handleSelectLetter(item) {
    // Keep the visual update independent so an audio failure never prevents
    // the selected letter, word, and emoji from changing.
    onSelectLetter(item);
    runSelectionAnimation();
    void playLetterSound(item.letter);
  }

  function handleBack() {
    playbackRequest.current += 1;

    try {
      letterPlayer.pause();
    } catch (error) {
      console.warn("Tidak dapat menghentikan audio huruf.", error);
    }

    onBack();
  }

  return (
    <View style={styles.container}>
      {/* Navigation control: tapping it calls the parent's back callback. */}
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backText}>← Kembali</Text>
      </Pressable>

      {/* Screen header identifies the lesson and language. */}
      <Text style={styles.title}>Belajar ABC</Text>
      <Text style={styles.subtitle}>Bahasa Melayu</Text>

      {/* Selected-letter display updates whenever the selectedLetter prop
          changes and React renders this component again. */}
      <Animated.View
        style={[
          styles.detailCard,
          { transform: [{ scale: cardScale }] },
        ]}
      >
        <Animated.Text
          style={[
            styles.emoji,
            { transform: [{ translateY: emojiTranslateY }] },
          ]}
        >
          {selectedLetter.emoji}
        </Animated.Text>
        <Animated.Text
          style={[styles.bigLetter, { transform: [{ scale: letterScale }] }]}
        >
          {selectedLetter.letter}
        </Animated.Text>
        <Animated.Text style={[styles.word, { opacity: wordOpacity }]}>
          {selectedLetter.word}
        </Animated.Text>
      </Animated.View>

      {/* Alphabet grid: FlatList efficiently renders the LETTERS data in four
          columns. keyExtractor gives every item a stable key so React can track
          each button, while renderItem describes the UI for one item. */}
      <FlatList
        data={LETTERS}
        keyExtractor={(item) => item.letter}
        numColumns={4}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <LetterButton
            item={item}
            isSelected={selectedLetter.letter === item.letter}
            onPress={handleSelectLetter}
          />
        )}
      />
    </View>
  );
}

// StyleSheet groups reusable native styles for this screen. flex: 1 lets the
// outer View fill the available screen so the FlatList has room to scroll.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    paddingTop: 48,
    paddingHorizontal: 18,
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
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#166534",
    textAlign: "center",
    marginBottom: 18,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    alignItems: "center",
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  emoji: {
    fontSize: 70,
  },
  bigLetter: {
    fontSize: 78,
    fontWeight: "900",
    color: "#16a34a",
  },
  word: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1f2937",
  },
  grid: {
    alignItems: "center",
    paddingBottom: 30,
  },
});
