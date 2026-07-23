/**
 * Google Apps Script - Unified Secure Backend for Alumni Tracking System
 *
 * วิธีใช้งาน:
 * 1. คัดลอกโค้ดทั้งหมดนี้ไปวางทดแทนโค้ดใน Google Apps Script Editor (script.google.com)
 * 2. เผยแพร่เว็บแอปเป็นเวอร์ชันใหม่ (Deploy as Web App) และตั้งค่าสิทธิ์การเข้าถึงเป็น "Anyone"
 */

// คอนฟิกหลักของระบบความปลอดภัยและชีต
const CONFIG = {
  USER_SHEET: "Users",        // ชื่อชีตเก็บข้อมูลสิทธิ์เข้าสู่ระบบ
  DATA_SHEET: "Alumni",       // ชื่อชีตฐานข้อมูลศิษย์เก่าหลัก
  LOG_SHEET: "Audit_Logs",     // ชื่อชีตสำหรับเก็บประวัติการแก้ไข
  MAX_LOGIN_ATTEMPTS: 5,       // พยายามเข้าสู่ระบบผิดได้ไม่เกิน 5 ครั้ง
  LOCKOUT_TIME_SEC: 900,       // พักการเชื่อมต่อเมื่อถูกล็อกเป็นเวลา 15 นาที (900 วินาที)
};

// การแมปชื่อคอลัมน์ภาษาไทยกับคีย์ภาษาอังกฤษ (Schema 39 คอลัมน์หลัก)
const THAI_TO_ENG = {
  "รหัสนักศึกษา": "studentId",
  "เลขบัตรประชาชน": "idCard",
  "คำนำหน้า": "prefix",
  "ชื่อจริง_TH": "nameTH",
  "นามสกุล_TH": "surnameTH",
  "ชื่อจริง_EN": "nameEN",
  "นามสกุล_EN": "surnameEN",
  "ชื่อเล่น": "nickname",
  "เพศ": "gender",
  "วัน/เดือน/ปีเกิด": "birthDate",
  "เบอร์โทรศัพท์": "phone",
  "อีเมล": "email",
  "โรคประจำตัว": "disease",
  "ที่อยู่ปัจจุบัน": "currentAddress",
  "ที่อยู่ตามทะเบียนบ้าน": "homeAddress",
  "ชื่อผู้ปกครอง": "parentName",
  "ความสัมพันธ์": "parentRelation",
  "เบอร์โทรศัพท์ (ผู้ปกครอง)": "parentPhone",
  "สาขาเรียน": "branch",
  "ชื่อย่อสาขา": "branchCode",
  "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)": "internY1_711Branch",
  "ตำแหน่งปี 1": "internY1_Position",
  "ระยะเวลาฝึกงานปี 1": "internY1_Duration",
  "ชื่อสถานประกอบการฝึกงานปี 2": "internY2_Company",
  "ตำแหน่งปี2 ": "internY2_Position",
  "ระยะเวลาฝึกงานปี 2 ": "internY2_Duration",
  "ชื่อสถานประกอบการฝึกงานปี 3-4": "internY3_Company",
  "ตำแหน่งปี 3-4": "internY3_Position",
  "ระยะเวลาฝึกงานปี 3-4": "internY3_Duration",
  "Final Project": "finalProject",
  "วันที่เริ่มศึกษา": "startDate",
  "วันที่จบการศึกษา": "gradDate",
  "ปีการศึกษาที่จบ": "batchYear",
  "สถานะการทำงาน": "jobStatus",
  "วันที่เริ่มงาน": "jobStartDate",
  "ชือสถานประกอบการที่บรรจุงาน": "jobCompany",
  "ตำแหน่งงาน": "jobPosition",
  "สถานะการได้งานจากที่ฝึกงาน": "jobCurrentStatus",
  "หมายเหตุ": "jobRemark",
  "รูปโปรไฟล์": "profileImage",
  "เงินเดือน (บาท)": "jobSalary",

  // Aliases เพื่อให้รองรับการนำเข้า/แก้ไขข้อมูลที่ยืดหยุ่นขึ้น
  "ชื่อ (ไทย)": "nameTH",
  "นามสกุล (ไทย)": "surnameTH",
  "ชื่อ (อังกฤษ)": "nameEN",
  "นามสกุล (อังกฤษ)": "surnameEN",
  "ที่อยู่ตามทะเบียน": "homeAddress",
  "เบอร์โทรศัพท์ผู้ปกครอง": "parentPhone",
  "เบอร์โทร ผู้ปกครอง": "parentPhone",
  "สาขาวิชาเรียน": "branch",
  "สาขา": "branch",
  "รหัสสาขา": "branchCode",
  "ปี1 สาขา 7-Eleven": "internY1_711Branch",
  "ชื่อย่อสาขาชื่อย่อสาขา": "internY1_711Branch", // typo alias
  "ปี1 ตำแหน่ง": "internY1_Position",
  "ปี1 ระยะเวลาฝึกงาน": "internY1_Duration",
  "ตำแหน่งปี 2": "internY2_Position",
  "ตำแหน่งปี 2 ": "internY2_Position",
  "ระยะเวลาฝึกงานปี 2": "internY2_Duration",
  "ตำแหน่งปี 3-4": "internY3_Position",
  "ระยะเวลาฝึกงานปี 3-4": "internY3_Duration",
  "วันจบการศึกษา": "gradDate",
  "วันที่ได้รับการบรรจุ": "jobStartDate",
  "ชื่อบริษัทที่ทำงาน": "jobCompany",
  "ตำแหน่งที่ทำงาน": "jobPosition",
  "สถานะปัจจุบัน": "jobCurrentStatus"
};

// รายชื่อคอลัมน์มาตรฐาน 40 คอลัมน์สำหรับ Alumni Sheet
const ALUMNI_HEADERS = [
  "รหัสนักศึกษา", "เลขบัตรประชาชน", "คำนำหน้า", "ชื่อจริง_TH", "นามสกุล_TH", 
  "ชื่อจริง_EN", "นามสกุล_EN", "ชื่อเล่น", "เพศ", "วัน/เดือน/ปีเกิด", 
  "เบอร์โทรศัพท์", "อีเมล", "โรคประจำตัว", "ที่อยู่ปัจจุบัน", "ที่อยู่ตามทะเบียนบ้าน", 
  "ชื่อผู้ปกครอง", "ความสัมพันธ์", "เบอร์โทรศัพท์ (ผู้ปกครอง)", "สาขาเรียน", "ชื่อย่อสาขา", 
  "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)", "ตำแหน่งปี 1", "ระยะเวลาฝึกงานปี 1", 
  "ชื่อสถานประกอบการฝึกงานปี 2", "ตำแหน่งปี2 ", "ระยะเวลาฝึกงานปี 2 ", 
  "ชื่อสถานประกอบการฝึกงานปี 3-4", "ตำแหน่งปี 3-4", "ระยะเวลาฝึกงานปี 3-4", "Final Project", 
  "วันที่เริ่มศึกษา", "วันที่จบการศึกษา", "ปีการศึกษาที่จบ", "สถานะการทำงาน", 
  "วันที่เริ่มงาน", "ชือสถานประกอบการที่บรรจุงาน", "ตำแหน่งงาน", "สถานะการได้งานจากที่ฝึกงาน", "หมายเหตุ", "รูปโปรไฟล์", "เงินเดือน (บาท)"
];

