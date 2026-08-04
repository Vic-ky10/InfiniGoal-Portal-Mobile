import React, { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator, Animated, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Path, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

import { AppText, Card } from "@/components/ui";
import { adminColors, employeeColors, useThemeColors, spacing, radius, shadows } from "@/theme";
import { CustomerPurchase } from "../sales.types";
import { getMonthlyRevenueChartData } from "../sales.utils";

interface MonthlyRevenueChartProps {
  purchases: CustomerPurchase[];
  isLoading?: boolean;
  isError?: boolean;
  theme?: "admin" | "employee";
}

export default function MonthlyRevenueChart({
  purchases,
  isLoading = false,
  isError = false,
  theme,
}: MonthlyRevenueChartProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const fallbackColors = useThemeColors();
  const colors = theme === "employee" ? employeeColors : theme === "admin" ? adminColors : fallbackColors;

  // Animation values
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(15), []);

  // Process chart data with useMemo
  const chartData = useMemo(() => {
    if (isLoading || isError || !purchases || purchases.length === 0) {
      return [];
    }
    return getMonthlyRevenueChartData(purchases);
  }, [purchases, isLoading, isError]);

  // Check if chart data has no revenue
  const isEmpty = useMemo(() => {
    return chartData.length === 0 || chartData.every((d) => d.amount === 0);
  }, [chartData]);

  // Max value for Y scale, fallback to 10k to prevent divide-by-zero or flat line
  const maxChartAmount = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.amount), 0);
    return maxVal > 0 ? maxVal * 1.15 : 10000; // Give 15% headroom above the max value
  }, [chartData]);

  // Trigger entrance animation when layout is ready and data exists
  useEffect(() => {
    if (chartWidth > 0 && !isLoading && !isError && !isEmpty) {
      // Reset values
      fadeAnim.setValue(0);
      slideAnim.setValue(15);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [chartWidth, isLoading, isError, isEmpty, fadeAnim, slideAnim]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setChartWidth(width);
    }
  };

  // Dimensions & padding configuration
  const containerHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = containerHeight - paddingTop - paddingBottom;

  // Render SVG Graph inside a memoized block or calculations
  const graphSVG = useMemo(() => {
    if (chartWidth === 0 || isEmpty) return null;

    // Calculate coordinates for points
    const points = chartData.map((d, i) => {
      const x = paddingLeft + (i / (chartData.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d.amount / maxChartAmount) * graphHeight;
      return { x, y, amount: d.amount, label: d.label };
    });

    // Create Line Path
    const linePathStr = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // Create Area Path (filled under the line)
    const areaPathStr = `${linePathStr} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;

    // Generate Y axis grid lines (4 lines: 0%, 33%, 66%, 100%)
    const gridDivisions = [0, 0.33, 0.66, 1.0];
    const gridYValues = gridDivisions.map((pct) => pct * maxChartAmount);

    
    const formatYLabel = (val: number) => {
      if (val === 0) return "₹0";
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(1).replace(/\.0$/, "")}L`;
      }
      if (val >= 1000) {
        return `₹${(val / 1000).toFixed(0)}K`;
      }
      return `₹${val}`;
    };

    // Format utility for dot values (e.g. 45.2K)
    const formatDotValue = (val: number) => {
      if (val === 0) return "₹0";
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(1).replace(/\.0$/, "")}L`;
      }
      if (val >= 1000) {
        return `₹${(val / 1000).toFixed(1).replace(/\.0$/, "")}K`;
      }
      return `₹${val}`;
    };

    return (
      <Svg width={chartWidth} height={containerHeight}>
        <Defs>
          <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
          </LinearGradient>
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.primaryLight} />
          </LinearGradient>
        </Defs>

        {/* Grid lines & Y Axis Labels */}
        {gridYValues.map((value, idx) => {
          const y = paddingTop + graphHeight - (value / maxChartAmount) * graphHeight;
          return (
            <G key={`grid-${idx}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4, 4"
              />
              <SvgText
               x={paddingLeft - 20}
                y={y + 4}
                fill={colors.textSecondary}
                fontSize={10}
                fontWeight="500"
                textAnchor="end"
              >
                {formatYLabel(value)}
              </SvgText>
            </G>
          );
        })}

        {/* Area fill path under the line */}
        <Path d={areaPathStr} fill="url(#gradientArea)" />

        {/* Line path */}
        <Path
          d={linePathStr}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots & labels at point coordinates */}
        {points.map((p, idx) => (
          <G key={`point-${idx}`}>
            {/* Outer ring */}
            <Circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill={colors.primary}
              opacity={0.15}
            />
            {/* Inner solid circle */}
            <Circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill={colors.primary}
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
            {/* Label text above dot */}
            <SvgText
              x={p.x}
              y={p.y - 10}
              fill={colors.text}
              fontSize={9}
              fontWeight="700"
              textAnchor="middle"
            >
              {formatDotValue(p.amount)}
            </SvgText>

            {/* X axis month labels */}
            <SvgText
              x={p.x}
              y={paddingTop + graphHeight + 16}
              fill={colors.textSecondary}
              fontSize={10}
              fontWeight="600"
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          </G>
        ))}
      </Svg>
    );
  }, [chartWidth, chartData, graphWidth, graphHeight, maxChartAmount, isEmpty, colors]);

  return (
    <Card style={{ ...styles.container, borderColor: colors.border, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <AppText variant="h3" weight="700" color={colors.text}>
            Monthly Revenue
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Total approved revenue generated over the last 6 months
          </AppText>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}10` }]}>
          <Feather name="trending-up" size={16} color={colors.primary} />
        </View>
      </View>

      <View style={styles.chartWrapper} onLayout={handleLayout}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              Loading chart metrics...
            </AppText>
          </View>
        ) : isError ? (
          <View style={styles.centerContainer}>
            <View style={[styles.errorIconBg, { backgroundColor: `${colors.danger}10` }]}>
              <Feather name="alert-circle" size={22} color={colors.danger} />
            </View>
            <AppText weight="700" color={colors.text} style={{ marginTop: spacing.sm }}>
              Failed to load chart data
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2, textAlign: "center" }}>
              Check your connection and try refreshing.
            </AppText>
          </View>
        ) : isEmpty ? (
          <View style={styles.centerContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: `${colors.textSecondary}10` }]}>
              <Feather name="bar-chart-2" size={24} color={colors.textSecondary} />
            </View>
            <AppText weight="700" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
              No Approved Revenue
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2, textAlign: "center" }}>
              Approved sales in the last 6 months will appear here.
            </AppText>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {graphSVG}
          </Animated.View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: adminColors.background,
    ...shadows.sm,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${adminColors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  chartWrapper: {
    height: 220,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  errorIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${adminColors.danger}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${adminColors.textSecondary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
});
