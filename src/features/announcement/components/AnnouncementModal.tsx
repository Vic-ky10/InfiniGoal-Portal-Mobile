import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AppText, Button, Input } from "@/components/ui";

import { adminColors, radius, spacing } from "@/theme";

import {
  Announcement,
  AnnouncementWithCreator,
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_TYPE,
  TARGET_AUDIENCE,
} from "../announcement.types";

import {
  createAnnouncement,
  updateAnnouncement,
  getAuthenticatedProfileId,
} from "../announcement.service";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcementToEdit?: AnnouncementWithCreator | null;
}

const ANNOUNCEMENT_TYPES = [
  ANNOUNCEMENT_TYPE.GENERAL,
  ANNOUNCEMENT_TYPE.HOLIDAY,
  ANNOUNCEMENT_TYPE.EVENT,
  ANNOUNCEMENT_TYPE.MEETING,
  ANNOUNCEMENT_TYPE.POLICY,
  ANNOUNCEMENT_TYPE.EMERGENCY,
] as const;

const TARGET_AUDIENCE_OPTIONS = [
  TARGET_AUDIENCE.EVERYONE,
  TARGET_AUDIENCE.ADMIN,
  TARGET_AUDIENCE.EMPLOYEE,
  TARGET_AUDIENCE.DEPARTMENT,
] as const;

const STATUS_OPTIONS = [
  ANNOUNCEMENT_STATUS.DRAFT,
  ANNOUNCEMENT_STATUS.PUBLISHED,
  ANNOUNCEMENT_STATUS.ARCHIVED,
] as const;