// ตรวจสอบและสร้างหัวข้อคอลัมน์หากยังไม่มี
function enforceHeaders(sheet) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
    if (!sheet) sheet = ss.insertSheet(CONFIG.DATA_SHEET);
  }
  const lastCol = sheet.getLastColumn();
  let currentHeaders = [];
  if (lastCol > 0) {
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  let isMatch = currentHeaders.length === ALUMNI_HEADERS.length;
  if (isMatch) {
    for (let i = 0; i < ALUMNI_HEADERS.length; i++) {
      if (currentHeaders[i] !== ALUMNI_HEADERS[i]) {
        isMatch = false;
        break;
      }
    }
  }
  
  if (!isMatch) {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      // ตารางว่างหรือมีแค่หัวตารางแบบเก่า ให้เคลียร์สร้างข้อมูลใหม่ได้ปลอดภัย
      sheet.clear();
      sheet.getRange(1, 1, 1, ALUMNI_HEADERS.length).setValues([ALUMNI_HEADERS]);
      sheet.getRange(1, 1, 1, ALUMNI_HEADERS.length)
        .setFontWeight("bold")
        .setBackground("#D9E1F2")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
      try {
        generateMockAlumniData();
      } catch(err) {
        Logger.log("Auto-generation of mock data failed: " + err.toString());
      }
    } else {
      // แบบ Non-destructive: เขียนหัวคอลัมน์ทับในแถว 1 โดยไม่ล้างข้อมูลเดิม
      sheet.getRange(1, 1, 1, ALUMNI_HEADERS.length).setValues([ALUMNI_HEADERS]);
      sheet.getRange(1, 1, 1, ALUMNI_HEADERS.length)
        .setFontWeight("bold")
        .setBackground("#D9E1F2")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
  }
  return ALUMNI_HEADERS;
}

// 🟢 สร้างเมนูเพิ่มเติมในหน้า Google Sheets สำหรับเรียกใช้งานฟังก์ชัน
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🎓 ระบบติดตามศิษย์เก่า')
      .addItem('🎲 สร้างข้อมูลตัวอย่างศิษย์เก่า (Mock 1,000 คน)', 'generateMockAlumniData')
      .addSeparator()
      .addItem('🏢 สร้างข้อมูลตัวอย่างองค์กร (Mock 100 แห่ง)', 'generateMockOrganizationData')
      .addItem('💼 สร้างข้อมูลตัวอย่างตำแหน่งงาน (Mock 100 อัตรา)', 'generateMockPositionData')
      .addSeparator()
      .addItem('📤 ซิงค์รูปภาพจาก Google Drive (Bulk Upload)', 'bulkImportPhotosFromDrive')
      .addToUi();
}

// 🟢 GET handler (ใช้สำหรับดึงข้อมูลปกติ และทดสอบ API สถานะ)
function doGet(e) {
  try {
    // หากเรียก doGet เพื่อดึงข้อมูลของระบบโดยไม่ส่งพารามิเตอร์ ให้ส่งข้อมูลศิษย์เก่ากลับไปเพื่อความเข้ากันได้
    var data = processGetData();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "GET Request failed: " + error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 🟢 POST handler (ประมวลผลการกระทำต่างๆ อย่างปลอดภัย)
function doPost(e) {
  var output = { status: "error", message: "ไม่พบคำสั่งใช้งาน" };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "ไม่พบข้อมูลส่งผ่าน (กรุณาใช้งานผ่าน API เท่านั้น)" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    // 1. ระบบป้องกัน Brute-Force
    if (action === "login") {
      return handleLoginWithRateLimit(payload);
    }

    // 2. ตรวจสอบสิทธิ์การใช้งาน (Authentication Guard สำหรับ Write Actions)
    var isAuthorized = false;
    var adminUser = null;

    if (payload.username && payload.password) {
      var authResult = checkUserCredentials(payload.username, payload.password);
      if (authResult.success) {
        isAuthorized = true;
        adminUser = authResult.user;
      }
    }

    const writeActions = ["add_data", "edit", "delete", "import_excel", "bulk_import_photos", "bulk_import_photos_local"];
    if (writeActions.indexOf(action) !== -1) {
      if (!isAuthorized || adminUser.role !== "admin") {
        writeAuditLog("SYSTEM", "UNAUTHORIZED_WRITE_ATTEMPT", "พยายามทำคำสั่ง " + action + " โดยไม่มีสิทธิ์ผู้ดูแลระบบ");
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "ไม่ได้รับอนุญาต: บัญชีผู้ใช้ไม่ถูกต้องหรือไม่มีสิทธิ์ระดับ Admin" })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. จัดการเส้นทางการทำงานตามคำสั่ง (Actions Routing)
    switch (action) {
      case "fetch":
        output = processGetData();
        break;

      case "add_data":
        output = processAddData(payload, adminUser);
        break;

      case "edit":
        output = processEdit(payload, adminUser);
        break;

      case "import_excel":
        output = processImportExcel(payload, adminUser);
        break;

      case "bulk_import_photos":
        output = processBulkImportPhotos(payload, adminUser);
        break;

      case "bulk_import_photos_local":
        output = processBulkImportPhotosLocal(payload, adminUser);
        break;

      case "student_login":
        output = handleStudentLogin(payload);
        break;

      case "student_update":
        output = handleStudentUpdate(payload);
        break;

      default:
        output = { status: "error", message: "ไม่พบ Action: " + action };
    }
  } catch (err) {
    output = { status: "error", message: "เกิดข้อผิดพลาดในการประมวลผลหลังบ้าน: " + err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

// 🔒 ระบบ Login พร้อมป้องกันการสุ่มรหัสผ่าน
function handleLoginWithRateLimit(payload) {
  var cache = CacheService.getScriptCache();
  var ipOrUserKey = "lock_" + String(payload.username).toLowerCase();

  var lockStatus = cache.get(ipOrUserKey);
  if (lockStatus !== null) {
    writeAuditLog(payload.username, "LOGIN_LOCKED", "พยายามเข้าสู่ระบบขณะบัญชีถูกระงับชั่วคราว");
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: "บัญชีนี้ถูกระงับชั่วคราว 15 นาที เนื่องจากป้อนรหัสผ่านผิดเกินกำหนด" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var auth = checkUserCredentials(payload.username, payload.password);

  if (auth.success) {
    cache.remove("fail_" + payload.username.toLowerCase());
    writeAuditLog(payload.username, "LOGIN_SUCCESS", "เข้าสู่ระบบสำเร็จ");
    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", role: auth.user.role, name: auth.user.name, message: "เข้าสู่ระบบสำเร็จ" })
    ).setMimeType(ContentService.MimeType.JSON);
  } else {
    var failKey = "fail_" + payload.username.toLowerCase();
    var failCount = parseInt(cache.get(failKey) || "0") + 1;

    if (failCount >= CONFIG.MAX_LOGIN_ATTEMPTS) {
      cache.put(ipOrUserKey, "locked", CONFIG.LOCKOUT_TIME_SEC);
      cache.remove(failKey);
      writeAuditLog(payload.username, "ACCOUNT_LOCKED", "ป้อนรหัสผิดครบ 5 ครั้ง บัญชีถูกระงับชั่วคราว 15 นาที");
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "ป้อนรหัสผ่านไม่ถูกต้องเกินกำหนด บัญชีถูกระงับใช้งาน 15 นาที" })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      cache.put(failKey, failCount.toString(), 600);
      writeAuditLog(payload.username, "LOGIN_FAILED", "เข้าสู่ระบบล้มเหลว (ครั้งที่ " + failCount + ")");
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสแก้ตัวอีก " + (CONFIG.MAX_LOGIN_ATTEMPTS - failCount) + " ครั้ง)" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// 🔑 ตรวจสอบข้อมูลสิทธิ์จากชีต "Users"
function checkUserCredentials(username, password) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.USER_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.USER_SHEET);
      sheet.getRange(1, 1, 2, 4).setValues([
        ["Username", "Password", "Role", "Name"],
        ["admin", "password", "admin", "Administrator"]
      ]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#bfdbfe");
    }

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var dbUser = String(data[i][0]).trim();
      var dbPass = String(data[i][1]).trim();
      var dbRole = String(data[i][2]).trim();
      var dbName = String(data[i][3]).trim();

      if (dbUser.toLowerCase() === username.trim().toLowerCase() && dbPass === password.trim()) {
        return { success: true, user: { username: dbUser, role: dbRole, name: dbName } };
      }
    }
  } catch (err) {
    Logger.log("checkUserCredentials Error: " + err.toString());
  }
  return { success: false };
}

