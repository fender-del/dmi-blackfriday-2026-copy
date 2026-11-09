# DMI, Black Friday Website Sale 2026 (landing + checkout)

> Bộ nhớ riêng dự án. Gu/luật chung ở `~/.claude/CLAUDE.md`. Ghi chú mới thêm vào đầu "Nhật ký".

## Brief (mail "Fwd: BLACK FRIDAY OUTREACH CAMPAIGN", Ed → Steve → Fender, 06/11/2026)

- Landing page **Black Friday 2026 Website Sale** cho cold outreach (email + social).
- Headline: **BLACK FRIDAY WEBSITE SALE 2026**. Khuyến mãi: **50% OFF WEBSITE DESIGN – BLACK FRIDAY 2026**.
- Tham chiếu thiết kế: https://dmi-website-design.fender-aa2.workers.dev/ (V3, dự án `Downloads/DMI- Service Website-Design`) + 2 ảnh mock AI của Ed (landing + checkout), lưu ở `0-brief/`.
- Checkout: đặt cọc **$99** (Airwallex, Ed tạo link); sau khi cọc, gửi email mời book call với **Jesse**. Mọi thứ nối **GHL** (form làm với **anh Đạt**, theo Steve).
- Deadline: **thứ Ba 10/11/2026, 17:00** (mail ghi nhầm "9 November").

## Quyết định của Fender (09/11, qua bảng hỏi)

- **Host:** đang ở phase thiết kế → tạm `*.fender-aa2.workers.dev`. Sau đó gắn subdomain DMI: **nhắc Fender nhắc Steve (Mkt leader) đưa anh Bằng (IT) gắn subdomain** (DNS detailersmovement.com nằm trên Cloudflare).
- **Quyền lợi/giá: theo đúng mock của Ed** (khác V3):
  - Standard: Normally ~~$1,000~~ → **$500** (50% OFF). Up to 20 pages, Mobile & Tablet Optimised, Lead Forms & Contact Integration, SEO-Friendly Setup, Google Analytics & Search Console. Hosting $25/month.
  - Premium (Best value): Normally ~~$2,000~~ → **$990** (50% OFF). Up to 30 pages (Premium design), như Standard, + 12 Months Hosting – $25/month, 3 Months Local SEO Package (valued at $897), FREE 5 Year Ceramic Coating (50ml bottle).
  - Chai ceramic là sản phẩm thật: dùng ảnh/render thật, đúng tỉ lệ (luật cứng).
- **Thiết kế:** bố cục mock (hero + form → 2 thẻ gói → review → 5 web Standard → 5 web Premium → form quote → dải Limited time) nhưng chất V3: tài sản thật (ảnh/video web khách, 8 review thật từ detailersmovement.com/reviews, logo thật), nền navy DMI, **bỏ glow/neon, review giả** (Tyler M., Carlos R., Jason K. trong mock là giả).
- **Checkout như mock 2:** chọn gói → Your details → tóm tắt đơn (giá gói, cọc $99, còn lại trả trong 14 ngày, hosting $25/tháng cam kết 12 tháng) → lưu lead GHL → chuyển sang Airwallex → trang cảm ơn có nút book call Jesse. Email sau cọc do workflow GHL gửi.
- **Form lead (hero + cuối trang):** đúng mock, 3 trường: Name, Email, Business Name.
- **Đầu vào chưa có gì:** webhook/form GHL (anh Đạt), link lịch Jesse, link Airwallex $99 (Ed) → dựng bằng placeholder.

## Việc chờ người khác
- [ ] Steve → anh Bằng: gắn subdomain detailersmovement.com cho worker.
- [ ] **Ed: Stripe live của DMI không nhận thanh toán** (link GHL Live báo "No valid payment method available"; link Test mode thì hiện ô thẻ). Ed kiểm Stripe dashboard / nối lại Stripe trong GHL. Điều khoản hoàn/huỷ cọc.
- [ ] Fender: dựng workflow GHL "BF26 Deposit paid" (trigger Payment Received, sản phẩm Black Friday 2026 Website Deposit → tag `bf26-deposit-paid` → email link lịch Jesse), bản Draft cần duyệt rồi Publish. UI workflow nằm trong iframe, Claude không click được.
- [ ] Fender: gửi ảnh chai ceramic DMI 50ml → thay `site/assets/bf-bottle-temp.webp` (đang là Apeax Paint 5 Years 20ml, tạm).

