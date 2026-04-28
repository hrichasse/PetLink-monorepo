import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <section className="rounded-card border border-dashed border-border bg-card p-8 text-center shadow-soft" aria-live="polite">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary"><PawPrint className="h-8 w-8" /></div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <Button className="mt-5" variant="hero" onClick={onAction}>{action}</Button>}
    </section>
  );
}
