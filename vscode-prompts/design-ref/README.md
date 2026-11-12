# design-ref — โค้ดดีไซน์อ้างอิง (อ่านอย่างเดียว)

ไฟล์เหล่านี้คือต้นฉบับของดีไซน์ทุกหน้า (ธีมมืด) เปิดในเบราว์เซอร์ได้เพื่อดูภาพนิ่ง
**ใช้เป็นแบบอ้างอิงเท่านั้น** ห้ามลิงก์หรือคัดลอกทั้งก้อนไปใช้ในเว็บ ให้เขียนใหม่เป็น class + CSS variables

## วิธีอ่านไฟล์
- ทุกอย่างเป็น inline style จึงอ่านสี ขนาด ระยะห่างได้ตรง ๆ
- ข้อความในไฟล์คือข้อความลาวที่ใช้จริง (นำไปทำ `i18n/lo.json`)
- แท็ก `<sc-if>` / `<sc-for>` และ `{{ ... }}` คือเครื่องหมายของเครื่องมือออกแบบ ไม่ใช่ HTML จริง ให้อ่านเป็น "ตรงนี้เปลี่ยนตามสถานะ"
- สคริปต์ท้ายไฟล์ (`class Component`) แสดงลอจิกของสถานะ เช่น Quiz มีกี่ข้อ ข้อมูลตัวอย่าง ใช้เป็นแนวทางเขียนโค้ดจริง
- ข้อมูลตัวเลขและตัวอย่างคำถามเป็นข้อมูลจำลอง

## ตารางจับคู่: ไฟล์ออกแบบ → หน้าที่ต้องสร้าง
| ไฟล์ออกแบบ | หน้าจริง | หมายเหตุ |
|---|---|---|
| `Style.html`, `Theme.html` | `styleguide.html`, `css/tokens.css` | ชุดสี ฟอนต์ คอมโพเนนต์ ปุ่มสลับธีม |
| `Main.html` | — | wireframe ดูลำดับ flow เท่านั้น |
| `Login.html`, `LoginError.html` | `login.html` | LoginError = สถานะผิดพลาดของหน้าเดียวกัน |
| `Register.html`, `RegisterError.html` | `register.html` | ข้อผิดพลาดแสดงใต้ช่องที่ผิด |
| `Forgot.html` | `forgot.html` | มี 2 สถานะ: กรอกอีเมล / ส่งแล้ว |
| `DesktopAuth.html` | login/register/forgot บนจอคอม | แบ่งสองฝั่ง ซ้ายข้อความเทอร์มินัล ขวาฟอร์ม |
| `Subjects.html`, `DesktopHome.html` | `subjects.html` | รายวิชา + รายการบทเรียนของวิชาที่เลือก |
| `Summary.html`, `DesktopSummary.html` | `summary.html` | |
| `Quiz.html`, `DesktopQuiz.html` | `quiz.html` | หลายข้อ, prev/next, ล็อกจนกว่าจะเลือก, หน้าต่างยืนยันออก |
| `Score.html`, `DesktopScore.html` | `score.html` | |
| `Review.html`, `DesktopReview.html` | `review.html` | มือถือ = กางพับ+กรอง, จอคอม = รายการซ้าย รายละเอียดขวา |
| `Dashboard.html`, `DesktopDash.html` | `stats.html` | |
| `Profile.html`, `DesktopProfile.html` | `profile.html` | หน้าต่างยืนยันออกจากระบบ |
| `Language.html`, `ChangePassword.html`, `DesktopSettings.html` | `language.html`, `change-password.html` | จอคอมรวมสองส่วนไว้หน้าเดียว (สร้างเป็นสองหน้าได้ แต่จอคอมให้แสดงเลย์เอาต์สองคอลัมน์ในแต่ละหน้า หรือรวมเป็นหน้าเดียวตามที่ AI เห็นเหมาะ แจ้งผมด้วย) |
| `NotFound.html`, `DesktopNotFound.html` | `404.html` | |
| `StateLoading.html`, `StateError.html`, `StateEmpty.html`, `DesktopStates.html` | ชิ้นส่วน `renderState()` ใน `js/ui.js` | ใช้ได้ทุกหน้า |

โหมดสว่าง: ไม่มีไฟล์แยก ใช้ตารางสีสว่างใน `CLAUDE.md` / `PROJECT.md` แล้วสลับด้วย `data-theme`