export default function AnnouncementModal({
  visible,
  onClose,
  onSuccess,
  announcementToEdit,
}: Props) {
  const [title, setTitle] = useState("");

  const [message, setMessage] = useState("");

  const [announcementType, setAnnouncementType] = useState<
    Announcement["announcement_type"]
  >(ANNOUNCEMENT_TYPE.GENERAL);

  const [targetAudience, setTargetAudience] = useState<
    Announcement["target_audience"]
  >(TARGET_AUDIENCE.EVERYONE);

  const [department, setDepartment] = useState("");

  const [status, setStatus] = useState<Announcement["status"]>(
    ANNOUNCEMENT_STATUS.DRAFT,
  );

  const [publishAt, setPublishAt] = useState("");

  const [expiresAt, setExpiresAt] = useState("");

  const [isPinned, setIsPinned] = useState(false);

  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");

    setMessage("");

    setAnnouncementType(ANNOUNCEMENT_TYPE.GENERAL);

    setTargetAudience(TARGET_AUDIENCE.EVERYONE);

    setDepartment("");

    setStatus(ANNOUNCEMENT_STATUS.DRAFT);

    setPublishAt("");

    setExpiresAt("");

    setIsPinned(false);
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!visible) return;

    if (announcementToEdit) {
      setTitle(announcementToEdit.title);

      setMessage(announcementToEdit.message);

      setAnnouncementType(announcementToEdit.announcement_type);

      setTargetAudience(announcementToEdit.target_audience);

      setDepartment(announcementToEdit.department ?? "");

      setStatus(announcementToEdit.status);

      setPublishAt(announcementToEdit.publish_at ?? "");

      setExpiresAt(announcementToEdit.expires_at ?? "");

      setIsPinned(announcementToEdit.is_pinned);
    } else {
      resetForm();
    }
  }, [visible, announcementToEdit]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required.");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Validation", "Message is required.");
      return;
    }

    if (targetAudience === TARGET_AUDIENCE.DEPARTMENT && !department.trim()) {
      Alert.alert("Validation", "Department is required.");
      return;
    }

    setLoading(true);

    try {
      const values = {
        title: title.trim(),

        message: message.trim(),

        announcement_type: announcementType,

        target_audience: targetAudience,

        department:
          targetAudience === TARGET_AUDIENCE.DEPARTMENT
            ? department.trim()
            : undefined,

        attachment_url: "",

        status,

        is_pinned: isPinned,

        publish_at: publishAt.trim() || undefined,

        expires_at: expiresAt.trim() || undefined,
      };

      let result;

      if (announcementToEdit) {
        result = await updateAnnouncement(announcementToEdit.id, values);
      } else {
        const profileId = await getAuthenticatedProfileId();

        if (!profileId) {
          Alert.alert("Authentication", "Unable to identify current user.");
          return;
        }

        result = await createAnnouncement(profileId, values);
      }

      if (!result.success) {
        Alert.alert("Error", result.error ?? "Something went wrong.");
        return;
      }

      Alert.alert("Success", result.message);

      resetForm();

      onSuccess();

      onClose();
    } catch (error) {
      console.error(error);

      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: adminColors.background,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.lg,
            maxHeight: "90%",
          }}
        >
          {/* Header */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.lg,
            }}
          >
            <AppText variant="h2" weight="700">
              {announcementToEdit ? "Edit Announcement" : "Create Announcement"}
            </AppText>

            <TouchableOpacity onPress={closeModal}>
              <Feather name="x" size={24} color={adminColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Title"
              placeholder="Enter title"
              value={title}
              onChangeText={setTitle}
            />

            <Input
              label="Message"
              placeholder="Enter announcement"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              style={{
                height: 120,
                textAlignVertical: "top",
                paddingTop: spacing.md,
              }}
            />

            <AppText
              weight="600"
              style={{
                marginBottom: spacing.sm,
              }}
            >
              Announcement Type
            </AppText>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              {ANNOUNCEMENT_TYPES.map((type) => {
                const selected = announcementType === type;

                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setAnnouncementType(type)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected
                        ? adminColors.primary
                        : adminColors.border,
                      backgroundColor: selected
                        ? adminColors.primary
                        : adminColors.surface,
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="600"
                      color={selected ? "#fff" : adminColors.textSecondary}
                    >
                      {type}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppText
              weight="600"
              style={{
                marginBottom: spacing.sm,
              }}
            >
              Target Audience
            </AppText>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              {TARGET_AUDIENCE_OPTIONS.map((item) => {
                const selected = targetAudience === item;

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setTargetAudience(item)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected
                        ? adminColors.primary
                        : adminColors.border,
                      backgroundColor: selected
                        ? adminColors.primary
                        : adminColors.surface,
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="600"
                      color={selected ? "#fff" : adminColors.textSecondary}
                    >
                      {item}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {targetAudience === TARGET_AUDIENCE.DEPARTMENT && (
              <Input
                label="Department"
                placeholder="Enter department"
                value={department}
                onChangeText={setDepartment}
              />
            )}

            <AppText
              weight="600"
              style={{
                marginBottom: spacing.sm,
              }}
            >
              Status
            </AppText>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              {STATUS_OPTIONS.map((item) => {
                const selected = status === item;

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setStatus(item)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected
                        ? adminColors.primary
                        : adminColors.border,
                      backgroundColor: selected
                        ? adminColors.primary
                        : adminColors.surface,
                    }}
                  >
                    <AppText
                      variant="caption"
                      weight="600"
                      color={selected ? "#fff" : adminColors.textSecondary}
                    >
                      {item}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Publish At"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={publishAt}
              onChangeText={setPublishAt}
            />

            <Input
              label="Expires At"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={expiresAt}
              onChangeText={setExpiresAt}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.xl,
              }}
            >
              <AppText weight="600">Pin Announcement</AppText>

              <Switch
                value={isPinned}
                onValueChange={setIsPinned}
                trackColor={{
                  false: adminColors.border,
                  true: adminColors.primary,
                }}
              />
            </View>

            <Button
              title={
                announcementToEdit
                  ? "Update Announcement"
                  : "Create Announcement"
              }
              onPress={handleSubmit}
              loading={loading}
            />

            <View
              style={{
                height: spacing.lg,
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