// 🗂️ ดึงข้อมูลทั้งหมดในระบบ
function processGetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ดึงข้อมูลนักศึกษาศิษย์เก่า
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.DATA_SHEET);
    enforceHeaders(sheet);
    return { status: "success", data: [], students: [], organizations: [], positions: [] };
  }
  var headers = enforceHeaders(sheet);
  var values = sheet.getDataRange().getValues();
  var displayValues = sheet.getDataRange().getDisplayValues();
  
  var data = [];
  if (values.length > 1) {
    for (var i = 1; i < values.length; i++) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        var thaiHeader = headers[j];
        var engKey = THAI_TO_ENG[thaiHeader];
        var rawValue = values[i][j];
        var finalValue;

        if (rawValue instanceof Date) {
          finalValue = Utilities.formatDate(rawValue, "GMT+7", "yyyy-MM-dd");
        } else if (engKey === "jobSalary" || typeof rawValue === "number") {
          finalValue = rawValue;
        } else {
          finalValue = displayValues[i][j];
        }

        rowObj[thaiHeader] = finalValue;
        if (engKey) rowObj[engKey] = finalValue;
      }
      data.push(rowObj);
    }
  }

  // 2. ดึงข้อมูลองค์กร WBL (Companies)
  var orgsSheet = ss.getSheetByName("องค์กร");
  var orgsData = [];
  if (orgsSheet) {
    var orgsValues = orgsSheet.getDataRange().getValues();
    var orgsDisplay = orgsSheet.getDataRange().getDisplayValues();
    if (orgsValues.length > 1) {
      var orgsHeaders = orgsValues[0];
      for (var i = 1; i < orgsValues.length; i++) {
        var rowObj = {};
        for (var j = 0; j < orgsHeaders.length; j++) {
          rowObj[orgsHeaders[j]] = orgsDisplay[i][j];
        }
        orgsData.push(rowObj);
      }
    }
  }

  // 3. ดึงข้อมูลตำแหน่งงาน WBL (Jobs)
  var posSheet = ss.getSheetByName("ตำแหน่งงาน");
  var posData = [];
  if (posSheet) {
    var posValues = posSheet.getDataRange().getValues();
    var posDisplay = posSheet.getDataRange().getDisplayValues();
    if (posValues.length > 1) {
      var posHeaders = posValues[0];
      for (var i = 1; i < posValues.length; i++) {
        var rowObj = {};
        for (var j = 0; j < posHeaders.length; j++) {
          rowObj[posHeaders[j]] = posDisplay[i][j];
        }
        posData.push(rowObj);
      }
    }
  }

  return {
    status: "success",
    data: data,
    students: data,
    organizations: orgsData,
    positions: posData
  };
}

// 📝 เพิ่มข้อมูลศิษย์เก่าใหม่ (Add Data)
function processAddData(payload, adminUser) {
  var dataObj = payload.data || {};
  if (!dataObj.idCard) return { status: "error", message: "ข้อมูลสำคัญไม่ครบถ้วน (เลขประจำตัวประชาชน)" };
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) sheet = ss.insertSheet(CONFIG.DATA_SHEET);
  var headers = enforceHeaders(sheet);
  
  // ป้องกันข้อมูลซ้ำด้วยเลขบัตร ปชช
  var values = sheet.getDataRange().getValues();
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]).replace(/'/g, "") === String(dataObj.idCard).replace(/'/g, "")) {
      return { status: "error", message: "เลขประจำตัวประชาชนนี้มีอยู่ในระบบแล้ว" };
    }
  }

  var newRow = [];
  for (var j = 0; j < headers.length; j++) {
    newRow.push(formatValue(headers[j], THAI_TO_ENG[headers[j]], dataObj));
  }
  sheet.appendRow(newRow);

  writeAuditLog(
    adminUser.username,
    "ADD_DATA",
    "เพิ่มข้อมูลศิษย์เก่า: " + (dataObj.nameTH || "") + " " + (dataObj.surnameTH || "") + " (ID: " + (dataObj.studentId || "-") + ")"
  );

  return { status: "success", message: "บันทึกข้อมูลเรียบร้อยแล้ว" };
}

