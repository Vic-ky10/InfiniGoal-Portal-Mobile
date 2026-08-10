import { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList } from "react-native";

import { Screen } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { Incentive } from "@/features/incentive/incentive.types";
import { getEmployeeIncentives } from "@/features/incentive/incentive.service";
import IncentiveCard from "@/features/incentive/components/IncentiveCard";
import IncentiveFilterBar, { IncentiveUiFilters } from "@/features/incentive/components/IncentiveFilterBar";

export default function EmployeeIncentivesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [filters, setFilters] = useState<IncentiveUiFilters>({});

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

  const filteredIncentives = useMemo(() => {
    return incentives.filter((inc) => {
      // Search matches Title, Code
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesSearch =
          inc.title.toLowerCase().includes(s) ||
          inc.incentive_code.toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      // Type
      if (filters.type && inc.incentive_type !== filters.type) return false;

      // Status
      if (filters.status && inc.status !== filters.status) return false;

      // Payment Status
      if (filters.paymentStatus && inc.payment_status !== filters.paymentStatus) return false;

      if (filters.date) {
        const [y, m] = filters.date.split("-").map(Number);
        if (inc.year !== y || inc.month !== m) return false;
      }
      if (filters.month) {
        const [y, m] = filters.month.split("-").map(Number);
        if (inc.year !== y || inc.month !== m) return false;
      }
      if (filters.year) {
        const y = Number(filters.year);
        if (inc.year !== y) return false;
      }

      return true;
    });
  }, [incentives, filters]);

  const renderIncentiveItem = ({ item }: { item: Incentive }) => (
    <IncentiveCard
      incentive={item as any}
      showAvatar={false}
      showActions={false}
    />
  );

  return (
    <Screen isLoading={loading} scroll={false}>
      <View style={{ flex: 1, }}>
        <AppHeader title="My Incentives" subtitle="Earned performance rewards and bonuses" />

        
        <IncentiveFilterBar filters={filters} onFiltersChange={setFilters} />

        <FlatList
          data={filteredIncentives}
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
