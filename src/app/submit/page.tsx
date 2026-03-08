import type { Metadata } from "next";

import { SubmissionHub } from "@/components/submission-hub";
import { repository } from "@/lib/repository";

export const metadata: Metadata = {
  title: "가게 등록",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SubmitPage() {
  const stores = await repository.listStores({
    includeDisabled: true,
  });

  return <SubmissionHub stores={stores} />;
}
