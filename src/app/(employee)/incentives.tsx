import { useState, useEffect, useCallback } from "react";
import { View, FlatList } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { Incentive } from "@/features/incentive/incentive.types";
import { getEmployeeIncentives } from "@/features/incentive/incentive.service";
import IncentiveCard from "@/features/incentive/components/IncentiveCard";

export default function EmployeeIncentivesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incentives, setIncentives] = useState<Incentive[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    await Promise.resolve();
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getEmployeeIncentives(user.id);
      setIncentives(data);
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

  const renderIncentiveItem = ({ item }: { item: Incentive }) => (
    <IncentiveCard
      incentive={item as any}
      showAvatar={false}
      showActions={false}
    />
  );

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <AppHeader title="My Incentives" subtitle="Earned performance rewards and bonuses" />

        <FlatList
          data={incentives}
          keyExtractor={(item) => item.id}
          renderItem={renderIncentiveItem}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No Incentives Recorded" />}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        />
      </View>
    </Screen>
  );
}