// ✏️ แก้ไขข้อมูลศิษย์เก่าเดิม (Edit Data)
function processEdit(payload, adminUser) {
  var dataObj = payload.data || {};
  var idCard = dataObj.idCard;
  if (!idCard) return { status: "error", message: "ข้อมูลที่ส่งเข้าไม่ระบุ ID หลักสำหรับการอัปเดต" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) return { status: "error", message: "ไม่พบแผ่นงานข้อมูลหลัก" };
  var headers = enforceHeaders(sheet);
  var values = sheet.getDataRange().getValues();
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");

  var rowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]).replace(/'/g, "") === String(idCard).replace(/'/g, "")) {
      rowIdx = i + 1;
      break;
    }
  }

  if (rowIdx === -1) {
    return { status: "error", message: "ไม่พบนักศึกษาที่ตรงกับบัตรประชาชนนี้ในฐานข้อมูล" };
  }

  // นำข้อมูลเก่ามาตั้งต้นและอัปเดตทับเฉพาะที่ส่งเข้ามาใหม่
  var tempObj = {};
  for (var h = 0; h < headers.length; h++) {
    var ek = THAI_TO_ENG[headers[h]];
    var oldVal = values[rowIdx - 1][h];
    if (oldVal instanceof Date) oldVal = Utilities.formatDate(oldVal, "GMT+7", "yyyy-MM-dd");
    tempObj[ek] = dataObj[ek] !== undefined ? dataObj[ek] : oldVal;
  }

  var updateRow = [];
  for (var k = 0; k < headers.length; k++) {
    updateRow.push(formatValue(headers[k], THAI_TO_ENG[headers[k]], tempObj));
  }
  
  sheet.getRange(rowIdx, 1, 1, headers.length).setValues([updateRow]);

  writeAuditLog(
    adminUser.username,
    "EDIT_DATA",
    "แก้ไขข้อมูลศิษย์เก่า: " + (tempObj.nameTH || "") + " " + (tempObj.surnameTH || "") + " (ID: " + (tempObj.studentId || "-") + ")"
  );

  return { status: "success", message: "แก้ไขข้อมูลเรียบร้อยแล้ว" };
}

// 🗑️ ลบข้อมูล (Delete Data)
function processDelete(payload, adminUser) {
  var idCard = payload.idCard;
  if (!idCard) return { status: "error", message: "กรุณาระบุเลขประจำตัวประชาชนของคนที่จะลบ" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) return { status: "error", message: "ไม่พบแผ่นงานที่จะทำการลบ" };
  var headers = enforceHeaders(sheet);
  var values = sheet.getDataRange().getValues();
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]).replace(/'/g, "") === String(idCard).replace(/'/g, "")) {
      var stdName = values[i][headers.indexOf("ชื่อจริง_TH")] + " " + values[i][headers.indexOf("นามสกุล_TH")];
      sheet.deleteRow(i + 1);
      
      writeAuditLog(adminUser.username, "DELETE_DATA", "ลบข้อมูลศิษย์เก่า: " + stdName + " (เลขบัตร ปชช: " + idCard + ")");
      return { status: "success", message: "ลบข้อมูลเรียบร้อยแล้ว" };
    }
  }
  return { status: "error", message: "ไม่พบข้อมูลที่ต้องการลบ" };
}

// 📥 นำเข้าข้อมูลจำนวนมากจาก Excel/CSV
function processImportExcel(payload, adminUser) {
  var data = payload.data || [];
  var importMode = payload.importMode || "upsert"; // upsert หรือ replace

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) sheet = ss.insertSheet(CONFIG.DATA_SHEET);
  var headers = enforceHeaders(sheet);

  var values = sheet.getDataRange().getValues();
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");

  if (importMode === "replace") {
    if (values.length > 1) {
      sheet.deleteRows(2, values.length - 1);
    }
    writeAuditLog(adminUser.username, "IMPORT_REPLACE_START", "เริ่มนำเข้าแบบทับข้อมูลเดิมทั้งหมด " + data.length + " รายการ");
  } else {
    writeAuditLog(adminUser.username, "IMPORT_UPSERT_START", "เริ่มนำเข้าแบบเขียนแทรก/ปรับปรุง " + data.length + " รายการ");
  }

  var successCount = 0;
  var updatedCount = 0;

  for (var i = 0; i < data.length; i++) {
    var record = data[i];
    if (!record.idCard) continue;

    var existingRowIdx = -1;
    if (importMode !== "replace") {
      var currentValues = sheet.getDataRange().getValues();
      for (var row = 1; row < currentValues.length; row++) {
        if (String(currentValues[row][idIndex]).replace(/'/g, "") === String(record.idCard).replace(/'/g, "")) {
          existingRowIdx = row + 1;
          break;
        }
      }
    }

    var rowValues = [];
    for (var col = 0; col < headers.length; col++) {
      rowValues.push(formatValue(headers[col], THAI_TO_ENG[headers[col]], record));
    }

    if (existingRowIdx > -1) {
      sheet.getRange(existingRowIdx, 1, 1, headers.length).setValues([rowValues]);
      updatedCount++;
    } else {
      sheet.appendRow(rowValues);
      successCount++;
    }
  }

  writeAuditLog(
    adminUser.username, 
    "IMPORT_COMPLETE", 
    "นำเข้าเรียบร้อย: เพิ่มใหม่ " + successCount + " รายการ, ปรับปรุงข้อมูลทับเก่า " + updatedCount + " รายการ"
  );

  return {
    status: "success",
    message: "นำเข้าข้อมูลสำเร็จ! เพิ่มใหม่ " + successCount + " รายการ, ปรับปรุงข้อมูลเดิม " + updatedCount + " รายการ"
  };
}

// 🎓 ค้นหาและยืนยันตัวตนสำหรับศิษย์เก่าเข้าตรวจสอบข้อมูลตัวเอง
function handleStudentLogin(payload) {
  var studentId = String(payload.studentId).trim();
  var idCard = String(payload.idCard).trim();

  if (!studentId || !idCard) {
    return { status: "error", message: "กรุณาระบุรหัสนักศึกษาและเลขบัตรประจำตัวประชาชน" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) return { status: "error", message: "ไม่พบตารางฐานข้อมูลหลักในระบบ" };

  var headers = enforceHeaders(sheet);
  var values = sheet.getDataRange().getValues();
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");
  var stdIndex = headers.indexOf("รหัสนักศึกษา");

  var rowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][stdIndex]).trim() === studentId && String(values[i][idIndex]).replace(/'/g, "") === idCard) {
      rowIdx = i;
      break;
    }
  }

  if (rowIdx === -1) {
    return { status: "error", message: "รหัสนักศึกษา หรือเลขบัตรประชาชนไม่ถูกต้อง หรือไม่พบข้อมูลในระบบ" };
  }

  var row = values[rowIdx];
  var studentObj = {};
  for (var j = 0; j < headers.length; j++) {
    var engKey = THAI_TO_ENG[headers[j]];
    var val = row[j];
    if (val instanceof Date) val = Utilities.formatDate(val, "GMT+7", "yyyy-MM-dd");
    studentObj[headers[j]] = val;
    if (engKey) studentObj[engKey] = val;
  }

  writeAuditLog(
    studentId,
    "STUDENT_LOGIN",
    "ศิษย์เก่า: " + (studentObj.nameTH || "") + " " + (studentObj.surnameTH || "") + " เข้าระบบรายงานตัวชั่วคราว"
  );

  return {
    status: "success",
    role: "alumni",
    name: (studentObj.prefix || "") + (studentObj.nameTH || "") + " " + (studentObj.surnameTH || ""),
    studentData: studentObj
  };
}

