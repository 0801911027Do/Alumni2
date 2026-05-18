# 📊 Sample Data Guide - ET PIM Alumni System

This guide explains the sample data files included in the Alumni2 system.

---

## Overview

Two sample data files are provided:

1. **sample_data.xlsx** - Ready-to-import test data (10 students)
2. **sample_data_import_template.xlsx** - Empty template for your data

---

## Sample Data (sample_data.xlsx)

### What's Included

**10 test students** covering all status types:

| ID | Name | Status | Company | Salary |
|----|------|--------|---------|--------|
| 1234567890123 | นายสมชาย ใจดี | ทำงาน | Google | ฿60,000 |
| 1234567890124 | นางสาวสมหญิง สุขดี | ทำงาน | Microsoft | ฿55,000 |
| 1234567890125 | นายประเทพ เมืองไทย | ทำงาน | Apple | ฿65,000 |
| 1234567890126 | นางสาวมณฑนา บุษเรศ | ศึกษาต่อ | - | - |
| 1234567890127 | นายกฤษณ์ ทำนาย | กำลังศึกษา | - | - |
| 1234567890128 | นางสาวปัญญา ชาญฉลาด | ว่างงาน | - | - |
| 1234567890129 | นายวิชัย ประสบ | ทำงาน | Samsung | ฿50,000 |
| 1234567890130 | นางสาวกรีตา เรืองแสง | ทำงาน | Intel | ฿58,000 |
| 1234567890131 | นายภูชิต ตั้งสง่า | ศึกษาต่อ | - | - |
| 1234567890132 | นางสาวราชา กำลังศึกษา | กำลังศึกษา | - | - |

### Using Sample Data

1. **First Time Setup**
   - Extract Alumni2 ZIP
   - Complete Google Apps Script setup
   - Update API_URL in alumni.js
   - Open alumni.html
   - Login (admin/admin123)
   - Click "นำเข้าข้อมูล" (Import)
   - Select `sample_data.xlsx`
   - Click "ยืนยันนำเข้า" (Confirm)
   - Wait 30 seconds
   - See dashboard with data ✓

2. **Testing Features**
   - Dashboard: See statistics calculated
   - Search: Search for "สมชาย"
   - Filter: Filter by "ทำงาน" status
   - Export: Export to Excel
   - Companies: See "Google", "Microsoft", etc.

3. **Learning**
   - See all field types populated
   - Understand data structure
   - Practice with real-looking data
   - Test import without risk

### Data Distribution

**By Status**:
- ทำงาน (Employed): 5 students
- ศึกษาต่อ (Further Study): 2 students
- กำลังศึกษา (Currently Studying): 2 students
- ว่างงาน (Unemployed): 1 student

**By Branch**:
- CAI (Computer): 4 students
- CYB (Cybersecurity): 2 students
- RAE (Robotics): 2 students
- DIT (Digital IT): 2 students

**By Year**:
- Class 64: 4 students
- Class 65: 3 students
- Class 66: 3 students

**Salary Range**:
- ฿50,000 - ฿65,000 (employed only)

---

## Empty Template (sample_data_import_template.xlsx)

### What's Provided

A blank Excel sheet with proper column headers for data entry.

### Column Headers

```
เลขประจำตัวประชาชน | รหัสนักศึกษา | ชื่อ (ไทย) | นามสกุล (ไทย) | 
ชื่อ (อังกฤษ) | นามสกุล (อังกฤษ) | เพศ | วันเกิด | 
สาขาวิชา | ปี ค.ศ. | เบอร์โทรศัพท์ | อีเมล | สถานะปัจจุบัน | 
บริษัทปัจจุบัน | ตำแหน่งปัจจุบัน | เงินเดือน | ...
```

### How to Use

1. Open `sample_data_import_template.xlsx`
2. Add your student data rows
3. Fill in all required columns
4. Save as `.xlsx` file
5. Import via application
6. System auto-calculates missing fields

### Required Columns

These MUST be filled:
- เลขประจำตัวประชาชน (ID Card, 13 digits)
- ชื่อ (ไทย) / นามสกุล (ไทย) (Thai Name)
- สาขาวิชา (Branch)
- เพศ (Gender)
- วันเกิด (Birth Date - วว/ดด/ปปปป)

### Optional Columns

These can be left blank:
- ชื่อเล่น (Nickname)
- โรค (Disease)
- ที่อยู่ปัจจุบัน (Current Address)

### Tips for Data Entry

✓ **Date Format**: Use วว/ดด/ปปปป (15/05/2567)
✓ **ID Card**: Must be exactly 13 digits
✓ **Names**: Enter in Thai characters
✓ **Email**: Use valid format (example@pim.ac.th)
✓ **Phone**: At least 9 digits (0812345678)
✓ **Branch**: Use code (CAI, CYB, RAE, AME, IEM, DIT)
✓ **Status**: Use standard values (ทำงาน, ศึกษาต่อ, etc)

---

## Importing Your Data

### Step-by-Step

1. **Prepare Excel File**
   - Start with `sample_data_import_template.xlsx`
   - Or use your own file with matching columns
   - Verify date format (วว/ดด/ปปปป)
   - Verify branch codes (CAI, CYB, etc)

2. **Open Alumni Application**
   - Click "นำเข้าข้อมูล" (Import)
   - Click "เลือกไฟล์" (Choose File)
   - Select your Excel file

3. **Choose Import Mode**
   - Upsert: Update existing + add new (default)
   - Append: Add all (may create duplicates)
   - Replace: Delete all and import new

