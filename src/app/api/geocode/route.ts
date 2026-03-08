import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/supabase";

type GeocodeCacheEntry = {
  latitude: number;
  longitude: number;
  cachedAt: number;
};

type NominatimResult = {
  lat: string;
  lon: string;
};

declare global {
  var __BUTTER_CAKE_RADAR_GEOCODE_CACHE__:
    | Map<string, GeocodeCacheEntry>
    | undefined;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const getCache = () => {
  if (!globalThis.__BUTTER_CAKE_RADAR_GEOCODE_CACHE__) {
    globalThis.__BUTTER_CAKE_RADAR_GEOCODE_CACHE__ = new Map();
  }

  return globalThis.__BUTTER_CAKE_RADAR_GEOCODE_CACHE__;
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const stripAddressNoise = (value: string) =>
  normalizeWhitespace(
    value
      .replace(/\([^)]*\)/g, " ")
      .replace(/\b(?:지하|B)\s*\d+\s*층\b/gi, " ")
      .replace(/\b\d+\s*층\b/g, " ")
      .replace(/\b\d+\s*호\b/g, " ")
      .replace(/\b\d+층\d+호\b/g, " "),
  );

const buildCandidates = ({
  q,
  roadAddress,
  jibunAddress,
  sido,
  sigungu,
}: {
  q: string;
  roadAddress?: string;
  jibunAddress?: string;
  sido?: string;
  sigungu?: string;
}) => {
  const values = [
    q,
    stripAddressNoise(q),
    roadAddress,
    roadAddress ? stripAddressNoise(roadAddress) : undefined,
    jibunAddress,
    jibunAddress ? stripAddressNoise(jibunAddress) : undefined,
    roadAddress && sido && sigungu ? `${sido} ${sigungu} ${stripAddressNoise(roadAddress)}` : undefined,
    jibunAddress && sido && sigungu
      ? `${sido} ${sigungu} ${stripAddressNoise(jibunAddress)}`
      : undefined,
    `${stripAddressNoise(q)}, South Korea`,
    roadAddress ? `${stripAddressNoise(roadAddress)}, South Korea` : undefined,
    jibunAddress ? `${stripAddressNoise(jibunAddress)}, South Korea` : undefined,
  ]
    .map((value) => (value ? normalizeWhitespace(value) : undefined))
    .filter((value): value is string => Boolean(value));

  return [...new Set(values)];
};

const fetchFirstResult = async (query: string) => {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("countrycodes", "kr");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("accept-language", "ko");

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": `butter-cake-radar/1.0 (${env.siteUrl})`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const results = (await response.json()) as NominatimResult[];
  return results[0] ?? null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const roadAddress = searchParams.get("roadAddress")?.trim() || undefined;
  const jibunAddress = searchParams.get("jibunAddress")?.trim() || undefined;
  const sido = searchParams.get("sido")?.trim() || undefined;
  const sigungu = searchParams.get("sigungu")?.trim() || undefined;

  if (!q) {
    return NextResponse.json(
      { message: "좌표로 변환할 주소가 필요합니다." },
      { status: 400 },
    );
  }

  const cacheKey = [q, roadAddress, jibunAddress, sido, sigungu]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
  const cached = getCache().get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      latitude: cached.latitude,
      longitude: cached.longitude,
      source: "cache",
    });
  }

  try {
    const candidates = buildCandidates({
      q,
      roadAddress,
      jibunAddress,
      sido,
      sigungu,
    });

    for (const candidate of candidates) {
      const result = await fetchFirstResult(candidate);

      if (!result) {
        continue;
      }

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      getCache().set(cacheKey, {
        latitude,
        longitude,
        cachedAt: Date.now(),
      });

      return NextResponse.json({
        latitude,
        longitude,
        source: "nominatim",
        matchedQuery: candidate,
      });
    }

    return NextResponse.json(
      {
        message:
          "주소에 맞는 위치를 찾지 못했습니다. 아래 지도에서 직접 위치를 선택해 주세요.",
      },
      { status: 404 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: `주소 좌표 변환에 실패했습니다. ${getErrorMessage(error)}`,
      },
      { status: 502 },
    );
  }
}
