import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { TrainingForm } from "@/components/training/TrainingForm";


export default function TrainingPage() {
  return (
    <PageShell>
      <Badge variant="info">训练配置</Badge>
      <h1 className="page-title mt-3">选择训练配置</h1>
      <p className="page-description">根据目标银行、岗位和题型生成专属训练题。配置完成后即可进入沉浸式答题。</p>
      <TrainingForm />
    </PageShell>
  );
}

