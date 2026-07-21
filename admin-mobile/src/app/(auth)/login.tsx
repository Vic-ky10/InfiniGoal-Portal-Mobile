import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { loginAdmin, loginEmployee } from "@/features/auth/auth.service";

export default function LoginScreen() {
  const router = useRouter();
  const { portal } = useLocalSearchParams<{ portal?: string }>();

  const isEmployee = portal === "employee";
  const portalTitle = isEmployee ? "Employee Portal" : "Admin Portal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const loginFn = isEmployee ? loginEmployee : loginAdmin;
      const { error } = await loginFn(email.trim(), password);

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      if (isEmployee) {
        router.replace("/(employee)/dashboard");
      } else {
        router.replace("/(admin)/dashboard");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#F8FAFC",
      }}
    >
      <TouchableOpacity
        onPress={() => router.replace("/")}
        style={{
          position: "absolute",
          top: 60,
          left: 24,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Feather name="arrow-left" size={22} color="#1E293B" />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16,
            fontWeight: "600",
            color: "#1E293B",
          }}
        >
          Back
        </Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: "#FFFFFF",
          padding: 24,
          borderRadius: 16,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            textAlign: "center",
            color: "#2563EB",
          }}
        >
          InfiniGoal
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "#64748B",
            marginTop: 6,
            marginBottom: 28,
            fontWeight: "600",
            fontSize: 15,
          }}
        >
          {portalTitle}
        </Text>

        <Text
          style={{
            marginBottom: 8,
            fontWeight: "600",
            color: "#334155",
          }}
        >
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 10,
            padding: 14,
            fontSize: 16,
          }}
        />

        <Text
          style={{
            marginTop: 20,
            marginBottom: 8,
            fontWeight: "600",
            color: "#334155",
          }}
        >
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 10,
            padding: 14,
            fontSize: 16,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            marginTop: 32,
            backgroundColor: "#2563EB",
            paddingVertical: 15,
            borderRadius: 10,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              textAlign: "center",
              fontWeight: "700",
              fontSize: 16,
            }}
          >
            {loading ? "Signing In..." : `Login to ${portalTitle}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}