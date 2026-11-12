# ໂປຣເຈັກ «ຮຽນງ່າຍ» — ไฟล์กฎกลาง (บันทึกเป็น CLAUDE.md / copilot-instructions.md / PROJECT.md)

> AI: อ่านไฟล์นี้ก่อนทำงานทุกครั้ง และทำตามอย่างเคร่งครัด

## 1. โปรเจกต์คืออะไร
เว็บเรียนรู้ + ทำ Quiz สำหรับนักศึกษา ผู้ใช้เลือกวิชา → เลือกบทเรียน → อ่านสรุป → ทำ Quiz → ดูคะแนนและเฉลย → ดูความคืบหน้า
ภาษาหน้าเว็บหลักคือ **ภาษาลาว** (รองรับ ไทย และ อังกฤษ) สไตล์ **โปรแกรมเมอร์**: ธีมมืดแบบ IDE/เทอร์มินัล, ฟอนต์ monospace, คำสั่งแบบ `$ login`, ผลคะแนนแบบ `PASS/FAIL`, progress แบบตัวอักษร `███░░░░░`

## 2. กฎเหล็ก (ห้ามฝ่าฝืน)
1. **HTML + CSS + JavaScript ล้วน** ห้ามใช้ React/Vue/Tailwind/Bootstrap/jQuery ห้ามมีขั้นตอน build ใช้ ES modules (`<script type="module">`)
2. **Mobile-first** เขียน CSS สำหรับมือถือก่อน แล้วเพิ่ม `@media (min-width: 768px)` สำหรับจอคอม
3. **สี ฟอนต์ ระยะ ใช้ CSS variables จาก `css/tokens.css` เท่านั้น** ห้ามเขียนรหัสสี (#xxxxxx) ในไฟล์อื่น
4. **ข้อความที่ผู้ใช้เห็นทุกตัวต้องผ่านระบบหลายภาษา** (`data-i18n="key"` หรือ `t('key')`) ห้ามฝังข้อความในโค้ด ยกเว้นข้อมูลจาก API
5. **การเรียก API ทั้งหมดผ่าน `js/api.js` ไฟล์เดียว** หน้าอื่นห้ามเรียก `fetch` เอง ตัวสลับ mock/จริงอยู่ที่ `js/config.js` (`USE_MOCK`)
6. **ห้ามใช้ `innerHTML` กับข้อมูลที่มาจากผู้ใช้หรือ API** ใช้ `textContent` หรือฟังก์ชัน escape กลาง (ป้องกัน XSS)
7. **การเข้าถึง (Accessibility)**: ใช้ `<button>`/`<a>`/`<input>`+`<label>` จริง, ปุ่มและลิงก์กดได้สูงอย่างน้อย 44px, มี `:focus-visible` ชัดเจน, ข้อความต้องคอนทราสต์ ≥ 4.5:1, ไอคอนล้วนต้องมี `aria-label`, ข้อความสถานะใช้ `role="status"`/`role="alert"`, ห้ามใช้สีอย่างเดียวบอกสถานะ (ต้องมีข้อความ/ไอคอนด้วย)
8. **ทำทีละขั้นที่สั่ง** ห้ามทำล่วงหน้า ห้ามแก้ไฟล์นอกขอบเขตขั้นนั้น เมื่อจบให้สรุปแล้วหยุดรอ
9. โค้ดเล็ก ชัด ไม่ซับซ้อนเกินจำเป็น ตั้งชื่อเป็นอังกฤษ คอมเมนต์เป็นภาษาไทยเฉพาะส่วนที่ไม่ชัดเอง
10. ห้ามติดตั้งแพ็กเกจเพิ่มโดยไม่ถาม

## 3. โครงโฟลเดอร์
```
/
├─ index.html            ← ตรวจ token แล้วส่งไป subjects.html หรือ login.html
├─ login.html register.html forgot.html
├─ subjects.html summary.html quiz.html score.html review.html
├─ stats.html profile.html language.html change-password.html
├─ 404.html styleguide.html
├─ css/   tokens.css base.css layout.css components.css pages.css
├─ js/    config.js api.js store.js i18n.js theme.js ui.js shell.js guard.js
│         pages/ (ไฟล์ละหน้า เช่น login.js quiz.js)
├─ data/  mock JSON
├─ i18n/  lo.json th.json en.json
├─ design-ref/           ← โค้ดดีไซน์ของทุกหน้า (อ่านอย่างเดียว ห้ามแก้ ห้ามลิงก์ใช้ในเว็บ)
└─ assets/
```

## 4. ดีไซน์อ้างอิง
โฟลเดอร์ `design-ref/` มี HTML ของทุกหน้าที่ออกแบบไว้ (ดูตารางจับคู่ใน `design-ref/README.md`) ให้เปิดไฟล์ที่เกี่ยวข้องก่อนทำแต่ละหน้า แล้วทำให้หน้าตา ระยะห่าง และข้อความตรงกัน แต่เขียนเป็นโค้ดสะอาดของเราเอง (ไม่คัดลอก inline style ทั้งก้อน — แยกเป็น class และใช้ variables)

### Design tokens
| ชื่อ | มืด (default) | สว่าง |
|---|---|---|
| `--bg` พื้นหลังหน้า | #0D1117 | #FBF8F1 |
| `--panel` พื้นการ์ด/แถบ | #161B22 | #FFFFFF |
| `--line` เส้นขอบ | #30363D | #D0D7DE |
| `--text` ตัวอักษร | #E6EDF3 | #1F2328 |
| `--muted` ตัวอักษรรอง | #8B949E | #59636E |
| `--green` สีหลัก/ผ่าน/ปุ่ม | #3FB950 | #1A7F37 |
| `--green-bg` พื้นรายการที่เลือก/ถูก | #0F2A1A | #DAFBE1 |
| `--blue` ชื่อ/ลิงก์ | #79C0FF | #0550AE |
| `--purple` คีย์เวิร์ด | #D2A8FF | #8250DF |
| `--red` ผิด/อันตราย | #FF7B72 | #CF222E |
| `--red-bg` พื้นรายการผิด | #2D1417 | #FFEBE9 |
| `--yellow` เตือน/ตัวเลข | #E3B341 | #7D4E00 |
| `--skeleton` พื้นโครงโหลด | #21262D | #EAEEF2 |
| `--on-green` ตัวอักษรบนปุ่มเขียว | #0D1117 | #FFFFFF |
| `--overlay` ฉากหลังหน้าต่างยืนยัน | rgba(1,4,9,.75) | rgba(31,35,40,.45) |
| `--heat-0..4` ตารางกิจกรรม | ว่าง(--panel), #0E4429, #006D32, #26A641, #39D353 | ว่าง, #9BE9A8, #40C463, #30A14E, #216E39 |

- ฟอนต์เนื้อหา: **Noto Sans Lao** (+ Noto Sans Thai สำหรับป้ายภาษาไทย) ฟอนต์โค้ด/label/ตัวเลข: **JetBrains Mono** (ตามด้วย Noto Sans Lao เป็น fallback)
- มุมโค้ง: ปุ่ม/ช่องกรอก 8px, การ์ด 10px, แผ่นล่าง 16px · ปุ่มสูง 48–52px · พื้นที่ขอบเนื้อหามือถือ 20px
- ธีมสลับด้วย `data-theme="dark|light"` ที่ `<html>` เก็บใน localStorage ค่าเริ่มต้นมืด

## 5. หน้าทั้งหมด
`login` `register` `forgot` · `subjects` `summary` `quiz` `score` `review` · `stats` `profile` `language` `change-password` · `404`
แต่ละหน้ามีสถานะ: ปกติ / กำลังโหลด / ผิดพลาด (มีปุ่มลองใหม่) / ไม่มีข้อมูล และฟอร์มมีสถานะ error ต่อช่อง
เมนู: มือถือ = แถบล่าง `subjects | stats | profile`, จอคอม (≥768px) = แถบข้างซ้าย `subjects/ stats/ profile/` + แถบบนมีปุ่มสลับธีม

## 6. สัญญา API (ชื่อเป็นตัวอย่าง ต้องตกลงกับ Backend)
ทุกการตอบผิดพลาดใช้รูปแบบ `{ "error": "code", "message": "..." }` พร้อม HTTP status ที่เหมาะสม ใช้ `Authorization: Bearer <token>`

| Method + Path | ส่งไป | ได้กลับ |
|---|---|---|
| POST `/api/auth/login` | `{email,password}` | `{token,user:{id,username,email}}` · 401 `invalid_credentials` |
| POST `/api/auth/register` | `{username,email,password}` | เหมือน login · 409 `email_taken` |
| POST `/api/auth/forgot` | `{email}` | `{ok:true}` |
| POST `/api/auth/change-password` | `{current,next}` | `{ok:true}` · 400 `wrong_password` |
| POST `/api/auth/logout` | — | `{ok:true}` |
| GET `/api/me` | — | `{id,username,email}` |
| GET `/api/subjects` | — | `[{id,name,lessonCount,doneCount}]` |
| GET `/api/subjects/:id/lessons` | — | `[{id,order,slug,title,status:"done"\|"running"\|"todo",score?,total?}]` |
| GET `/api/lessons/:id/summary` | — | `{id,title,readMinutes,intro,keyPoints:[string],codeSample?,table:[{from,to}]}` |
| GET `/api/lessons/:id/quiz` | — | `{lessonId,questions:[{id,text,choices:[{id,label}]}]}` (ไม่ส่งเฉลยมาด้วย) |
| POST `/api/quiz/submit` | `{lessonId,answers:[{questionId,choiceId}]}` | `{score,total,percent,results:[{questionId,correct,yourChoiceId,correctChoiceId,explanation}]}` |
| GET `/api/dashboard` | — | `{lessonsDone,lessonsTotal,avgScore,quizzesTaken,activity:[{date,count}],recent:[{lessonId,lessonTitle,score,total,date}]}` |

## 7. วิธีรายงานเมื่อจบแต่ละขั้น
1. รายการไฟล์ที่สร้าง/แก้
2. วิธีรันและวิธีตรวจตามรายการ "ตรวจรับ" ของขั้นนั้น (ระบุ URL ที่ต้องเปิด)
3. สิ่งที่ยังไม่ได้ทำหรือไม่แน่ใจ
4. **หยุดรอ** อย่าเริ่มขั้นต่อไป
