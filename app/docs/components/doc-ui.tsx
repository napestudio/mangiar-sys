import { ReactNode } from "react";

// ---------------------------------------------------------------------------
// DocPageHeader
// ---------------------------------------------------------------------------

interface DocPageHeaderProps {
  title: string;
  description: string;
}

export function DocPageHeader({ title, description }: DocPageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocSection — plain white card, no step number
// ---------------------------------------------------------------------------

interface DocSectionProps {
  title: string;
  children: ReactNode;
}

export function DocSection({ title, children }: DocSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepCard — numbered step card with blue circle badge
// ---------------------------------------------------------------------------

interface StepCardProps {
  step: number;
  title: string;
  children: ReactNode;
}

export function StepCard({ step, title, children }: StepCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Callout — tip or warning highlight box
// ---------------------------------------------------------------------------

type CalloutType = "tip" | "warning";

interface CalloutProps {
  type: CalloutType;
  children: ReactNode;
}

const calloutStyles: Record<CalloutType, { wrapper: string; label: string }> = {
  tip: {
    wrapper: "bg-blue-50 border border-blue-200 text-blue-800",
    label: "Tip",
  },
  warning: {
    wrapper: "bg-amber-50 border border-amber-200 text-amber-800",
    label: "Importante",
  },
};

export function Callout({ type, children }: CalloutProps) {
  const { wrapper, label } = calloutStyles[type];
  return (
    <div className={`mt-4 rounded-lg p-3 text-sm ${wrapper}`}>
      <strong>{label}:</strong> {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusTable — color-dot status reference table
// ---------------------------------------------------------------------------

export interface StatusRow {
  /** Tailwind bg-* class, e.g. "bg-green-500" */
  color: string;
  label: string;
  description: string;
}

interface StatusTableProps {
  rows: StatusRow[];
}

export function StatusTable({ rows }: StatusTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-3 border border-gray-200 font-semibold">
              Color
            </th>
            <th className="text-left p-3 border border-gray-200 font-semibold">
              Estado
            </th>
            <th className="text-left p-3 border border-gray-200 font-semibold">
              Descripción
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 1 ? "bg-gray-50" : ""}>
              <td className="p-3 border border-gray-200">
                <span
                  className={`inline-block w-4 h-4 rounded-full align-middle ${row.color}`}
                />
              </td>
              <td className="p-3 border border-gray-200 font-medium">
                {row.label}
              </td>
              <td className="p-3 border border-gray-200 text-gray-600">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocSteps — ordered list of steps (ol) with consistent spacing
// ---------------------------------------------------------------------------

interface DocStepsProps {
  children: ReactNode;
}

export function DocSteps({ children }: DocStepsProps) {
  return (
    <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-2">
      {children}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// DocList — unordered list with consistent spacing
// ---------------------------------------------------------------------------

interface DocListProps {
  children: ReactNode;
}

export function DocList({ children }: DocListProps) {
  return (
    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
      {children}
    </ul>
  );
}
