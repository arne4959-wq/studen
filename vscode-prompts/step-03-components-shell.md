# ขั้น 3 — ชิ้นส่วนใช้ซ้ำ + โครงหน้า (shell)

> วางพรอมต์ด้านล่างนี้ให้ AI

---

อ่านกฎกลาง และ `design-ref/Style.html`, `StateLoading.html`, `StateError.html`, `StateEmpty.html`, `DesktopStates.html`, `Subjects.html`, `DesktopHome.html`, `Profile.html` แล้วทำ **ขั้น 3 เท่านั้น**

## งาน
1. `css/components.css` ทำ class ที่ใช้ซ้ำ (ชื่อแบบ BEM เบา ๆ) ให้ตรงดีไซน์:
   - ปุ่ม: `.btn` (หลัก/เขียวทึบ), `.btn--outline`, `.btn--danger`, `.btn--disabled` (ใช้ `aria-disabled`), ความสูง 48–52px
   - ช่องกรอก: `.field` (label + input + ข้อความช่วยเหลือ + ข้อความ error) พร้อมสถานะ `aria-invalid="true"` ขอบแดง 2px
   - การ์ด `.card`, การ์ดวิชา `.subject-card` (+ สถานะเลือก), แถวบทเรียน `.lesson-row` (done/running/todo)
   - ตัวเลือก Quiz `.choice` (ปกติ/เลือก) ใช้ `<button aria-pressed>`
   - ป้าย `.badge--pass`, `.badge--fail`, ป้ายคำสั่ง
   - แถบความคืบหน้าแบบตัวอักษร: ฟังก์ชัน `asciiBar(percent, width)` ให้ผลเช่น `███░░░░░`
   - `.skeleton` (โครงโหลด), กล่องแจ้งเตือน `.alert--error`, `.alert--success` (`role="alert"`/`role="status"`)
2. `js/ui.js`:
   - `el(tag, props, ...children)` สร้าง DOM ปลอดภัย (ใช้ `textContent`)
   - `renderState(container, 'loading' | 'error' | 'empty', {onRetry, messageKey})` วาดสถานะตามดีไซน์ (error ต้องมีปุ่ม retry)
   - `withState(container, promiseFn, renderFn)` ครอบรูปแบบ: โชว์ loading → เรียก api → สำเร็จ render / ล้ม error+retry / ว่าง empty
   - `toast(messageKey)` และ `confirmDialog({titleKey, bodyKey, confirmKey, danger})` เป็น `<dialog>` หรือ `role="dialog" aria-modal` จริง, ล็อกโฟกัสในหน้าต่าง, ปิดด้วย Esc, คืนโฟกัสเมื่อปิด, บนมือถือเป็นแผ่นเลื่อนขึ้นจากล่าง จอคอมอยู่กลางจอ
3. `js/shell.js` + `css/layout.css`: ฟังก์ชัน `mountShell({active, title, back})` ใส่โครงหน้ามาตรฐานให้ทุกหน้า
   - มือถือ: แถบบน (ปุ่มย้อนกลับถ้ามี + ชื่อหน้า + ปุ่มสลับธีม) + แถบเมนูล่าง 3 ช่อง `subjects | stats | profile`
   - จอคอม ≥768px: แถบข้างซ้าย (โลโก้ + เมนู `subjects/ stats/ profile/`) + แถบแท็บบนมีปุ่มสลับธีม
   - ปุ่มสลับธีมเป็นสวิตช์พระจันทร์/อาทิตย์ตาม `design-ref/Theme.html` ปุ่มสูง 44px มี `aria-label`
4. อัปเดต `styleguide.html` ให้โชว์ทุกคอมโพเนนต์และทุกสถานะ (รวมกดเปิดหน้าต่างยืนยัน, toast, สถานะ loading/error/empty ผ่านปุ่มทดสอบ) ทั้งธีมมืดและสว่าง
5. ข้อความใหม่ทั้งหมดเข้า `lo/th/en.json`

## ห้าม
- ห้ามทำหน้าจริง ห้ามใส่รหัสสีนอก tokens
- ห้ามใช้ `innerHTML` กับข้อความที่มาจากข้อมูล

## ตรวจรับ
- [ ] เทียบ `styleguide.html` กับ `design-ref/Style.html` แล้วหน้าตาตรงกัน ทั้งมืดและสว่าง
- [ ] กดแท็บเมนูด้วยคีย์บอร์ด (Tab/Enter) ได้ มีวงโฟกัสชัดเจน
- [ ] หน้าต่างยืนยัน: Esc ปิดได้, Tab วนอยู่ในหน้าต่าง, ปิดแล้วโฟกัสกลับปุ่มเดิม
- [ ] ย่อ/ขยายหน้าต่างผ่านจุด 767px/768px เมนูสลับระหว่างล่าง↔ข้างถูกต้อง
- [ ] ปุ่มและลิงก์ทุกอันสูง ≥ 44px
- [ ] Console ไม่มี error

เมื่อจบ: สรุป แล้วหยุดรอผม อย่าเริ่มขั้น 4
