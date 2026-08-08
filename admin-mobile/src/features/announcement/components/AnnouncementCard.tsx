import React, { useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Button } from "@/components/ui";
import { ActionSheet, ActionSheetOption } from "@/components/common";
import { useThemeColors, radius, spacing, shadows } from "@/theme";
import { AnnouncementWithCreator } from "../announcement.types";

interface Props {
  announcement: AnnouncementWithCreator;
  onPublish?: (id: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onEdit?: (announcement: AnnouncementWithCreator) => void;
  onDelete?: (
    id: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  showActions?: boolean;
}

export default function AnnouncementCard({
  announcement,
  onPublish,
  onEdit,
  onDelete,
  showActions = true,
}: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const colors = useThemeColors();
  const [actionSheetConfig, setActionSheetConfig] = useState<{
    visible: boolean;
    title?: string;
    subtitle?: string;
    options: ActionSheetOption[];
  }>({
    visible: false,
    options: [],
  });
  const isDraft = announcement.status === "Draft";

  const getIcon = (type: string) => {
    switch (type) {
      case "Emergency":
        return "alert-triangle";
      case "Policy":
        return "clipboard";
      case "Holiday":
        return "calendar";
      case "Event":
        return "gift";
      case "Meeting":
        return "users";
      default:
        return "bell";
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "Emergency":
        return `${colors.danger}15`;
      case "Policy":
        return `${colors.warning}15`;
      case "Holiday":
        return `${colors.success}15`;
      case "Event":
        return `${colors.info}15`;
      case "Meeting":
        return `${colors.primary}15`;
      default:
        return `${colors.primary}15`;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "Emergency":
        return colors.danger;
      case "Policy":
        return colors.warning;
      case "Holiday":
        return colors.success;
      case "Event":
        return colors.info;
      case "Meeting":
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Important":
      case "Emergency":
        return colors.danger;
      case "Event":
        return colors.info;
      case "Policy":
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    setActionLoading(true);
    try {
      await onPublish(announcement.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    setActionSheetConfig({
      visible: true,
      title: "Delete Announcement",
      subtitle: "Are you sure you want to delete this announcement?",
      options: [
        {
          
          label: " Are You sure about Delete then touch",
         
          isDestructive: true,
        
          onPress: () => onDelete(announcement.id),
        },
      ],
    });
  };

  return (
    <Card
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        ...shadows.sm,
        padding: spacing.md,
        backgroundColor: colors.background,
        marginBottom: spacing.md,
      }}
    >
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.sm,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.md,
              backgroundColor: getIconBgColor(announcement.announcement_type),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name={getIcon(announcement.announcement_type) as any}
              size={18}
              color={getIconColor(announcement.announcement_type)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" }}>
              {announcement.is_pinned && (
                <AppText variant="caption" color={colors.warning} weight="700">
                  📌 Pinned
                </AppText>
              )}
              <Badge
                label={announcement.announcement_type}
                color={getTypeColor(announcement.announcement_type)}
                variant="subtle"
              />
            </View>
            <AppText weight="700" variant="body" color={colors.text} style={{ marginTop: 4 }}>
              {announcement.title}
            </AppText>
          </View>
        </View>
        <Badge
          label={announcement.status}
          color={isDraft ? colors.warning : colors.success}
        />
      </View>

      {/* MIDDLE */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <AppText
          color={colors.text}
          variant="body"
          style={{ lineHeight: 20 }}
        >
          {announcement.message}
        </AppText>
      </View>

      {/* FOOTER */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: `${colors.border}80`,
          paddingTop: spacing.sm,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="user" size={12} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary}>
            By {Array.isArray(announcement.creator) ? (announcement.creator[0]?.full_name ?? "Admin") : "Admin"}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="target" size={12} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary}>
              Audience: {announcement.target_audience}
            </AppText>
          </View>

          {announcement.created_at && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="calendar" size={12} color={colors.textSecondary} />
              <AppText variant="caption" color={colors.textSecondary}>
                {new Date(announcement.created_at).toLocaleDateString()}
              </AppText>
            </View>
          )}
        </View>
      </View>

      {/* ACTIONS */}
      {showActions && (onEdit || onDelete || onPublish) && (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {onEdit && (
              <View style={{ flex: 1 }}>
                <Button title="Edit" onPress={() => onEdit(announcement)} size="sm" />
              </View>
            )}
            {onDelete && (
              <View style={{ flex: 1 }}>
                <Button title="Delete" onPress={handleDelete} size="sm" />
              </View>
            )}
          </View>

          {isDraft && onPublish && (
            <Button
              title="Publish Announcement"
              onPress={handlePublish}
              loading={actionLoading}
              size="sm"
            />
          )}
        </View>
      )}

      <ActionSheet
        visible={actionSheetConfig.visible}
        onClose={() => setActionSheetConfig((prev) => ({ ...prev, visible: false }))}
        title={actionSheetConfig.title}
        subtitle={actionSheetConfig.subtitle}
        options={actionSheetConfig.options}
      />
    </Card>
  );
}
