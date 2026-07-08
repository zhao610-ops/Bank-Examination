import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { TrainingForm } from "@/components/training/TrainingForm";


export default function TrainingPage() {
  return (
    <PageShell>
      <Badge variant="info">训练配置</Badge>
      <h1 className="page-title mt-3">生成今日训练方案</h1>
      <p className="page-description">智能推荐用于解决今天练什么、练多少题；明确目标时也可以切换到自定义训练。</p>
      <TrainingForm />
    </PageShell>
  );
}