4. **Confirm Import**
   - Click "ยืนยันนำเข้า" (Confirm)
   - Wait for completion
   - See success message

5. **Verify Data**
   - Go to Alumni Database
   - Search for imported students
   - Check dashboard updated

---

## Data Validation Rules

The system validates data during import:

| Field | Rule | Example |
|-------|------|---------|
| ID Card | 13 digits | 1234567890123 |
| Birth Date | วว/ดด/ปปปป | 15/05/2567 |
| Email | Contains @ | user@pim.ac.th |
| Phone | 9+ digits | 0812345678 |
| Salary | Numbers only | 50000 (not ฿50,000) |
| Status | Standard text | ทำงาน, ศึกษาต่อ |

---

## Common Import Issues

### Issue 1: "Invalid Date Format"
**Solution**: Use วว/ดด/ปปปป format
- ❌ 5/15/2023
- ❌ 2023-05-15
- ✓ 15/05/2567

### Issue 2: "ID Card Already Exists"
**Solution**: ID card numbers must be unique
- Check for duplicate ID cards in file
- Remove duplicates
- Or use "Replace" mode to overwrite

### Issue 3: "Invalid Email"
**Solution**: Email must have @ symbol
- ❌ user.pim.ac.th
- ✓ user@pim.ac.th

### Issue 4: "Column Headers Don't Match"
**Solution**: Use provided template or matching headers
- Column names must match exactly
- Headers in Row 1
- Use provided template as reference

### Issue 5: Import Stuck / Timeout
**Solution**: Split into smaller files
- If > 5000 rows: Split into 2 files
- Import separately
- Google Apps Script has 6-minute timeout

---

## Sample Data Use Cases

### Use Case 1: Quick Demo
- Import sample_data.xlsx
- Show dashboard to stakeholders
- Show all features (search, filter, export)
- Takes 10 minutes

### Use Case 2: Testing
- Import sample data
- Test add/edit/delete functions
- Test search and filters
- Test export feature
- Takes 30 minutes

### Use Case 3: Training
- Import sample data
- Have staff practice with real data
- Show how to search for students
- Show how to edit records
- Takes 1-2 hours

### Use Case 4: Template
- Use empty template
- Modify column headers for your school
- Add your student data
- Import as batch
- Takes 2-3 hours

---

## Customizing Sample Data

### For Your Institution

1. **Remove Test Data**
   - Import sample data (if needed)
   - Or delete all and start fresh
   - Use Dashboard → Import with "Replace" mode

2. **Add Your Data**
   - Use template file
   - Fill in your students
   - Import via application

3. **Update Details**
   - Edit individual students
   - Or bulk edit via spreadsheet

---

## Excel Column Reference

### Full Column List

```
Column 1:   เลขประจำตัวประชาชน (ID Card)
Column 2:   รหัสนักศึกษา (Student ID)
Column 3:   ชื่อ (ไทย) (Thai First Name)
Column 4:   นามสกุล (ไทย) (Thai Last Name)
Column 5:   ชื่อ (อังกฤษ) (English First Name)
Column 6:   นามสกุล (อังกฤษ) (English Last Name)
Column 7:   ชื่อเล่น (Nickname)
Column 8:   เพศ (Gender - M/F)
Column 9:   วันเกิด (Birth Date - วว/ดด/ปปปป)
Column 10:  อายุ (Age - auto calculated)
Column 11:  โรค (Disease)
Column 12:  ที่อยู่ปัจจุบัน (Current Address)
Column 13:  ที่อยู่บ้าน (Home Address)
Column 14:  สาขาวิชา (Branch)
Column 15:  คณะ (Faculty - auto filled)
Column 16:  ปีที่จบการศึกษา (Graduation Year)
Column 17:  วันที่จบการศึกษา (Graduation Date)
Column 18:  เบอร์โทรศัพท์ (Phone)
Column 19:  อีเมล (Email)
Column 20:  ชื่อผู้ปกครอง (Parent Name)
Column 21:  เบอร์โทรศัพท์ผู้ปกครอง (Parent Phone)
Column 22:  ความสัมพันธ์ (Parent Relation)
Column 23:  สถานะปัจจุบัน (Current Status)
Column 24:  วันที่เริ่มทำงาน (Job Start Date)
Column 25:  บริษัทปัจจุบัน (Current Company)
Column 26:  ตำแหน่งปัจจุบัน (Current Position)
Column 27:  แผนกปัจจุบัน (Current Department)
Column 28:  เงินเดือน (Salary)
Column 29:  สถานะการทำงาน (Working Status - Still/Resigned)
Column 30+: Additional custom fields
```

---

## After Importing Sample Data

### Immediate Next Steps

1. **Review Dashboard**
   - See statistics calculated
   - Check employment rate
   - View company breakdown

2. **Try Search**
   - Search for "สมชาย"
   - Search for "Google"
   - Search for "CAI"

3. **Try Filters**
   - Filter by status "ทำงาน"
   - Filter by branch "CAI"
   - Combine filters

4. **Try Export**
   - Click "ส่งออก Excel"
   - Download and open file
   - See all data exported

5. **Try Edit**
   - Click on a student
   - Edit their information
   - Save changes

---

## Support

- **Questions about data**: See USER_GUIDE.md
- **Import errors**: See TROUBLESHOOTING.md
- **Data format issues**: See this file
- **Need more samples**: Contact support@pim.ac.th

---

**Version**: 2.0.0
**Last Updated**: May 18, 2026
**Ready to Use**: Yes ✓