// 🎓 อัปเดตข้อมูลการรายงานตัวด้วยตัวเองโดยศิษย์เก่า
function handleStudentUpdate(payload) {
  var studentId = String(payload.studentId).trim();
  var idCard = String(payload.idCard).trim();

  if (!studentId || !idCard) {
    return { status: "error", message: "ข้อมูลประจำตัวส่งมาไม่ครบถ้วนสำหรับการแก้ไขข้อมูล" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) return { status: "error", message: "ไม่พบตารางฐานข้อมูลหลัก" };

  var headers = enforceHeaders(sheet);
  var values = sheet.getDataRange().getValues();
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");
  var stdIndex = headers.indexOf("รหัสนักศึกษา");
  
  var rowIdx = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][stdIndex]).trim() === studentId && String(values[i][idIndex]).replace(/'/g, "") === idCard) {
      rowIdx = i + 1;
      break;
    }
  }

  if (rowIdx === -1) {
    return { status: "error", message: "ปฏิเสธสิทธิ์: รหัสนักศึกษาหรือเลขบัตรประชาชนสำหรับแก้ไขไม่ตรงกัน" };
  }

  // ฟิลด์จำกัดที่ศิษย์เก่าอัปเดตเองได้
  var allowedFields = {
    jobStatus: payload.jobStatus,
    jobCurrentStatus: payload.jobCurrentStatus,
    jobCompany: payload.jobCompany,
    jobPosition: payload.jobPosition,
    jobStartDate: payload.jobStartDate,
    jobRemark: payload.jobRemark
  };

  for (var j = 0; j < headers.length; j++) {
    var colName = headers[j];
    var engKey = THAI_TO_ENG[colName];
    if (allowedFields[engKey] !== undefined) {
      sheet.getRange(rowIdx, j + 1).setValue(formatValue(colName, engKey, allowedFields));
    }
  }

  writeAuditLog(
    studentId,
    "STUDENT_SELF_UPDATE",
    "ศิษย์เก่ารายงานตัวสถานะการทำงานใหม่: " + (payload.jobStatus || "") + " (" + (payload.jobCurrentStatus || "") + ")"
  );

  return { status: "success", message: "อัปเดตข้อมูลสถานะเรียบร้อยแล้ว" };
}

// 📝 บันทึกประวัติกิจกรรมในหน้าชีต "Audit_Logs"
function writeAuditLog(user, actionType, details) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET);

    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.LOG_SHEET);
      logSheet.appendRow(["Timestamp", "User", "Action", "Details"]);
      logSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#E2E8F0");
    }

    var timestamp = new Date();
    logSheet.appendRow([timestamp, user, actionType, details]);
  } catch (err) {
    Logger.log("Audit logging failed: " + err.toString());
  }
}

// 📅 แปลงรูปแบบวันที่ส่งเข้ามาให้เป็นแบบ YYYY-MM-DD
function parseDateValue(val) {
  if (val === null || val === undefined) return "";
  var str = String(val).trim();
  if (str === "" || str === "-" || str === "Invalid Date") return "";

  // 1. ถ้าส่งมาเป็นตัวเลข Serial Number ของ Excel
  if (/^\d+(\.\d+)?$/.test(str)) {
    var num = parseFloat(str);
    if (num > 25000 && num < 60000) {
      var date = new Date((num - 25569) * 86400 * 1000);
      return Utilities.formatDate(date, "GMT+7", "yyyy-MM-dd");
    }
  }

  // 2. จัดการกับ DD/MM/YYYY หรือ DD-MM-YYYY
  var parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    var d = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var y = parseInt(parts[2], 10);

    // กรณีเป็น YYYY-MM-DD
    if (String(parts[0]).length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    }

    // แปลง พ.ศ. เป็น ค.ศ.
    if (y > 2400) {
      y = y - 543;
    }

    if (m > 12 && d <= 12) {
      var temp = d; d = m; m = temp;
    }

    if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1000) {
      return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
    }
  }

  // 3. ใช้ JavaScript Date parser ทั่วไป
  try {
    var testDate = new Date(str);
    if (!isNaN(testDate.getTime())) {
      var testY = testDate.getFullYear();
      if (testY > 2400) testDate.setFullYear(testY - 543);
      return Utilities.formatDate(testDate, "GMT+7", "yyyy-MM-dd");
    }
  } catch (e) {}

  return str;
}

// 🕒 คำนวณระยะเวลาความแตกต่างระหว่างช่วงเวลา
function calculateDuration(gradDate, jobDate) {
  if (!gradDate || !jobDate || gradDate === "-" || jobDate === "-") return "-";

  try {
    var gradParts = String(gradDate).split("-").map(Number);
    var jobParts = String(jobDate).split("-").map(Number);
    if (gradParts.length !== 3 || jobParts.length !== 3) return "-";

    var gradDateObj = new Date(gradParts[0], gradParts[1] - 1, gradParts[2]);
    var jobDateObj = new Date(jobParts[0], jobParts[1] - 1, jobParts[2]);

    if (isNaN(gradDateObj.getTime()) || isNaN(jobDateObj.getTime())) return "-";
    if (jobDateObj < gradDateObj) return "ได้งานก่อนเรียนจบ";

    var timeDiff = jobDateObj.getTime() - gradDateObj.getTime();
    var daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return "0 วัน (ได้งานทันที)";

    var years = Math.floor(daysDiff / 365);
    var months = Math.floor((daysDiff % 365) / 30);
    var days = Math.floor((daysDiff % 365) % 30);

    var result = [];
    if (years > 0) result.push(years + " ปี");
    if (months > 0) result.push(months + " เดือน");
    if (days > 0) result.push(days + " วัน");

    return result.length > 0 ? result.join(" ") : "0 วัน";
  } catch (e) {
    return "-";
  }
}

