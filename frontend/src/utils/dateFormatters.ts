/**
 * Date and time formatting helpers for Yatrivo Admin & CRM
 */

export interface FormattedDateTime {
  date: string;
  time?: string;
}

export function formatEnquiryDateTime(dateStr?: string | null): FormattedDateTime {
  if (!dateStr) return { date: "—" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: dateStr };

  const date = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const hasTime = dateStr.includes("T") || dateStr.includes(":") || (dateStr.includes(" ") && dateStr.length > 10);
  if (!hasTime) {
    return { date };
  }

  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return { date, time };
}
