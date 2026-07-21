import { useCallback, useEffect, useState } from "react";
import { AnnouncementWithCreator } from "../announcement.types";
import {
  deleteAnnouncement,
  getAnnouncements,
  publishAnnouncement,
} from "../announcement.service";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getAnnouncements();
      setAnnouncements(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePublish = async (id: string) => {
    const result = await publishAnnouncement(id);
    if (result.success) {
      fetchAnnouncements(true);
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAnnouncement(id);
    if (result.success) {
      fetchAnnouncements(true);
    }
    return result;
  };

  return {
    announcements,
    loading,
    refreshing,
    refresh: () => fetchAnnouncements(true),
    handlePublish,
    handleDelete,
  };
}
