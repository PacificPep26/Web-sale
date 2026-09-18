# Railway — cấu trúc & quy trình push/deploy

Ghi lại đúng trạng thái thực tế đã xác minh (2026-09-18). Có 2 service Next/Medusa
chạy độc lập trên cùng 1 project Railway, cùng đọc từ 1 GitHub repo.

## 1. Cấu trúc project trên Railway

Project: **Sale Web** (`d0520d1b-0197-4190-b0fc-ed8b67db72d4`), environment: **production**
(`0d67056c-b020-4618-ab3e-d072535264e0`).

| Service | Vai trò | Domain | Root dir | Build |
|---|---|---|---|---|
| **Postgres** | Managed DB | nội bộ (`postgres.railway.internal:5432`) | — | — |
| **Web-sale** | Medusa backend | `web-sale-production.up.railway.app` (port 9000) | `/` (repo root) | `apps/backend/Dockerfile` |
| **frontend** | Storefront Next.js (site eyewear) | `luxshade.up.railway.app` (port 3000) | `/` (repo root) | `apps/storefront/Dockerfile` |

Cả 2 service **Web-sale** và **frontend** đều nối trực tiếp với repo GitHub
`https://github.com/PacificPep26/Web-sale.git`, nhánh `main`, Root Directory `/`
(bắt buộc `/` vì đường dẫn `COPY` trong Dockerfile giả định build context là gốc repo).

**Không có service Redis.** Medusa backend chạy production mà không set `REDIS_URL`
— các module event-bus/cache/locking fallback về in-memory, đủ dùng ở quy mô hiện tại.
Nếu sau này cần multi-instance/scale ngang thì phải thêm Redis service + set `REDIS_URL`.

## 2. Biến môi trường đã set

**Web-sale (backend):**
`JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_WORKER_MODE=shared`, `DATABASE_URL`
(reference tới Postgres service), `ADMIN_CORS`, `AUTH_CORS`, `STORE_CORS`, `PORT=9000`.

⚠️ **`STORE_CORS` hiện đang trỏ về domain của chính backend** (`web-sale-production...`)
thay vì domain storefront (`luxshade.up.railway.app`). SSR (server-side fetch từ Next.js)
không bị ảnh hưởng vì đó là request server-to-server, không qua CORS — nhưng bất kỳ
thao tác nào gọi thẳng từ browser tới Store API (add to cart, v.v. nếu code có chỗ
gọi client-side) có thể bị chặn CORS. Cần sửa lại `STORE_CORS` thành đúng domain
frontend nếu gặp lỗi CORS khi thao tác trên site.

**frontend (storefront):**
`SITE=eyewear`, `MEDUSA_BACKEND_URL` / `NEXT_PUBLIC_MEDUSA_BACKEND_URL` =
`https://web-sale-production.up.railway.app`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_EYEWEAR`,
`NEXT_PUBLIC_DEFAULT_REGION=us`, `PORT=3000`.

*Tính năng tìm kiếm bằng ảnh (`/api/image-search`):*
- `GEMINI_API_KEY` (Google AI Studio key)
- `GEMINI_IMAGE_SEARCH_MODEL=gemini-3.5-flash-lite` (khuyến nghị, model 2.5 đã bị Google ngưng hỗ trợ)
- `IMAGE_SEARCH_PER_IP_MINUTE=3`
- `IMAGE_SEARCH_PER_IP_DAY=10`
- `IMAGE_SEARCH_DAILY_LIMIT=100`

## 3. Quy trình push code → lên production

```
sửa code local → git commit → git push origin main → Railway tự build & deploy
```

- **Auto Deploy đang BẬT** cho cả 2 service (Settings → Source → "Auto deploys when
  pushed to GitHub", nhánh `main`). Push lên `main` sẽ tự trigger build mới cho
  **cả backend lẫn frontend** — không cần làm gì thêm.
- Build thường mất 1-3 phút. Theo dõi bằng CLI (xem mục 4) hoặc tab Deployments
  trên dashboard.
- **Từng có lúc webhook không bắn** (nhiều commit bị push liên tiếp mà không thấy
  build mới xuất hiện trong `railway deployment list`). Không rõ nguyên nhân gốc
  (có thể do đụng giới hạn webhook tạm thời). Nếu gặp lại tình trạng này → xem
  mục 5 "Deploy thủ công khi auto-deploy im lặng".

## 4. Lệnh CLI hay dùng

Cần `railway login` 1 lần (đã login sẵn với `tqn8886@gmail.com`), sau đó luôn
`cd` vào gốc repo trước khi chạy lệnh Railway.

```bash
# Link lại nếu CLI mất context (báo lỗi "no linked project")
railway link -p d0520d1b-0197-4190-b0fc-ed8b67db72d4 -e 0d67056c-b020-4618-ab3e-d072535264e0

