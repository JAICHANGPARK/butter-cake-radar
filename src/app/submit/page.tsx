import { SubmissionHub } from "@/components/submission-hub";
import { repository } from "@/lib/repository";

export default async function SubmitPage() {
  const stores = await repository.listStores({
    includeDisabled: true,
  });

  return <SubmissionHub stores={stores} />;
}
