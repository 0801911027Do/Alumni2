# ET PIM - Alumni Tracking System
**ระบบบริหารจัดการข้อมูลศิษย์เก่า (Alumni Lifecycle Management)**

![Version](https://img.shields.io/badge/Version-2.0.0-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📋 Overview

A comprehensive web-based system for managing and tracking alumni data for **Faculty of Engineering and Technology, Panyapiwat Institute of Management (PIM)**. The system provides:

- **Dashboard Analytics**: Real-time statistics and employment trends
- **Alumni Database**: Complete student lifecycle tracking
- **Employment Tracking**: Job status, company information, salary ranges
- **Education Continuation**: Track further education opportunities
- **Import/Export**: Excel, CSV, and Google Sheets integration
- **Mobile & Desktop**: Fully responsive design for all devices
- **Role-based Access**: Admin and viewer role management
- **Real-time Calculations**: Automatic employment duration calculation

---

## 🚀 Features

### ✅ Dashboard Features
- Overall statistics and KPIs
- Employment rate and trends
- Education continuation tracking  - Salary averages and ranges
- Visual charts and analytics
- Company hiring statistics

### ✅ Alumni Database
- Comprehensive student records
- Advanced search and filtering
- Student status tracking
- Contact information management
- Employment history
- Internship records

### ✅ Data Management
- **Import**: Excel, CSV, Google Sheets
- **Export**: Excel spreadsheet format
- **Google Drive Integration**: Direct file sync
- **Auto-mapping**: Column detection
- **Data Conversion**: Automatic format normalization

### ✅ Responsive Design
- Desktop optimized (1920px+)
- Tablet ready (768px-1024px)
- Mobile friendly (320px+)
- Smooth animations and transitions
- Touch-optimized interface

### ✅ User Management
- Role-based access control
- Admin panel
- Secure login system
- Session management
- Activity tracking

---

## 📱 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Google Apps Script
- **Data Storage**: Google Sheets
- **Libraries**:
  - Chart.js - Data visualization
  - XLSX.js - Excel processing
  - Lucide Icons - Icon system
  - Google Picker API - File selection

---

## 🔧 Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google Account
- Google Apps Script API enabled
- Basic internet connection

### Step 1: Deploy Google Apps Script

1. Go to [Google Apps Script Console](https://script.google.com)
2. Create a new project
3. Copy the code from `AppsScript_Updated.gs`
4. Paste into the script editor
5. Click **Deploy** → **New Deployment**
6. Select **Type: Web app**
7. Execute as: Your account
8. Who has access: Anyone
9. Copy the deployment URL

### Step 2: Configure API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable APIs:
   - Google Drive API
   - Google Picker API
   - Google Sheets API
4. Create OAuth 2.0 credentials (Web application)
5. Get your API Key

### Step 3: Update Configuration

Open `alumni.js` and update these values:

```javascript
const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
const GOOGLE_API_KEY = "YOUR_API_KEY";
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID";
const GOOGLE_APP_ID = "YOUR_APP_ID";
```

### Step 4: Host the Website

**Option A: Vercel** (Recommended - Already configured)
```bash
vercel deploy
```

**Option B: GitHub Pages**
1. Push to GitHub
2. Enable Pages in repository settings
3. Select main branch as source

**Option C: Any Web Host**
1. Upload all files via FTP
2. Update `vercel.json` as needed
3. Test locally with Live Server

---

## 📊 Database Structure

The system uses Google Sheets with the following columns:

| Column | Description | Type |
|--------|-------------|------|
| เลขประจำตัวประชาชน | ID Card Number | Text |
| รหัสนักศึกษา | Student ID | Text |
| คำนำหน้า | Title | Select |
| ชื่อ (ไทย) | Thai Name | Text |
| นามสกุล (ไทย) | Thai Surname | Text |
| ชื่อ (อังกฤษ) | English Name | Text |
| นามสกุล (อังกฤษ) | English Surname | Text |
| ชื่อเล่น | Nickname | Text |
| เพศ | Gender | Select |
| วัน/เดือน/ปีเกิด | Date of Birth | Date |
| รหัสสาขา | Branch Code | Text |
| สาขา | Branch | Text |
| คณะ | Faculty | Text |
| เบอร์โทรศัพท์ | Phone | Text |
| อีเมล | Email | Email |
| โรคประจำตัว | Disease | Text |
| ที่อยู่ปัจจุบัน | Current Address | Text |
| ที่อยู่ตามทะเบียนบ้าน | Home Address | Text |
| ชื่อ-สกุล ผู้ปกครอง | Parent Name | Text |
| เบอร์โทร ผู้ปกครอง | Parent Phone | Text |
| ความสัมพันธ์ | Relation | Select |
| [+ Internship Data] | Year 1-4 internship details | Various |
| วันจบการศึกษา | Graduation Date | Date |
| สถานะการทำงาน | Job Status | Select |
| วันที่ได้รับการบรรจุ | Start Date | Date |
| ชื่อบริษัทที่ทำงาน | Company | Text |
| ตำแหน่งที่ทำงาน | Position | Text |
| แผนกที่ทำงาน | Department | Text |
| เงินเดือน (บาท) | Salary | Number |
| สถานะปัจจุบัน | Current Status | Select |

---

## 📈 Dashboard Metrics

### Key Performance Indicators
- **Employment Rate**: % of graduates with jobs
- **Average Salary**: Mean salary for employed
- **Time to Employment**: Average duration from graduation to job start
- **Education Continuation**: % pursuing further studies
- **Unemployment Rate**: % between jobs

### Analytics Charts
- 📊 Trend line: Employment over years
- 🥧 Donut: Distribution by branch
- 📈 Bar: Top hiring companies
- 📉 Line: Salary distribution

---

## 🎨 UI/UX Features

### Color Scheme
- **Primary**: Green (#064e3b, #059669, #10b981)
- **Success**: Green (#16a34a)
- **Warning**: Orange (#ea580c)
- **Danger**: Red (#dc2626)
- **Info**: Blue (#0284c7)

### Responsive Breakpoints
- **Desktop**: 1024px+ (Full sidebar + content)
- **Tablet**: 768px-1023px (Collapsible sidebar)
- **Mobile**: Below 768px (Bottom navigation)

### Accessibility
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

---

## 🔐 Security Features

- **Role-based access** (Admin/Viewer)
- **Session management** (localStorage)
- **Input validation** (Client + Server)
- **XSS protection** (HTML escaping)
- **CSRF protection** (Google Apps Script)
- **Data encryption** (HTTPS only)

---

## 📥 Import/Export Guide

### Import Alumni Data

**Supported Formats**: Excel (.xlsx, .xls), CSV, Google Sheets

**Steps**:
1. Click **"นำเข้าข้อมูล"** (Import Data)
2. Drag & drop or select file
3. Choose import method:
   - **Upsert**: Update existing + add new
   - **Append**: Add to existing data
   - **Replace**: Clear all and import new
4. Confirm and wait for completion

### Export Alumni Data

**Steps**:
1. Click **"ส่งออก Excel"** (Export to Excel)
2. File downloads automatically as `Student_Data_Export.xlsx`
3. Open in Excel or Google Sheets

---

## 🎓 User Roles

### Admin
- ✅ View dashboard
- ✅ View all students
- ✅ Add new students
- ✅ Edit student records
- ✅ Delete records
- ✅ Import/Export data

### Viewer  
- ✅ View dashboard
- ✅ View all students
- ❌ Edit records
- ❌ Delete records
- ❌ Import/Export

---

## 🐛 Troubleshooting

### Issue: "API URL ไม่ถูกต้อง"
**Solution**: Check `API_URL` in `alumni.js` matches your Google Apps Script deployment

### Issue: File import fails
**Solution**: Ensure file format is correct (Excel/CSV) and has required columns

### Issue: Login doesn't work
**Solution**: Check Google Apps Script deployment is public and credentials are correct

### Issue: Mobile view not working
**Solution**: Clear cache, disable zoom in browser settings

### Issue: Charts not displaying
**Solution**: Check browser console for JavaScript errors, update Chart.js library

---

## 📞 Support & Contact

- **Documentation**: See `/docs` folder
- **Issues**: Report in GitHub Issues
- **Email**: support@pim.ac.th
- **Hotline**: 02-XXX-XXXX

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔄 Version History

### v2.0.0 (May 2026) - Production Release
- ✅ Complete mobile optimization
- ✅ Fixed all critical bugs
- ✅ Improved UX/UI
- ✅ Added automated calculations
- ✅ Enhanced security
- ✅ Complete documentation

### v1.0.0 (Initial Release)
- Initial system development

---

**Last Updated**: May 18, 2026
**Maintained by**: Faculty of Engineering and Technology, PIM
