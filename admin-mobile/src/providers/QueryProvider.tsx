import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
}

export default function QueryProvider({ children }: Props) {
  useEffect(() => {
    // Realtime for Customer Purchases & Sales (React Query)
    const purchasesChannel = supabase
      .channel("realtime-customer_purchases")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_purchases" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["my-purchases"] });
          queryClient.invalidateQueries({ queryKey: ["my-sales-dashboard"] });
        }
      )
      .subscribe();

    const followupsChannel = supabase
      .channel("realtime-customer_followups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_followups" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["my-customers"] });
          queryClient.invalidateQueries({ queryKey: ["my-sales-dashboard"] });
        }
      )
      .subscribe();

    const customersChannel = supabase
      .channel("realtime-customers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["my-customers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(followupsChannel);
      supabase.removeChannel(customersChannel);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}