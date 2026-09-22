import { useApp } from "@/context/AppContext";

interface Props {
  id: string;
  className?: string;
  size?: number;
}

export default function SaveButton({ id, className = "", size = 18 }: Props) {
  const { isSaved, toggleSave } = useApp();
  const saved = isSaved(id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleSave(id);
      }}
      className={`flex items-center justify-center transition-all ${className}`}
      aria-label={saved ? "Remove from saved" : "Save trip"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={saved ? "#e8622a" : "none"}
        stroke={saved ? "#e8622a" : "currentColor"}
        strokeWidth="2"
        className="transition-all"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
