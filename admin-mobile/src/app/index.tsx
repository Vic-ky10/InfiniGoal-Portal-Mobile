import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 28,
        }}
      >
        {/* Company Logo Placeholder */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            backgroundColor: "#EFF6FF",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#DBEAFE",
          }}
        >
          <Feather name="layers" size={44} color="#2563EB" />
        </View>

        {/* Header Title & Subtitle */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#1E293B",
            textAlign: "center",
            letterSpacing: -0.5,
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
            marginTop: 8,
            marginBottom: 48,
          }}
        >
          Employee Management System
        </Text>

        {/* Portal Action Buttons */}
        <View style={{ width: "100%", gap: 16 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { portal: "admin" },
              })
            }
            style={{
              backgroundColor: "#2563EB",
              paddingVertical: 18,
              borderRadius: 14,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Feather
              name="shield"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Login to Admin Portal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/(auth)/login",
                params: { portal: "employee" },
              })
            }
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 2,
              borderColor: "#2563EB",
              paddingVertical: 18,
              borderRadius: 14,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather
              name="user"
              size={20}
              color="#2563EB"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: "#2563EB",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Login to Employee Portal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}