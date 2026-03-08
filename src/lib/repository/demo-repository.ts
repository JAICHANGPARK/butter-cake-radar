import { createDemoDatabase, type DemoDatabase } from "@/lib/demo-data";
import { REGIONS } from "@/lib/regions";
import type {
  AdminDashboardData,
  Repository,
  Store,
  StoreInput,
  StoreReport,
  StoreReportInput,
  StoreSearchFilters,
} from "@/lib/types";
import {
  applyStoreFilters,
  buildStoreRelations,
  createId,
  findSimilarStoreCandidates,
  nowIso,
  slugify,
} from "@/lib/utils";

declare global {
  var __BUTTER_CAKE_RADAR_DEMO_DB__: DemoDatabase | undefined;
}

const getDatabase = () => {
  if (!globalThis.__BUTTER_CAKE_RADAR_DEMO_DB__) {
    globalThis.__BUTTER_CAKE_RADAR_DEMO_DB__ = createDemoDatabase();
  }

  return globalThis.__BUTTER_CAKE_RADAR_DEMO_DB__;
};

export class DemoRepository implements Repository {
  async getRegions() {
    return REGIONS;
  }

  async listStores(filters: StoreSearchFilters) {
    const database = getDatabase();
    const stores = buildStoreRelations(
      database.stores,
      database.storeImages,
      database.storeReports,
    );

    return applyStoreFilters(stores, filters);
  }

  async getStoreById(id: string) {
    const database = getDatabase();
    return (
      buildStoreRelations(
        database.stores,
        database.storeImages,
        database.storeReports,
      ).find((store) => store.id === id) ?? null
    );
  }

  async findSimilarStores(input: Pick<StoreInput, "name" | "address" | "sido" | "sigungu">) {
    const stores = await this.listStores({
      sido: input.sido,
      sigungu: input.sigungu,
      includeDisabled: true,
    });

    return findSimilarStoreCandidates(stores, input);
  }

  async createStore(input: StoreInput) {
    const database = getDatabase();
    const timestamp = nowIso();
    const store: Store = {
      id: createId(),
      name: input.name,
      slug: slugify(input.name),
      summary: input.summary,
      address: input.address,
      sido: input.sido,
      sigungu: input.sigungu,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone ?? null,
      openingHours: input.openingHours ?? null,
      websiteUrl: input.websiteUrl || null,
      instagramUrl: input.instagramUrl || null,
      kakaoMapUrl: input.kakaoMapUrl || null,
      naverMapUrl: input.naverMapUrl || null,
      googleMapUrl: input.googleMapUrl || null,
      status: "active",
      disabledReason: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    database.stores.push(store);
    input.imageUrls.forEach((imageUrl, index) => {
      database.storeImages.push({
        id: createId(),
        storeId: store.id,
        imageUrl,
        altText: `${store.name} 이미지 ${index + 1}`,
        sortOrder: index,
        createdAt: timestamp,
      });
    });

    return (await this.getStoreById(store.id))!;
  }

  async createReport(input: StoreReportInput) {
    const database = getDatabase();
    const timestamp = nowIso();
    const report: StoreReport = {
      id: createId(),
      storeId: input.storeId,
      reportType: input.reportType,
      note: input.note,
      reporterName: input.reporterName ?? null,
      reporterContact: input.reporterContact ?? null,
      status: "pending",
      resolution: null,
      createdAt: timestamp,
      reviewedAt: null,
    };

    database.storeReports.push(report);
    return report;
  }

  async listAdminDashboard() {
    const database = getDatabase();
    const stores = await this.listStores({ includeDisabled: true });
    const reports = database.storeReports
      .map((report) => {
        const store = database.stores.find((entry) => entry.id === report.storeId);
        if (!store) {
          return null;
        }

        return {
          ...report,
          storeName: store.name,
          storeStatus: store.status,
          storeSido: store.sido,
          storeSigungu: store.sigungu,
        };
      })
      .filter(Boolean)
      .sort(
        (left, right) =>
          new Date(right!.createdAt).getTime() - new Date(left!.createdAt).getTime(),
      );

    return {
      stores,
      reports: reports as AdminDashboardData["reports"],
    };
  }

  async setStoreStatus(input: {
    id: string;
    status: "active" | "disabled";
    reason?: string;
  }) {
    const database = getDatabase();
    const store = database.stores.find((entry) => entry.id === input.id);

    if (!store) {
      return null;
    }

    store.status = input.status;
    store.disabledReason = input.status === "disabled" ? input.reason ?? null : null;
    store.updatedAt = nowIso();

    if (input.status === "disabled") {
      database.storeReports.forEach((report) => {
        if (report.storeId === input.id && report.status === "pending") {
          report.status = "reviewed";
          report.reviewedAt = nowIso();
          report.resolution = input.reason ?? "신고 검토 후 매장이 비노출 처리되었습니다.";
        }
      });
    }

    return this.getStoreById(input.id);
  }

  async reviewReport(input: {
    id: string;
    resolution?: string;
  }) {
    const database = getDatabase();
    const report = database.storeReports.find((entry) => entry.id === input.id);

    if (!report) {
      return null;
    }

    report.status = "reviewed";
    report.reviewedAt = nowIso();
    report.resolution = input.resolution ?? "검토 완료";
    return report;
  }
}
