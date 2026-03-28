"use client";

import { getGlobalMovements } from "@/actions/CashRegister";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateCSV, downloadCSV } from "@/lib/csv/csv-export";
import { formatDateAR, formatTimeAR } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  GLOBAL_MOVEMENT_CATEGORIES,
  MOVEMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/cash-register";
import type { GlobalMovement } from "@/types/cash-register";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  History,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AddGlobalMovementDialog,
  type OptimisticGlobalMovement,
} from "./add-global-movement-dialog";
import { MovementDetailsSidebar } from "./movement-details-sidebar";

interface GlobalMovementRow extends GlobalMovement {
  isOptimistic?: boolean;
}

interface GlobalMovementsProps {
  branchId: string;
  userRole: string;
}

type FilterType = "today" | "history" | "dateRange";
type SortBy = "date" | "amount";
type SortOrder = "asc" | "desc";

export function GlobalMovements({ branchId, userRole }: GlobalMovementsProps) {
  const [movements, setMovements] = useState<GlobalMovementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterMovementType, setFilterMovementType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchDescription, setSearchDescription] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [detailsSidebarOpen, setDetailsSidebarOpen] = useState(false);

  const PAGE_SIZE = 50;

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const loadMovements = useCallback(
    async (pageNum: number = 0) => {
      setIsLoading(true);
      try {
        let fromDate: string | undefined;
        let toDate: string | undefined;

        if (filterType === "today") {
          fromDate = today;
          toDate = today;
        } else if (filterType === "dateRange" && dateFrom && dateTo) {
          fromDate = dateFrom;
          toDate = dateTo;
        }

        const result = await getGlobalMovements({
          branchId,
          dateFrom: fromDate,
          dateTo: toDate,
          type:
            filterMovementType !== "all"
              ? (filterMovementType as "INCOME" | "EXPENSE")
              : undefined,
          category: filterCategory !== "all" ? filterCategory : undefined,
          description: searchDescription.trim() || undefined,
          sortBy,
          sortOrder,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
        });

        if (result.success && result.data) {
          setMovements(result.data as GlobalMovementRow[]);
          setTotal(result.total ?? 0);
          setHasMore(result.hasMore ?? false);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error loading global movements:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      branchId,
      dateFrom,
      dateTo,
      filterCategory,
      filterMovementType,
      filterType,
      searchDescription,
      sortBy,
      sortOrder,
      today,
    ],
  );

  const debouncedLoad = useDebounce(() => loadMovements(0), 300);

  useEffect(() => {
    debouncedLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterType,
    dateFrom,
    dateTo,
    filterMovementType,
    filterCategory,
    searchDescription,
    sortBy,
    sortOrder,
  ]);

  const handleSetToday = () => {
    setFilterType("today");
    setDateFrom("");
    setDateTo("");
  };

  const handleSetHistory = () => {
    setFilterType("history");
    setDateFrom("");
    setDateTo("");
  };

  const handleSetDateRange = () => {
    setFilterType("dateRange");
    const from = new Date();
    from.setDate(from.getDate() - 7);
    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(today);
  };

  const handleClearFilters = () => {
    setFilterType("today");
    setDateFrom("");
    setDateTo("");
    setFilterMovementType("all");
    setFilterCategory("all");
    setSearchDescription("");
  };

  const handleSortColumn = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleMovementAdded = (optimistic: OptimisticGlobalMovement) => {
    setMovements((prev) => [optimistic as GlobalMovementRow, ...prev]);
    setTotal((prev) => prev + 1);
  };

  const handleMovementFailed = (tempId: string) => {
    setMovements((prev) => prev.filter((m) => m.id !== tempId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const handleMovementConfirmed = (
    tempId: string,
    real: OptimisticGlobalMovement,
  ) => {
    setMovements((prev) =>
      prev.map((m) => (m.id === tempId ? { ...real, isOptimistic: false } : m)),
    );
  };

  const formatDateTime = (dateStr: string) =>
    `${formatDateAR(dateStr)} ${formatTimeAR(dateStr)}`;

  const handleExportCSV = () => {
    const exportable = movements.filter((m) => !m.isOptimistic);
    const csv = generateCSV(exportable, [
      { header: "Fecha", accessor: (row) => formatDateAR(row.createdAt) },
      { header: "Hora", accessor: (row) => formatTimeAR(row.createdAt) },
      { header: "Tipo", accessor: (row) => MOVEMENT_TYPE_LABELS[row.type] },
      {
        header: "Medio de Pago",
        accessor: (row) =>
          PAYMENT_METHOD_LABELS[
            row.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
          ] || row.paymentMethod,
      },
      { header: "Categoría", accessor: (row) => row.category ?? "" },
      { header: "Descripción", accessor: (row) => row.description ?? "" },
      {
        header: "Monto",
        accessor: (row) =>
          row.type === "EXPENSE" ? -row.amount : row.amount,
      },
      { header: "Registrado por", accessor: (row) => row.createdByName },
    ]);
    downloadCSV(csv, `movimientos-globales-${formatDateAR(new Date().toISOString())}.csv`);
  };

  const hasActiveFilters =
    filterType !== "today" ||
    filterMovementType !== "all" ||
    filterCategory !== "all" ||
    searchDescription !== "";

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column)
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1" />
    );
  };

  const getMovementBadge = (movement: GlobalMovementRow) => (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        movement.type === "INCOME"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700",
      )}
    >
      {movement.type === "INCOME" ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {MOVEMENT_TYPE_LABELS[movement.type]}
    </span>
  );

  const getAmountDisplay = (movement: GlobalMovementRow) => (
    <span
      className={cn(
        "font-medium",
        movement.type === "INCOME" ? "text-green-600" : "text-red-600",
      )}
    >
      {movement.type === "INCOME" ? "+" : "-"}
      {formatCurrency(movement.amount)}
    </span>
  );

  const getRowBorderClass = (movement: GlobalMovementRow) =>
    movement.type === "INCOME"
      ? "border-l-4 border-l-green-500"
      : "border-l-4 border-l-red-500";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Movimientos Globales
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ingresos y egresos no vinculados a ningún arqueo de caja
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={movements.filter((m) => !m.isOptimistic).length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <AddGlobalMovementDialog
            onMovementAdded={handleMovementAdded}
            onMovementFailed={handleMovementFailed}
            onMovementConfirmed={handleMovementConfirmed}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={filterType === "today" ? "default" : "ghost"}
            size="sm"
            onClick={handleSetToday}
            className={
              filterType === "today" ? "bg-red-600 hover:bg-red-700" : ""
            }
          >
            <Clock className="h-4 w-4 mr-1" />
            Hoy
          </Button>
          <Button
            variant={filterType === "history" ? "default" : "ghost"}
            size="sm"
            onClick={handleSetHistory}
            className={
              filterType === "history" ? "bg-red-600 hover:bg-red-700" : ""
            }
          >
            <History className="h-4 w-4 mr-1" />
            Historial
          </Button>
          <Button
            variant={filterType === "dateRange" ? "default" : "ghost"}
            size="sm"
            onClick={handleSetDateRange}
            className={
              filterType === "dateRange" ? "bg-red-600 hover:bg-red-700" : ""
            }
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Rango
          </Button>
        </div>

        {filterType === "dateRange" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-35"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-35"
            />
          </div>
        )}

        <Select
          value={filterMovementType}
          onValueChange={setFilterMovementType}
        >
          <SelectTrigger className="w-38">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="INCOME">Ingresos</SelectItem>
            <SelectItem value="EXPENSE">Egresos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {GLOBAL_MOVEMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchDescription}
            onChange={(e) => setSearchDescription(e.target.value)}
            placeholder="Buscar descripción..."
            className="pl-8 w-48"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {total > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600">
            Mostrando {page * PAGE_SIZE + 1} –{" "}
            {Math.min((page + 1) * PAGE_SIZE, total)} de {total} movimientos
          </div>
        )}
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSortColumn("date")}
                >
                  Fecha y Hora
                  <SortIcon column="date" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Medio de Pago
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Categoría
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                Descripción
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                <button
                  className="flex items-center ml-auto hover:text-gray-900 transition-colors"
                  onClick={() => handleSortColumn("amount")}
                >
                  Monto
                  <SortIcon column="amount" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500">Cargando movimientos...</p>
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-gray-500">No hay movimientos globales</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {filterType === "today"
                      ? "No se registraron movimientos globales hoy"
                      : "No se encontraron movimientos con los filtros seleccionados"}
                  </p>
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr
                  key={movement.id}
                  onClick={() => {
                    if (movement.isOptimistic) return;
                    setSelectedMovementId(movement.id);
                    setDetailsSidebarOpen(true);
                  }}
                  className={cn(
                    "transition-colors",
                    getRowBorderClass(movement),
                    movement.isOptimistic
                      ? "opacity-60 cursor-default"
                      : "hover:bg-gray-50 cursor-pointer",
                  )}
                >
                  <td className="px-4 py-3 text-sm">
                    {formatDateTime(movement.createdAt)}
                  </td>
                  <td className="px-4 py-3">{getMovementBadge(movement)}</td>
                  <td className="px-4 py-3 text-sm">
                    {PAYMENT_METHOD_LABELS[
                      movement.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
                    ] || movement.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {movement.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {movement.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-50 truncate">
                    {movement.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {getAmountDisplay(movement)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {total > PAGE_SIZE && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {page + 1} de {Math.ceil(total / PAGE_SIZE)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMovements(page - 1)}
                disabled={isLoading || page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMovements(page + 1)}
                disabled={isLoading || !hasMore}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <MovementDetailsSidebar
        open={detailsSidebarOpen}
        onClose={() => {
          setDetailsSidebarOpen(false);
          setSelectedMovementId(null);
        }}
        movementId={selectedMovementId}
        onMovementUpdated={() => loadMovements(page)}
        userRole={userRole}
      />
    </div>
  );
}
