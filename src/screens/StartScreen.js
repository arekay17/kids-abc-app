// The app's starting screen displays a heading and the available learning
// modules. App passes in onOpenModule for navigation; module content comes from
// MODULES, and this component returns a vertically scrollable module list.
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Imports from other project files reuse the module-card UI and shared data
// instead of defining either one again inside this screen.
import ModuleCard from "../components/ModuleCard";
import { MODULES } from "../data/modules";

// onOpenModule is a callback prop. The parent owns navigation and this screen
// calls the callback with a module when the learner chooses one.
export default function StartScreen({ onOpenModule }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 1000;

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={styles.safeArea}
    >
      <ScrollView contentContainerStyle={styles.container}>
      {/* Screen header introduces the app and tells the learner what to do. */}
      <View style={styles.heroCard}>
        <Text style={styles.appTitle}>Belajar Bahasa Melayu</Text>
        <Text style={styles.subtitle}>Pilih modul pembelajaran</Text>
      </View>

      {/* Module list: map renders one ModuleCard for each MODULES item. A stable
          key helps React match each rendered card with its data between renders. */}
      <View style={styles.moduleGrid}>
        {MODULES.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onPress={onOpenModule}
            style={[styles.moduleCard, isTablet && styles.tabletModuleCard]}
          />
        ))}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// StyleSheet collects the screen's reusable React Native styles. The
// ScrollView receives container through contentContainerStyle so its entire
// scrollable content gets the background and spacing.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ecfdf5",
  },
  container: {
    backgroundColor: "#ecfdf5",
    flexGrow: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: "#16a34a",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
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
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },
  moduleCard: {
    flexGrow: 1,
    flexBasis: 250,
    maxWidth: 380,
    minWidth: 230,
  },
  tabletModuleCard: {
    flexBasis: 280,
  },
});
