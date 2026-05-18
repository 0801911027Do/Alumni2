# ⚡ Quick Start Guide - ET PIM Alumni System

Get up and running in 10 minutes!

---

## Prerequisites

- [x] Google Account
- [x] Modern web browser (Chrome, Firefox, Safari)
- [x] Internet connection
- [x] Google Apps Script file (AppsScript_Updated.gs)

---

## 5-Minute Setup

### Step 1: Deploy Google Apps Script (2 minutes)

1. Open [Google Apps Script Console](https://script.google.com)
2. Create new project
3. Copy code from `AppsScript_Updated.gs`
4. Click **Deploy** → **New deployment**
5. Type: **Web app**
6. Permissions: **Execute as** → Your account
7. Access: **Execute as → Anyone**
8. Copy **Deployment ID**

**Example URL**:
```
https://script.google.com/macros/s/AKfycbw8abc123xyz/exec
```

---

### Step 2: Update Frontend Config (1 minute)

1. Open `alumni.js` in text editor
2. Find line ~20: `const API_URL = ...`
3. Paste your deployment URL
4. Save file

---

### Step 3: Open Application (1 minute)

1. Open `alumni.html` in browser
2. You see login page ✅
3. Login with:
   - Username: `admin`
   - Password: `admin123`

---

### Step 4: Import Sample Data (1 minute)

1. Click **"นำเข้าข้อมูล"** (Import)
2. Select sample Excel file
3. Click **"ยืนยันนำเข้า"** (Confirm)
4. Wait 30 seconds...
5. See "Import successful!" ✅

---

### Step 5: View Dashboard (1 minute)

1. Click **"แdashboard"** in sidebar
2. See statistics, charts, company list
3. You're done! 🎉

---

## First-Time User Tasks

### Task 1: Add Your First Student
**Time: 2 minutes**

1. Click **"เพิ่มข้อมูลใหม่"** (Add New)
2. Fill in basic info:
   - ID: `1234567890123`
   - Name: `นายสมชาย ใจดี`
   - Branch: `CAI`
   - Status: `ทำงาน`
3. Click **"บันทึกข้อมูล"** (Save)
4. See success message ✅

### Task 2: Search for Students
**Time: 1 minute**

1. Go to **"ฐานข้อมูลศิษย์เก่า"** (Alumni Database)
2. Type name in search box
3. See results appear automatically ✅

### Task 3: Export Data to Excel
**Time: 1 minute**

1. Go to Alumni Database
2. Click **"ส่งออก Excel"** (Export)
3. File downloads automatically ✅
4. Open in Excel/Google Sheets

### Task 4: Change Your Password
**Time: 2 minutes**

1. Open `AppsScript_Updated.gs`
2. Find `AUTHORIZED_USERS` (around line 20)
3. Change password for admin:
   ```javascript
   admin: { password: "your_new_password", role: "admin" }
   ```
4. Re-deploy Google Apps Script
5. Try login with new password

---

## Common Commands

### Search for an Employee
```
1. Go to Alumni Database
2. Type company name in search
3. Click company in dropdown
4. See all employees from that company
```

### View Statistics
```
1. Click on any card in Dashboard
2. See detailed list of students
3. Click student for full profile
```

### Filter by Status
```
1. Go to Alumni Database
2. Select status: "ทำงาน" / "ศึกษาต่อ" / etc
3. See only matching students
```

### View Alumni by Branch
```
1. Go to Dashboard
2. Click on branch in doughnut chart
3. Database filters automatically
```

---

## Troubleshooting Checklist

- [ ] Can't login?
  - Check username/password
  - Clear browser cache (Ctrl+Shift+Delete)
  - Check API_URL is correct

- [ ] Dashboard blank?
  - Click "รีเฟรช" (Refresh)
  - Check Google Sheet has data
  - Wait 10 seconds for charts to load

- [ ] Import fails?
  - Check Excel file format (.xlsx)
  - Verify column headers match
  - Delete empty rows
  - Try smaller file first

- [ ] Can't find student?
  - Try different name format
  - Try partial name
  - Refresh data

- [ ] Mobile looks broken?
  - Disable zoom (set to 100%)
  - Rotate phone to landscape
  - Try different browser

---

## Tips for Success

✅ **Always backup** Google Sheet before import
✅ **Test with sample data** first
✅ **Use Chrome** for best compatibility
✅ **Clear cache** if things look wrong
✅ **Import small files** first (under 1000 rows)

---

## Need More Help?

- **Setup Issues**: Read `INSTALLATION.md`
- **How to Use**: Read `USER_GUIDE.md`
- **Error Messages**: Read `TROUBLESHOOTING.md`
- **API Details**: Read `API_DOCUMENTATION.md`
- **Report Issue**: Email support@pim.ac.th

---

## What's Next?

1. ✅ **Setup Complete** - Basic system running
2. ⏭️ **Customize** - Update school name, colors, fields
3. ⏭️ **Populate** - Import real student data
4. ⏭️ **Train** - Teach staff how to use
5. ⏭️ **Deploy** - Move to Vercel for production

---

## Key Features to Explore

- 📊 **Dashboard**: Real-time statistics
- 🔍 **Search**: Find students instantly
- 📥 **Import**: Bulk data entry
- 📤 **Export**: Report generation
- 👥 **Profiles**: Complete student info
- 📱 **Mobile**: Works on phones
- 📈 **Analytics**: Employment insights
- 🏢 **Companies**: Hiring patterns

---

**Version**: 2.0.0  
**Setup Time**: ~10 minutes  
**Skill Level**: Beginner  
**Support**: support@pim.ac.th
