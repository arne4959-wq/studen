# ขั้น 2 — ข้อมูลจำลอง + ไฟล์ `api.js`

> วางพรอมต์ด้านล่างนี้ให้ AI

---

อ่านกฎกลาง (หัวข้อ 6 สัญญา API) แล้วทำ **ขั้น 2 เท่านั้น**: ทำให้เว็บ "ดึงข้อมูลได้" โดยยังไม่มี Backend จริง

## งาน
1. `js/config.js`: `export const USE_MOCK = true; export const API_BASE = '/api';`
2. `data/` สร้าง mock JSON ให้ตรงสัญญาเป๊ะ:
   - `subjects.json` 3 วิชา: ໄວຍະກອນ (8 บท, เรียนแล้ว 3), ຄຳສັບ (10 บท, เรียนแล้ว 1 — **แต่ `lessons` ของวิชานี้ให้เป็นว่าง** เพื่อทดสอบสถานะไม่มีข้อมูล), ການອ່ານ (6 บท, 0)
   - `lessons.json` บทเรียนของวิชาไวยากรณ์ (present_simple done, past_simple running, future_simple todo ...)
   - `summaries.json` สรุปบทเรียน Past Simple (อ่านเนื้อหาจาก `design-ref/Summary.html`)
   - `quizzes.json` Quiz 5 ข้อของ Past Simple ตามหัวข้อ `const Q` ใน `design-ref/Quiz.html` (ทุกข้อ 4 ตัวเลือก) **เก็บเฉลยและเหตุผลไว้แยกในไฟล์เดียวกัน** (`answers`) เพื่อให้ `api.js` ใช้ตรวจ ส่วนที่ "ส่งออกไปหน้าเว็บ" ต้องไม่มีเฉลย
   - `dashboard.json` สถิติ + activity 28 วัน + recent 3 รายการ
   - `user.json` ผู้ใช้ตัวอย่าง
3. `js/api.js` (ไฟล์เดียวที่เรียกข้อมูล) ส่งออกฟังก์ชัน: `login, register, forgotPassword, changePassword, logout, getMe, getSubjects, getLessons(subjectId), getSummary(lessonId), getQuiz(lessonId), submitQuiz(payload), getDashboard`
   - โหมด mock: อ่านจาก `data/*.json` หน่วงเวลา 400ms จำลองเครือข่าย
   - `submitQuiz` ในโหมด mock ให้ **คำนวณคะแนนเองจากเฉลย** และคืนรูปแบบเดียวกับสัญญา
   - โหมดจริง: `fetch(API_BASE + path)` แนบ `Authorization: Bearer <token>` (token เก็บใน `store.js`)
   - ทุกฟังก์ชันคืน Promise ที่ **reject ด้วย `ApiError { status, code, message }`** (ทั้งกรณีเครือข่ายล่ม, 401, 409, 500) หน้าอื่นจะได้จัดการข้อผิดพลาดแบบเดียวกัน
   - ตัวช่วยทดสอบสถานะ (ใช้ได้ทั้ง mock): พารามิเตอร์ URL `?mock=slow` (หน่วง 3 วินาที), `?mock=error` (ทุกคำขอล้มด้วย 500), `?mock=empty` (รายการว่าง)
   - ถ้า 401 และไม่ใช่หน้า login ให้เก็บไว้ให้ `guard.js` (ขั้น 4) จัดการ ไม่ต้องทำที่นี่
   - login ใน mock: อีเมล `user@example.com` + รหัสผ่านอะไรก็ได้ที่ยาว ≥ 8 = สำเร็จ, อื่น ๆ = 401 `invalid_credentials`; register อีเมล `taken@example.com` = 409 `email_taken`
4. `tests/api-check.html`: หน้าเรียกทุกฟังก์ชันใน `api.js` แล้วแสดงผ่าน/ไม่ผ่านเป็นรายการ (รวมกรณีผิดพลาด 401/409/`?mock=error`)

## ห้าม
- ห้ามทำ UI ของหน้าจริง ห้ามเรียก `fetch` นอก `api.js`
- ห้ามให้ฟังก์ชัน `getQuiz` ส่งเฉลยออกไป

## ตรวจรับ
- [ ] เปิด `tests/api-check.html` แล้วทุกข้อผ่าน
- [ ] เปิดโดยเติม `?mock=error` แล้วข้อที่ควรล้มแสดงเป็นล้ม (ไม่ใช่ crash)
- [ ] `getQuiz` ที่ได้ไม่มีฟิลด์เฉลย/เหตุผล
- [ ] `submitQuiz` ตอบข้อ 2 ผิดแล้วได้ `score: 4, total: 5, percent: 80` และ `results[1].correct = false`
- [ ] ค้นหา `fetch(` ทั้งโปรเจกต์ เจอเฉพาะใน `js/api.js`
- [ ] ผมเอาไฟล์ `data/*.json` และรายการฟังก์ชัน ไปคุยกับคนทำ Backend ได้ (สรุปให้เป็นตารางสั้น ๆ ท้ายคำตอบ)

เมื่อจบ: สรุป แล้วหยุดรอผม อย่าเริ่มขั้น 3
