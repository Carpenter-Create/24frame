import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { EDUCATION_ADMIN } from "@/lib/education";

export default function GcEducationPage() {
  return (
    <div data-education-index="">
      <PageHeader title={EDUCATION_ADMIN.title} />
      <HouseEmpty>{EDUCATION_ADMIN.selectCourse}</HouseEmpty>
    </div>
  );
}
