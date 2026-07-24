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

  const primaryColor = isEmployee ? "#22C55E" : "#2563EB";
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

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
          backgroundColor: "#FFFFFF",
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <Feather name="arrow-left" size={18} color="#0F172A" />
        <Text
          style={{
            marginLeft: 6,
            fontSize: 14,
            fontWeight: "600",
            color: "#0F172A",
          }}
        >
          Back
        </Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: "#FFFFFF",
          padding: 28,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          elevation: 4,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.05,
          shadowRadius: 16,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: isEmployee ? "#F0FDF4" : "#EFF6FF",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isEmployee ? "#DCFCE7" : "#DBEAFE",
            }}
          >
            <Feather name="layers" size={28} color={primaryColor} />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#0F172A",
              letterSpacing: -0.5,
            }}
          >
            InfiniGoal
          </Text>

          <Text
            style={{
              color: "#64748B",
              marginTop: 6,
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            {portalTitle}
          </Text>
        </View>

        <Text
          style={{
            marginBottom: 6,
            fontWeight: "600",
            fontSize: 13,
            color: "#64748B",
          }}
        >
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          style={{
            borderWidth: 1.5,
            borderColor: emailFocused ? primaryColor : "#E2E8F0",
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            marginBottom: 20,
          }}
        />

        <Text
          style={{
            marginBottom: 6,
            fontWeight: "600",
            fontSize: 13,
            color: "#64748B",
          }}
        >
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          onFocus={() => setPassFocused(true)}
          onBlur={() => setPassFocused(false)}
          style={{
            borderWidth: 1.5,
            borderColor: passFocused ? primaryColor : "#E2E8F0",
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            marginTop: 32,
            backgroundColor: primaryColor,
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
            shadowColor: primaryColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 2,
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
            {loading ? "Signing In..." : `Sign In`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}