"use client";

import { useDemoStore } from "@/lib/store/demoStore";
import { PageHeader } from "@/components/ui/Card";
import { AlertCard } from "@/components/alerts/AlertCard";

export default function MinistryAlertsPage() {
  const { state, markAlertRead } = useDemoStore();
  const alerts = [...state.alerts].sort((a, b) => Number(a.isRead) - Number(b.isRead));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="التنبيهات"
        title="تنبيهات رقابية"
        descriptionAr="تنبيهات الشركات ذات البيانات التفصيلية ضمن النموذج التجريبي."
      />
      <div className="space-y-3 max-w-3xl">
        {alerts.map((a) => (
          <AlertCard key={a.id} alert={a} onMarkRead={markAlertRead} />
        ))}
      </div>
    </div>
  );
}
