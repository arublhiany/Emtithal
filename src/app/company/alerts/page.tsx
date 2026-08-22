"use client";

import { useDemoStore } from "@/lib/store/demoStore";
import { PageHeader } from "@/components/ui/Card";
import { AlertCard } from "@/components/alerts/AlertCard";

export default function CompanyAlertsPage() {
  const { state, markAlertRead } = useDemoStore();
  const alerts = [...state.alerts].sort((a, b) => Number(a.isRead) - Number(b.isRead));
  const unreadCount = state.alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="التنبيهات"
        title="التنبيهات ذات الأولوية"
        descriptionAr={
          unreadCount > 0
            ? `لديك ${unreadCount} تنبيهًا غير مقروء يحتاج مراجعة.`
            : "لا توجد تنبيهات غير مقروءة حاليًا."
        }
      />
      <div className="space-y-3 max-w-3xl">
        {alerts.map((a) => (
          <AlertCard key={a.id} alert={a} onMarkRead={markAlertRead} />
        ))}
      </div>
    </div>
  );
}
