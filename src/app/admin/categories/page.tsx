import { redirect } from "next/navigation";
import { CategoriesManager } from "@/components/CategoriesManager";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { requireSession } from "@/lib/auth";
import { getAllCategories } from "@/lib/categories";

export default async function AdminCategoriesPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const categories = await getAllCategories();

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Categories"
        description="Manage award categories for submissions and the public showcase."
      />
      <YardContainer>
        <div className="overflow-hidden rounded-[24px] border border-line bg-white/90 p-5 md:p-8">
          <CategoriesManager initialCategories={categories} />
        </div>
      </YardContainer>
    </YardPage>
  );
}
