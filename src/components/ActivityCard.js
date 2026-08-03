import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export default function ActivityCard({
  activity,
  width,
  height,
  compact = false,
  showDescription = true,
  animatedStyle,
  onPress,
}) {
  return (
    <Animated.View style={[{ width, height }, animatedStyle]}>
      <Pressable
        accessibilityLabel={`Aktiviti ${activity.number}, ${activity.fullTitle || activity.title}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          compact && styles.compactCard,
          {
            backgroundColor: activity.softColor,
            borderColor: activity.accentColor,
          },
          pressed && styles.pressed,
        ]}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.decorativeCircle,
              styles.decorativeCircleLarge,
              { backgroundColor: activity.accentColor },
            ]}
          />
          <View
            style={[
              styles.decorativeCircle,
              styles.decorativeCircleSmall,
              { backgroundColor: activity.accentColor },
            ]}
          />
        </View>

        <View style={styles.cardTopRow}>
          <View
            style={[styles.numberBadge, { backgroundColor: activity.deepColor }]}
          >
            <Text style={styles.numberText}>{activity.number}</Text>
          </View>
          <Text style={[styles.miniStar, { color: activity.deepColor }]}>★</Text>
        </View>

        <View
          style={[
            styles.symbolContainer,
            compact && styles.compactSymbolContainer,
            { backgroundColor: activity.accentColor },
          ]}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            numberOfLines={1}
            style={[styles.symbol, compact && styles.compactSymbol]}
          >
            {activity.symbol}
          </Text>
        </View>

        <View style={styles.textArea}>
          <Text
            numberOfLines={2}
            style={[styles.title, compact && styles.compactTitle]}
          >
            {activity.title}
          </Text>
          {activity.fullTitle && (
            <Text
              numberOfLines={1}
              style={[styles.fullTitle, compact && styles.compactFullTitle]}
            >
              {activity.fullTitle}
            </Text>
          )}
          {showDescription && (
            <Text numberOfLines={1} style={styles.description}>
              {activity.description}
            </Text>
          )}
        </View>

        <View style={[styles.action, { backgroundColor: activity.deepColor }]}>
          <Text style={styles.actionText}>Mula</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 27,
    borderWidth: 3,
    padding: 16,
    elevation: 5,
    shadowColor: "#324b35",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
  },
  compactCard: {
    borderRadius: 22,
    padding: 12,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ translateY: 2 }, { scale: 0.97 }],
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.16,
  },
  decorativeCircleLarge: {
    width: 92,
    height: 92,
    right: -28,
    top: -24,
  },
  decorativeCircleSmall: {
    width: 42,
    height: 42,
    left: -10,
    bottom: 28,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  numberText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  miniStar: {
    fontSize: 20,
    opacity: 0.72,
  },
  symbolContainer: {
    alignSelf: "center",
    minWidth: 88,
    height: 65,
    borderRadius: 21,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -5,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.75)",
  },
  compactSymbolContainer: {
    minWidth: 74,
    height: 53,
    borderRadius: 17,
    marginTop: -8,
  },
  symbol: {
    color: "#ffffff",
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
  },
  compactSymbol: {
    fontSize: 24,
  },
  textArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  title: {
    color: "#293b28",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 24,
    textAlign: "center",
  },
  compactTitle: {
    fontSize: 18,
    lineHeight: 20,
  },
  fullTitle: {
    color: "#52604f",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    textAlign: "center",
  },
  compactFullTitle: {
    fontSize: 9,
  },
  description: {
    color: "#657260",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  action: {
    alignSelf: "stretch",
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  arrow: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
});
