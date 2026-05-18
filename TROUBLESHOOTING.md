# 🔧 Troubleshooting Guide - ET PIM Alumni System

## Common Issues & Solutions

---

## Login Issues

### Issue 1: "Invalid Username or Password"

**Symptom**: Cannot login even with correct credentials

**Solutions**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try private/incognito mode
3. Check CAPS LOCK is off
4. Verify username matches exactly (case-sensitive)
5. Check admin updated credentials in `AppsScript_Updated.gs`
6. Re-deploy Google Apps Script with latest code

**Check**: Go to `AppsScript_Updated.gs` line ~20, verify `AUTHORIZED_USERS` object

---

### Issue 2: "Server Error" on Login Page

**Symptom**: Error message shows when clicking login

**Solutions**:
1. Check internet connection
2. Verify `API_URL` in `alumni.js` is correct
3. Test URL directly in browser: `https://script.google.com/macros/s/YOUR_ID/exec`
4. If 403 error: Google Apps Script not set to public
   - Go to Google Apps Script → Deploy → Edit deployment
   - Change "Who has access" to "Anyone"
   - Deploy again

**Check**: Open browser DevTools (F12) → Network tab → See what error is returned

---

### Issue 3: "API_URL Error" Message

**Symptom**: Warning about API_URL not being set

**Solution**:
1. Open `alumni.js`
2. Find line: `const API_URL = ...`
3. Paste your Google Apps Script URL from Step 1.3
4. Format should be: `https://script.google.com/macros/s/AKfycbw.../exec`
5. Save file
6. Refresh browser (Ctrl+F5) - hard refresh
7. Clear storage: DevTools → Application → Clear Site Data

---

### Issue 4: "Can't Connect to Server"

**Symptom**: Timeout or connection refused

**Possible Causes**:
- Internet down
- Google Apps Script deployment deleted
- API_URL has typo
- Google blocking requests (rare)

