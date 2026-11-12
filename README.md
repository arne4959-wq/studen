# ຮຽນງ່າຍ — เว็บเรียนรู้ + ทำ Quiz

HTML + CSS + JavaScript ล้วน (ES modules) ไม่มี framework / build / แพ็กเกจ · ธีม «โปรแกรมเมอร์» มืด/สว่าง · 3 ภาษา (ລາວ / ไทย / English)

## วิธีรัน

1. เปิดโฟลเดอร์นี้ใน VS Code → คลิกขวา `index.html` → **Open with Live Server**
2. เข้า `http://127.0.0.1:5500/` → ระบบพาไปหน้า login
3. บัญชีทดลอง (โหมด mock): `user@example.com` + รหัสผ่านอะไรก็ได้ ≥ 8 ตัว

> ต้องเปิดผ่านเซิร์ฟเวอร์ (Live Server หรือ `python3 -m http.server`) — เปิดไฟล์ตรง ๆ แบบ `file://` จะโหลด ES modules / JSON ไม่ได้

### ทดสอบสถานะต่าง ๆ (เติมท้าย URL ของหน้าไหนก็ได้)

| พารามิเตอร์ | ผล |
|---|---|
| `?mock=slow` | (เฉพาะโหมด mock) หน่วง 3 วินาที → เห็น skeleton |
| `?mock=error` | ทุกคำขอตอบ 500 → กล่อง ERROR + ปุ่ม retry |
| `?mock=empty` | รายการว่าง / dashboard เป็นศูนย์ → สถานะ empty |

ข้อมูลทดลองอื่น ๆ: `taken@example.com` สมัคร → 409 · เปลี่ยนรหัสผ่านโดยใส่รหัสเดิมสั้นกว่า 8 ตัว → 400 `wrong_password` · วิชา ຄຳສັບ ไม่มีบทเรียน (empty) · บท Reading ไม่มี Quiz (empty)

### หน้าตรวจ (tests/)

เปิดผ่าน Live Server แล้วรอจนบรรทัดสรุปเป็นสีเขียว ทุกหน้าคืนค่า localStorage เดิมให้หลังรันเสร็จ

| หน้า | ตรวจอะไร |
|---|---|
| `tests/api-check.html` | สัญญา API ทุก endpoint, รูปแบบ `ApiError`, `?mock=` ทั้ง 3 แบบ, guard (ไม่มี token / token ปลอม / login แล้วเข้า login) , กัน redirect ออกนอกเว็บ |
| `tests/i18n-check.html` | key ครบเท่ากัน 3 ภาษา, `{placeholder}` ตรงกัน, key ที่โค้ดใช้มีจริง, และสแกนข้อความที่แสดงจริงในทุกหน้า × 3 ภาษา (+ error/empty) ว่าไม่มีข้อความตายตัวหลุด |
| `tests/contrast-check.html` | คอนทราสต์ทุกคู่สีที่ใช้จริงทั้งสองธีม (ข้อความ ≥ 4.5, ขอบ/โฟกัส ≥ 3) |
| `tests/layout-check.html` | 17 หน้า × กว้าง 360/390/768/1280 × mock ปกติ/slow/error/empty — ไม่มีแถบเลื่อนแนวนอน |
| `styleguide.html` | ทุกคอมโพเนนต์ + สถานะ + สลับธีม/ภาษา บนหน้าเดียว |

## โครงโฟลเดอร์

```
*.html            15 หน้า (หน้าเว็บเป็น HTML นิ่ง ข้อความทั้งหมดมาจาก data-i18n)
css/
  tokens.css      ไฟล์เดียวที่มีรหัสสี + ฟอนต์ ระยะ มุมโค้ง ขนาด (CSS variables) ทั้งธีมมืดและสว่าง
  base.css        reset, ตัวอักษร, :focus-visible, .sr-only, skip link, prefers-reduced-motion
  layout.css      แถบบน, เมนู (มือถือ = แถบล่าง / ≥768px = แถบข้าง), layout หน้า auth
  components.css  ปุ่ม ช่องกรอก alert skeleton การ์ด ชิป ตัวเลือก PASS/FAIL diff heatmap switch toast dialog
  pages.css       ส่วนเฉพาะของแต่ละหน้า
js/
  config.js       SUPABASE_URL / SUPABASE_KEY, USE_MOCK, ค่าหน่วง mock
  api.js          ไฟล์เดียวที่เรียก fetch: endpoint ทั้งหมด + mock server + ApiError
  store.js        localStorage/sessionStorage (token, user, ผล Quiz)
  i18n.js         t(key, vars), data-i18n / data-i18n-attr / data-i18n-vars, setLang
  theme.js        สลับธีม + sync ทุกสวิตช์
  ui.js           el(), renderState, withState, toast, confirmDialog, validate + คอมโพเนนต์ที่ใช้ร่วมกัน
  shell.js        initPage(): guard → แถบบน/เมนู → ธีม → ภาษา
  guard.js        requireAuth, redirectIfAuthed, handleUnauthorized (401), safeNext
  pages/*.js      ไฟล์ละหน้า
data/             mock JSON (เฉลยแยกอยู่ใน answers.json — api.js ตรวจเอง, GET quiz ไม่ส่งเฉลย)
                  summaries.json แต่ละบทมีส่วนเสริม (ไม่บังคับ): image {src, alt, caption} · photos [{src, alt, caption, credit, source, width, height}] · examples [{title, story, lines}] · tryIt [{task, answer}] · idea
assets/lessons/   ภาพประกอบบทเรียน <lessonId>.svg (วาดเอง พื้นมืดในตัว ใช้ได้ทั้งสองธีม — ไฟล์ภาพเป็นข้อยกเว้นของกติกา "ไม่มีรหัสสีนอก tokens.css")
                  ต้นฉบับที่ใช้วาด: studen-offline-sources/make_lesson_svgs.py (รันซ้ำเฉพาะเมื่อแก้ภาพ)
assets/photos/    รูปถ่ายอุปกรณ์จริงของวิชาซ่อมคอม จาก Wikimedia Commons — ต้องแสดงเครดิตใต้รูปเสมอ (ดู "เครดิตรูปถ่าย" ท้ายไฟล์นี้)
i18n/             lo.json (หลัก) th.json en.json
tests/            หน้าตรวจด้านบน + harness.js
```

