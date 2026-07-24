import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useThemeStore } from "@/store";

export default function HomeScreen() {
  const router = useRouter();
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 28,
        }}
      >
        {/* Company Logo Container */}
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 28,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Feather name="layers" size={48} color="#2563EB" />
        </View>

        {/* Header Title & Subtitle */}
        <Text
          style={{
            fontSize: 34,
            fontWeight: "800",
            color: "#0F172A",
            textAlign: "center",
            letterSpacing: -0.8,
          }}
        >
          InfiniGoal Portal
        </Text>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: "#64748B",
            textAlign: "center",
            marginTop: 10,
            marginBottom: 56,
            lineHeight: 22,
          }}
        >
          Premium Employee Hub & Management
        </Text>

        {/* Portal Action Cards */}
        <View style={{ width: "100%", gap: 16 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setMode("admin");
              router.push({
                pathname: "/(auth)/login",
                params: { portal: "admin" },
              });
            }}
            style={{
              backgroundColor: "#2563EB",
              paddingVertical: 20,
              paddingHorizontal: 24,
              borderRadius: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Feather name="shield" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Admin Portal
                </Text>
                <Text style={{ color: "#BFDBFE", fontSize: 13, marginTop: 2 }}>
                  System management center
                </Text>
              </View>
            </View>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setMode("employee");
              router.push({
                pathname: "/(auth)/login",
                params: { portal: "employee" },
              });
            }}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1.5,
              borderColor: "#E2E8F0",
              paddingVertical: 20,
              paddingHorizontal: 24,
              borderRadius: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: "#F0FDF4",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Feather name="user" size={20} color="#22C55E" />
              </View>
              <View>
                <Text
                  style={{
                    color: "#0F172A",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Employee Portal
                </Text>
                <Text style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>
                  Clock-in, leaves & projects
                </Text>
              </View>
            </View>
            <Feather name="arrow-right" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}