## Cấu trúc
- `site/` = thứ lên Cloudflare (`wrangler.jsonc`, worker `dmi-blackfriday`, live tại https://dmi-blackfriday.fender-aa2.workers.dev; push `main` = tự deploy qua Workers Builds). `index.html` (landing), `checkout/`, `thank-you/`, `assets/bf.css` + `bf.js`.
- **`CONFIG` đầu `site/assets/bf.js`:** `ghlWebhook` = `/api/lead`; `payment.standard/premium` = GHL Payment Links (`link.fastpaydirect.com/payment-link/6af14a3303c375ed645fe306` / `6af14af7d4cfb789aef226ae`, product "Black Friday 2026 Website Deposit" $99 id `6af149fb1549b73ef5e8d4e1`, Live mode, redirect về `/thank-you/?pkg=...&paid=1`; **đổi domain thì sửa redirect trong 2 link**); `jesseCalendar` = Acuity của Jesse (trang cảm ơn điền sẵn firstName/lastName/email). Checkout nối `?email=` vào link thanh toán (chỉ email điền sẵn được). Để trống = demo.
- Payload gửi GHL: `type` = `lead` (form hero/quote) hoặc `deposit_started` (checkout), kèm `package`, `package_price`, `deposit`, `name/email/business/phone`, `utm_*`, `campaign`. Lead form xong thì chuyển sang checkout, thông tin điền sẵn (sessionStorage).
- Tài sản chép từ dự án `Downloads/DMI- Service Website-Design` bằng `4-tools/prep_assets.py`. Standard: First Choice, Daniels, Diwal, ATD, Slim's (crop 16:10 đầu trang). Premium: Design 1–5 (link steve-7e8 themes). Review: 3 câu thật (Ryan Lindsey, Michael Heintz, Joey Love). Nền hero = ảnh studio của Premium Design 4.
- Preview: launch `dmi-blackfriday` cổng 8770. QA: `node 4-tools/shots.js` (ảnh vào `4-tools/qa/`), `node 4-tools/flow-test.js` (thử luồng form → checkout → cảm ơn).

## Trang review cho Ed
- `/review/?k=<REVIEW_KEY>` (khoá ở `.dev.vars` + secret Cloudflare `REVIEW_KEY`, không đưa vào git). Xem trước Landing/Checkout/Thank-you (máy tính/điện thoại), góp ý theo từng block (tự nhận block đang xem), danh sách Open/Done, nút Reply. Lưu ở KV `FEEDBACK` (id `604531afecd94bc28aefa8b52994a606`), API `/api/feedback` trong `src/worker.js`. Trang có `noindex` + `no-store`.
- Đọc góp ý: mở trang, hoặc `curl "<site>/api/feedback?k=<key>"`.

## GHL
- Fender gửi **Private Integration Token** (09/11), lưu ở `.dev.vars` (git-ignore, không bao giờ đưa vào `site/`). Location ID `yqROQIaNeeK0xIpi4n67` (đã điền, đã chạy thật).
- Đường đi: form → `POST /api/lead` (Worker `src/worker.js`) → GHL `contacts/upsert` (tag `black-friday-2026`, `bf26-lead` / `bf26-checkout-started`, `bf26-premium|standard`, `bf26-src-<utm_source>`) + ghi chú (gói, giá, utm). Workflow email sau cọc / book call Jesse dựng trong GHL dựa theo tag.
- Khi có Location ID: điền `vars.GHL_LOCATION_ID` trong `wrangler.jsonc`; lúc deploy chạy `npx wrangler secret put GHL_TOKEN`.
- Preview giờ chạy bằng `wrangler dev` cổng 8770 (để `/api/lead` hoạt động).

## Landing dựng từ V3 (từ 09/11 tối)
- `site/index.html` **sinh ra** bằng `python 4-tools/build_from_v3.py` từ `Downloads/DMI- Service Website-Design/2-preview-v3/index.html`, **không sửa tay** (sửa trong `4-tools/parts/` hoặc `site/assets/bf-v3.css|js`, rồi chạy lại). V3 đổi gì thì chạy lại là cập nhật theo.
- Giữ nguyên CSS/JS gốc của V3: header, hero tường web, Standard, Premium (configurator), Reviews, footer. Bỏ: Before/After, Custom, Simulator, CRM. Cuối trang thay CTA/FAQ cũ bằng `parts/end.html` (form quote + FAQ không Custom, thêm câu cọc $99) + dải "Limited time only".
- Hero: `parts/hero-copy.html` (tiêu đề BF + 50% OFF + form 3 trường), `.bf-shade` làm tối nền sau chữ. Đã vá script tường web để bấm vào form không mở web khách.
- Nút "I want one like this" (Standard) và "Choose this design" (Premium) → `checkout/?pkg=...&design=...` (thay vì Messenger), checkout hiện dòng Design, gửi kèm sang GHL.
- **Giá theo Ed (09/11):** Standard ~~$1,000~~ $500 (≤20 trang + 5 quyền lợi mock), Premium ~~$2,000~~ $990 (≤30 trang, Everything in Standard, Local SEO 3 tháng valued $897, tặng ceramic 5 năm 50ml), hosting giữ $25 và $50. Builder (`build_from_v3.py` bước 5b) vá các dòng này trên HTML V3. Checkout có chọn hosting, gửi kèm sang GHL (ghi chú contact).
- Bản landing cũ dựng theo mock: `4-tools/old/index-mock-v1.html`.
- QA: `node 4-tools/shots-v3.js <url>` (ảnh từng block), `node 4-tools/flow-test-v3.js <url>` (6 bước, chặn `/api/lead` và trang Stripe nên không tạo contact rác).

## Nhật ký
- **09/11/2026 (tối muộn):** So lại mock Ed lần cuối: thêm nút header "Get the Black Friday deal", lời dẫn form hero theo mock, Premium "Best value", nút "Get the Standard website for $500". Không lấy 3 slogan (Get More Leads…) và review giả. Dựng trang `/review` cho Ed góp ý.
- **09/11/2026 (khuya 2):** Mail Ed (qua Steve): 50% OFF model, giữ 2 hosting, tặng chai ceramic DMI, 20/30 trang, cọc qua GHL, sau cọc → lịch Jesse. Đã: sửa giá/quyền lợi toàn trang + checkout, chai Apeax tạm, hero điện thoại gọn 1 màn (bỏ kicker + proof, khối 50% OFF + giá gạch), tạo product + 2 Payment Link trong GHL, nối link lịch Jesse. Stripe live của DMI (đã nối GHL, từng thu $99 qua funnel marketingtoolkits 11/2024) hiện không thanh toán được → chờ Ed.
- **09/11/2026 (khuya):** Location ID `yqROQIaNeeK0xIpi4n67` đã điền, token đọc/ghi contacts OK (không có scope locations). Git: repo riêng tư https://github.com/fender-del/dmi-blackfriday-2026 (`main`). Deploy live https://dmi-blackfriday.fender-aa2.workers.dev, secret `GHL_TOKEN` đã đặt. Lead thử: contact `test-bf26@detailersmovement.com` (TEST - please delete) cần xoá trong GHL. Deploy tự động từ git (Workers Builds) cần Fender bấm nối GitHub trong dashboard Cloudflare.
- **09/11/2026 (đêm):** Fender có tài khoản GHL `https://app.detailersmovement.com/` (white-label). Đã hướng dẫn: lấy Location ID từ URL `/v2/location/<ID>/`, token phải tạo trong đúng sub-account (scope contacts); phương án cọc trên GHL (Payment Link / order form funnel + workflow "Payment Received") cần cổng thanh toán GHL hỗ trợ (Stripe…, Airwallex không có sẵn); subdomain: worker phải nằm cùng tài khoản Cloudflare với zone detailersmovement.com → bàn giao cho anh Bằng deploy vào tài khoản DMI rồi Add Custom Domain.
- **09/11/2026 (tối):** Fender yêu cầu lấy đúng block từ source V3 (hero + form, Standard, Premium, testimonial; bỏ Custom) → dựng lại landing bằng builder ở trên. Máy tính 6,8 màn, điện thoại 7,0. QA không lỗi JS, 4 luồng chạy đúng.
- **09/11/2026 (chiều):** Dựng bản đầu cả 3 trang theo bố cục mock + chất V3. Máy tính ~4,4 màn, điện thoại ~6,5 màn. Đã chụp QA và chạy thử luồng: không lỗi. **Ô ảnh chai ceramic để placeholder** ("Bottle photo"): ảnh có sẵn chỉ là Apeax 20ml, không đúng chai DMI 50ml trong mock → cần ảnh thật. Chưa deploy.
- **09/11/2026:** Đọc mail, grill xong hướng triển khai (ở trên).
