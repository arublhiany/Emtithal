"use client";

import { useRouter } from "next/navigation";
import { useRegMgmt } from "@/components/regmgmt/RegMgmtProvider";
import { RequirementForm } from "@/components/regmgmt/RequirementForm";
import { PageHead } from "@/components/ui/kit";

export default function NewRequirementPage() {
  const router = useRouter();
  const { createRequirement } = useRegMgmt();

  function makeId(): string {
    return `GOV-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  return (
    <div>
      <PageHead
        eyebrow="إدارة المتطلبات"
        title="إنشاء متطلب جديد"
        subtitle="يُنشأ المتطلب كمسودة. المسودة لا تدخل في حساب الجاهزية، ولا تصبح سارية إلا بعد التفعيل."
      />
      <RequirementForm
        submitLabel="حفظ كمسودة"
        onCancel={() => router.push("/ministry/requirements")}
        onSubmit={(input) => {
          const id = input.requirementId ?? makeId();
          const res = createRequirement(id, input);
          if (res.ok) router.push(`/ministry/requirements/${encodeURIComponent(id)}`);
          return res;
        }}
      />
    </div>
  );
}