// 🔧 จัดระเบียบการจัดเก็บฟิลด์พิเศษ
function formatValue(thaiHeader, engKey, rowData) {
  rowData = rowData || {};
  var val = rowData[engKey] !== undefined ? rowData[engKey] : rowData[thaiHeader] !== undefined ? rowData[thaiHeader] : "";

  if (engKey === "jobSalary") {
    var numVal = Number(val);
    return isNaN(numVal) ? 0 : numVal;
  }

  if (thaiHeader === "เบอร์โทรศัพท์" || thaiHeader === "เบอร์โทรศัพท์ (ผู้ปกครอง)" || thaiHeader === "เลขบัตรประชาชน" || thaiHeader === "เบอร์โทร ผู้ปกครอง" || thaiHeader === "เลขประจำตัวประชาชน") {
    return "'" + String(val || "").replace(/'/g, "");
  }

  if (["วัน/เดือน/ปีเกิด", "วันที่เริ่มศึกษา", "วันที่จบการศึกษา", "วันที่เริ่มงาน", "วันจบการศึกษา", "วันที่ได้รับการบรรจุ"].indexOf(thaiHeader) !== -1) {
    return parseDateValue(val);
  }

  if (thaiHeader === "ระยะเวลาได้งานทำ" || thaiHeader === "ระยะเวลาได้งานทำ") {
    var gd = rowData.gradDate || rowData["วันที่จบการศึกษา"] || rowData["วันจบการศึกษา"];
    var jsd = rowData.jobStartDate || rowData["วันที่เริ่มงาน"] || rowData["วันที่ได้รับการบรรจุ"];
    var status = rowData.jobStatus || rowData["สถานะการทำงาน"] || rowData["สถานะหลัก"] || "";

    var gdClean = parseDateValue(gd);
    var jsdClean = parseDateValue(jsd);

    var isWorking = ["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ", "ทำงานแล้ว"].some(function (s) {
      return String(status).indexOf(s) !== -1;
    });

    if (isWorking && gdClean && jsdClean) {
      return calculateDuration(gdClean, jsdClean);
    } else if (String(status).indexOf("ว่างงาน") !== -1 && gdClean) {
      var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      return calculateDuration(gdClean, todayStr);
    } else {
      return "-";
    }
  }

  return val !== undefined ? val : "";
}

// 🎲 -------------------------------------------------------------
// 🎲 FUNCTION: สร้างข้อมูล Mock นักศึกษา 1,000 คนเข้าตาราง (แก้ไขโครงสร้างคอลัมน์ 39 ช่องให้ตรงระบบ)
// 🎲 -------------------------------------------------------------
function generateMockAlumniData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.DATA_SHEET);
  }
  
  // เคลียร์ข้อมูลเดิมในหน้าชีตก่อน (ถ้ามี)
  sheet.clear();
  
  // 1. กำหนดหัวตาราง (Headers A - AM) รวม 39 คอลัมน์
  const headers = ALUMNI_HEADERS;

  // 2. คลังข้อมูลสำหรับสุ่ม (Mock Data Pools)
  const maleNamesTH = ["สมชาย", "กิตติภพ", "ณัฐวุฒิ", "ธนพล", "จิรภัทร", "วีรภัทร", "ศุภกร", "อนุชา", "พงศธร", "กฤษฎา"];
  const maleNamesEN = ["Somchai", "Kittiphop", "Nattawut", "Thanapon", "Jiraphat", "Weeraphat", "Suppakorn", "Anucha", "Pongsatorn", "Krisada"];
  const femaleNamesTH = ["สมหญิง", "กนกวรรณ", "ณัฐริกา", "ธนาภรณ์", "จิราภา", "วิภาดา", "ศุภวรรณ", "อรอุมา", "พรพิมล", "กฤษณา"];
  const femaleNamesEN = ["Somying", "Kanokwan", "Nattarika", "Thanaporn", "Jirapa", "Wipada", "Suppawan", "Onuma", "Pornpimon", "Krisana"];
  const surnamesTH = ["ใจดี", "รักเรียน", "มีสุข", "เจริญรุ่งเรือง", "ทรัพย์ทวี", "บุญมี", "แสงทอง", "ประเสริฐสกุล", "คงทน", "วงษ์สุวรรณ"];
  const surnamesEN = ["Jaidee", "Rakrian", "Meesuk", "Charoenrungruang", "Subtawee", "Boonmee", "Saengthong", "Prasertsakul", "Kongton", "Wongsuwan"];
  const nicknames = ["เบส", "มายด์", "กล้า", "พลอย", "บอส", "แนน", "บีม", "ฟ้า", "นัท", "แอม"];
  const diseases = ["ไม่มี", "ไม่มี", "ไม่มี", "ไม่มี", "ไม่มี", "ไม่มี", "ไม่มี", "ภูมิแพ้", "หอบหืด", "กระเพาะอาหาร"];
  const addresses = [
    "85/1 หมู่ 2 ต.บางตลาด อ.ปากเกร็ด จ.นนทบุรี 11120",
    "123 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210",
    "45/8 ถนนพหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
    "99 หมู่ 5 ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม 73170",
    "12/34 ซอยลาดพร้าว 101 แขวงคลองเจ้าคุณสิงห์ เขตวังทองหลาง กรุงเทพฯ 10310"
  ];
  const relations = ["บิดา", "มารดา", "ผู้ปกครอง"];
  
  const majors = [
    { th: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์", en: "CAI", proj: "การพัฒนาระบบ IoT สำหรับตรวจสอบอุณหภูมิตู้แช่สินค้าแบบเรียลไทม์" },
    { th: "การรักษาความมั่นคงปลอดภัยไซเบอร์", en: "CYB", proj: "ระบบตรวจจับและป้องกันภัยคุกคามไซเบอร์ในร้านสะดวกซื้อ" },
    { th: "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ", en: "RAE", proj: "การพัฒนาแขนกลอัจฉริยะช่วยจัดเรียงสินค้าบนชั้นวาง" },
    { th: "วิศวกรรมการผลิตยานยนต์", en: "AME", proj: "ระบบจัดการสายการผลิตรถยนต์พลังงานไฟฟ้าแบบอัตโนมัติ" },
    { th: "วิศวกรรมอุตสาหการและการผลิตอัจฉริยะ", en: "IEM", proj: "การลดความสูญเสียในกระบวนการบรรจุหีบห่อคลังสินค้าหลัก" },
    { th: "เทคโนโลยีดิจิทัลและสารสนเทศ", en: "DIT", proj: "ระบบจัดการคลังสินค้าออนไลน์ด้วยเทคโนโลยีคลาวด์และระบบอัตโนมัติ" }
  ];

  const sevenBranches = [
    "สาขาธาราพัทยา (01234)", "สาขาแจ้งวัฒนะ-ปัญญาภิวัฒน์ (05678)", "สาขาสีลม ซอย 9 (04321)", 
    "สาขารังสิต-คลอง 3 (08765)", "สาขาสุขุมวิท 55 (03456)", "สาขางามวงศ์วาน 25 (09876)"
  ];
  
  const companies = ["CP ALL Plc.", "True Corporation", "Gosoft (Thailand)", "CP RAM", "All Now Logistics", "Accenture Thailand", "บริษัทชั้นนำทั่วไป"];
  const positions = ["Software Engineer", "Store Manager trainee", "System Analyst", "Logistics Officer", "Marketing Executive", "Data Analyst"];
  const jobStatusList = ["ทำงานแล้ว", "ทำงานแล้ว", "ทำงานแล้ว", "กำลังหางาน", "ศึกษาต่อ"];

  // ฟังก์ชันช่วยสุ่มค่าใน Array
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomNumber = (length) => Array.from({length}, () => Math.floor(Math.random() * 10)).join('');

  const dataRows = [];

  // 3. เริ่มวนลูปสร้างข้อมูล 1,000 แถว
  for (let i = 1; i <= 1000; i++) {
    const isMale = Math.random() >= 0.5;
    const prefix = isMale ? "นาย" : "นางสาว";
    const gender = isMale ? "ชาย" : "หญิง";
    const nameIdx = Math.floor(Math.random() * 10);
    const surIdx = Math.floor(Math.random() * 10);
    
    const fnameTH = isMale ? maleNamesTH[nameIdx] : femaleNamesTH[nameIdx];
    const fnameEN = isMale ? maleNamesEN[nameIdx] : femaleNamesEN[nameIdx];
    const snameTH = surnamesTH[surIdx];
    const snameEN = surnamesEN[surIdx];
    
    const studentId = "6" + Math.floor(Math.random() * 4 + 4) + getRandomNumber(8); // รหัสขึ้นต้น 64-67
    const idCard = getRandomNumber(13);
    const phone = "0" + getRandom(["6", "8", "9"]) + getRandomNumber(8);
    const email = `${fnameEN.toLowerCase()}.${snameEN.substring(0,2).toLowerCase()}@gmail.com`;
    
    const currentAddr = getRandom(addresses);
    const regAddr = Math.random() > 0.3 ? currentAddr : getRandom(addresses); // 70% ตรงกับทะเบียนบ้าน
    
    const parentName = `${getRandom(isMale ? maleNamesTH : femaleNamesTH)} ${snameTH}`;
    const parentPhone = "0" + getRandom(["6", "8", "9"]) + getRandomNumber(8);
    
    const selectedMajor = getRandom(majors);
    const branch711 = getRandom(sevenBranches);
    
    // สุ่มปีการศึกษาที่จบ
    const gradYear = getRandom(["2565", "2566", "2567", "2568"]);
    const startYear = (parseInt(gradYear) - 4).toString();
    
    const jobStatus = getRandom(jobStatusList);
    const isWorking = jobStatus === "ทำงานแล้ว";
    
    const row = [
      studentId,                                      // A: รหัสนักศึกษา
      idCard,                                         // B: เลขบัตรประชาชน
      prefix,                                         // C: คำนำหน้า
      fnameTH,                                        // D: ชื่อจริง_TH
      snameTH,                                        // E: นามสกุล_TH
      fnameEN,                                        // F: ชื่อจริง_EN
      snameEN,                                        // G: นามสกุล_EN
      getRandom(nicknames),                           // H: ชื่อเล่น
      gender,                                         // I: เพศ
      `${Math.floor(Math.random() * 28 + 1)}/${Math.floor(Math.random() * 12 + 1)}/${parseInt(startYear) - 18}`, // J: วันเกิด
      phone,                                          // K: เบอร์โทรศัพท์
      email,                                          // L: อีเมล
      getRandom(diseases),                            // M: โรคประจำตัว
      currentAddr,                                    // N: ที่อยู่ปัจจุบัน
      regAddr,                                        // O: ที่อยู่ตามทะเบียนบ้าน
      parentName,                                     // P: ชื่อผู้ปกครอง
      getRandom(relations),                           // Q: ความสัมพันธ์
      parentPhone,                                    // R: เบอร์โทรศัพท์ (ผู้ปกครอง)
      selectedMajor.th,                               // S: สาขาเรียน
      selectedMajor.en,                               // T: ชื่อย่อสาขา
      branch711,                                      // U: ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)
      "พนักงานฝึกหัด (Student Trainee)",               // V: ตำแหน่งปี 1
      "3 เดือน",                                       // W: ระยะเวลาฝึกงานปี 1
      getRandom(["CP ALL (DC/RDC)", branch711, "CP RAM"]), // X: ชื่อสถานประกอบการฝึกงานปี 2
      "ผู้ช่วยผู้จัดการร้านฝึกหัด / พนักงานฝึกหัด",          // Y: ตำแหน่งปี 2
      "3 เดือน",                                       // Z: ระยะเวลาฝึกงานปี 2
      getRandom(companies),                           // AA: ชื่อสถานประกอบการฝึกงานปี 3-4
      getRandom(["Cooperative Education", "Trainee Engineer", "Marketing Trainee"]), // AB: ตำแหน่งปี 3-4
      "4 เดือน",                                       // AC: ระยะเวลาฝึกงานปี 3-4
      selectedMajor.proj,                             // AD: Final Project
      `01/06/${startYear}`,                           // AE: วันที่เริ่มศึกษา
      `31/03/${gradYear}`,                            // AF: วันที่จบการศึกษา
      gradYear,                                       // AG: ปีการศึกษาที่จบ
      jobStatus,                                      // AH: สถานะการทำงาน
      isWorking ? `01/05/${gradYear}` : "-",          // AI: วันที่เริ่มงาน
      isWorking ? getRandom(companies) : "-",         // AJ: ชือสถานประกอบการที่บรรจุงาน
      isWorking ? getRandom(positions) : "-",         // AK: ตำแหน่งงาน
      isWorking ? getRandom(["ตรงสาย", "ตรงสาย", "ไม่ตรงสาย"]) : "-", // AL: สถานะการได้งานจากที่ฝึกงาน
      "",                                             // AM: หมายเหตุ
      "",                                             // AN: รูปโปรไฟล์
      isWorking ? getRandom([15000, 18000, 20000, 22000, 25000, 28000, 30000, 35000]) : 0 // AO: เงินเดือน (บาท)
    ];
    
    dataRows.push(row);
  }

  // 4. นำข้อมูลไปเขียนลงตาราง (ใช้ Batch write เพื่อความเร็วสูงสุด)
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
  
  // จัดรูปแบบให้สวยงาม
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#D9E1F2");
  sheet.setFrozenRows(1);
  
  SpreadsheetApp.getUi().alert("สร้างข้อมูล Mockup นักศึกษา 1,000 คน เรียบร้อยแล้วค่ะ!");
}

