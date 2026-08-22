import { getCurrentUser } from "@/lib/api";
import { redirect } from "next/navigation";
import { BookmarksReview } from "@/components/BookmarksReview";

export const metadata = { title: "Saved Questions — MCQure" };

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookmarks");

  return <BookmarksReview />;
}
