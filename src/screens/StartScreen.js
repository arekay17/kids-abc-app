import { ScrollView, StyleSheet, Text, View } from "react-native";
import ModuleCard from "../components/ModuleCard";
import { MODULES } from "../data/modules";

export default function StartScreen({ onOpenModule }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.appTitle}>Belajar Bahasa Melayu</Text>
        <Text style={styles.subtitle}>Pilih modul pembelajaran</Text>
      </View>

      {MODULES.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onPress={onOpenModule}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ecfdf5",
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: "#16a34a",
    borderRadius: 28,
    padding: 24,
    marginBottom: 22,
    alignItems: "center",
    elevation: 5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dcfce7",
    marginTop: 8,
    textAlign: "center",
  },
});