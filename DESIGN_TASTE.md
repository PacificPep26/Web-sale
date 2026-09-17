# DESIGN_TASTE.md — Quy tắc thiết kế chống "AI-slop" cho project này

> Nguồn: tổng hợp và rút gọn từ 2 skill mã nguồn mở [taste-skill](https://github.com/Leonxlnx/taste-skill) và [impeccable](https://github.com/pbakaus/impeccable), điều chỉnh cho storefront này.
> Cách dùng: dán "Đọc DESIGN_TASTE.md trước khi làm" vào đầu prompt, hoặc chỉ định file này khi giao việc UI/frontend. Không tự động load.

---

## 0. Đọc brief trước, đừng nhảy vào aesthetic mặc định

Trước khi code, xác định trong 1 câu: **loại trang / đối tượng / vibe / hệ thống thiết kế định dùng.**
Ví dụ: "Trang sản phẩm cho khách mua sắm phổ thông, phong cách studio tối giản, dùng Tailwind + ảnh trắng nền sạch."

Nếu brief mơ hồ, hỏi đúng **1 câu**, không hỏi dồn dập. Nếu tự suy luận được thì đừng hỏi.

**Mặc định LLM cần tránh:** gradient tím-AI, hero căn giữa trên nền mesh tối, 3 feature card bằng nhau, glassmorphism tràn lan, animation lặp vô hạn khắp nơi, font Inter + slate-900 mặc định.

---

## 1. Ba "dial" cấu hình (tham khảo, không cần hỏi user)

- **VARIANCE** (1 = đối xứng hoàn hảo → 10 = layout phá cách): mặc định 6-8 cho landing/storefront.
- **MOTION** (1 = tĩnh → 10 = choreography điện ảnh): mặc định 4-6.
- **DENSITY** (1 = art gallery thoáng → 10 = cockpit dày đặc): mặc định 3-4 cho storefront sản phẩm.

---

## 2. Hệ thống & stack

- Tailwind v4 mặc định, dùng CSS Grid thay vì flex-math phức tạp (`grid grid-cols-1 md:grid-cols-3 gap-6` thay vì `w-[calc(33%-1rem)]`).
- **Không** `h-screen` cho hero full-height → dùng `min-h-[100dvh]`.
- Icon: một family duy nhất/project (Phosphor, HugeIcons, Radix, Tabler…). Không tự vẽ SVG icon tay, không mix nhiều thư viện icon.
- Không dùng emoji trong UI trừ khi brief yêu cầu rõ vibe playful.
- Kiểm tra `package.json` trước khi import thư viện mới, đừng giả định nó đã có.
- Một design system / một theme cho toàn project — không mix nhiều hệ thống trong cùng cây component.

---

## 3. Typography

- Tránh Inter làm mặc định — ưu tiên Geist, Outfit, Cabinet Grotesk, Satoshi hoặc serif phù hợp brand.
- **Serif rất hạn chế làm mặc định.** Chỉ dùng khi brand brief nêu rõ tên font serif, hoặc aesthetic thực sự editorial/luxury/heritage. Cấm mặc định: Fraunces, Instrument Serif.
- Nhấn mạnh 1 từ trong headline: dùng italic/bold **cùng font family**, không chèn font khác.
- Chữ italic có ký tự đuôi (y g j p q): `leading-[1.1]` trở lên + `pb-1`/`mb-1` để không bị cắt.
- Body text: measure 65-75ch, contrast ≥4.5:1 (text lớn ≥3:1). Trên nền màu, tint secondary text theo hue nền, không dùng gray thuần.

---

## 4. Màu sắc

- Tối đa 1 accent color/trang, saturation <80%.
- **Luật LILA:** tránh mặc định "AI purple/blue glow". Dùng nền trung tính (Zinc/Slate/Stone) + 1 accent tương phản cao (Emerald, Electric Blue, Deep Rose, Burnt Orange…).
- Một khi chọn accent → dùng nhất quán toàn trang, không đổi giữa chừng.
- Với brief "premium consumer" (đồ gia dụng, mỹ phẩm, thủ công cao cấp): **tránh** bộ màu mặc định be/kem + đồng thau/oxblood/espresso — quá phổ biến trong AI output. Luân phiên các bảng màu khác: cold luxury (xám bạc/chrome), forest (xanh đậm + bone), black & tan, cobalt + cream, terracotta + slate, monochrome + 1 điểm nhấn bão hòa.
- Không pure black `#000000` / pure white `#ffffff` — dùng off-black/off-white.
- Bóng đổ (shadow) tint theo hue nền, không dùng bóng đen thuần; có offset + blur mềm, không phải halo phát sáng 0-offset.

---

## 5. Layout — luật cứng

- Hero phải vừa viewport ban đầu: headline ≤2 dòng, subtext ≤20 từ và ≤3-4 dòng, CTA hiện không cần scroll.
- Hero top padding tối đa `pt-24` desktop.
- Hero tối đa 4 text element (eyebrow HOẶC brand strip, headline, subtext, CTA). Không nhét trust-strip/pricing teaser/feature bullet vào hero.
- Nav phải nằm 1 dòng ở desktop, cao tối đa 80px (mặc định 64-72px).
- Cấm 3 feature-card giống hệt nhau xếp ngang — dùng zig-zag lệch, grid bất đối xứng, hoặc horizontal-scroll.
- Không lặp lại cùng 1 layout family quá 1 lần/trang nếu có thể tránh (landing 8 section nên có ≥4 layout family khác nhau).
- Zigzag "ảnh-trái/chữ-phải" rồi đảo ngược: tối đa 2 section liên tiếp, sang section thứ 3 phải đổi kiểu.
- Bento grid: đúng số cell theo số item thực tế, không để cell trống.
- Một corner-radius scale cho cả trang (all-sharp, all-soft 12-16px, hoặc all-pill cho phần tương tác) — không trộn tùy tiện.
- Danh sách dài (>5 item): không mặc định `<ul>`/`divide-y` — dùng card grid, tabs/accordion, scroll-snap pill, carousel, hoặc nhóm cụm.
- Không dùng card lồng card làm cấu trúc trang chính — card là container lười biếng.

---

## 6. Ảnh & tài nguyên hình ảnh

- Ưu tiên ảnh thật/ảnh generate theo đúng aspect ratio section. Không dựng "fake screenshot" bằng div.
- Logo wall "Trusted by": dùng SVG logo thật (Simple Icons/devicon), không phải text wordmark thường; không thêm nhãn ngành nghề dưới mỗi logo.
- Không tự vẽ illustration trang trí trừ khi được yêu cầu rõ và đơn giản (hình học cơ bản).
- Trang tối giản vẫn cần ảnh thật — text-only không phải minimalism, mà là làm dở.

---

## 7. Nội dung / copy

- Mỗi section: headline ≤8 từ, sub-paragraph ≤25 từ, 1 visual asset hoặc 1 CTA — trừ khi có lý do rõ ràng cần nhiều hơn.
- Không dump bảng dữ liệu dài (20 dòng spec) trên trang marketing — nhóm cụm, dùng card, hoặc "xem thêm".
- Trước khi ship: đọc lại toàn bộ text hiển thị, sửa câu ngữ pháp lủng củng, sáo rỗng kiểu AI.
- Số liệu "giả-chính-xác" (92%, 4.1×...) chỉ dùng khi có dữ liệu thật hoặc đánh dấu rõ là ví dụ.
- Không tên chung chung "John Doe/Acme/Jane Doe", không filler verb ("Elevate", "Seamless", "Revolutionize").
- Quote/testimonial tối đa 3 dòng, có tên + vai trò, không chỉ tên suông.
- **Cấm hoàn toàn dấu em-dash (—) và en-dash làm dấu phân cách (–)** ở mọi nơi hiển thị cho user (headline, nút, caption, quote...). Dùng dấu gạch ngang thường "-" hoặc tách câu.

---

## 8. Các "AI tell" cần tránh tuyệt đối (checklist nhanh)

- Eyebrow (label chữ hoa nhỏ) phía trên MỌI section — tối đa 1 eyebrow / 3 section. Cân nhắc bỏ hẳn — nhiều skill coi đây là "ban", không có brief nào cứu được.
- Số thứ tự section kiểu "00/INDEX", "001 · Capabilities".
- Nhãn version trong hero: "V0.6", "BETA", "EARLY ACCESS" (trừ khi brief đúng là launch).
- Dấu chấm giữa (·) làm separator dùng tràn lan — tối đa 1/dòng.
- Chấm màu trang trí trước nav item/badge/status không mang ý nghĩa thực.
- Pill/label đè lên ảnh ("Plate · Brand"), caption "photo credit" giả tạo.
- Footer version string ("v1.4.2", "Build 0048") trên trang marketing.
- Dải text trang trí cuối hero ("BRAND. MOTION. SPATIAL.").
- Scroll cue ("Scroll to explore", mũi tên xuống) — không cần thiết.
- Locale/thời tiết strip ("Lisbon 14:23 · 18°C") trừ khi brand thực sự gắn với địa điểm/timezone.
- Gradient text làm emphasis — dùng weight/size thay vì gradient.
- Border-left/right màu trên card/callout dày hơn 1px làm điểm nhấn trang trí.
- Hard offset shadow (`4px 4px 0`) trừ khi world thực sự neobrutalist.
- Glass/blur trang trí không có lý do — chỉ dùng khi phù hợp premium/Apple-adjacent vibe, có fallback `prefers-reduced-transparency`.
- Font hệ thống (Arial, system-ui) làm display font chính của trang có identity riêng.
- Emoji/glyph Unicode thay icon system thật.

---

## 9. Nút & form (accessibility)

- Kiểm tra contrast nút CTA: không trắng-trên-trắng, không nút trong suốt không viền trên nền trùng màu. WCAG AA tối thiểu (4.5:1 text thường, 3:1 text lớn ≥18px).
- Label CTA phải fit 1 dòng ở desktop (tối đa 2-3 từ cho CTA chính).
- Không có 2 CTA cùng ý nghĩa trên 1 trang ("Get in touch" + "Contact us" + "Let's talk" → chọn 1 label dùng xuyên suốt).
- Form: label ở TRÊN input, không dùng placeholder thay label, error text dưới input, contrast đạt chuẩn.
- Trạng thái tương tác đầy đủ: hover, disabled, loading (skeleton, không spinner tròn chung chung), error, empty state.

---

## 10. Motion

- Mỗi animation phải có lý do (hierarchy / kể chuyện / feedback / chuyển trạng thái) — không thêm "vì trông cool".
- Chỉ animate `transform` và `opacity` (hardware-accelerated); có thể mở rộng sang blur/backdrop-filter/clip-path nếu mượt.
- **Bắt buộc** tôn trọng `prefers-reduced-motion` khi motion > mức tối thiểu — infinite loop, parallax, scroll-hijack phải fallback về tĩnh.
- Cấm `window.addEventListener('scroll', ...)` — dùng `useScroll()`/ScrollTrigger/IntersectionObserver/CSS scroll-driven animation.
- Tối đa 1 marquee (chữ chạy ngang) / trang.
- Nếu dùng GSAP sticky-stack/horizontal-pan: `start: "top top"`, `pin: true`, scrub đúng cách (xem code mẫu trong taste-skill nếu cần).

---

## 11. Redesign (khi sửa trang có sẵn thay vì làm mới)

1. Audit trước khi sửa: brand token hiện có (màu, font, radius), IA/nav, section nào đang hoạt động tốt, section nào là filler/lỗi thời.
2. Không đổi URL slug, tên field form, nav label chính, logo — trừ khi được yêu cầu rõ.
3. Ưu tiên chỉnh sửa theo thứ tự rủi ro thấp → cao: typography → spacing/rhythm → color → motion layer → hero/section chính → thay toàn bộ block (chỉ khi block cũ không cứu được).
4. Giữ nguyên copy voice trừ khi được yêu cầu viết lại nội dung.

---

## 12. Checklist trước khi báo "xong" (rút gọn từ Pre-Flight Check gốc)

- [ ] Không có dấu em-dash (—) ở bất kỳ đâu.
- [ ] 1 theme (sáng/tối) toàn trang, không lật giữa chừng.
- [ ] 1 accent color nhất quán toàn trang.
- [ ] 1 hệ corner-radius nhất quán.
- [ ] Mọi CTA đọc được rõ trên nền của nó (contrast pass).
- [ ] CTA không bị wrap 2-3 dòng ở desktop.
- [ ] Hero fit viewport, headline ≤2 dòng, subtext ≤20 từ.
- [ ] Nav 1 dòng, ≤80px cao.
- [ ] Không quá 1 eyebrow/3 section.
- [ ] Không 3+ section liên tiếp cùng layout family (đặc biệt zig-zag ảnh/chữ).
- [ ] Không 2 CTA trùng ý nghĩa trên trang.
- [ ] Ảnh thật hoặc generate, không fake-screenshot bằng div.
- [ ] Copy đã đọc lại, không câu lủng củng/sáo AI.
- [ ] Motion có lý do rõ ràng, tôn trọng `prefers-reduced-motion`.
- [ ] Dark mode (nếu áp dụng) đã test cả 2 chế độ.
- [ ] Mobile collapse rõ ràng cho mọi layout đa cột.
- [ ] Không dùng `h-screen`, dùng `min-h-[100dvh]`.

Nếu 1 mục không tick được thật lòng → chưa xong, sửa tiếp trước khi báo hoàn thành.
