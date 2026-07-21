import { useState, useEffect, useCallback } from "react";
import { View, FlatList } from "react-native";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, spacing } from "@/theme";

import { AnnouncementWithCreator } from "@/features/announcement/announcement.types";
import { getAnnouncements } from "@/features/announcement/announcement.service";

export default function EmployeeAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementWithCreator[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderAnnouncementItem = ({ item }: { item: AnnouncementWithCreator }) => {
    const creatorName = Array.isArray(item.creator)
      ? item.creator[0]?.full_name
      : (item.creator as any)?.full_name;

    return (
      <Card style={{ marginBottom: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Badge label={item.announcement_type} color={employeeColors.primary} variant="subtle" />
            {item.is_pinned && <Badge label="Pinned" color={employeeColors.warning} />}
          </View>

          <AppText weight="700" variant="h3" style={{ marginTop: spacing.xs }}>
            {item.title}
          </AppText>

          <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.xs, lineHeight: 22 }}>
            {item.message}
          </AppText>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              By: {creatorName ?? "Management"}
            </AppText>
            <AppText variant="caption" color={employeeColors.textSecondary}>
              {new Date(item.created_at).toLocaleDateString()}
            </AppText>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Announcements" subtitle="Company news & updates" />

        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderAnnouncementItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Announcements Found" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
