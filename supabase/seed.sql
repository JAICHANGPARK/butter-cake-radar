insert into regions (id, sido, sigungu, label)
values
  ('서울특별시-성동구', '서울특별시', '성동구', '서울특별시 성동구'),
  ('서울특별시-마포구', '서울특별시', '마포구', '서울특별시 마포구'),
  ('부산광역시-부산진구', '부산광역시', '부산진구', '부산광역시 부산진구'),
  ('경기도-수원시 영통구', '경기도', '수원시 영통구', '경기도 수원시 영통구'),
  ('대전광역시-서구', '대전광역시', '서구', '대전광역시 서구')
on conflict (id) do nothing;

insert into stores (
  id,
  name,
  slug,
  summary,
  address,
  sido,
  sigungu,
  latitude,
  longitude,
  phone,
  opening_hours,
  website_url,
  instagram_url,
  status
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '버터하우스 성수',
    '버터하우스-성수',
    '짭짤한 버터떡과 라즈베리 쿠키가 인기인 성수동 디저트 숍',
    '서울특별시 성동구 연무장길 18 1층',
    '서울특별시',
    '성동구',
    37.5444,
    127.0557,
    '02-543-1200',
    '화-일 11:00-20:00',
    'https://butterhouse.example.com',
    'https://instagram.com/butterhouse.seongsu',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '말랑떡연구소 연남',
    '말랑떡연구소-연남',
    '매일 구운 쫀득 버터떡을 진열하는 연남동 작은 실험실',
    '서울특별시 마포구 동교로38길 24',
    '서울특별시',
    '마포구',
    37.563,
    126.9252,
    '070-8812-4545',
    '매일 12:00-21:00',
    null,
    'https://instagram.com/mallanglab',
    'active'
  )
on conflict (id) do nothing;

insert into store_images (store_id, image_url, alt_text, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', '/demo/store-seoul.svg', '버터하우스 성수 대표 이미지', 0),
  ('11111111-1111-1111-1111-111111111111', '/demo/store-detail-a.svg', '버터하우스 성수 진열대 이미지', 1),
  ('22222222-2222-2222-2222-222222222222', '/demo/store-coral.svg', '말랑떡연구소 연남 대표 이미지', 0)
on conflict do nothing;

insert into store_reports (store_id, report_type, note, reporter_name, status)
values
  ('22222222-2222-2222-2222-222222222222', 'wrong_info', '최근 방문했을 때 영업시간이 변경돼 있었습니다.', '연남동 제보자', 'pending'),
  ('11111111-1111-1111-1111-111111111111', 'other', '대표 사진이 오래된 것 같습니다.', null, 'reviewed')
on conflict do nothing;