// 📤 ฟังก์ชันสำหรับซิงค์หรือนำเข้ารูปภาพนักศึกษาจำนวนมากจาก Google Drive แบบ 100% ฟรี
function bulkImportPhotosFromDrive() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    '📤 นำเข้าคลังรูปภาพนักศึกษาจาก Google Drive',
    'กรุณากรอก Folder ID ของโฟลเดอร์ใน Google Drive ที่เก็บรูปภาพนักศึกษาไว้:\n(รูปภาพในโฟลเดอร์ต้องตั้งชื่อไฟล์ด้วย "รหัสนักศึกษา" หรือ "เลขบัตรประชาชน" เช่น 6679555016.jpg)',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var folderId = response.getResponseText().trim();
  if (!folderId) {
    ui.alert('❌ ข้อผิดพลาด: กรุณากรอก Folder ID ที่ถูกต้อง');
    return;
  }
  
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var photoMap = {};
    var processedCount = 0;
    
    // สแกนหารูปภาพทั้งหมดในโฟลเดอร์และตั้งค่าการเข้าถึง
    while (files.hasNext()) {
      var file = files.next();
      var mimeType = file.getMimeType();
      if (mimeType && mimeType.indexOf('image/') !== -1) {
        var filename = file.getName();
        var key = filename.substring(0, filename.lastIndexOf('.')).trim();
        var fileId = file.getId();
        
        // แปลงลิงก์ของ Google Drive ให้กลายเป็น Direct Link (ดูรูปได้ตรงๆ บนเว็บโดยไม่ต้องล็อกอิน)
        var directLink = 'https://lh3.googleusercontent.com/d/' + fileId;
        photoMap[key] = directLink;
        
        // แชร์ไฟล์แบบ "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (เพื่อให้เบราว์เซอร์ผู้ใช้ปลายทางดึงรูปไปแสดงผลได้)
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        processedCount++;
      }
    }
    
    if (processedCount === 0) {
      ui.alert('⚠️ ไม่พบไฟล์รูปภาพใดๆ ในโฟลเดอร์ดังกล่าว กรุณาตรวจสอบนามสกุลไฟล์หรือประเภทไฟล์รูปภาพ');
      return;
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
    var headers = enforceHeaders(sheet);
    var values = sheet.getDataRange().getValues();
    
    var idCardIndex = headers.indexOf("เลขบัตรประชาชน");
    var studentIdIndex = headers.indexOf("รหัสนักศึกษา");
    var profilePhotoIndex = headers.indexOf("รูปโปรไฟล์");
    
    if (profilePhotoIndex === -1) {
      ui.alert('❌ ไม่พบคอลัมน์ "รูปโปรไฟล์" ในตารางข้อมูล');
      return;
    }
    
    var updateCount = 0;
    // คลุมช่วงข้อมูลแล้วเขียนลงตาราง
    for (var i = 1; i < values.length; i++) {
      var stdId = String(values[i][studentIdIndex]).trim();
      var idCard = String(values[i][idCardIndex]).replace(/'/g, "").trim();
      
      // แมปตามรหัสนักศึกษา หรือเลขบัตรประชาชน
      var photoUrl = photoMap[stdId] || photoMap[idCard];
      if (photoUrl) {
        sheet.getRange(i + 1, profilePhotoIndex + 1).setValue(photoUrl);
        updateCount++;
      }
    }
    
    ui.alert('✅ สำเร็จ!\nนำเข้ารูปภาพนักศึกษาและเชื่อมโยงโปรไฟล์เรียบร้อยแล้วทั้งหมด ' + updateCount + ' คน (จากไฟล์รูปภาพทั้งหมดที่พบ ' + processedCount + ' รูป)');
  } catch (e) {
    ui.alert('❌ เกิดข้อผิดพลาด: ' + e.toString());
  }
}