กติกาที่โค้ดยึด: ไม่มีรหัสสีนอก `tokens.css` · `fetch(` มีแค่ใน `api.js` · ไม่ใช้ `innerHTML`/`eval`/`document.write` (ข้อมูลทุกตัวเข้า DOM ผ่าน `textContent` ใน `el()`) · ข้อความที่ผู้ใช้เห็นทุกตัวมาจาก `i18n/*.json`

## ระบบ save (Supabase)

เนื้อหาบทเรียนอยู่ในไฟล์ของเว็บ (`data/*.json`) ส่วนบัญชี ความคืบหน้า คะแนน และ **เฉลย Quiz** อยู่ในฐานข้อมูล Supabase เว็บเรียกผ่าน `js/api.js` ไฟล์เดียวเหมือนเดิม

- `supabase/schema.sql` — ตาราง `progress`, `attempts`, `quiz_answers` + กฎความปลอดภัย (RLS: ผู้เรียนอ่านได้เฉพาะแถวของตัวเอง, เขียนไม่ได้ตรงๆ, อ่านเฉลยไม่ได้) + ฟังก์ชัน `submit_quiz` (ตรวจข้อสอบฝั่งเซิร์ฟเวอร์) และ `my_state`
- `studen-offline-sources/make_answers_sql.py` — สร้าง SQL ใส่เฉลยลงตาราง `quiz_answers` จาก `data/answers.json` (ผลลัพธ์ห้าม commit)
- `js/config.js` — ใส่ `SUPABASE_URL` และ `SUPABASE_KEY` (publishable key เปิดเผยได้ ความปลอดภัยอยู่ที่ RLS) ถ้าเว้นว่าง เว็บใช้โหมดทดลอง (mock) ตามเดิม
- บน localhost เว็บใช้ mock เสมอ (เทสต์ทั้งหมดรันบน mock) อยากลองระบบจริงจาก localhost: `localStorage.setItem("hianngai:real", "1")` ในคอนโซลแล้วรีโหลด
- ใน Supabase ต้องตั้ง Authentication → Sign In / Providers → Email: ปิด "Confirm email" ถ้าอยากให้สมัครแล้วใช้ได้ทันที (ถ้าเปิดไว้ เว็บจะแจ้งให้ไปกดยืนยันในอีเมลก่อน)
- `data/answers.json` ใช้เฉพาะโหมด mock — ตอนเปิดใช้ระบบจริงจะเอาออกจาก GitHub (ใส่ใน `.gitignore`) เพราะเฉลยย้ายไปอยู่ในฐานข้อมูลแล้ว

## เพิ่มภาษาใหม่ (ตัวอย่าง: เวียดนาม `vi`)

1. คัดลอก `i18n/en.json` → `i18n/vi.json` แล้วแปลค่า (ห้ามเปลี่ยน key และต้องคง `{placeholder}` เดิม)
2. เพิ่ม `"lang": { "vi": "Tiếng Việt" }` ลงใน **ทุก** ไฟล์ภาษา
3. `js/i18n.js` → `export const LANGS = ["lo", "th", "en", "vi"];`
4. เพิ่มตัวเลือกใน `language.html` (และ `<option>` ใน `styleguide.html`):
   ```html
   <label class="option"><input type="radio" name="lang" value="vi"><span class="option__name" lang="vi" data-i18n="lang.vi"></span><span class="option__code" translate="no" aria-hidden="true">vi</span></label>
   ```
5. ถ้าภาษาใช้อักษรที่ฟอนต์ปัจจุบันไม่มี ให้เพิ่มฟอนต์ใน `<link>` ของ Google Fonts และใน `--font-body` ที่ `css/tokens.css`
6. เพิ่ม `"vi"` ใน `LANGS` ของ `tests/i18n-check.js` แล้วเปิดหน้านั้นให้ผ่าน

