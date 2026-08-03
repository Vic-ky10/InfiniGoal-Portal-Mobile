import { useState, useEffect, useCallback } from "react";
import { View, FlatList } from "react-native";

import { AppText, Screen, Card, Badge } from "@/components/ui";
import { AppHeader, EmptyState } from "@/components/common";
import { employeeColors, spacing } from "@/theme";
import { supabase } from "@/lib/supabase/client";

import { Incentive } from "@/features/incentive/incentive.types";
import { getEmployeeIncentives } from "@/features/incentive/incentive.service";

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
    <Card style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <AppText weight="700" variant="h3" color={employeeColors.primary}>
              ₹{item.amount.toLocaleString()}
            </AppText>
            <Badge
              label={item.payment_status}
              color={
                item.payment_status === "Paid"
                  ? employeeColors.primary
                  : employeeColors.warning
              }
            />
          </View>

          <AppText weight="700" style={{ marginTop: spacing.xs }}>
            {item.title}
          </AppText>

          <AppText variant="caption" color={employeeColors.textSecondary} style={{ marginTop: 2 }  }>
            Code: {item.incentive_code} | Type: {item.incentive_type} | Month: {item.month}/{item.year}
          </AppText>

          {item.description ? (
            <AppText variant="body" color={employeeColors.text} style={{ marginTop: spacing.xs }}>
              Comments:   {item.description}
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
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