// 📤 ฟังก์ชันประมวลผลคำสั่ง API ซิงค์รูปโปรไฟล์จาก Google Drive ผ่านหน้าเว็บ (Admin Panel)
function processBulkImportPhotos(payload, adminUser) {
  var folderId = String(payload.folderId || "").trim();
  if (!folderId) {
    return { status: "error", message: "ไม่ระบุ Folder ID ของ Google Drive" };
  }
  
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var photoMap = {};
    var processedCount = 0;
    
    // สแกนหารูปภาพและแชร์สิทธิ์ดู
    while (files.hasNext()) {
      var file = files.next();
      var mimeType = file.getMimeType();
      if (mimeType && mimeType.indexOf('image/') !== -1) {
        var filename = file.getName();
        var key = filename.substring(0, filename.lastIndexOf('.')).trim();
        var fileId = file.getId();
        
        var directLink = 'https://lh3.googleusercontent.com/d/' + fileId;
        photoMap[key] = directLink;
        
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        processedCount++;
      }
    }
    
    if (processedCount === 0) {
      return { status: "error", message: "ไม่พบไฟล์รูปภาพใดๆ ในโฟลเดอร์ Google Drive นี้" };
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
    var headers = enforceHeaders(sheet);
    var values = sheet.getDataRange().getValues();
    
    var idCardIndex = headers.indexOf("เลขบัตรประชาชน");
    var studentIdIndex = headers.indexOf("รหัสนักศึกษา");
    var profilePhotoIndex = headers.indexOf("รูปโปรไฟล์");
    
    if (profilePhotoIndex === -1) {
      return { status: "error", message: "ไม่พบคอลัมน์ \"รูปโปรไฟล์\" ในสเปรดชีต" };
    }
    
    var updateCount = 0;
    for (var i = 1; i < values.length; i++) {
      var stdId = String(values[i][studentIdIndex]).trim();
      var idCard = String(values[i][idCardIndex]).replace(/'/g, "").trim();
      
      var photoUrl = photoMap[stdId] || photoMap[idCard];
      if (photoUrl) {
        sheet.getRange(i + 1, profilePhotoIndex + 1).setValue(photoUrl);
        updateCount++;
      }
    }
    
    // เขียนบันทึกประวัติการทำงาน (Audit Log)
    writeAuditLog(adminUser.username, "BULK_IMPORT_PHOTOS", "ซิงค์รูปโปรไฟล์นักศึกษาสำเร็จ " + updateCount + " คน จากทั้งหมดที่พบ " + processedCount + " รูปในไดรฟ์");
    return { status: "success", updateCount: updateCount, processedCount: processedCount };
  } catch (e) {
    return { status: "error", message: "ข้อผิดพลาดระบบ Google Drive: " + e.toString() };
  }
}

// 📤 ฟังก์ชันบันทึกรูปโปรไฟล์ปริมาณมากที่อัปโหลดตรงจากหน้าเว็บ (Local Bulk Upload) ลงในตาราง
function processBulkImportPhotosLocal(payload, adminUser) {
  var photos = payload.photos;
  if (!photos || !Array.isArray(photos)) {
    return { status: "error", message: "ไม่พบข้อมูลรูปภาพที่อัปโหลด" };
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.DATA_SHEET);
    var headers = enforceHeaders(sheet);
    var values = sheet.getDataRange().getValues();
    
    var idCardIndex = headers.indexOf("เลขบัตรประชาชน");
    var studentIdIndex = headers.indexOf("รหัสนักศึกษา");
    var profilePhotoIndex = headers.indexOf("รูปโปรไฟล์");
    
    if (profilePhotoIndex === -1) {
      return { status: "error", message: "ไม่พบคอลัมน์ \"รูปโปรไฟล์\" ในตารางข้อมูล" };
    }
    
    // สร้าง Map สำหรับรูปภาพเพื่อดึงมาเขียนลงแถวได้ทันที key -> base64
    var photoMap = {};
    photos.forEach(function(item) {
      if (item.key && item.base64) {
        photoMap[String(item.key).trim()] = item.base64;
      }
    });
    
    var updateCount = 0;
    // วนลูปเปรียบเทียบข้อมูลเพื่อเขียนลงตาราง
    for (var i = 1; i < values.length; i++) {
      var stdId = String(values[i][studentIdIndex]).trim();
      var idCard = String(values[i][idCardIndex]).replace(/'/g, "").trim();
      
      var base64Data = photoMap[stdId] || photoMap[idCard];
      if (base64Data) {
        sheet.getRange(i + 1, profilePhotoIndex + 1).setValue(base64Data);
        updateCount++;
      }
    }
    
    // เขียนบันทึกประวัติการทำงาน (Audit Log)
    writeAuditLog(adminUser.username, "BULK_UPLOAD_PHOTOS_LOCAL", "อัปโหลดรูปโปรไฟล์แบบกลุ่มสำเร็จ " + updateCount + " คน");
    return { status: "success", updateCount: updateCount };
  } catch (e) {
    return { status: "error", message: "ข้อผิดพลาดระบบการบันทึก: " + e.toString() };
  }
}