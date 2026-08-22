"use client";

import { getMinistryCompanies } from "@/lib/data/ministryCompanies";
import { PageHeader, Card } from "@/components/ui/Card";
import { CompanyTable } from "@/components/ministry/CompanyTable";

export default function MinistryCompaniesPage() {
  const companies = getMinistryCompanies();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الشركات"
        title="الشركات المسجلة"
        descriptionAr="قائمة شركات خدمة الحج ضمن النموذج التجريبي مع مستوى الامتثال والمخاطر لكل شركة."
      />
      <Card padding="p-0">
        <div className="p-5">
          <CompanyTable companies={companies} />
        </div>
      </Card>
    </div>
  );
}
