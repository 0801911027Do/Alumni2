# 🚀 Installation Guide - ET PIM Alumni System

## Full Step-by-Step Setup

---

## Part 1: Google Apps Script Setup

### Step 1.1: Create Google Apps Script Project

1. Visit [Google Apps Script](https://script.google.com)
2. Click **"New project"**
3. Name it: `PIM Alumni Backend`
4. Go to **Project Settings**
5. Copy your Script ID (you'll need this later)

### Step 1.2: Add Backend Code

1. In the editor, replace everything with code from `AppsScript_Updated.gs`
2. Update the `AUTHORIZED_USERS` object with your admin credentials:

```javascript
const AUTHORIZED_USERS = {
  "your_username": "your_password",  // Change this!
  "admin": "your_secure_password"    // Generate a strong password
};
```

3. Click **Save** (Ctrl+S)

### Step 1.3: Deploy as Web App

1. Click **Deploy** → **New Deployment**
2. Select deployment type: **"Web app"**
3. Execute as: Select your Google account
4. Who has access: Select **"Anyone"**
5. Click **Deploy**
6. Copy the **Deployment URL**
7. It should look like:
```
https://script.google.com/macros/s/AKfycbw.../exec
```
8. **Save this URL** - you'll need it in the frontend!

---

## Part 2: Google Cloud Setup

### Step 2.1: Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** → **NEW PROJECT**
3. Name: `PIM Alumni Management`
4. Click **Create**
5. Wait 1-2 minutes for creation

### Step 2.2: Enable Required APIs

1. In the sidebar, go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google Drive API** ← Click Enable
   - **Google Sheets API** ← Click Enable
   - **Google Picker API** ← Click Enable

### Step 2.3: Create Credentials

#### API Key (for Picker):
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the key (looks like: `AIzaSy...`)
4. Click **Restrict key**:
   - Application restrictions: **HTTP referrers (web sites)**
   - Add your domain: `yourdomain.com`
   - API restrictions: **Google Picker API**
5. **Save this key**

#### OAuth 2.0 Client ID:
1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. If prompted, configure OAuth consent screen first:
   - User type: **External**
   - App name: `PIM Alumni`
   - User support email: `your_email@gmail.com`
   - Developer contact: `your_email@gmail.com`
   - Scopes needed: `https://www.googleapis.com/auth/drive.readonly`
   - Test users: Add your email
   - Click **Save & Continue**
3. Application type: **Web application**
4. Name: `PIM Alumni Frontend`
5. Authorized JavaScript origins: Add your domain
   ```
   http://localhost:8000
   https://yourdomain.com
   ```
6. Authorized redirect URIs: (Skip for now)
7. Click **Create**
8. Copy: **Client ID** and **Project ID**

---

## Part 3: Frontend Configuration

### Step 3.1: Update Alumni.js

Open `alumni.js` and update these values (around line 10):

```javascript
const API_URL = 
  "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec";

const GOOGLE_API_KEY = "YOUR_API_KEY_HERE";

const GOOGLE_CLIENT_ID = 
  "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";

const GOOGLE_APP_ID = "YOUR_PROJECT_NUMBER";
```

**Where to find each value**:
- `YOUR_SCRIPT_ID_HERE`: From Step 1.3
- `YOUR_API_KEY_HERE`: From Step 2.3 (API Key)
- `YOUR_CLIENT_ID_HERE`: From Step 2.3 (OAuth 2.0 Client ID)
- `YOUR_PROJECT_NUMBER`: Go to GCP → Project Settings → Project Number

### Step 3.2: Create Google Sheet for Data

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: `PIM Alumni Data 2567`
4. Add columns (Row 1):

```
เลขประจำตัวประชาชน | รหัสนักศึกษา | คำนำหน้า | ชื่อ (ไทย) | นามสกุล (ไทย) | ชื่อ (อังกฤษ) | นามสกุล (อังกฤษ) | ชื่อเล่น | เพศ | วัน/เดือน/ปีเกิด | รหัสสาขา | สาขา | คณะ | เบอร์โทรศัพท์ | อีเมล | โรคประจำตัว | ที่อยู่ปัจจุบัน | ที่อยู่ตามทะเบียนบ้าน | ชื่อ-สกุล ผู้ปกครอง | เบอร์โทร ผู้ปกครอง | ความสัมพันธ์ | ปี1 สาขา 7-Eleven | ปี1 พื้นที่/ภาค | ปี1 รหัสพนักงาน | ปี2 บริษัท | ปี2 ตำแหน่ง | ปี2 แผนก | ปี3 บริษัท | ปี3 ตำแหน่ง | ปี3 แผนก | ปี4 บริษัท | ปี4 ตำแหน่ง | ปี4 แผนก | วันจบการศึกษา | สถานะการทำงาน | วันที่ได้รับการบรรจุ | ชื่อบริษัทที่ทำงาน | ตำแหน่งที่ทำงาน | แผนกที่ทำงาน | เงินเดือน (บาท) | สถานะปัจจุบัน
```

5. Copy the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
6. Go back to Google Apps Script and update:

```javascript
const SHEET_ID = "YOUR_SHEET_ID_HERE";
```

---

## Part 4: Deployment Options

### Option A: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. In your project directory:
```bash
vercel
```

3. Follow prompts, configure as static site
4. Get your Vercel URL: `https://your-project.vercel.app`

### Option B: GitHub Pages

1. Push to GitHub repo
2. Go to repo settings → **Pages**
3. Source: **main** branch → **/root**
4. Save - site deploys automatically
5. URL: `https://username.github.io/repo-name`

### Option C: Firebase Hosting

```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

### Option D: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Option E: Manual/Shared Hosting

1. Upload all files via FTP to:
   ```
   public_html/alumni/
   ```
2. Access via: `https://yourdomain.com/alumni/`

---

## Part 5: Verify Installation

### Checklist:

- [ ] Google Apps Script deployed with backend code
- [ ] Google APIs enabled (Drive, Sheets, Picker)
- [ ] API Key and OAuth credentials created
- [ ] `alumni.js` updated with correct URLs and keys
- [ ] Google Sheet created with columns
- [ ] Frontend deployed (Vercel/GitHub Pages/etc)
- [ ] Visit `alumni.html` in your browser
- [ ] Try logging in with test credentials
- [ ] Dashboard displays correctly
- [ ] Try importing sample data

---

## Part 6: Test Login

### Default Test Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT**: Change these credentials immediately in `AppsScript_Updated.gs`!

---

##  Common Installation Issues

### Issue 1: "API_URL Error"
```
Solution: Copy the exact URL from Step 1.3, ensure no typos
```

### Issue 2: "CORS Error"
```
Solution: 
- Update authorized origins in GCP
- Clear browser cache (Ctrl+Shift+Delete)
- Try in Incognito mode
```

### Issue 3: "403 Forbidden"
```
Solution:
- Check Google Apps Script deployment is set to "Anyone"
- Verify OAuth scopes are correct
- Re-deploy with updated code
```

### Issue 4: "File not found"
```
Solution:
- Ensure all files (HTML, CSS, JS) uploaded
- Check file permissions (should be readable)
- Verify folder structure matches
```

### Issue 5: "Google Picker not working"
```
Solution:
- Verify API Key is correct
- Check Google Picker API is enabled
- Test in Chrome (best support)
```

---

##  Next Steps

1. **Add sample data** using the Import feature
2. **Configure admin accounts** in `AppsScript_Updated.gs`
3. **Customize faculty/branches** if different from Engineering
4. **Set up email notifications** (optional)
5. **Train users** on how to use the system
6. **Enable 2FA** for security (optional)

---

## 📞 Support

- Check `TROUBLESHOOTING.md` for common issues
- Review `USER_GUIDE.md` for feature usage
- Contact: support@pim.ac.th

---

**Version**: 2.0.0
**Last Updated**: May 18, 2026
