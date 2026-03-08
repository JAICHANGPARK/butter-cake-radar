alter table stores
  add column if not exists kakao_map_url text,
  add column if not exists naver_map_url text,
  add column if not exists google_map_url text;
