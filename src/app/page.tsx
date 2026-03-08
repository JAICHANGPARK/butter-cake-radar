import { MapBrowser } from "@/components/map-browser";
import { getRepositoryRuntime, repository } from "@/lib/repository";
import { parseStoreSearchParams } from "@/lib/validation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, regions] = await Promise.all([searchParams, repository.getRegions()]);
  const filters = parseStoreSearchParams(params);
  const stores = await repository.listStores(filters);
  const runtime = getRepositoryRuntime();

  return (
    <MapBrowser
      key={JSON.stringify(filters)}
      stores={stores}
      filters={filters}
      regions={regions}
      isDemoMode={runtime.mode === "demo"}
      setupFallbackReason={runtime.fallbackReason}
    />
  );
}
