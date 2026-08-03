// Displays the Mengenal Semua Huruf activity after it is chosen from the ABC
// activities menu. This learning screen now lives in src/activities/abc so it
// is kept separate from screens that mainly provide navigation choices.
// App supplies the selected letter and selection callback so the choice can
// persist across visits; shared LETTERS data fills the grid and details.
import { useRef } from "react";
import { useAudioPlayer } from "expo-audio";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// These project imports reuse the individual letter button and shared letter
// data plus its matching static audio assets.
import LetterButton from "../../components/LetterButton";
import { LETTER_AUDIO } from "../../data/letterAudio";
import { LETTERS } from "../../data/letters";

// selectedLetter remains parent-owned while the navigation prop handles Back.
export default function MengenalSemuaHurufScreen({
  navigation,
  selectedLetter,
  onSelectLetter,
}) {
  const { width, height } = useWindowDimensions();
  const isShort = height < 390;
  const gridWidth = Math.min(width * 0.58, 620);
  const columns = width >= 1050 ? 9 : 7;
  const buttonSize = Math.max(
    44,
    Math.min(isShort ? 52 : 60, Math.floor(gridWidth / columns) - 8),
  );
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

    navigation.goBack();
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.container}
    >
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Kembali</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.title, isShort && styles.shortTitle]}>
            Belajar ABC
          </Text>
          <Text style={styles.subtitle}>Bahasa Melayu</Text>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      {/* Both learning areas remain visible together across landscape sizes. */}
      <View style={styles.landscapeContent}>

        {/* Selected-letter display updates whenever the selectedLetter prop
          changes and React renders this component again. */}
        <Animated.View
        style={[
          styles.detailCard,
          isShort && styles.shortDetailCard,
          { transform: [{ scale: cardScale }] },
        ]}
      >
        <Animated.Text
          style={[
            styles.emoji,
            isShort && styles.shortEmoji,
            { transform: [{ translateY: emojiTranslateY }] },
          ]}
        >
          {selectedLetter.emoji}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.bigLetter,
            isShort && styles.shortBigLetter,
            { transform: [{ scale: letterScale }] },
          ]}
        >
          {selectedLetter.letter}
        </Animated.Text>
        <Animated.Text style={[styles.word, { opacity: wordOpacity }]}>
          {selectedLetter.word}
        </Animated.Text>
        </Animated.View>

        {/* The responsive grid changes its column count for phones and tablets.
          keyExtractor gives every item a stable key so React can track
          each button, while renderItem describes the UI for one item. */}
        <View
          style={[
            styles.gridPanel,
            isShort && styles.shortGridPanel,
            { maxWidth: gridWidth + 48 },
          ]}
        >
          <FlatList
            style={styles.gridList}
            data={LETTERS}
            keyExtractor={(item) => item.letter}
            key={columns}
            numColumns={columns}
            scrollEnabled={isShort}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <LetterButton
                item={item}
                isSelected={selectedLetter.letter === item.letter}
                onPress={handleSelectLetter}
                size={buttonSize}
              />
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// StyleSheet groups reusable native styles for this screen. flex: 1 lets the
// outer View fill the available screen so the FlatList has room to scroll.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
    fontSize: 30,
    fontWeight: "900",
    color: "#14532d",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#166534",
    textAlign: "center",
  },
  shortTitle: {
    fontSize: 26,
  },
  heading: {
    flex: 1,
  },
  backButtonSpacer: {
    width: 104,
  },
  landscapeContent: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  detailCard: {
    order: 2,
    flex: 2,
    minWidth: 210,
    maxWidth: 440,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    alignItems: "center",
    padding: 16,
    justifyContent: "center",
    elevation: 4,
  },
  emoji: {
    fontSize: 66,
  },
  bigLetter: {
    fontSize: 76,
    fontWeight: "900",
    color: "#16a34a",
  },
  word: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1f2937",
  },
  grid: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  gridPanel: {
    order: 1,
    flex: 3,
    minWidth: 350,
    backgroundColor: "#d1fae5",
    borderRadius: 24,
    justifyContent: "center",
  },
  gridList: {
    flex: 1,
  },
  gridRow: {
    justifyContent: "center",
  },
  shortDetailCard: {
    padding: 8,
  },
  shortGridPanel: {
    paddingVertical: 2,
  },
  shortEmoji: {
    fontSize: 50,
  },
  shortBigLetter: {
    fontSize: 60,
  },
});
