// Displays one learning-module card in the module list on StartScreen.
// It receives a module data object and an onPress callback, then shows the
// module's title, description, availability badge, and progress.
import { Pressable, StyleSheet, Text, View } from "react-native";

// Props come from StartScreen: module supplies the content, while onPress lets
// this child component tell its parent which module the learner tapped.
export default function ModuleCard({ module, onPress }) {
  // These derived values are calculated from props on every render. They do not
  // need state because they can always be recreated from the module data.
  const progressPercent = Math.round(module.progress * 100);
  const isComingSoon = module.status === "comingSoon";

  // Pressable can provide its current pressed state to the style callback.
  // Coming-soon cards look muted, while available cards shrink slightly.
  return (
    <Pressable
      onPress={() => onPress(module)}
      style={({ pressed }) => [
        styles.card,
        pressed && !isComingSoon && styles.pressed,
        isComingSoon && styles.disabledCard,
      ]}
    >
      {/* Card header: the badge is conditional rendering, so it only appears
          when isComingSoon is true. */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{module.title}</Text>
        {isComingSoon && <Text style={styles.badge}>Akan datang</Text>}
      </View>

      {/* Short explanation of what the module teaches. */}
      <Text style={styles.description}>{module.description}</Text>

      {/* Progress display: the inner View's width turns the numeric progress
          into a visible bar. */}
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%` },
            isComingSoon && styles.progressDisabled,
          ]}
        />
      </View>

      <Text style={styles.progressText}>{progressPercent}% selesai</Text>
    </Pressable>
  );
}

// StyleSheet keeps the card's reusable React Native styles together. Unlike
// CSS, these style objects are passed directly to native UI components.
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledCard: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#14532d",
  },
  badge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  description: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 8,
    marginBottom: 14,
  },
  progressBackground: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#d1fae5",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 999,
  },
  progressDisabled: {
    backgroundColor: "#9ca3af",
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    marginTop: 8,
  },
});
