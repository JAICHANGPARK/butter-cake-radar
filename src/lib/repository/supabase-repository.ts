import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { REGIONS } from "@/lib/regions";
import type {
  AdminDashboardData,
  Repository,
  Store,
  StoreImage,
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

let supabaseAdminClient: SupabaseClient | null = null;

const getSupabaseAdminClient = () => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      env.supabaseUrl || "https://placeholder.supabase.co",
      env.supabaseServiceRoleKey || "placeholder-service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAdminClient;
};

const unwrap = async <T,>(
  promise: PromiseLike<{ data: T; error: { message: string } | null }>,
) => {
  const result = await promise;

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
};

const mapStore = (row: Record<string, unknown>): Store => ({
  id: row.id as string,
  name: row.name as string,
  slug: row.slug as string,
  summary: row.summary as string,
  address: row.address as string,
  sido: row.sido as string,
  sigungu: row.sigungu as string,
  latitude: row.latitude as number,
  longitude: row.longitude as number,
  phone: (row.phone as string | null) ?? null,
  openingHours: (row.opening_hours as string | null) ?? null,
  websiteUrl: (row.website_url as string | null) ?? null,
  instagramUrl: (row.instagram_url as string | null) ?? null,
  kakaoMapUrl: (row.kakao_map_url as string | null) ?? null,
  naverMapUrl: (row.naver_map_url as string | null) ?? null,
  googleMapUrl: (row.google_map_url as string | null) ?? null,
  status: row.status as "active" | "disabled",
  disabledReason: (row.disabled_reason as string | null) ?? null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapImage = (row: Record<string, unknown>): StoreImage => ({
  id: row.id as string,
  storeId: row.store_id as string,
  imageUrl: row.image_url as string,
  altText: (row.alt_text as string | null) ?? null,
  sortOrder: row.sort_order as number,
  createdAt: row.created_at as string,
});

const mapReport = (row: Record<string, unknown>): StoreReport => ({
  id: row.id as string,
  storeId: row.store_id as string,
  reportType: row.report_type as "wrong_info" | "closed" | "duplicate" | "other",
  note: row.note as string,
  reporterName: (row.reporter_name as string | null) ?? null,
  reporterContact: (row.reporter_contact as string | null) ?? null,
  status: row.status as "pending" | "reviewed",
  resolution: (row.resolution as string | null) ?? null,
  createdAt: row.created_at as string,
  reviewedAt: (row.reviewed_at as string | null) ?? null,
});

export class SupabaseRepository implements Repository {
  async getRegions() {
    return REGIONS;
  }

  async listStores(filters: StoreSearchFilters) {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("stores")
      .select("*, store_images(*), store_reports(*)");

    if (filters.sido) {
      query = query.eq("sido", filters.sido);
    }

    if (filters.sigungu) {
      query = query.eq("sigungu", filters.sigungu);
    }

    if (!filters.includeDisabled) {
      query = query.eq("status", "active");
    }

    if (filters.q) {
      query = query.or(
        `name.ilike.%${filters.q}%,summary.ilike.%${filters.q}%,address.ilike.%${filters.q}%`,
      );
    }

    const rows = (await unwrap(query)) ?? [];
    const stores = buildStoreRelations(
      rows.map((row) => mapStore(row as Record<string, unknown>)),
      rows.flatMap((row) =>
        ((row as { store_images?: Record<string, unknown>[] }).store_images ?? []).map(
          (image) => mapImage(image),
        ),
      ),
      rows.flatMap((row) =>
        ((row as { store_reports?: Record<string, unknown>[] }).store_reports ?? []).map(
          (report) => mapReport(report),
        ),
      ),
    );

    return applyStoreFilters(stores, filters);
  }

  async getStoreById(id: string) {
    const supabase = getSupabaseAdminClient();
    const rows =
      (await unwrap(
        supabase
          .from("stores")
          .select("*, store_images(*), store_reports(*)")
          .eq("id", id)
          .limit(1),
      )) ?? [];
    const [row] = rows;

    if (!row) {
      return null;
    }

    return buildStoreRelations(
      [mapStore(row as Record<string, unknown>)],
      ((row as { store_images?: Record<string, unknown>[] }).store_images ?? []).map((image) =>
        mapImage(image),
      ),
      ((row as { store_reports?: Record<string, unknown>[] }).store_reports ?? []).map(
        (report) => mapReport(report),
      ),
    )[0]!;
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
    const supabase = getSupabaseAdminClient();
    const timestamp = nowIso();
    const storeId = createId();

    await unwrap(
      supabase.from("stores").insert({
        id: storeId,
        name: input.name,
        slug: slugify(input.name),
        summary: input.summary,
        address: input.address,
        sido: input.sido,
        sigungu: input.sigungu,
        latitude: input.latitude,
        longitude: input.longitude,
        phone: input.phone ?? null,
        opening_hours: input.openingHours ?? null,
        website_url: input.websiteUrl ?? null,
        instagram_url: input.instagramUrl ?? null,
        kakao_map_url: input.kakaoMapUrl ?? null,
        naver_map_url: input.naverMapUrl ?? null,
        google_map_url: input.googleMapUrl ?? null,
        status: "active",
        disabled_reason: null,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );

    if (input.imageUrls.length > 0) {
      await unwrap(
        supabase.from("store_images").insert(
          input.imageUrls.map((imageUrl, index) => ({
            id: createId(),
            store_id: storeId,
            image_url: imageUrl,
            alt_text: `${input.name} 이미지 ${index + 1}`,
            sort_order: index,
            created_at: timestamp,
          })),
        ),
      );
    }

    return (await this.getStoreById(storeId))!;
  }

  async createReport(input: StoreReportInput) {
    const supabase = getSupabaseAdminClient();
    const timestamp = nowIso();
    const report = await unwrap(
      supabase
        .from("store_reports")
        .insert({
          id: createId(),
          store_id: input.storeId,
          report_type: input.reportType,
          note: input.note,
          reporter_name: input.reporterName ?? null,
          reporter_contact: input.reporterContact ?? null,
          status: "pending",
          resolution: null,
          created_at: timestamp,
          reviewed_at: null,
        })
        .select("*")
        .single(),
    );

    return mapReport(report as Record<string, unknown>);
  }

  async listAdminDashboard() {
    const supabase = getSupabaseAdminClient();
    const [stores, reports] = await Promise.all([
      this.listStores({ includeDisabled: true }),
      unwrap(
        supabase
          .from("store_reports")
          .select("*, stores(name, status, sido, sigungu)")
          .order("created_at", { ascending: false }),
      ),
    ]);

    return {
      stores,
      reports: (reports ?? []).map((row: Record<string, unknown>) => ({
        ...mapReport(row),
        storeName: (row.stores as { name: string })?.name ?? "알 수 없는 매장",
        storeStatus:
          ((row.stores as { status: "active" | "disabled" })?.status ?? "active"),
        storeSido: (row.stores as { sido: string })?.sido ?? "",
        storeSigungu: (row.stores as { sigungu: string })?.sigungu ?? "",
      })),
    } satisfies AdminDashboardData;
  }

  async setStoreStatus(input: {
    id: string;
    status: "active" | "disabled";
    reason?: string;
  }) {
    const supabase = getSupabaseAdminClient();
    const timestamp = nowIso();

    await unwrap(
      supabase
        .from("stores")
        .update({
          status: input.status,
          disabled_reason: input.status === "disabled" ? input.reason ?? null : null,
          updated_at: timestamp,
        })
        .eq("id", input.id),
    );

    if (input.status === "disabled") {
      await unwrap(
        supabase
          .from("store_reports")
          .update({
            status: "reviewed",
            resolution: input.reason ?? "신고 검토 후 매장이 비노출 처리되었습니다.",
            reviewed_at: timestamp,
          })
          .eq("store_id", input.id)
          .eq("status", "pending"),
      );
    }

    return this.getStoreById(input.id);
  }

  async reviewReport(input: {
    id: string;
    resolution?: string;
  }) {
    const supabase = getSupabaseAdminClient();
    const report = await unwrap(
      supabase
        .from("store_reports")
        .update({
          status: "reviewed",
          resolution: input.resolution ?? "검토 완료",
          reviewed_at: nowIso(),
        })
        .eq("id", input.id)
        .select("*")
        .maybeSingle(),
    );

    return report ? mapReport(report as Record<string, unknown>) : null;
  }
}
