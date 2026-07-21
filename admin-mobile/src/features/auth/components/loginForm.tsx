import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { loginAdmin } from "@/features/auth/auth.service";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await loginAdmin(email, password);

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      Alert.alert("Success", "Login successful.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 12,
        width: "100%",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        InfiniGoal
      </Text>

      <Text
        style={{
          textAlign: "center",
          color: "#6b7280",
          marginTop: 8,
        }}
      >
        Employee Management Portal
      </Text>

      <Text style={{ marginTop: 30, marginBottom: 8 }}>Email</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          padding: 12,
        }}
      />

      <Text style={{ marginTop: 20, marginBottom: 8 }}>Password</Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          padding: 12,
        }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 8,
          marginTop: 30,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          {loading ? "Signing In..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}