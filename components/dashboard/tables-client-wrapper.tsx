"use client";

import { useState, useCallback, useEffect } from "react";
import { TablesTabs } from "./tables-tabs";
import { TablesSimpleView } from "./tables-simple-view";
import FloorPlanHandler from "./floor-plan-handler";
import { AddSectorDialog } from "./floor-plan/add-sector-dialog";
import { EditSectorDialog } from "./floor-plan/edit-sector-dialog";
import { AddTableDialog } from "./floor-plan/add-table-dialog";
import { useSectors } from "@/hooks/use-sectors";
import { useDialogs } from "@/hooks/use-dialogs";
import { useTableForm } from "@/hooks/use-table-form";
import { getTablesWithStatus, getTableWithStatus } from "@/actions/Table";
import type { TableWithReservations, Sector } from "@/types/tables-client";
import { ProductsProvider } from "@/contexts/products-context";
import { OrderType } from "@/app/generated/prisma";

// Re-export for backward compatibility
export type { TableWithReservations };

interface TablesClientWrapperProps {
  branchId: string;
  initialTables: TableWithReservations[];
  initialSectors: Sector[];
  editModeOnly?: boolean;
  initialTableId?: string;
  initialPartySize?: number;
  initialCustomerEmail?: string;
}

export function TablesClientWrapper({
  branchId,
  initialTables,
  initialSectors,
  editModeOnly = false,
  initialTableId,
  initialPartySize,
  initialCustomerEmail,
}: TablesClientWrapperProps) {
  const [tables, setTables] = useState<TableWithReservations[]>(initialTables);

  // Custom hooks for state management
  const {
    sectors,
    selectedSector,
    setSelectedSector,
    sectorsLoaded,
    refreshSectors,
  } = useSectors(branchId, initialSectors);

  const {
    state: dialogState,
    openAddSector,
    closeAddSector,
    openEditSector,
    closeEditSector,
    closeAddTable,
  } = useDialogs();

  const { formState, updateField, submitTable } = useTableForm(branchId);

  // Pre-select the sector for the initial table (when navigating from reservations)
  useEffect(() => {
    if (!initialTableId) return;
    const table = initialTables.find((t) => t.id === initialTableId);
    if (table?.sectorId) setSelectedSector(table.sectorId);
  }, []); // mount only — eslint-disable-line react-hooks/exhaustive-deps

  // Refresh tables data from server
  const refreshTables = useCallback(async () => {
    const tablesResult = await getTablesWithStatus(branchId);
    if (tablesResult.success && tablesResult.data) {
      setTables(tablesResult.data as TableWithReservations[]);
    }
  }, [branchId]);

  // Refresh only a specific table (more efficient than refreshing all)
  const refreshSingleTable = useCallback(async (tableId: string) => {
    const tableResult = await getTableWithStatus(tableId);
    if (tableResult.success && tableResult.data) {
      setTables((prevTables) =>
        prevTables.map((t) =>
          t.id === tableId ? (tableResult.data as TableWithReservations) : t
        )
      );
    }
  }, []);

  // Memoized callback for adding table
  const handleAddTable = useCallback(async () => {
    const success = await submitTable((newTable) => {
      setTables((prevTables) => [...prevTables, newTable]);
    });

    if (success) {
      closeAddTable();
      refreshSectors();
    }
  }, [submitTable, closeAddTable, refreshSectors]);

  return (
    <ProductsProvider branchId={branchId} orderType={OrderType.DINE_IN}>
      <TablesTabs>
        <FloorPlanHandler
          branchId={branchId}
          tables={tables}
          setTables={setTables}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
          sectors={sectors}
          onAddSector={openAddSector}
          onEditSector={openEditSector}
          onRefreshTables={refreshTables}
          onRefreshSingleTable={refreshSingleTable}
          editModeOnly={editModeOnly}
          isLoading={!sectorsLoaded}
          initialTableId={initialTableId}
          initialPartySize={initialPartySize}
          initialCustomerEmail={initialCustomerEmail}
        />
        <TablesSimpleView tables={tables} sectors={sectors} />
      </TablesTabs>

      <AddSectorDialog
        open={dialogState.addSector}
        onOpenChange={closeAddSector}
        branchId={branchId}
        onSectorAdded={refreshSectors}
      />

      <EditSectorDialog
        open={dialogState.editSector}
        onOpenChange={closeEditSector}
        sector={dialogState.editingSector}
        onSectorUpdated={refreshSectors}
        totalSectors={sectors.length}
      />

      <AddTableDialog
        open={dialogState.addTable}
        onOpenChange={closeAddTable}
        tableNumber={formState.number}
        tableShape={formState.shape}
        tableCapacity={formState.capacity}
        isShared={formState.isShared}
        onTableNumberChange={(value) => updateField("number", value)}
        onTableShapeChange={(value) => updateField("shape", value)}
        onTableCapacityChange={(value) => updateField("capacity", value)}
        onIsSharedChange={(value) => updateField("isShared", value)}
        onAddTable={handleAddTable}
      />
    </ProductsProvider>
  );
}
