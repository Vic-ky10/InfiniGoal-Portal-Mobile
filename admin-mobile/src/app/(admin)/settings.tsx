import { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, Modal, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { AppText, Screen, Card, Button, Avatar, Badge, Input } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { adminColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";
import { logout } from "@/features/auth/auth.service";
import { updateSelfProfile } from "@/features/employee/employee.service";
import { uploadAvatar } from "@/lib/storage/uploadAvatar";
import { toast } from "@/store/toast.store";

interface ProfileData {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  role: string | null;
  avatar_url: string | null;
  status: string | null;
  is_online: boolean | null;
  last_login: string | null;
  joined_date: string | null;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadProfile = useCallback(async () => {
    await Promise.resolve();
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select(
          "id, employee_id, full_name, email, phone, department, designation, role, avatar_url, status, is_online, last_login, joined_date"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        const profileData = data as ProfileData;
        setProfile(profileData);
        setEditName(profileData.full_name || "");
        setEditPhone(profileData.phone || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadProfile();
    });
  }, [loadProfile]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/");
    } catch {
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    if (!editName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateSelfProfile(
        profile.id,
        editName.trim(),
        editPhone.trim() || null,
        profile.avatar_url
      );

      if (!res.success) {
        throw new Error(res.error || "Update failed.");
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editName.trim(),
              phone: editPhone.trim() || null,
            }
          : null
      );
      setIsEditModalOpen(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAvatar = async () => {
    if (!profile) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        toast.error(
          "Permission to access camera roll is required to update photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setUploading(true);
      const selectedUri = result.assets[0].uri;

      // Upload to Supabase Storage
      const publicUrl = await uploadAvatar({
        userId: profile.id,
        imageUri: selectedUri,
      });

      // Update profile table
      const dbRes = await updateSelfProfile(
        profile.id,
        profile.full_name,
        profile.phone,
        publicUrl
      );

      if (!dbRes.success) {
        throw new Error(dbRes.error ?? "Failed to update profile.");
      }

      // refresh UI after seting the profile 
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: publicUrl,
            }
          : null
      );

      toast.success("Profile picture updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen isLoading={loading}>
      <View style={{ gap: spacing.lg }}>
       <AppHeader
    title="Administrator Profile"
    subtitle="Manage your administrator account"
/>

        {/* Section 1: Administrator Profile Card */}
        <Card
          style={{
            alignItems: "center",
            paddingVertical: spacing.xl,
            borderWidth: 1,
            borderColor: adminColors.border,
            overflow: "hidden",
            position: "relative",
            ...shadows.sm,
          }}
        >
          {/* Subtle Accent Background Banner */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 70,
              backgroundColor: `${adminColors.primary}10`,
            }}
          />

          <View style={{ position: "relative", marginTop: 16 }}>
            <TouchableOpacity onPress={handleSelectAvatar} disabled={uploading}>
              <Avatar
                name={profile?.full_name ?? "Administrator"}
                size={96}
                uri={profile?.avatar_url}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSelectAvatar}
              disabled={uploading}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: adminColors.primary,
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                ...shadows.sm,
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <AppText weight="700" variant="h2" style={{ marginTop: spacing.md, textAlign: "center" }}>
            {profile?.full_name ?? "Admin User"}
          </AppText>
          <AppText
            variant="body"
            color={adminColors.textSecondary}
            style={{ marginTop: 2, textAlign: "center" }}
          >
            {profile?.designation ?? "Administrator"}
          </AppText>

          <View
            style={{
              marginTop: spacing.sm,
              flexDirection: "row",
              gap: spacing.xs,
              justifyContent: "center",
            }}
          >
            <Badge label={profile?.role ?? "Super Admin"} color={adminColors.primary} />
            <Badge
              label={profile?.status ?? "Active"}
              color={
                profile?.status?.toLowerCase() === "active" || !profile?.status
                  ? adminColors.success
                  : adminColors.danger
              }
              variant="subtle"
            />
          </View>
        </Card>

      
        {/* Section 3: Administrator Information */}
        <Card style={{ gap: spacing.md, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.xs,
            }}
          >
            <AppText variant="h3" weight="700">
              Administrator Information
            </AppText>
            <TouchableOpacity
              onPress={() => setIsEditModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: `${adminColors.primary}10`,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 14,
              }}
            >
              <Feather name="edit-2" size={12} color={adminColors.primary} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={adminColors.primary} weight="600">
                Edit
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Employee ID */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="hash" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Employee ID
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.employee_id ?? "--"}
            </AppText>
          </View>

          {/* Email */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="mail" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Email
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.email ?? "--"}
            </AppText>
          </View>

          {/* Phone */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="phone" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Phone
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.phone ?? "--"}
            </AppText>
          </View>

          {/* Department */}
          {/* <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather
                name="briefcase"
                size={16}
                color={adminColors.primary}
                style={{ marginRight: spacing.md }}
              />
              <AppText weight="600" color={adminColors.textSecondary}>
                Department
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.department ?? "--"}
            </AppText>
          </View> */}

          {/* Designation */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="award" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Designation
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.designation ?? "--"}
            </AppText>
          </View>

          {/* Joined Date */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather
                name="calendar"
                size={16}
                color={adminColors.primary}
                style={{ marginRight: spacing.md }}
              />
              <AppText weight="600" color={adminColors.textSecondary}>
                Joined Date
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.joined_date ? new Date(profile.joined_date).toLocaleDateString() : "--"}
            </AppText>
          </View>
        </Card>

        {/* Section 4: Account Information */}
        <Card style={{ gap: spacing.md, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm }}>
          <AppText variant="h3" weight="700" style={{ marginBottom: spacing.xs }}>
            Account Information
          </AppText>

          {/* Role */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="shield" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Role
              </AppText>
            </View>
            <Badge label={profile?.role ?? "Admin"} color={adminColors.primary} variant="subtle" />
          </View>

          {/* Status */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="activity" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Status
              </AppText>
            </View>
            <Badge
              label={profile?.status ?? "Active"}
              color={
                profile?.status?.toLowerCase() === "active" || !profile?.status
                  ? adminColors.success
                  : adminColors.danger
              }
              variant="solid"
            />
          </View>


          {/* Last Login */}
          {/* <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="clock" size={16} color={adminColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={adminColors.textSecondary}>
                Last Login
              </AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.last_login ? new Date(profile.last_login).toLocaleString() : "--"}
            </AppText>
          </View> */}
        </Card>

        {/* Sign Out Section */}
        <TouchableOpacity
          disabled={loggingOut}
          onPress={handleLogout}
          style={{
            backgroundColor: "#EF44440F",
            borderWidth: 1.5,
            borderColor: "#EF444433",
            borderRadius: radius.md,
            paddingVertical: spacing.lg,
            alignItems: "center",
            marginTop: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="log-out" size={18} color="#EF4444" style={{ marginRight: spacing.sm }} />
            <AppText weight="700" color="#EF4444">
              {loggingOut ? "Signing Out..." : "Sign Out of Account"}
            </AppText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Bottom Sheet Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <AppText variant="h2" weight="700">
                    Edit Profile Details
                  </AppText>
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                    <Feather name="x" size={24} color={adminColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Input
                  label="Full Name"
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your full name"
                />

                <Input
                  label="Phone Number"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Your phone number"
                  keyboardType="phone-pad"
                />

                <View
                  style={{
                    flexDirection: "row",
                    gap: spacing.md,
                    marginTop: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Button title="Cancel" variant="outline" onPress={() => setIsEditModalOpen(false)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Save Changes" loading={saving} onPress={handleUpdateProfile} />
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}