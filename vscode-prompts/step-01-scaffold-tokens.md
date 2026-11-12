# ขั้น 1 — โครงโปรเจกต์ + ธีม + หลายภาษา

> วางพรอมต์ด้านล่างนี้ให้ AI (อ่านกฎกลางก่อนเสมอ)

---

อ่านไฟล์กฎกลางของโปรเจกต์ (CLAUDE.md / PROJECT.md) และ `design-ref/Style.html`, `design-ref/Theme.html` ก่อน แล้วทำ **ขั้น 1 เท่านั้น**:

## งาน
1. สร้างโครงโฟลเดอร์ตามหัวข้อ 3 ของกฎกลาง (สร้างเฉพาะโฟลเดอร์และไฟล์ที่ขั้นนี้ต้องใช้ ไฟล์หน้าอื่นยังไม่ต้องสร้าง)
2. `css/tokens.css`: ประกาศ variables ทั้งหมดตามตาราง Design tokens ทั้งโหมดมืด (`:root` และ `[data-theme="dark"]`) และสว่าง (`[data-theme="light"]`) เพิ่มตัวแปรฟอนต์ (`--font-body`, `--font-mono`), ระยะ (`--space-1..6`), มุมโค้ง (`--radius-sm/md/lg`), ขนาดตัวอักษร (`--fs-xs..2xl`)
3. `css/base.css`: reset เบา ๆ, ตั้ง `html { color-scheme }` ตามธีม, ฟอนต์พื้นฐาน, `:focus-visible` ชัดเจน (วงสีเขียวหนา 2px), `prefers-reduced-motion`, โหลดฟอนต์จาก Google Fonts (Noto Sans Lao, Noto Sans Thai, JetBrains Mono) ผ่าน `<link>` ใน HTML ทุกหน้า
4. `js/theme.js`: อ่าน/เก็บธีมใน localStorage (ค่าเริ่มต้น dark), ตั้ง `data-theme` ที่ `<html>` ตั้งแต่ก่อนวาดหน้า (กันกะพริบ), ฟังก์ชัน `toggleTheme()`, `getTheme()`
5. `js/store.js`: ตัวช่วยอ่าน/เขียน localStorage และ sessionStorage โดยครอบ try/catch (ใช้ไม่ได้ก็ไม่พัง)
6. `js/i18n.js`: รองรับ `lo` (ค่าเริ่มต้น), `th`, `en` · `loadLang(code)` โหลดจาก `i18n/<code>.json` · `t(key, vars)` · `applyI18n(root)` แทนข้อความใน element ที่มี `data-i18n`, `data-i18n-attr="placeholder:key"`, ตั้ง `<html lang>` ตามภาษา · `setLang(code)` เก็บใน localStorage · ถ้าไม่มี key ให้แสดง key และ `console.warn`
7. `i18n/lo.json`: ใส่ข้อความที่ใช้ใน styleguide ก่อน (ดึงข้อความลาวจริงจาก design-ref) ใช้ key แบบมีหมวด เช่น `nav.subjects`, `auth.login.title`, `common.retry` ส่วน `th.json` กับ `en.json` ให้แปลร่างแรกครบทุก key เท่ากัน
8. `styleguide.html`: หน้าตรวจรับ แสดงสี/ฟอนต์/ขนาดตัวอักษรตาม `design-ref/Style.html`, มีปุ่มสลับธีม และตัวเลือกภาษา 3 ตัว (ดึงไปใช้ซ้ำในขั้น 3 ได้ จึงเขียนให้แยกเป็นฟังก์ชันได้)
9. `.gitignore` และ `README.md` สั้น ๆ (วิธีรัน: เปิดด้วย Live Server)

## ห้าม
- ห้ามเขียนรหัสสีนอก `tokens.css`
- ห้ามทำหน้าอื่น ห้ามเขียน `api.js` (เป็นของขั้น 2)

## ตรวจรับ (ผมจะตรวจเอง)
- [ ] เปิด `styleguide.html` ด้วย Live Server แล้วตัวอักษรลาวแสดงถูกต้อง
- [ ] กดสลับธีม มืด ⇄ สว่าง ได้ รีเฟรชแล้วจำค่าเดิม และไม่มีการกะพริบสีผิดตอนโหลด
- [ ] เปลี่ยนภาษา ลาว/ไทย/อังกฤษ แล้วข้อความเปลี่ยนทันที รีเฟรชแล้วจำค่าเดิม
- [ ] Console ไม่มี error/warning
- [ ] ค้นหา `#` ตามด้วยรหัสสี ในไฟล์ `.css`/`.js`/`.html` นอก `tokens.css` แล้วไม่พบ

เมื่อจบ: สรุปไฟล์ที่สร้าง วิธีรัน แล้วหยุดรอผม อย่าเริ่มขั้น 2
