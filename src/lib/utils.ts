import type {
  SimilarStoreCandidate,
  Store,
  StoreImage,
  StoreReport,
  StoreSearchFilters,
  StoreWithRelations,
} from "@/lib/types";

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const normalizeText = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const nowIso = () => new Date().toISOString();

export const buildStoreRelations = (
  stores: Store[],
  images: StoreImage[],
  reports: StoreReport[],
) =>
  stores.map((store) => {
    const storeImages = images
      .filter((image) => image.storeId === store.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    const storeReports = reports
      .filter((report) => report.storeId === store.id)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );

    return {
      ...store,
      images: storeImages,
      reports: storeReports,
      reportCount: storeReports.length,
      pendingReportCount: storeReports.filter((report) => report.status === "pending").length,
    };
  }) as StoreWithRelations[];

export const applyStoreFilters = (
  stores: StoreWithRelations[],
  filters: StoreSearchFilters,
) => {
  const keyword = filters.q ? normalizeText(filters.q) : "";

  return stores
    .filter((store) => {
      if (!filters.includeDisabled && store.status !== "active") {
        return false;
      }

      if (filters.sido && store.sido !== filters.sido) {
        return false;
      }

      if (filters.sigungu && store.sigungu !== filters.sigungu) {
        return false;
      }

      if (keyword) {
        const haystack = normalizeText(
          [
            store.name,
            store.summary,
            store.address,
            store.sido,
            store.sigungu,
          ].join(" "),
        );

        if (!haystack.includes(keyword)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => {
      if (left.pendingReportCount !== right.pendingReportCount) {
        return right.pendingReportCount - left.pendingReportCount;
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
};

export const computeSimilarityScore = (
  store: Store,
  input: { name: string; address: string; sido: string; sigungu: string },
) => {
  const normalizedStoreName = normalizeText(store.name);
  const normalizedInputName = normalizeText(input.name);
  const normalizedStoreAddress = normalizeText(store.address);
  const normalizedInputAddress = normalizeText(input.address);

  let score = 0;

  if (store.sido === input.sido) {
    score += 20;
  }

  if (store.sigungu === input.sigungu) {
    score += 20;
  }

  if (
    normalizedStoreName.includes(normalizedInputName) ||
    normalizedInputName.includes(normalizedStoreName)
  ) {
    score += 40;
  }

  if (
    normalizedStoreAddress.includes(normalizedInputAddress) ||
    normalizedInputAddress.includes(normalizedStoreAddress)
  ) {
    score += 20;
  }

  return score;
};

export const findSimilarStoreCandidates = (
  stores: StoreWithRelations[],
  input: { name: string; address: string; sido: string; sigungu: string },
) =>
  stores
    .map((store) => ({
      ...store,
      similarityScore: computeSimilarityScore(store, input),
    }))
    .filter((candidate) => candidate.similarityScore >= 40)
    .sort((left, right) => right.similarityScore - left.similarityScore) as SimilarStoreCandidate[];

export const parseNumberParam = (value: string | null) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