**Solutions**:
1. Test internet: Open google.com
2. Check Google Apps Script is deployed:
   - Visit [Google Apps Script Console](https://script.google.com)
   - Click your project
   - Check "Deployments" section
3. Get correct URL from Deployments tab
4. Update alumni.js and refresh

---

## Dashboard Issues

### Issue 5: Dashboard Shows "No Data"

**Symptom**: Dashboard empty even though data exists

**Solutions**:
1. Click **"รีเฟรช"** (Refresh) button
2. Check Google Sheet has data (with all required columns)
3. Verify columns named exactly (Thai text must match)
4. Check Sheet ID in `AppsScript_Updated.gs`:
   ```javascript
   const SHEET_ID = "YOUR_SHEET_ID";
   ```
5. Make sure Google Apps Script can access the Sheet
6. Check Sheet permissions (should be editable by script)

**Check**: Open Google Sheet directly → Verify data visible

---

### Issue 6: Charts Not Displaying

**Symptom**: Charts section blank, says "No Data"

**Possible Causes**:
- Chart.js library failed to load
- Data format issues
- Browser JavaScript error

**Solutions**:
1. Check internet (CDN must load)
2. Open DevTools (F12) → Console tab
3. Look for red errors mentioning "Chart"
4. If "Chart is not defined": Chart.js didn't load
   - Wait 5 seconds and refresh
   - Try different browser (Chrome best)
5. Check data: Dashboard needs at least 5 records across 2 years

---

### Issue 7: Statistics Show Incorrect Numbers

**Symptom**: Employment rate or salary calculation wrong

**Possible Causes**:
- Salary field has text instead of numbers
- Job status values don't match exactly
- Date calculations off

**Solutions**:
1. In Google Sheet, check salary column:
   - Should be numbers only (not "฿30000")
   - Remove currency symbols
2. Check job status values match exactly:
   - "ทำงาน" (not "ทำงานแล้ว" or with spaces)
3. Verify dates are in YYYY-MM-DD format
4. Clear browser cache and refresh

---

## Database & Search Issues

### Issue 8: Search Not Working

**Symptom**: Searching for text returns no results even though data exists

**Solutions**:
1. Clear search box and try again
2. Try searching with different format:
   - If searching "นายสมชาย", try "สมชาย"
   - If searching English name, try Thai name
3. Check spelling (system is case-sensitive for English)
4. Verify data is loaded: Check table has rows
5. Try **"รีเฟรช"** button to reload data

**Note**: Search is real-time and matches partial strings

---

### Issue 9: Filter Not Working

**Symptom**: Filter buttons selected but nothing changes

**Solutions**:
1. Check if multiple filters applied (may result in no matches)
2. Try removing filters one at a time
3. Click **"รีเฟรช"** button
4. Check data exists for that combination

**Example**: If filtering for "Graduated 67" AND "Branch CYB" AND "Company Google", there might be no matches

---

### Issue 10: "No Records Found" in Table

**Symptom**: Table is empty but data should exist

**Possible Causes**:
- All filters too restrictive
- Data not loaded yet
- Search string matches nothing

**Solutions**:
1. Clear all filters by refreshing
2. Check "Total Records" counter
3. Remove search text and filters gradually
4. Click **"รีเฟรช"** to reload from server
5. If still empty: Google Sheet may be empty

---

## Add/Edit Student Issues

### Issue 11: Form Won't Submit / "Please Fill Required Fields"

**Symptom**: Red error boxes appear, can't save

**Solutions**:
1. Check all fields with asterisk (*) are filled
2. Verify date format (should be วว/ดด/ปปปป):
   - Example: 15/05/2567 (not 2024)
3. ID card must be 13 digits
4. Email must be valid format (with @)
5. Branch must be selected (click one of the buttons)
6. Scroll to find all required fields
7. Save again after fixing

**Validation Rules**:
- ID Card: Exactly 13 numbers
- Email: Must contain @
- Phone: At least 9 digits
- Dates: วว/ดด/ปปปป format
- Name fields: Cannot be empty

---

### Issue 12: "ID Card Number Already Exists"

**Symptom**: Error when trying to save new student

**Possible Causes**:
- Student already in database
- Duplicate entry
- Wrong ID number entered

**Solutions**:
1. Search database for that ID card number
2. If found: Edit existing record instead of adding new
3. If not found: Try refreshing browser (ID may not have synced)
4. Verify ID number is correct (check original documents)

---

### Issue 13: Form Data Lost When Page Refreshes

**Symptom**: Filled form disappears if accidentally refresh

**Prevention**:
- System auto-saves draft in browser (localStorage)
- When opening form again, previous data restored

**Recovery**:
1. If data lost, check browser history (don't restore session)
2. Re-enter data carefully
3. Click Save button to confirm

---

## Import/Export Issues

### Issue 14: Import File Not Accepting

**Symptom**: Can't select or upload file

**Possible Causes**:
- Wrong file format
- File too large
- Browser security

**Solutions**:
1. Check file format: .xlsx, .xls, or .csv only
2. Check file size: Must be under 5MB
3. Try different file name (no special characters)
4. Convert to Excel first:
   - If CSV in wrong format
   - Open in Excel, re-save as .xlsx
5. Try different browser
6. Disable browser extensions (ad-blockers might block)

---

### Issue 15: Import Shows "Invalid Structure"

**Symptom**: Excel file rejects during import

**Possible Causes**:
- Missing required columns
- Column names don't match
- Empty rows confusing parser

**Solutions**:
1. Open your Excel file
2. Check Row 1 has column headers
3. Verify column names match exactly:
   ```
   เลขประจำตัวประชาชน | รหัสนักศึกษา | ชื่อ (ไทย) | etc.
   ```
4. Delete empty rows (don't start data from row 2)
5. Check no merged cells
6. Re-save as .xlsx and try again

**Tip**: Use sample Excel file from docs/sample_data.xlsx as template

---

### Issue 16: Import Gets Stuck / Hangs

**Symptom**: Import starts but never completes

**Possible Causes**:
- Large file (>10,000 rows)
- Slow internet
- Google Apps Script timeout

**Solutions**:
1. Wait 2-3 minutes (could be processing)
2. Check browser console (F12) for errors
3. Try importing in smaller batches:
   - Split Excel into 2-3 files
   - Import separately
4. Try different browser
5. Check internet speed (speedtest.net)

**Limit**: Google Apps Script times out after 6 minutes

---

### Issue 17: Export File Empty or Corrupted

**Symptom**: Exported Excel file won't open or is blank

**Solutions**:
1. Check anti-virus didn't block download:
   - Check Downloads folder
   - Check anti-virus quarantine
2. Try opening with different program:
   - Microsoft Excel
   - Google Sheets
   - LibreOffice
3. If file is 0 bytes: No data to export
   - Check data exists in database
   - Try without filters first
4. Download again in different browser

---

### Issue 18: Imported Data Has Errors

**Symptom**: Data imported but values are wrong/corrupted

**Possible Causes**:
- Date format conversion failed
- Excel number format issues
- Character encoding wrong

**Solutions**:
1. Check source Excel:
   - Dates should be in actual date format (not text)
   - Formats: DD/MM/YYYY or YYYY-MM-DD
2. Remove currency symbols from salary:
   - "30000" not "฿30,000.00"
3. Check character encoding:
   - File should be UTF-8
   - In Excel: File → Options → Advanced → Encoding
4. Check numbers aren't stored as text:
   - Right-click → Format Cells → Number
5. Delete erroneous data and re-import

---

## Mobile & Responsive Issues

### Issue 19: Mobile View Broken

**Symptom**: UI looks wrong on phone

**Solutions**:
1. Disable zoom: Browser settings → Zoom = 100%
2. Rotate phone to landscape (some views better)
3. Try different browser (Chrome, Firefox, Safari)
4. Clear browser cache (Settings → Clear Data)
5. Try different phone:
   - Issue may be with specific device
   - Especially old devices (iPhone 6, etc.)

**Supported Phones**:
- iPhone 8+
- Samsung Galaxy S8+
- Any modern phone (2018+)
- Tablets all sizes

---

### Issue 20: Bottom Navigation (Mobile) Not Showing

**Symptom**: Can't see navigation menu on phone

**Possible Cause**:
- Screen too small or not mobile detected

**Solutions**:
1. Rotate to landscape and back to portrait
2. Refresh browser (Ctrl+R)
3. Clear cache and refresh
4. Try browser's "Request Desktop Site" OFF
5. Report if persists (may be older device)

---

## Browser-Specific Issues

### Issue 21: Works in Chrome but Not Other Browsers

**Symptom**: App works fine in Chrome, breaks in Firefox/Safari/Edge

**Possible Causes**:
- JavaScript compatibility
- CSS support different
- Storage/permissions issues

**Solutions**:

**Firefox**:
1. Clear site data: Settings → Privacy → Clear cookies/cache
2. Disable Extensions (especially privacy ones)
3. Allow popups: Settings → Permissions

**Safari**:
1. Disable "Privacy Browsing"
2. Allow cookies: Settings → Privacy → Allow all
3. Update Safari to latest version

**Edge**:
1. Clear cache: Settings → Privacy → Clear
2. Disable Extensions
3. Try InPrivate mode

**General**:
1. Update browser to latest
2. Try Firefox (best compatibility)

---

## Performance Issues

### Issue 22: App Running Slow / Lagging

**Symptom**: Page takes long to load or feels sluggish

**Possible Causes**:
- Large dataset (10,000+ records)
- Slow internet
- Too many browser tabs open
- Computer resources low

**Solutions**:
1. Close other browser tabs
2. Close other applications
3. Restart browser
4. Check internet speed (speedtest.net)
5. Try during off-peak hours
6. Clear browser cache

**Performance Tips**:
- Dashboard fast: Optimized for large data
- Table faster if you filter first
- Export/Import slower with 5,000+ rows
- Charts take a few seconds to render

---

### Issue 23: Dashboard Charts Slow to Load

**Symptom**: Charts don't appear for 10+ seconds

**Possible Causes**:
- Lots of data (1,000+ records)
- Chart.js library loading
- Browser rendering slow

**Solutions**:
1. Wait 10-15 seconds (let charts render)
2. Refresh page
3. Close other apps/tabs
4. Try different browser
5. Check Chart.js CDN is loading:
   - DevTools → Network tab → look for chart.js
   - If error: Internet issue or CDN down

---

## Data Issues

### Issue 24: Duplicate Records

**Symptom**: Same student appears twice

**Possible Causes**:
- Imported same file twice
- Manual entry + import same person
- ID card number typo

**Solutions**:
1. Search for both records
2. Keep the more complete one
3. Edit the duplicate to change ID slightly
   - Or manually delete from Google Sheet
4. Use "Upsert" mode for imports to prevent duplicates
5. Check before importing to avoid duplicates

---

### Issue 25: Missing Data in Records

**Symptom**: Some fields empty or blank

**Possible Causes**:
- Data not imported correctly
- Fields optional in form
- Data lost in migration

**Solutions**:
1. Edit student record
2. Fill in missing information
3. Save changes
4. If many missing: Check source data file

**Required vs Optional**:
- Required: Name, ID, Branch, Status (marked with *)
- Optional: Disease, Nickname (can be "-")

---

## Advanced Troubleshooting

### Issue 26: "Google Apps Script Error"

**Symptom**: Technical error referencing Google Apps Script

**Possible Causes**:
- Script has bug
- Sheet structure wrong
- Rate limit exceeded (Quota)

**Solutions**:
1. Check Google Apps Script logs:
   - [Google Apps Script Console](https://script.google.com)
   - Your project → Executions
   - Look for error messages
2. If quota exceeded:
   - Wait 1 hour before retrying
   - For large imports, break into smaller batches
3. Re-deploy script:
   - Update code from latest version
   - Click Deploy

---

### Issue 27: Data Won't Sync to Google Sheet

**Symptom**: Add/edit records but changes don't appear in Sheet

**Possible Causes**:
- Script disconnected from Sheet
- Permissions issue
- Google API limit

**Solutions**:
1. Check Sheet ID in `AppsScript_Updated.gs`:
   - Should match your actual Sheet ID
2. Check permissions:
   - Log in as same account that owns Sheet
   - Verify script has edit access
3. Test save:
   - Add dummy record through app
   - Check if it appears in Google Sheet
4. Check Google Apps Script logs for errors

---

### Issue 28: Can't See Any Updates

**Symptom**: Add data but it never appears anywhere

**Solutions**:
1. Check if saved successfully (green checkmark)
2. Refresh page to reload data from server
3. Check Google Sheet directly (bypass app)
4. If in Google Sheet: App is working, just display lag
5. If not in Google Sheet: Script error
   - Check Executions tab in Google Apps Script
   - Look for error messages

---

##  When All Else Fails

### Nuclear Options

**Option 1: Clear Everything & Start Over**
```
1. Clear browser: Ctrl+Shift+Delete
2. Close and reopen browser
3. Sign out of Google account
4. Clear Google Sheet (keep structure)
5. Refresh app
```

**Option 2: Check Setup**
```
1. Verify API_URL is correct
2. Verify Google Sheet ID is correct
3. Verify Google Apps Script deployed
4. Verify credentials updated
5. Re-read INSTALLATION.md
```

**Option 3: Different Device**
```
1. Try on different computer
2. Try on different phone
3. Try on different browser
4. If works elsewhere: Issue with original device
5. If fails everywhere: Setup issue
```

---

## Getting Help

### Information to Include When Reporting Issues

1. **Error message** (exactly, word for word)
2. **Browser & version** (Chrome 120, Safari 17, etc.)
3. **Device & OS** (Windows 11, Mac M2, iPhone 14, etc.)
4. **Steps to reproduce** (how did you get the error?)
5. **Screenshot** (if possible)
6. **DevTools console error** (F12 → Console tab)
7. **When it started** (after import? after update?)

### Support Channels

- Email: support@pim.ac.th
- Chat: [contact admin]
- Issue: Report on GitHub
- Phone: Call tech support

---

**Version**: 2.0.0
**Last Updated**: May 18, 2026
**Maintained by**: IT Department, PIM
