import { Hero } from "@/components/hero";
import { Methodology } from "@/components/methodology";
import { PerformanceTable } from "@/components/performance-table";
import { PicksDashboard } from "@/components/picks-dashboard";
import { RisksSection } from "@/components/risks-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PicksDashboard />
      <Methodology />
      <RisksSection />
      <PerformanceTable />
    </>
  );
}
