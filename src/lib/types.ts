export type StoreStatus = "active" | "disabled";

export type ReportStatus = "pending" | "reviewed";

export type ReportType = "wrong_info" | "closed" | "duplicate" | "other";

export interface RegionRecord {
  id: string;
  sido: string;
  sigungu: string;
  label: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  summary: string;
  address: string;
  sido: string;
  sigungu: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  openingHours: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  kakaoMapUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  status: StoreStatus;
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreImage {
  id: string;
  storeId: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface StoreReport {
  id: string;
  storeId: string;
  reportType: ReportType;
  note: string;
  reporterName: string | null;
  reporterContact: string | null;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface StoreWithRelations extends Store {
  images: StoreImage[];
  reports: StoreReport[];
  reportCount: number;
  pendingReportCount: number;
}

export interface StoreReportWithStore extends StoreReport {
  storeName: string;
  storeStatus: StoreStatus;
  storeSido: string;
  storeSigungu: string;
}

export interface StoreSearchFilters {
  sido?: string;
  sigungu?: string;
  q?: string;
  includeDisabled?: boolean;
}

export interface StoreInput {
  name: string;
  summary: string;
  address: string;
  sido: string;
  sigungu: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  kakaoMapUrl?: string;
  naverMapUrl?: string;
  googleMapUrl?: string;
  imageUrls: string[];
}

export interface StoreReportInput {
  storeId: string;
  reportType: ReportType;
  note: string;
  reporterName?: string;
  reporterContact?: string;
}

export interface SimilarStoreCandidate extends StoreWithRelations {
  similarityScore: number;
}

export interface AdminDashboardData {
  stores: StoreWithRelations[];
  reports: StoreReportWithStore[];
}

export interface Repository {
  getRegions(): Promise<RegionRecord[]>;
  listStores(filters: StoreSearchFilters): Promise<StoreWithRelations[]>;
  getStoreById(id: string): Promise<StoreWithRelations | null>;
  findSimilarStores(input: Pick<StoreInput, "name" | "address" | "sido" | "sigungu">): Promise<SimilarStoreCandidate[]>;
  createStore(input: StoreInput): Promise<StoreWithRelations>;
  createReport(input: StoreReportInput): Promise<StoreReport>;
  listAdminDashboard(): Promise<AdminDashboardData>;
  setStoreStatus(input: {
    id: string;
    status: StoreStatus;
    reason?: string;
  }): Promise<StoreWithRelations | null>;
  reviewReport(input: {
    id: string;
    resolution?: string;
  }): Promise<StoreReport | null>;
}
