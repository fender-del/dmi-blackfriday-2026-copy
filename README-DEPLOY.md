# DMI Black Friday 2026: hướng dẫn deploy (cho IT)

Trang landing + checkout + trang cảm ơn của chiến dịch Black Friday, chạy trên **Cloudflare Workers** (file tĩnh + một Worker nhỏ). Không có database, không có server riêng.

Mục tiêu: chạy trong tài khoản Cloudflare của DMI và gắn subdomain, ví dụ `blackfriday.detailersmovement.com`. Bản tạm hiện tại: https://dmi-blackfriday.fender-aa2.workers.dev

## Gói này gồm

| Đường dẫn | Là gì |
|---|---|
| `site/` | Toàn bộ trang tĩnh (HTML, CSS, JS, ảnh, video). Worker phục vụ thư mục này. |
| `src/worker.js` | Worker: phục vụ `site/` và 3 API (xem dưới). |
| `wrangler.jsonc` | Cấu hình Cloudflare (tên worker, KV, biến môi trường). |

API trong Worker:
- `POST /api/lead`: form trên trang gửi khách vào GoHighLevel (GHL) của DMI.
- `GET /api/spots`: bộ đếm "Only 10 available", đọc số đơn cọc đã trả từ GHL.
- `/api/feedback`: trang góp ý nội bộ `/review/` (lưu trong KV).

## Cần có
- Node.js 18 trở lên.
- Tài khoản Cloudflare đang giữ zone `detailersmovement.com`.
- 2 giá trị bí mật **Fender gửi riêng** (không nằm trong gói): `GHL_TOKEN`, `REVIEW_KEY`.

## Deploy (khoảng 10 phút)

Chạy trong thư mục đã giải nén:

```bash
npx wrangler login
```

**1. Tạo KV cho trang góp ý**, rồi thay `id` trong `wrangler.jsonc` (dòng `kv_namespaces`) bằng id vừa nhận:

```bash
npx wrangler kv namespace create FEEDBACK
```

**2. Đặt 2 bí mật** (mỗi lệnh hỏi giá trị, dán giá trị Fender gửi):

```bash
npx wrangler secret put GHL_TOKEN
```
```bash
npx wrangler secret put REVIEW_KEY
```

Nếu wrangler báo worker chưa tồn tại, chạy bước 3 trước rồi đặt bí mật sau.

**3. Deploy:**

```bash
npx wrangler deploy
```

**4. Gắn subdomain:** Cloudflare dashboard → Workers & Pages → `dmi-blackfriday` → Settings → Domains & Routes → Add → **Custom Domain** → nhập `blackfriday.detailersmovement.com` (hoặc tên khác DMI chọn). Cloudflare tự tạo bản ghi DNS và SSL, vài phút là chạy. Không cần tạo bản ghi DNS bằng tay.

## Kiểm tra sau khi deploy
- Mở `https://<subdomain>/`: trang hiện bình thường.
- Mở `https://<subdomain>/api/spots`: phải trả `{"ok":true,"total":10,...}`. Nếu `ok:false` thì `GHL_TOKEN` chưa đặt đúng.

## Sau khi có subdomain, báo lại Fender để
- Đổi URL chuyển hướng trong 2 Payment Link cọc $99 trên GHL (hiện trỏ về bản tạm `fender-aa2.workers.dev/thank-you/...`).
- Gửi link mới cho chiến dịch email/social và trang góp ý `/review/`.

## Cập nhật nội dung về sau
- **Khuyên dùng:** Workers & Pages → `dmi-blackfriday` → Settings → Build → Connect, nối với repo GitHub của dự án (Fender mời tài khoản GitHub của anh vào repo). Build command để trống, Deploy command `npx wrangler deploy`. Từ đó Fender sửa và push là tự deploy vào tài khoản DMI. Anh vẫn giữ toàn quyền Cloudflare và DNS, Fender không cần quyền gì.
- **Hoặc:** Fender gửi gói mới, anh chạy lại `npx wrangler deploy` (giữ nguyên `id` KV đã sửa ở bước 1).

## Ghi chú
- `GHL_LOCATION_ID` và `SPOTS_TOTAL` (tổng số suất, đang là 10) nằm trong `wrangler.jsonc` → `vars`, không phải bí mật.
- Trang `/review/` chỉ mở được khi có `?k=<REVIEW_KEY>`, và gửi header `noindex` để Google không index.
- Không thu thẻ trên trang này: nút cọc chuyển sang trang thanh toán của GHL (Stripe).
