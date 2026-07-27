import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import LetterButton from "../components/LetterButton";
import { LETTERS } from "../data/letters";

export default function AlphabetScreen({
  selectedLetter,
  onSelectLetter,
  onBack,
}) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Kembali</Text>
      </Pressable>

      <Text style={styles.title}>Belajar ABC</Text>
      <Text style={styles.subtitle}>Bahasa Melayu</Text>

      <View style={styles.detailCard}>
        <Text style={styles.emoji}>{selectedLetter.emoji}</Text>
        <Text style={styles.bigLetter}>{selectedLetter.letter}</Text>
        <Text style={styles.word}>{selectedLetter.word}</Text>
      </View>

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