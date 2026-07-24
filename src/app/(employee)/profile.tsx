import { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { AppText, Screen, Card, Avatar, Badge, Button, Input } from "@/components/ui";
import { AppHeader } from "@/components/common";
import { employeeColors, radius, spacing, shadows } from "@/theme";
import { supabase } from "@/lib/supabase/client";
import { logout } from "@/features/auth/auth.service";
import { updateSelfProfile } from "@/features/employee/employee.service";
import { getEmployeeLeaveRequests } from "@/features/leave/leave.service";
import { getEmployeeProjects } from "@/features/project/project.service";
import { getEmployeeTasks } from "@/features/task/task.service";

interface ProfileData {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  joined_date: string | null;
  avatar_url: string | null;
}

export default function EmployeeProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Statistics
  const [projectCount, setProjectCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);

  // Editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("id, employee_id, full_name, email, phone, department, designation, joined_date, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        const profileData = data as ProfileData;
        setProfile(profileData);
        setEditName(profileData.full_name || "");
        setEditPhone(profileData.phone || "");

        // Load stats in parallel
        const [projects, leaves, tasks] = await Promise.all([
          getEmployeeProjects(user.id),
          getEmployeeLeaveRequests(user.id),
          getEmployeeTasks(user.id),
        ]);

        setProjectCount(projects.length);
        setPendingLeaves(leaves.filter((l) => l.status === "Pending").length);
        setActiveTasks(tasks.filter((t) => t.status !== "Completed").length);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/");
    } catch {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    if (!editName.trim()) {
      Alert.alert("Validation", "Name cannot be empty.");
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
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert(
        "Update Error",
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const removeOldAvatars = async (userId: string) => {
    const { data: files } = await supabase.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(paths);
    }
  };

  const handleSelectAvatar = async () => {
    if (!profile) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required to update photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setUploading(true);
      const selectedUri = result.assets[0].uri;

      // Extract details
      const fileExt = selectedUri.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // Fetch file blob from URI
      const response = await fetch(selectedUri);
      const blob = await response.blob();

      // Clean old avatars
      await removeOldAvatars(profile.id);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update database profile
      const dbRes = await updateSelfProfile(
        profile.id,
        profile.full_name,
        profile.phone,
        publicUrl
      );

      if (!dbRes.success) {
        throw new Error(dbRes.error || "Failed to update profile record.");
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      Alert.alert("Success", "Profile picture updated successfully.");
    } catch (error) {
      Alert.alert(
        "Upload Error",
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen isLoading={loading}>
      <View style={{ gap: spacing.lg }}>
        <AppHeader title="My Profile" subtitle="Your account & employee details" />

        {/* Premium Profile Header Card */}
        <Card
          style={{
            alignItems: "center",
            paddingVertical: spacing.xl,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Accent Background Banner inside Card */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 70,
              backgroundColor: `${employeeColors.primary}10`,
            }}
          />

          <View style={{ position: "relative", marginTop: 16 }}>
            <Avatar name={profile?.full_name ?? "Employee"} size={96} uri={profile?.avatar_url} />
            <TouchableOpacity
              onPress={handleSelectAvatar}
              disabled={uploading}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: employeeColors.primary,
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
            {profile?.full_name ?? "Employee User"}
          </AppText>
          <AppText variant="body" color={employeeColors.textSecondary} style={{ marginTop: 2, textAlign: "center" }}>
            {profile?.designation ?? "Team Member"}
          </AppText>

          <View style={{ marginTop: spacing.sm, flexDirection: "row", gap: spacing.xs, justifyContent: "center" }}>
            <Badge label={profile?.employee_id ?? "EMP"} color={employeeColors.primary} />
            <Badge label="Active" color={employeeColors.success} variant="subtle" />
          </View>
        </Card>

        {/* Statistics Grid */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Card style={{ flex: 1, alignItems: "center", paddingVertical: spacing.md }}>
            <Feather name="folder" size={20} color={employeeColors.primary} style={{ marginBottom: spacing.xs }} />
            <AppText variant="h3" weight="700">
              {projectCount}
            </AppText>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              Projects
            </AppText>
          </Card>

          <Card style={{ flex: 1, alignItems: "center", paddingVertical: spacing.md }}>
            <Feather name="calendar" size={20} color="#F59E0B" style={{ marginBottom: spacing.xs }} />
            <AppText variant="h3" weight="700">
              {pendingLeaves}
            </AppText>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              Pending Leaves
            </AppText>
          </Card>

          <Card style={{ flex: 1, alignItems: "center", paddingVertical: spacing.md }}>
            <Feather name="check-square" size={20} color="#3B82F6" style={{ marginBottom: spacing.xs }} />
            <AppText variant="h3" weight="700">
              {activeTasks}
            </AppText>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              Active Tasks
            </AppText>
          </Card>
        </View>

        {/* Details Card */}
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs }}>
            <AppText variant="h3" weight="700">
              Personal Information
            </AppText>
            <TouchableOpacity
              onPress={() => setIsEditModalOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: `${employeeColors.primary}10`,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 14,
              }}
            >
              <Feather name="edit-2" size={12} color={employeeColors.primary} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={employeeColors.primary} weight="600">
                Edit
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="mail" size={16} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={employeeColors.textSecondary}>Email</AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.email ?? "--"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="phone" size={16} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={employeeColors.textSecondary}>Phone</AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.phone ?? "--"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="briefcase" size={16} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={employeeColors.textSecondary}>Department</AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.department ?? "--"}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="calendar" size={16} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600" color={employeeColors.textSecondary}>Joined Date</AppText>
            </View>
            <AppText variant="body" weight="500">
              {profile?.joined_date ? new Date(profile.joined_date).toLocaleDateString() : "--"}
            </AppText>
          </View>
        </Card>

        {/* Settings Card */}
        <Card style={{ gap: spacing.md }}>
          <AppText variant="h3" weight="700" style={{ marginBottom: spacing.xs }}>
            Account Settings
          </AppText>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="bell" size={16} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600">Notifications</AppText>
            </View>
            <Badge label="Enabled" color={employeeColors.success} variant="subtle" />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="shield" size={16} color={employeeColors.primary} style={{ marginRight: spacing.md }} />
              <AppText weight="600">Security & PIN</AppText>
            </View>
            <Feather name="chevron-right" size={16} color={employeeColors.textSecondary} />
          </View>
        </Card>

        {/* Sign Out Button */}
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

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
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
              gap: 20,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText variant="h2" weight="700">
                Edit Profile Details
              </AppText>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Feather name="x" size={24} color={employeeColors.textSecondary} />
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

            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsEditModalOpen(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Save Changes"
                  loading={saving}
                  onPress={handleUpdateProfile}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