# Chuyển service đang thao tác (bắt buộc trước khi chạy deployment/variables/logs)
railway service Web-sale      # hoặc: railway service frontend

# Xem lịch sử deploy + trạng thái (SUCCESS / FAILED / BUILDING / REMOVED)
railway deployment list

# Xem log build/runtime của bản deploy mới nhất
railway logs --deployment

# Xem biến môi trường của service đang link
railway variables

# Redeploy lại ĐÚNG bản build đã có sẵn (không kéo code mới từ GitHub!)
railway redeploy -y

# Deploy thẳng code hiện tại trên máy (bỏ qua GitHub hoàn toàn) — xem mục 5
railway up --service frontend --detach
```

## 5. Deploy thủ công khi auto-deploy im lặng

Nếu push xong mà `railway deployment list` không thấy build mới xuất hiện sau
~1 phút, đừng chỉ chạy `railway redeploy` — lệnh đó **build lại đúng commit cũ**
đã deploy trước đó, không kéo code mới. Cách chắc ăn:

```bash
cd <gốc repo>
railway service frontend        # hoặc Web-sale
railway up --service frontend --detach
```

`railway up` upload toàn bộ thư mục hiện tại rồi build — tức là chắc chắn đúng
100% code đang có trên máy, không phụ thuộc GitHub/webhook.

**Bẫy đã gặp:** chạy `railway up` từ gốc repo (monorepo, có `node_modules` nặng
nhiều GB) mà không loại trừ gì → lệnh bị treo/timeout khi upload. Đã tạo sẵn
`.railwayignore` ở gốc repo để loại `node_modules`, `.git`, `.next`, `banner/`,
`bran/`, `.agents/`, ảnh rác ở gốc repo — giữ file này, đừng xoá.

## 6. Kiểm tra sau khi deploy

```bash
# Cả 2 domain phải trả 200
curl -s -o /dev/null -w "backend: %{http_code}\n"  https://web-sale-production.up.railway.app/health
curl -s -o /dev/null -w "frontend: %{http_code}\n" https://luxshade.up.railway.app

# Đối chiếu nội dung mới nhất đã lên live chưa (ví dụ: check 1 class/text/ảnh
# vừa sửa có xuất hiện trong HTML trả về không)
curl -s https://luxshade.up.railway.app | grep -o "<chuỗi đặc trưng vừa sửa>"
```

Nên luôn `npx tsc --noEmit` + `npx eslint .` + `npm run build` ở `apps/storefront`
trước khi push, để chắc chắn Railway không build fail vì lỗi mà local không bắt
được sớm.

## 7. Việc còn dang dở / để sau

- Sửa `STORE_CORS` trên Web-sale thành domain thật của frontend (`luxshade.up.railway.app`)
  thay vì domain của chính nó — hiện đang là leftover từ lúc mới tạo service.
- Domain frontend hiện là `luxshade.up.railway.app` (thiếu chữ "e" so với brand
  "LuxeShade") — do domain generate tự động lúc đầu, có thể đổi domain custom sau
  nếu cần khớp tên thương hiệu.
- 3 niche còn lại (Cases, Toys, Watches) chưa có service riêng trên Railway —
  hiện chỉ mới deploy site Eyewear.
- Chưa tạo Redis service — cân nhắc thêm nếu sau này cần scale nhiều instance
  hoặc cần event-bus bền hơn in-memory.
