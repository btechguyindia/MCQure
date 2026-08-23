import { getCurrentUser } from "@/lib/api";
import { redirect } from "next/navigation";
import { BookmarksReview } from "@/components/BookmarksReview";
import { SavedIcon } from "@/components/icons";

export const metadata = { title: "Saved Questions — MCQure" };

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookmarks");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Saved for later</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <SavedIcon className="h-6 w-6 text-brand" />
          Saved questions
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          Your bookmarked questions, ready for focused review.
        </p>
      </header>
      <BookmarksReview />
    </div>
  );
}
