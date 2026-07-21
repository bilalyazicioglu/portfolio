import { CornerMarks } from "@/components/CornerMarks";

export function PanelFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[28px] border-[1.5px] border-ink bg-surface">
      <CornerMarks />
      <div className="overflow-hidden rounded-[26.5px]">{children}</div>
    </div>
  );
}
