import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { loginAdmin } from "@/features/auth/auth.service";

export default function LoginScreen() {
  const router = useRouter();

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

    const { error } = await loginAdmin(
      email.trim(),
      password
    );

    if (error) {
      Alert.alert("Login Failed", error.message);
      return;
    }

    router.replace("/(admin)/dashboard");
  } catch (error) {
    Alert.alert(
      "Error",
      error instanceof Error
        ? error.message
        : "Something went wrong."
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
      <View
        style={{
          backgroundColor: "#FFFFFF",
          padding: 24,
          borderRadius: 16,
          elevation: 4,
        }}
      >
        <Text
          style={{
            fontSize: 30,
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
            marginTop: 8,
            marginBottom: 32,
          }}
        >
          Employee Management Portal
        </Text>

        <Text
          style={{
            marginBottom: 8,
            fontWeight: "600",
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
          }}
        />

        <Text
          style={{
            marginTop: 20,
            marginBottom: 8,
            fontWeight: "600",
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
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
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
            {loading ? "Signing In..." : "Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}