# 📖 User Guide - ET PIM Alumni System

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Alumni Database](#alumni-database)
4. [Adding/Editing Students](#addingediting-students)
5. [Import/Export](#importexport)
6. [Analytics & Reports](#analytics--reports)

---

## Getting Started

### Login

1. Open the application URL in your browser
2. Enter your **Username** and **Password**
3. Click **"เข้าสู่ระบบ"** (Login)
4. Dashboard appears after successful login

**Test Credentials** (First time):
```
Username: admin
Password: admin123
```

**⚠️ NOTE**: Admin should change these credentials immediately!

### User Interface Overview

The system has 3 main sections:

1. **Sidebar** (Left): Navigation menu
   - Dashboard
   - Alumni Database
   - Logout button

2. **Topbar** (Top): Quick actions
   - Search
   - Import/Export buttons
   - Add New button (Admin only)
   - User menu

3. **Main Content**: Dashboard or Database view

---

## Dashboard

The dashboard shows executive summary of all alumni data.

### Dashboard Sections

#### 1. Executive Summary Card
- **Total Alumni**: Count of all records
- **Employment Rate**: % of employed graduates
- **Average Salary**: Mean salary
- **Time to Employment**: Average months to get job

#### 2. Statistics Cards (4 main metrics)
- 🟢 **Employment Rate**: Green card showing %
- 🟠 **Time to Find Job**: Orange card showing average
- 🎓 **Graduation Status**: Purple card
- 🌍 **Education Continuation**: Blue card

#### 3. Employment Status Breakdown
Click any card to see detailed list:
- **ทำงานแล้ว** (Employed): Click to see all working graduates
- **ศึกษาต่อ** (Further Study): Click to see students continuing education
- **กำลังศึกษาอยู่** (Currently Studying): Currently enrolled students
- **ว่างงาน** (Unemployed): Between jobs

#### 4. Top Hiring Companies
- Shows which companies hired most alumni
- Click company name to see all employees from that company
- Shows salary for each employee

#### 5. Employment Trend Chart
- Line graph showing employment over 7 years
- 2 lines: Total graduates vs. Employed

#### 6. Distribution by Branch
- Doughnut chart showing alumni per branch
- Click to filter alumni by that branch

---

## Alumni Database

Access by clicking **"ฐานข้อมูลศิษย์เก่า"** in sidebar.

### Search & Filter

#### Quick Search
Type in search box to find:
- Student name (Thai or English)
- ID card number
- Company name
- Position
- Phone/Email

**Tip**: Search is real-time (searches while you type)

#### Advanced Filters

**Filter by Status**:
- ทุกสถานะ (All Status)
- ทำงาน (Employed)
- ศึกษาต่อ (Studying)
- กำลังศึกษา (Currently Studying)
- ติดภารกิจ (Special Mission)
- ว่างงาน (Unemployed)
- พ้นสภาพ (Discontinued)

**Filter by Branch**:
- All branches OR specific branch
- CAI - Computer Engineering
- CYB - Cybersecurity
- RAE - Robotics & Automation
- AME - Automotive Engineering
- IEM - Industrial & Smart Manufacturing
- DIT - Digital IT

**Filter by Graduation Year**:
- Select specific year

**Filter by Company**:
- Select which company's employees to see

#### Refresh Data
Click **"รีเฟรช"** button to get latest data from server

### Table Columns

| Column | Description |
|--------|-------------|
| # | Row number |
| รหัสนักศึกษา/รุ่น | ID & graduation year |
| ข้อมูลนักศึกษา | Name (Thai & English) |
| สาขาวิชา | Branch (with branch code) |
| ข้อมูลติดต่อ | Phone & email |
| สถานะปัจจุบัน | Employment status (colored badge) |
| สถานที่ทำงาน | Company & position |
| เงินเดือน | Monthly salary |
| ระยะเวลา | Time to employment |
| จัดการ | Action buttons |

### Table Actions

**View Full Profile**:
1. Click **"ข้อมูล"** button
2. Detailed information dialog appears
3. All sections visible:
   - Personal info
   - Contact info
   - Parents info
   - Internship history
   - Employment details

**Edit Student** (Admin only):
1. Click **"แก้ไข"** button
2. Edit form opens with all fields
3. Make changes
4. Click **"บันทึกข้อมูล"** (Save)

---

## Adding/Editing Students

### Add New Student (Admin Only)

1. Click **"เพิ่มข้อมูลใหม่"** button in topbar
2. Form opens with 4 sections:
   - Section 1: Personal & Education Info
   - Section 2: Parent Info
   - Section 3: Internship History
   - Section 4: Employment Status

### Section 1: Personal & Education

**Required Fields** (marked with *):
- Graduation year (ปี ค.ศ.)
- ID Card number (13 digits)
- Title (นาย/นางสาว)
- Thai name & surname
- English name & surname
- Gender
- Date of birth (วว/ดด/ปปปป format)
- Phone
- Email
- Current address
- Home address
- Branch (select from list)

**Filled Automatically**:
- Branch code (after selecting branch)
- Faculty (always Engineering)

### Section 2: Parent Info

- Parent name
- Parent phone
- Relationship (Father/Mother/etc)

### Section 3: Internship History

**Year 1**: 7-Eleven internship
- Branch name
- Area/Region
- Employee ID

**Year 2-4**: Professional internship
- Company name
- Position
- Department

### Section 4: Employment Status

**Select Status**:
- ทำงาน (Employed) - shows job fields
- ศึกษาต่อ (Further study) - shows study details
- กำลังศึกษา (Currently studying)
- ว่างงาน (Unemployed)
- ไม่จบการศึกษา (Not graduated)

**If Employed**:
- Job start date
- Company name
- Position
- Department
- Salary (Baht)
- Current status (Still working/Resigned/etc)

**Fields Automatically Calculated**:
- Duration to get job (calculated from graduation to start date)

### Save & Error Handling

Click **"บันทึกข้อมูล"** (Save):
- If fields missing: Red error boxes appear
- Fix marked fields and try again
- Success message shows when saved

---

## Import/Export

### Import Alumni Data

1. Click **"นำเข้าข้อมูล"** (Import) button
2. Choose import method:

**Option A: Upload File**
- Click drop zone or drag file
- Supported: Excel (.xlsx, .xls), CSV
- System auto-maps columns

**Option B: Google Drive**
- Not fully configured (requires OAuth setup)

### Import Settings

1. Select file
2. Choose import mode:
   - **Upsert** (Default): Update existing records + add new
   - **Append**: Add to existing (keep duplicates)
   - **Replace**: Delete all and import new

3. Click **"ยืนยันนำเข้า"** (Confirm Import)

4. Wait for completion
   - Shows number of records imported
   - Success message appears

### Export Alumni Data

1. Click **"ส่งออก Excel"** button
2. File downloads automatically
3. Filename: `Student_Data_Export.xlsx`

**Exported Columns**:
- All student fields
- Employment information
- Calculated duration

**Uses Current Filters**:
- If filtering by year 66, only 66 exported
- If filtering by status, only that status exported

---

## Analytics & Reports

### Dashboard Analytics

The dashboard provides several analytics:

#### Employment Rate Card
- Shows % of employed
- Formula: (Employed / Total Graduates) × 100
- Color: Green

#### Time to Employment Card
- Average months from graduation to job
- Calculates from all employed students
- Automatically updated

#### Salary Analysis
- Shows average salary of employed graduates
- Filters salaries > 0
- Monthly in Baht (฿)

#### Education Continuation
- Shows % pursuing further studies
- Includes domestic & international

#### Company Ranking
- Top 7 companies hiring PIM graduates
- Click to see detailed list
- Shows salary range per company

### Charts

**Employment Trend** (Line Chart):
- X-axis: Year (ปี พ.ศ.)
- Y-axis: Number of students
- 2 lines: All graduates vs. Employed

**Distribution by Branch** (Doughnut Chart):
- Percentage per branch
- Click to filter by branch
- Colors: Different per branch

---

##  Export & Sharing

### Email Distribution List

To create email distribution list:
1. Export to Excel
2. Copy email column
3. Paste in email client BCC field

### Reporting

Export data and use in:
- Excel pivot tables for deeper analysis
- Google Sheets for collaborative reporting
- Power BI for dashboards
- Mail merge for communications

---

##  Best Practices

### ✅ DO

- Update data regularly (monthly)
- Verify contact info when importing
- Use consistent company names
- Keep phone numbers in standard format
- Back up data regularly

### ❌ DON'T

- Share login credentials via email
- Export full database for external use
- Edit data directly in Google Sheets (use UI)
- Delete records without confirmation
- Import duplicate files

---

##  Tips & Tricks

### Quick Actions

- **Mobile**: Bottom navigation better than sidebar
- **Search**: Use partial names (e.g., "สม" finds all นายสมชาย)
- **Filter**: Combine multiple filters (status + branch + year)
- **Keyboard**: Press Enter to search
- **Export**: Use filtered view to export subset

### Troubleshooting

**Can't find a student**:
1. Try different name format (Thai/English)
2. Check ID card number
3. Try partial search
4. Refresh data

**Form won't submit**:
1. Check all required fields (marked *)
2. Verify date format (วว/ดด/ปปปป)
3. Ensure email is valid
4. Phone must have at least 9 digits

**Import fails**:
1. Ensure Excel has required columns
2. Check date formats (format as dates, not text)
3. Verify company names are consistent
4. Try with fewer records first

---

## 📞 Support & Help

- **Questions**: Check this guide
- **Issues**: See TROUBLESHOOTING.md
- **Features**: Contact admin
- **Email**: support@pim.ac.th

---

**Version**: 2.0.0
**Last Updated**: May 18, 2026
