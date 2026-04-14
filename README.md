# ระบบติดตามศิษย์เก่า (Alumni Tracking System)

## คำอธิบาย
ระบบจัดการและติดตามสถานะการทำงานของศิษย์เก่าสำหรับสถาบันการศึกษา

## คุณสมบัติ
- ✅ ระบบเข้าสู่ระบบที่ปลอดภัย
- ✅ ฐานข้อมูลศิษย์เก่า
- ✅ ติดตามสถานะการจ้างงาน
- ✅ วิเคราะห์ข้อมูลและสถิติ
- ✅ ตัวกรองข้อมูลแบบหมวดหมู่

## เทคโนโลยี
- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- Google Apps Script (Backend)
- Chart.js (Data Visualization)
- Lucide Icons (UI Icons)

## การติดตั้ง

### ขั้นตอน 1: Clone/Download โปรเจค
```bash
git clone <repository-url>
cd Alumni2
```

### ขั้นตอน 2: ตั้งค่า API URL
แก้ไข `alumni.js` และตั้งค่า `API_URL` ให้ชี้ไปยัง Google Apps Script Deployment ID ของคุณ:
```javascript
const API_URL = "https://script.google.com/macros/s/{YOUR_DEPLOYMENT_ID}/exec";
```

### ขั้นตอน 3: Deploy บน Vercel
```bash
npm install -g vercel

# เข้าสู่โฟลเดอร์โปรเจค
cd Alumni2

# Deploy
vercel
```

## การใช้งาน

### เข้าสู่ระบบ
1. หน้าแรก: กรอก username และ password
2. ระบบจะตรวจสอบสิทธิ์ผ่าน API

### ฟีเจอร์หลัก
- **Dashboard**: ดูสถิติและสรุปข่มูล
- **Student Database**: ค้นหา แก้ไข และจัดการข้อมูลศิษย์เก่า
- **Filters**: กรองข้อมูลตามคณะ สาขา และสถานะ

## Deployment Issues บน Vercel

### แก้ไขแล้ว:
1. ✅ **CSS/JS Path**: เปลี่ยนจาก `alumni.css` เป็น `./alumni.css`
2. ✅ **Content-Type Headers**: เพิ่ม headers ในการส่ง CSS และ JS ให้อย่างถูกต้อง
3. ✅ **API CORS**: เพิ่ม `mode: "cors"` ในการ fetch และ timeout handling
4. ✅ **Color Display**: เพิ่ม fallback colors ในกรณี CSS variables ไม่โหลด
5. ✅ **Package.json**: สร้าง package.json เพื่อให้ Vercel รู้จักโปรเจค

## Troubleshooting

### หากหน้าเว็บไม่แสดง:
1. ตรวจสอบ Browser DevTools Console (F12)
2. ตรวจสอบ Network tab เพื่อดูไฟล์ที่โหลด
3. ล้าง Cache: `Ctrl+Shift+Delete`

### หากข้อมูลไม่โหลด:
1. ตรวจสอบ API_URL ในไฟล์ `alumni.js`
2. ตรวจสอบ Google Apps Script Deployment ว่าทำงานหรือไม่
3. ตรวจสอบ CORS settings ในเซิร์ฟเวอร์

### หากสีไม่แสดงตามที่คาดหวัง:
1. ล้าง browser cache
2. Deploy ใหม่บน Vercel: `vercel --prod`

## สำหรับผู้พัฒนา

### ตัวแปร CSS ที่ใช้ (`alumni.css`):
```css
:root {
  --primary: #0f172a;
  --primary-light: #2563eb;
  --accent: #2563eb;
  --bg: #f8fafc;
  --text: #0f172a;
  /* ... เพิ่มเติม */
}
```

### การทดสอบในเครื่อง:
1. เปิด `alumni.html` ด้วย Live Server
2. เปิด DevTools เพื่อ debug
3. ตรวจสอบ Console สำหรับข้อผิดพลาด

## License
MIT License

## ติดต่อ
สำหรับคำถาม หรือรายงานปัญหา กรุณาติดต่อ...
