import Link from "next/link";

import { Card } from "./Card";


interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">—</div>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && actionHref && <Link href={actionHref} className="link-button mt-5">{actionLabel}</Link>}
    </Card>
  );
}

