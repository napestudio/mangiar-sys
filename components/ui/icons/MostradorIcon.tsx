export default function MostradorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 9h18M3 9l1-4h16l1 4M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M9 13h6M9 16h4"
      />
    </svg>
  );
}
