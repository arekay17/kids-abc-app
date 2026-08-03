import { Pressable, StyleSheet, Text, View } from "react-native";

function ProgressBar({ progress, accentColor }) {
  const progressPercent = Math.round(progress * 100);

  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${progressPercent}%`, backgroundColor: accentColor },
        ]}
      />
    </View>
  );
}

// One flexible card supports the large available module and the smaller locked
// modules while keeping their typography, icon, and interaction consistent.
export default function ModuleCard({
  module,
  onPress,
  featured = false,
  locked = false,
  accentColor,
  softColor,
  icon,
  progress = module.progress,
  progressLabel,
  compact = false,
  style,
}) {
  const progressPercent = Math.round(progress * 100);

  return (
    <Pressable
      accessibilityLabel={`${module.title}${locked ? ", akan datang" : ""}`}
      accessibilityRole="button"
      onPress={() => onPress(module)}
      style={({ pressed }) => [
        styles.card,
        featured ? styles.featuredCard : styles.standardCard,
        compact && (featured ? styles.compactFeaturedCard : styles.compactCard),
        { borderColor: accentColor },
        locked && styles.lockedCard,
        pressed && (locked ? styles.lockedPressed : styles.pressed),
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            featured && styles.featuredIconContainer,
            compact && styles.compactIconContainer,
            { backgroundColor: softColor, borderColor: accentColor },
          ]}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            numberOfLines={1}
            style={[
              styles.icon,
              featured && styles.featuredIcon,
              compact && styles.compactIcon,
            ]}
          >
            {icon}
          </Text>
        </View>

        <View style={styles.textGroup}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              featured && styles.featuredTitle,
              compact && styles.compactTitle,
            ]}
          >
            {module.title}
          </Text>
          <Text
            numberOfLines={featured ? 2 : compact ? 1 : 2}
            style={[styles.description, compact && styles.compactDescription]}
          >
            {module.description}
          </Text>
        </View>

        {featured && (
          <View style={[styles.playButton, { backgroundColor: accentColor }]}>
            <Text style={styles.playButtonText}>▶</Text>
          </View>
        )}
      </View>

      {!featured && (
        <View style={[styles.lockBadge, { backgroundColor: softColor }]}>
          <Text style={styles.lockText}>🔒 Akan datang</Text>
        </View>
      )}

      {featured && (
        <View style={styles.progressArea}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={[styles.progressPercent, { color: accentColor }]}>
              {progressPercent}%
            </Text>
          </View>
          <ProgressBar progress={progress} accentColor={accentColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 2,
    elevation: 4,
    shadowColor: "#315b1a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },
  featuredCard: {
    minHeight: 176,
    padding: 20,
    borderWidth: 3,
  },
  standardCard: {
    minHeight: 132,
    padding: 15,
  },
  compactFeaturedCard: {
    minHeight: 142,
    padding: 14,
    borderRadius: 20,
  },
  compactCard: {
    minHeight: 112,
    padding: 11,
    borderRadius: 19,
  },
  lockedCard: {
    opacity: 0.82,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  lockedPressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featuredIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 24,
    marginRight: 18,
  },
  compactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    marginRight: 9,
  },
  icon: {
    fontSize: 21,
    fontWeight: "900",
    color: "#263a20",
  },
  featuredIcon: {
    fontSize: 38,
  },
  compactIcon: {
    fontSize: 18,
  },
  textGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#263a20",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  featuredTitle: {
    fontSize: 31,
    lineHeight: 36,
  },
  compactTitle: {
    fontSize: 18,
    lineHeight: 21,
  },
  description: {
    color: "#586451",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 5,
  },
  compactDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
    elevation: 3,
  },
  playButtonText: {
    color: "#ffffff",
    fontSize: 25,
    marginLeft: 4,
  },
  lockBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 9,
  },
  lockText: {
    color: "#374151",
    fontSize: 10,
    fontWeight: "900",
  },
  progressArea: {
    marginTop: 18,
  },
  progressLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  progressLabel: {
    color: "#4b4f32",
    fontSize: 15,
    fontWeight: "900",
  },
  progressPercent: {
    fontSize: 17,
    fontWeight: "900",
  },
  progressTrack: {
    height: 13,
    borderRadius: 999,
    backgroundColor: "#f3ead3",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
