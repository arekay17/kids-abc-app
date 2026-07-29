// Displays the activity choices for the Belajar ABC module between StartScreen
// and the learning activities in src/activities/abc. It receives callbacks for
// opening the available ABC activities and going back, then renders two
// available activities and one coming-soon placeholder.
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// Keeping the activity descriptions together makes the screen easy to extend
// later. The available item has an action callback; placeholder items do not.
const ACTIVITIES = [
  {
    id: "allLetters",
    title: "Mengenal Semua Huruf",
    description: "Kenali huruf A hingga Z",
    emoji: "🔤",
    status: "available",
  },
  {
    id: "game1",
    title: "Cari Huruf",
    description: "Cari huruf yang betul",
    emoji: "🎮",
    status: "available",
  },
  {
    id: "game2",
    title: "Permainan 2",
    description: "Aktiviti baharu sedang disediakan",
    emoji: "🧩",
    status: "comingSoon",
  },
];

// This small child component avoids repeating the same card JSX three times.
// Its props control the displayed activity, its visual state, and what happens
// when the learner taps it.
function ActivityCard({ activity, onPress }) {
  // This derived value controls conditional text and styling. It can be
  // calculated from props, so it does not need its own React state.
  const isComingSoon = activity.status === "comingSoon";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.activityCard,
        isComingSoon && styles.comingSoonCard,
        pressed && styles.pressedCard,
      ]}
    >
      {/* The emoji gives young learners a quick visual clue for each choice. */}
      <Text style={styles.activityEmoji}>{activity.emoji}</Text>

      {/* This group contains the main label, explanation, and conditional badge. */}
      <View style={styles.activityText}>
        <Text
          style={[
            styles.activityTitle,
            isComingSoon && styles.comingSoonTitle,
          ]}
        >
          {activity.title}
        </Text>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        {isComingSoon && (
          <Text style={styles.comingSoonBadge}>Akan datang</Text>
        )}
      </View>
    </Pressable>
  );
}

// Props are callbacks supplied by App. They let this screen request a screen
// transition while App remains responsible for the actual navigation state.
export default function AbcActivitiesScreen({
  onOpenAlphabet,
  onOpenCariHuruf,
  onBack,
}) {
  // The remaining placeholder uses an alert to respond without navigating.
  function handleComingSoon(activity) {
    Alert.alert("Akan datang", `${activity.title} akan dibuka nanti.`);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Navigation control returns from this menu to the main module list. */}
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Kembali</Text>
      </Pressable>

      {/* Screen header tells the learner which module is open and what to do. */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>Belajar ABC</Text>
        <Text style={styles.subtitle}>Pilih aktiviti</Text>
      </View>

      {/* Activity list: map renders one card for each data item. The key gives
          React a stable identity for each card between renders. */}
      {ACTIVITIES.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onPress={
            activity.id === "allLetters"
              ? onOpenAlphabet
              : activity.id === "game1"
                ? onOpenCariHuruf
                : () => handleComingSoon(activity)
          }
        />
      ))}
    </ScrollView>
  );
}

// StyleSheet groups reusable React Native styles. Coming-soon styles make the
// unavailable choices visibly different while keeping every card tappable.
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ecfdf5",
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
    elevation: 2,
  },
  backText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#14532d",
  },
  headerCard: {
    backgroundColor: "#16a34a",
    borderRadius: 28,
    padding: 24,
    marginBottom: 22,
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#dcfce7",
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },
  comingSoonCard: {
    backgroundColor: "#f3f4f6",
    opacity: 0.8,
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
  },
  activityEmoji: {
    fontSize: 42,
    marginRight: 16,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#14532d",
  },
  comingSoonTitle: {
    color: "#4b5563",
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 5,
  },
  comingSoonBadge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "800",
    color: "#92400e",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
});
