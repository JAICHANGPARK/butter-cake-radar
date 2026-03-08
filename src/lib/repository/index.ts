import { isSupabaseConfigured } from "@/lib/env";
import { DemoRepository } from "@/lib/repository/demo-repository";
import { SupabaseRepository } from "@/lib/repository/supabase-repository";
import { getErrorMessage, isSupabaseSetupError } from "@/lib/supabase";
import type {
  AdminDashboardData,
  RegionRecord,
  Repository,
  SimilarStoreCandidate,
  StoreReport,
  StoreReportInput,
  StoreSearchFilters,
  StoreWithRelations,
  StoreInput,
} from "@/lib/types";

export type RepositoryMode = "demo" | "supabase";

declare global {
  var __BUTTER_CAKE_RADAR_REPOSITORY_MODE__: RepositoryMode | undefined;
  var __BUTTER_CAKE_RADAR_REPOSITORY_FALLBACK_REASON__: string | undefined;
}

const getMode = () => {
  if (!globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_MODE__) {
    globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_MODE__ = isSupabaseConfigured
      ? "supabase"
      : "demo";
  }

  return globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_MODE__;
};

const setDemoMode = (reason?: string) => {
  globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_MODE__ = "demo";
  globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_FALLBACK_REASON__ = reason;
};

class ResilientRepository implements Repository {
  private readonly demoRepository = new DemoRepository();
  private supabaseRepository = isSupabaseConfigured
    ? new SupabaseRepository()
    : null;

  private async execute<T>(callback: (repository: Repository) => Promise<T>) {
    if (!this.supabaseRepository || getMode() === "demo") {
      return callback(this.demoRepository);
    }

    try {
      const result = await callback(this.supabaseRepository);
      globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_MODE__ = "supabase";
      globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_FALLBACK_REASON__ = undefined;
      return result;
    } catch (error) {
      if (!isSupabaseSetupError(error)) {
        throw error;
      }

      const reason = getErrorMessage(error);
      this.supabaseRepository = null;
      setDemoMode(reason);
      console.warn(
        `[repository] Supabase setup is incomplete. Falling back to demo data. ${reason}`,
      );

      return callback(this.demoRepository);
    }
  }

  async getRegions(): Promise<RegionRecord[]> {
    return this.execute((repository) => repository.getRegions());
  }

  async listStores(filters: StoreSearchFilters): Promise<StoreWithRelations[]> {
    return this.execute((repository) => repository.listStores(filters));
  }

  async getStoreById(id: string): Promise<StoreWithRelations | null> {
    return this.execute((repository) => repository.getStoreById(id));
  }

  async findSimilarStores(
    input: Pick<StoreInput, "name" | "address" | "sido" | "sigungu">,
  ): Promise<SimilarStoreCandidate[]> {
    return this.execute((repository) => repository.findSimilarStores(input));
  }

  async createStore(input: StoreInput): Promise<StoreWithRelations> {
    return this.execute((repository) => repository.createStore(input));
  }

  async createReport(input: StoreReportInput): Promise<StoreReport> {
    return this.execute((repository) => repository.createReport(input));
  }

  async listAdminDashboard(): Promise<AdminDashboardData> {
    return this.execute((repository) => repository.listAdminDashboard());
  }

  async setStoreStatus(input: {
    id: string;
    status: "active" | "disabled";
    reason?: string;
  }): Promise<StoreWithRelations | null> {
    return this.execute((repository) => repository.setStoreStatus(input));
  }

  async reviewReport(input: {
    id: string;
    resolution?: string;
  }): Promise<StoreReport | null> {
    return this.execute((repository) => repository.reviewReport(input));
  }
}

const repository = new ResilientRepository();

export const getRepositoryRuntime = () => ({
  mode: getMode(),
  fallbackReason:
    globalThis.__BUTTER_CAKE_RADAR_REPOSITORY_FALLBACK_REASON__ ?? null,
});

export { repository };
