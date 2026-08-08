import { View, FlatList, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { Feather } from "@expo/vector-icons";
import AnnouncementModal from "@/features/announcement/components/AnnouncementModal";
import { AnnouncementWithCreator } from "@/features/announcement/announcement.types";
import { AppText, Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementCard from "@/features/announcement/components/AnnouncementCard";
import AnnouncementFilterBar, { AnnouncementUiFilters } from "@/features/announcement/components/AnnouncementFilterBar";

export default function AnnouncementsScreen() {
  const [filters, setFilters] = useState<AnnouncementUiFilters>({});
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementWithCreator | null>(null);

  const {
    announcements,
    loading,
    refreshing,
    refresh,
    handlePublish,
    handleDelete,
  } = useAnnouncements();

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
        // e.g. YYYY-MM-DD
        if (!item.publish_at?.startsWith(filters.date)) return false;
      }
      if (filters.month) {
        // e.g. YYYY-MM
        if (!item.publish_at?.startsWith(filters.month)) return false;
      }
      if (filters.year) {
        // e.g. YYYY
        if (!item.publish_at?.startsWith(filters.year)) return false;
      }

      return true;
    });
  }, [announcements, filters]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader
          title="Announcements"
          subtitle="Company broadcasts & news"
          rightComponent={
            <TouchableOpacity
              onPress={() => {
                setSelectedAnnouncement(null);
                setModalVisible(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: adminColors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.md,
                gap: 4,
              }}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <AppText variant="caption" weight="700" color="#FFFFFF">
                New
              </AppText>
            </TouchableOpacity>
          }
        />

      
        <AnnouncementFilterBar filters={filters} onFiltersChange={setFilters} isAdmin />

       
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            gap: spacing.md,
            paddingBottom: spacing.xl,
            flexGrow: filteredAnnouncements.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={<EmptyState title="No announcements found." />}
          renderItem={({ item }) => (
            <AnnouncementCard
              announcement={item}
              onPublish={handlePublish}
              onDelete={handleDelete}
              onEdit={(ann) => {
                setSelectedAnnouncement(ann);
                setModalVisible(true);
              }}
            />
          )}
        />
      </View>

      <AnnouncementModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={refresh}
        announcementToEdit={selectedAnnouncement}
      />
    </Screen>
  );
}
