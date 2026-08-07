import { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { spacing } from "@/theme";

import { AnnouncementWithCreator } from "@/features/announcement/announcement.types";
import { getAnnouncements } from "@/features/announcement/announcement.service";
import AnnouncementCard from "@/features/announcement/components/AnnouncementCard";
import AnnouncementFilterBar, { AnnouncementUiFilters } from "@/features/announcement/components/AnnouncementFilterBar";

export default function EmployeeAnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementWithCreator[]>([]);
  const [filters, setFilters] = useState<AnnouncementUiFilters>({});

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
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
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Search matches Title, Message, Category
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(s) ||
          item.message.toLowerCase().includes(s) ||
          item.announcement_type.toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      // Category
      if (filters.category && item.announcement_type !== filters.category) return false;

      // Status
      if (filters.status && item.status !== filters.status) return false;

      // Date / Month / Year
      if (filters.date) {
        if (!item.publish_at?.startsWith(filters.date)) return false;
      }
      if (filters.month) {
        if (!item.publish_at?.startsWith(filters.month)) return false;
      }
      if (filters.year) {
        if (!item.publish_at?.startsWith(filters.year)) return false;
      }

      return true;
    });
  }, [announcements, filters]);

  const renderAnnouncementItem = ({ item }: { item: AnnouncementWithCreator }) => {
    return <AnnouncementCard announcement={item} showActions={false} />;
  };

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Announcements" subtitle="Company news & updates" />

        {/* Enhanced Announcement Filter Bar */}
        <AnnouncementFilterBar filters={filters} onFiltersChange={setFilters} />

        <FlatList
          data={filteredAnnouncements}
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
