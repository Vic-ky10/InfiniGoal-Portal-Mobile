import { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card, AppText, Badge, Button } from "@/components/ui";
import { adminColors, radius, spacing } from "@/theme";
import { AnnouncementWithCreator } from "../announcement.types";

interface Props {
  announcement: AnnouncementWithCreator;
  onPublish: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function AnnouncementCard({ announcement, onPublish }: Props) {
  const [actionLoading, setActionLoading] = useState(false);
  const isDraft = announcement.status === "Draft";

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Important":
        return adminColors.danger;
      case "Event":
        return adminColors.info;
      case "Policy":
        return adminColors.warning;
      default:
        return adminColors.primary;
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await onPublish(announcement.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.xs }}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs }}>
            {announcement.is_pinned && (
              <AppText variant="caption" color={adminColors.warning} weight="700">
                📌 Pinned
              </AppText>
            )}
            <Badge label={announcement.announcement_type} color={getTypeColor(announcement.announcement_type)} variant="subtle" />
          </View>

          <AppText weight="700" variant="h3">
            {announcement.title}
          </AppText>
        </View>

        <Badge
          label={announcement.status}
          color={isDraft ? adminColors.warning : adminColors.success}
        />
      </View>

      <AppText color={adminColors.text} variant="body" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
        {announcement.message}
      </AppText>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: adminColors.background,
          padding: spacing.sm,
          borderRadius: radius.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="user" size={12} color={adminColors.textSecondary} style={{ marginRight: 4 }} />
          <AppText variant="caption" color={adminColors.textSecondary}>
            By {Array.isArray(announcement.creator) ? announcement.creator[0]?.full_name ?? "Admin" : "Admin"}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="target" size={12} color={adminColors.textSecondary} style={{ marginRight: 4 }} />
          <AppText variant="caption" color={adminColors.textSecondary}>
            Target: {announcement.target_audience}
          </AppText>
        </View>
      </View>

      {isDraft && (
        <View style={{ marginTop: spacing.md }}>
          <Button
            title="Publish Announcement"
            onPress={handlePublish}
            loading={actionLoading}
          />
        </View>
      )}
    </Card>
  );
}