## ข้อจำกัดที่รู้อยู่

- **เฉลยย้อนหลัง**: API ไม่มี endpoint ดึงผล Quiz เก่า เว็บจึงเก็บผลจาก `submitQuiz` ไว้ใน localStorage ของเครื่องนั้น — ประวัติที่มาจาก server (เช่นรายการตั้งต้นใน stats) กดแล้วจะเจอสถานะ "ไม่มีเฉลยในเครื่องนี้" + ปุ่มทำ Quiz ใหม่
- **404 ของ Live Server**: Live Server ไม่เสิร์ฟ `404.html` ให้อัตโนมัติ ถ้าต้องการให้ตั้ง `"liveServer.settings.file": "404.html"` (ใช้ได้ดีกับ path ชั้นเดียว เช่น `/abc.html`; path ซ้อนหลายชั้น CSS แบบ relative จะหาไม่เจอ)
- Mock login รับเฉพาะ `user@example.com` ตามสเปก — บัญชีที่สมัครใหม่ใช้ได้ทันทีหลังสมัคร แต่ login ซ้ำด้วยอีเมลนั้นจะได้ 401

## เครดิตรูปถ่าย (`assets/photos`)

รูปทั้งหมดมาจาก Wikimedia Commons ใช้ได้ฟรีตามสัญญาอนุญาตของแต่ละรูป ทุกไฟล์เป็นรูปย่อขนาด (กว้าง 960 หรือ 500 px) จากต้นฉบับ ไม่ได้แก้ไขอย่างอื่น
รูปที่เป็น CC BY-SA / Free Art License **ต้องคงเครดิตผู้ถ่ายและชื่อสัญญาอนุญาตไว้** (หน้าบทเรียนแสดงให้ใต้รูปจากฟิลด์ `credit` + `source` ใน `data/summaries.json`) ถ้าเปลี่ยนรูป ให้แก้ตารางนี้ด้วย

| ไฟล์ | ผู้ถ่าย | สัญญาอนุญาต | ต้นฉบับ |
|---|---|---|---|
| `r05-inside-pc.jpg` | Bubba73 | CC BY-SA 4.0 | [File:HP SFF desktop computer inside.jpg](https://commons.wikimedia.org/wiki/File:HP_SFF_desktop_computer_inside.jpg) |
| `r05-back-panel.jpg` | Hitachi-Train | Public domain | [File:ASUS P5Q-EM back panel.jpg](https://commons.wikimedia.org/wiki/File:ASUS_P5Q-EM_back_panel.jpg) |
| `r07-hard-disk-open.jpg` | Zzubnik | Public domain | [File:Open hard-drive.jpg](https://commons.wikimedia.org/wiki/File:Open_hard-drive.jpg) |
| `r08-lga-cpu.jpg` | Eric Gaba, Wikimedia Commons user Sting | CC BY-SA 3.0 | [File:Intel CPU Core i7 2600K Sandy Bridge bottom.jpg](https://commons.wikimedia.org/wiki/File:Intel_CPU_Core_i7_2600K_Sandy_Bridge_bottom.jpg) |
| `r08-lga-socket.jpg` | Artem S. Tashkinov | CC BY-SA 3.0 | [File:Intel Socket 1155.jpeg](https://commons.wikimedia.org/wiki/File:Intel_Socket_1155.jpeg) |
| `r08-pga-cpu.jpg` | Liam McSherry | CC BY-SA 3.0 | [File:AMD Phenom X4 9750 (Underside).JPG](https://commons.wikimedia.org/wiki/File:AMD_Phenom_X4_9750_%28Underside%29.JPG) |
| `r09-ram-generations.jpg` | smial | Free Art License | [File:DIMM IMGP5807 ABCDEF smial wp.jpg](https://commons.wikimedia.org/wiki/File:DIMM_IMGP5807_ABCDEF_smial_wp.jpg) |
| `r10-sata-connectors.jpg` | Thomas Rosenau (Pumbaa80) | CC BY-SA 2.5 | [File:Serial ATA hard disk connected.jpg](https://commons.wikimedia.org/wiki/File:Serial_ATA_hard_disk_connected.jpg) |
| `r11-mainboard.jpg` | © Raimond Spekking | CC BY-SA 4.0 | [File:Asus P8H61-MX USB3 - uATX motherboard-6071.jpg](https://commons.wikimedia.org/wiki/File:Asus_P8H61-MX_USB3_-_uATX_motherboard-6071.jpg) |
| `r11-power-supply.jpg` | Victor Korniyenko | CC BY-SA 3.0 | [File:Power Supply ATX-450PNF.jpg](https://commons.wikimedia.org/wiki/File:Power_Supply_ATX-450PNF.jpg) |
| `r11-bios-battery.jpg` | Kent Madsen | CC BY-SA 2.0 | [File:CMOS Battery, Motherboard.jpg](https://commons.wikimedia.org/wiki/File:CMOS_Battery,_Motherboard.jpg) |
