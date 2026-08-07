import { useMemo, useCallback } from "react";
import {
  View,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { DrawerContentScrollView } from "expo-router/drawer";
import { usePathname, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import Logo from "@/assets/images/Logo.png";

import { AppText } from "@/components/ui";
import { spacing, radius } from "@/theme";

export interface DrawerRoute {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  path: string;
}

interface Props {
  /** The drawer props passed by expo-router/drawer */
  drawerProps: any;
  /** Brand primary color for active items */
  primaryColor: string;
  /** Display name shown in the header */
  appName: string;
  /** Subtitle under the app name */
  appSubtitle: string;
  /** Icon for the header logo area */
  appIcon: React.ComponentProps<typeof Feather>["name"];
  /** Ordered list of routes to render */
  routes: DrawerRoute[];
}

/** A single animated drawer item */
function DrawerItem({
  route,
  isActive,
  primaryColor,
  onPress,
}: {
  route: DrawerRoute;
  isActive: boolean;
  primaryColor: string;
  onPress: () => void;
}) {
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bgAnim = useMemo(() => new Animated.Value(isActive ? 1 : 0), []);

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, [bgAnim, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
      Animated.timing(bgAnim, {
        toValue: isActive ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive, bgAnim, scaleAnim]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", `${primaryColor}14`],
  });

  return (
    <Animated.View
      style={[styles.itemWrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={null}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <Animated.View
          style={[
            styles.itemInner,
            { backgroundColor: bgColor },
            isActive && styles.itemActive,
          ]}
        >
          {/* active left indicator bar */}
          {isActive && (
            <View
              style={[styles.activeBar, { backgroundColor: primaryColor }]}
            />
          )}

          {/* Icon */}
          <View
            style={[
              styles.iconWrap,
              isActive && { backgroundColor: `${primaryColor}18` },
            ]}
          >
            <Feather
              name={route.icon}
              size={18}
              color={isActive ? primaryColor : "#94A3B8"}
            />
          </View>

          {/* Label */}
          <AppText
            weight={isActive ? "700" : "600"}
            variant="body"
            color={isActive ? primaryColor : "#64748B"}
            style={styles.label}
          >
            {route.title}
          </AppText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function CustomDrawerContent({
  drawerProps,
  primaryColor,
  appName,
  appSubtitle,
  appIcon,
  routes,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DrawerContentScrollView
      {...drawerProps}
      scrollEnabled={false}
      contentContainerStyle={styles.container}
    >
      {/*  Header  */}
      <View style={[styles.header, { borderBottomColor: `${primaryColor}20` }]}>
        <View style={[styles.logoCircle, { backgroundColor: primaryColor }]}>
          <View
            style={{
              width: 66,
              height: 68,
              borderRadius: 18,
              backgroundColor: "#FFFFFF",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 18,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
              marginRight: 0,
            }}
          >
            <Image
              source={Logo}
              style={{
                width: 52,
                height: 52,
                resizeMode: "contain",
              }}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <AppText
            weight="700"
            variant="h3"
            color="#0F172A"
            style={{ marginLeft: 10 }}
          >
            {appName}
          </AppText>
          <AppText
            variant="caption"
            color="#94A3B8"
            style={{ marginTop: 1, marginLeft: 10 }}
          >
            {appSubtitle}
          </AppText>
        </View>
      </View>

      {/*  nav Items  */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.navList}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
      >
        {routes.map((route) => {
          const isActive =
            pathname === route.path || pathname.startsWith(route.path + "/");
          return (
            <DrawerItem
              key={route.name}
              route={route}
              isActive={isActive}
              primaryColor={primaryColor}
              onPress={() => {
                router.push(route.path as any);
                drawerProps.navigation.closeDrawer();
              }}
            />
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: `${primaryColor}20` }]}>
        <AppText
          variant="caption"
          color="#CBD5E1"
          style={{ textAlign: "center" }}
        >
          InfiniGoal Portal
        </AppText>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  navList: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  itemWrapper: {
    marginVertical: 2,
  },
  itemInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    overflow: "hidden",
    position: "relative",
  },
  itemActive: {},
  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.xs,
    marginRight: spacing.md,
  },
  label: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
