// Displays the ABC learning screen after the alphabet module is opened.
// App supplies the selected letter plus callbacks for selecting a letter and
// going back; shared LETTERS data fills the grid, and the screen shows details
// for the current selection above that grid.
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
// These project imports reuse the individual letter button and the single
// source of alphabet data shared by the app.
import LetterButton from "../components/LetterButton";
import { LETTERS } from "../data/letters";

// Props let the parent keep control of state and navigation. selectedLetter is
// the current state value; the callbacks ask the parent to update it or leave
// this screen, which causes React to render the appropriate screen again.
export default function AlphabetScreen({
  selectedLetter,
  onSelectLetter,
  onBack,
}) {
  return (
    <View style={styles.container}>
      {/* Navigation control: tapping it calls the parent's back callback. */}
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Kembali</Text>
      </Pressable>

      {/* Screen header identifies the lesson and language. */}
      <Text style={styles.title}>Belajar ABC</Text>
      <Text style={styles.subtitle}>Bahasa Melayu</Text>

      {/* Selected-letter display updates whenever the selectedLetter prop
          changes and React renders this component again. */}
      <View style={styles.detailCard}>
        <Text style={styles.emoji}>{selectedLetter.emoji}</Text>
        <Text style={styles.bigLetter}>{selectedLetter.letter}</Text>
        <Text style={styles.word}>{selectedLetter.word}</Text>
      </View>

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
            onPress={onSelectLetter}
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
