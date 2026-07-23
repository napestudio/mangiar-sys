"use client";

interface TableWithStatus {
  id: string;
  number: number;
  capacity: number;
  isActive: boolean;
  status: string | null;
}

interface TablesStatsOverviewProps {
  tables: TableWithStatus[];
}

export function TablesStatsOverview({ tables }: TablesStatsOverviewProps) {
  // Helper function to determine if table is occupied
  const isTableOccupied = (table: TableWithStatus): boolean => {
    return table.status === "OCCUPIED" || table.status === "RESERVED";
  };

  const occupiedTables = tables.filter(
    (table) => table.isActive && isTableOccupied(table)
  );
  const availableTables = tables.filter(
    (table) => table.isActive && !isTableOccupied(table)
  );

  const totalCapacity = tables
    .filter((t) => t.isActive)
    .reduce((sum, t) => sum + t.capacity, 0);
  const occupiedCapacity = occupiedTables.reduce(
    (sum, t) => sum + t.capacity,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Total de Mesas</div>
        <div className="text-2xl font-bold text-gray-900">
          {tables.filter((t) => t.isActive).length}
        </div>
      </div>
      <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
        <div className="text-sm text-green-700">Disponibles</div>
        <div className="text-2xl font-bold text-green-900">
          {availableTables.length}
        </div>
      </div>
      <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
        <div className="text-sm text-red-700">Ocupadas</div>
        <div className="text-2xl font-bold text-red-900">
          {occupiedTables.length}
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
        <div className="text-sm text-blue-700">Capacidad</div>
        <div className="text-2xl font-bold text-blue-900">
          {totalCapacity - occupiedCapacity} / {totalCapacity}
        </div>
      </div>
    </div>
  );
}
