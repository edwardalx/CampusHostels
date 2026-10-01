import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { fetchManagedProperties } from "../services/PropertyService";
import { FunctionType } from "../type/manager";
import type { ManagedProperty } from "../type/property";
import { DashboardSummaryCards } from "./DashboardSummaryCards";
import { DashboardHeader } from "./DashboardHeader";
import { OccupancyChart } from "./OccupancyChart";
import { PropertyHealthPanel } from "./PropertyHealthPanel";
import { Sidebar } from "./Sidebar";

export function DashboardPage() {
  const { manager } = useAuth();
  const { occupancyTrend, selectedPropertyIds } = useDashboard();
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const canManageProperties =
    manager?.tier === "Super" || manager?.functions.includes(FunctionType.ManageProperties);

  useEffect(() => {
    if (!canManageProperties) {
      setIsLoadingProperties(false);
      return;
    }

    const controller = new AbortController();
    fetchManagedProperties(controller.signal)
      .then(setProperties)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setPropertiesError(
            requestError instanceof Error ? requestError.message : "Unable to load property health",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingProperties(false);
      });

    return () => controller.abort();
  }, [canManageProperties]);

  const visibleProperties = selectedPropertyIds.length
    ? properties.filter((property) => selectedPropertyIds.includes(property.id))
    : properties;

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <main className="content">
        <DashboardHeader />
        <DashboardSummaryCards />

        <section className={`main-grid${canManageProperties ? "" : " single-column"}`}>
          <OccupancyChart data={occupancyTrend} />
          {canManageProperties && (
            <PropertyHealthPanel
              error={propertiesError}
              isLoading={isLoadingProperties}
              properties={visibleProperties}
            />
          )}
        </section>
      </main>
    </div>
  );
}
