"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdatePicksButton({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <Button type="button" onClick={onRefresh} variant="secondary" disabled={isRefreshing}>
      <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
      {isRefreshing ? "Updating live data..." : "Update Picks"}
    </Button>
  );
}
