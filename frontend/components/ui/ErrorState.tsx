import { Button } from "./Button";
import { Card } from "./Card";


interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "加载失败", description, onRetry }: ErrorStateProps) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center border-red-100 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 font-semibold text-red-600">!</div>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {onRetry && <Button className="mt-5" onClick={onRetry}>重新加载</Button>}
    </Card>
  );
}

