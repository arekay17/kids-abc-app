import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ModuleCard({ module, onPress }) {
  const progressPercent = Math.round(module.progress * 100);
  const isComingSoon = module.status === "comingSoon";

  return (
    <Pressable
      onPress={() => onPress(module)}
      style={({ pressed }) => [
        styles.card,
        pressed && !isComingSoon && styles.pressed,
        isComingSoon && styles.disabledCard,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{module.title}</Text>
        {isComingSoon && <Text style={styles.badge}>Akan datang</Text>}
      </View>

      <Text style={styles.description}>{module.description}</Text>

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