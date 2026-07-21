
import { View, FlatList, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import AnnouncementModal from "@/features/announcement/components/AnnouncementModal";
import { AnnouncementWithCreator } from "@/features/announcement/announcement.types";
import { AppText, Screen } from "@/components/ui";
import { AppHeader, SearchBar, EmptyState } from "@/components/common";
import { adminColors, radius, spacing } from "@/theme";

import { useAnnouncements } from "@/features/announcement/hooks/useAnnouncements";
import AnnouncementCard from "@/features/announcement/components/AnnouncementCard";

const STATUS_FILTERS = ["All", "Published", "Draft"];

export default function AnnouncementsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.announcement_type
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [announcements, searchQuery, statusFilter]);

  return (
    <Screen
      scroll={false}
      isLoading={loading}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="Announcements" subtitle="Company broadcasts & news" />

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Status Filters */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {STATUS_FILTERS.map((status) => {
            const isSelected = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: isSelected
                    ? adminColors.primary
                    : adminColors.surface,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? adminColors.primary
                    : adminColors.border,
                }}
              >
                <AppText
                  variant="caption"
                  weight="600"
                  color={isSelected ? "#FFFFFF" : adminColors.textSecondary}
                >
                  {status}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => {
            setSelectedAnnouncement(null);
            setModalVisible(true);
          }}
          style={{
            backgroundColor: adminColors.primary,
            paddingVertical: spacing.md,
            borderRadius: radius.md,
            alignItems: "center",
          }}
        >
          <AppText color="#FFFFFF" weight="700">
            + Create Announcement
          </AppText>
        </TouchableOpacity>

        {/* Announcements List */}
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
              onEdit={(announcement) => {
                setSelectedAnnouncement(announcement);
                setModalVisible(true);
              }}
            />
          )}
        />

        <AnnouncementModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedAnnouncement(null);
          }}
          onSuccess={refresh}
          announcementToEdit={selectedAnnouncement}
        />
      </View>
    </Screen>
  );
}
