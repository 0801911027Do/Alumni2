const DATA_SHEET_NAME = 'AlumniData';
const USER_SHEET_NAME = 'Users';

const THAI_TO_ENG = {
  'รหัสนักศึกษา': 'studentId',
  'เลขประจำตัวประชาชน': 'idCard', 'คำนำหน้า': 'prefix', 'ชื่อ (ไทย)': 'nameTH', 'นามสกุล (ไทย)': 'surnameTH',
  'ชื่อ (อังกฤษ)': 'nameEN', 'นามสกุล (อังกฤษ)': 'surnameEN', 'ชื่อเล่น': 'nickname', 'เพศ': 'gender',
  'วัน/เดือน/ปีเกิด': 'birthDate', 'รหัสสาขา': 'branchCode', 'สาขา': 'branch', 'คณะ': 'faculty',
  'อายุ': 'age', 'เบอร์โทรศัพท์': 'phone', 'อีเมล': 'email', 'โรคประจำตัว': 'disease',
  'ที่อยู่ปัจจุบัน': 'currentAddress', 'ที่อยู่ตามทะเบียนบ้าน': 'homeAddress', 'ชื่อ-สกุล ผู้ปกครอง': 'parentName',
  'เบอร์โทร ผู้ปกครอง': 'parentPhone', 'ความสัมพันธ์': 'parentRelation', 'ปี1 สาขา 7-Eleven': 'internY1_711Branch',
  'ปี1 พื้นที่/ภาค': 'internY1_711Area', 'ปี1 รหัสพนักงาน': 'internY1_711EmpID', 'ปี2 บริษัท': 'internY2_Company',
  'ปี2 ตำแหน่ง': 'internY2_Position', 'ปี2 แผนก': 'internY2_Dept', 'ปี3 บริษัท': 'internY3_Company',
  'ปี3 ตำแหน่ง': 'internY3_Position', 'ปี3 แผนก': 'internY3_Dept', 'ปี4 บริษัท': 'internY4_Company',
  'ปี4 ตำแหน่ง': 'internY4_Position', 'ปี4 แผนก': 'internY4_Dept', 'วันจบการศึกษา': 'gradDate',
  'สถานะการทำงาน': 'jobStatus', 'วันที่ได้รับการบรรจุ': 'jobStartDate', 'ชื่อบริษัทที่ทำงาน': 'jobCompany',
  'ตำแหน่งที่ทำงาน': 'jobPosition', 'แผนกที่ทำงาน': 'jobDept', 'เงินเดือน (บาท)': 'jobSalary',
  'สถานะปัจจุบัน': 'jobCurrentStatus', 'ระยะเวลาได้งานทำ': 'durationToGetJob'
};

// ✅ ฟังก์ชันแปลงวันที่เป็นรูปแบบ YYYY-MM-DD
function formatDateToISO(dateInput) {
  if (!dateInput || dateInput === "" || dateInput === "-") return "";
  
  let dateStr = String(dateInput).trim();
  
  // ถ้าเป็น Excel date serial (ตัวเลขมากกว่า 60000 เป็นวันที่)
  if (!isNaN(dateStr) && Number(dateStr) > 100) {
    let excelDate = Number(dateStr);
    let date = new Date((excelDate - 25569) * 86400 * 1000);
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // ถ้าเป็นรูปแบบ YYYY-MM-DD แล้ว ให้คืนค่าตามเดิม
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // ถ้าเป็นรูปแบบ DD/MM/YYYY ให้แปลง
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    let parts = dateStr.split('/');
    let day = String(parts[0]).padStart(2, '0');
    let month = String(parts[1]).padStart(2, '0');
    let year = parts[2];
    if (year < 2500 && year > 1900) {
      year = Number(year) + 543;
    }
    return `${year - 543}-${month}-${day}`;
  }
  
  return dateStr;
}

// ✅ ตรวจสอบ idCard 13 หลัก
function validateIDCard(idCard) {
  idCard = String(idCard).trim();
  if (idCard.length !== 13 || !/^\d+$/.test(idCard)) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(idCard.charAt(i)) * (13 - i);
  }
  let checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(idCard.charAt(12));
}

// ✅ ตรวจสอบข้อมูลซ้ำ
function getExistingRecords(sheet) {
  let records = {};
  let values = sheet.getDataRange().getValues();
  let headers = values[0];
  let idCardIndex = headers.indexOf("เลขประจำตัวประชาชน");
  let studentIdIndex = headers.indexOf("รหัสนักศึกษา");
  
  for (let i = 1; i < values.length; i++) {
    let idCard = String(values[i][idCardIndex]).trim();
    let studentId = String(values[i][studentIdIndex]).trim();
    
    if (idCard) records[`idCard:${idCard}`] = i;
    if (studentId) records[`studentId:${studentId}`] = i;
  }
  return records;
}

function setupHeadersOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let userSheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!userSheet) {
    userSheet = ss.insertSheet(USER_SHEET_NAME);
    userSheet.getRange(1, 1, 1, 4).setValues([["Username", "Password", "Role", "Name"]]);
    userSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e2e8f0");
    userSheet.appendRow(["admin", "admin", "admin", "แอดมินระบบ (แก้ไขได้)"]);
    userSheet.appendRow(["user", "user", "user", "ผู้บริหาร (ดูได้อย่างเดียว)"]);
  }
  
  let dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!dataSheet) {
    let sheet1 = ss.getSheets()[0];
    if (sheet1.getName() === "แผ่นที่ 1" || sheet1.getName() === "Sheet1") {
      sheet1.setName(DATA_SHEET_NAME);
      dataSheet = sheet1;
    } else {
      dataSheet = ss.insertSheet(DATA_SHEET_NAME);
    }
  }
  
  const headers = Object.keys(THAI_TO_ENG);
  
  dataSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  dataSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#bfdbfe");
  dataSheet.setFrozenRows(1);
  
  try { Logger.log('✅ สร้างชีตและหัวตารางเรียบร้อยแล้ว!'); } catch(e) {}
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ไม่มีข้อมูล" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var response;
    
    if (action === "login") response = processLogin(payload);
    else if (action === "add_data") response = processAddData(payload);
    else if (action === "edit") response = processEdit(payload);
    else if (action === "import_excel") response = processImportExcel(payload);
    else throw new Error("ไม่รู้จักคำสั่ง (Invalid Action)");
    
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify(processGetData())).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ✅ ปรับปรุง processImportExcel เพื่อ validate และป้องกัน duplicate
function processImportExcel(payload) {
  if (!payload) {
    return { status: "error", message: "ไม่พบข้อมูลที่ส่งมา" };
  }

  var data = payload.data || [];
  var importMode = payload.importMode || "append"; 
  if (data.length === 0) return { status: "error", message: "ไม่พบข้อมูลที่จะนำเข้า" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;

  if (importMode === "new") {
    var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
    sheet = ss.insertSheet("Import_" + timeStamp);
  } else {
    sheet = ss.getSheetByName(DATA_SHEET_NAME);
    if (!sheet) return { status: "error", message: "ไม่พบชีตชื่อ " + DATA_SHEET_NAME };
    
    if (importMode === "replace") {
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow > 1 && lastCol > 0) sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
  }

  var headers = [];
  if (sheet.getLastRow() === 0) {
    headers = Object.keys(THAI_TO_ENG);
    sheet.appendRow(headers);
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  // ✅ ดึงข้อมูลที่มีอยู่แล้วเพื่อ validate duplicate
  let existingRecords = {};
  if (importMode === "append") {
    existingRecords = getExistingRecords(sheet);
  }
  
  var rowsToAppend = [];
  var duplicateCount = 0;
  var successCount = 0;
  var errorCount = 0;
  
  for (var i = 0; i < data.length; i++) {
    var rowData = data[i];
    var newRow = [];
    var idCardValue = "";
    var studentIdValue = "";
    var hasError = false;
    var errorMsg = "";
    
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var engKey = THAI_TO_ENG[header];
      
      var cellValue = "";
      if (engKey && rowData[engKey] !== undefined) {
        cellValue = rowData[engKey];
      } else if (rowData[header] !== undefined) {
        cellValue = rowData[header];
      }
      
      // ✅ ตรวจสอบและแปลงวันที่
      if (header.includes("วัน") || header.includes("ปี")) {
        cellValue = formatDateToISO(cellValue);
      }
      
      // ✅ เก็บค่า idCard เพื่อ validate
      if (header === "เลขประจำตัวประชาชน") {
        idCardValue = String(cellValue).trim();
        if (idCardValue && !validateIDCard(idCardValue)) {
          hasError = true;
          errorMsg = `แถว ${i+1}: บัตรประชาชน ${idCardValue} ไม่ถูกต้อง`;
        }
      }
      
      // ✅ เก็บค่า studentId
      if (header === "รหัสนักศึกษา") {
        studentIdValue = String(cellValue).trim();
      }
      
      newRow.push(cellValue);
    }
    
    // ✅ ตรวจสอบ duplicate
    if (importMode === "append") {
      if (idCardValue && existingRecords[`idCard:${idCardValue}`]) {
        duplicateCount++;
        continue;
      }
      if (studentIdValue && existingRecords[`studentId:${studentIdValue}`]) {
        duplicateCount++;
        continue;
      }
    }
    
    if (hasError) {
      errorCount++;
      Logger.log(errorMsg);
      continue;
    }
    
    rowsToAppend.push(newRow);
    successCount++;
  }
  
  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }
  
  return { 
    status: "success", 
    message: `นำเข้าสำเร็จ: ${successCount} รายการ`,
    details: {
      imported: successCount,
      duplicated: duplicateCount,
      errors: errorCount,
      total: data.length
    }
  };
}

// ✅ ดึงข้อมูลไปแสดงหน้าเว็บ
function processGetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DATA_SHEET_NAME);
  if(!sheet) return { status: 'success', data: [] };
  
  var values = sheet.getDataRange().getValues();
  var displayValues = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return { status: 'success', data: [] };
  
  var headers = values[0];
  var data = [];
  
  for (var i = 1; i < values.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var rawValue = values[i][j];
      var header = headers[j];
      
      // ✅ ตรวจสอบรูปแบบวันที่
      if (rawValue instanceof Date) {
        rowObj[header] = Utilities.formatDate(rawValue, "GMT+7", "yyyy-MM-dd");
      } else {
        var strVal = String(rawValue);
        if (strVal.length >= 10 && strVal.charAt(10) === 'T') strVal = strVal.substring(0, 10);
        rowObj[header] = strVal || displayValues[i][j]; 
      }
    }
    data.push(rowObj);
  }
  
  return { status: 'success', data: data };
}

// ✅ ตรวจสอบการ Login
function processLogin(payload) {
  if (!payload) {
    return { status: "error", message: "ไม่พบข้อมูลที่ส่งมา" };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(USER_SHEET_NAME);
  if(!sheet) return { status: "error", message: "ไม่พบชีตระบบผู้ใช้งาน" };
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (payload.username === String(data[i][0]) && payload.password === String(data[i][1])) {
      return { status: "success", role: data[i][2], name: data[i][3] || data[i][0] };
    }
  }
  return { status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
}

// ✅ เพิ่มข้อมูล 1 รายการ
function processAddData(payload) {
  if (!payload) {
    return { status: "error", message: "ไม่พบข้อมูลที่ส่งมา" };
  }

  var dataObj = payload.data || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DATA_SHEET_NAME);
  
  if (!sheet) return { status: "error", message: "ไม่พบชีตชื่อ " + DATA_SHEET_NAME };
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return { status: "error", message: "ยังไม่มีหัวตาราง โปรดรัน setupHeadersOnly() ก่อน" };
  
  // ✅ ตรวจสอบ idCard ซ้ำ
  let idCard = String(dataObj.idCard || "").trim();
  if (idCard && !validateIDCard(idCard)) {
    return { status: "error", message: "บัตรประชาชนไม่ถูกต้อง" };
  }
  
  let existingRecords = getExistingRecords(sheet);
  if (idCard && existingRecords[`idCard:${idCard}`]) {
    return { status: "error", message: "บัตรประชาชนนี้มีอยู่ในระบบแล้ว" };
  }
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  var newRow = [];
  for (var j = 0; j < headers.length; j++) {
    var thaiHeader = headers[j];
    var engKey = THAI_TO_ENG[thaiHeader];
    var cellValue = engKey && dataObj[engKey] !== undefined ? dataObj[engKey] : "";
    
    // ✅ แปลงวันที่
    if (thaiHeader.includes("วัน") || thaiHeader.includes("ปี")) {
      cellValue = formatDateToISO(cellValue);
    }
    
    newRow.push(cellValue);
  }
  sheet.appendRow(newRow);
  return { status: "success" };
}

// ✅ แก้ไขข้อมูล
function processEdit(payload) {
  if (!payload) {
    return { status: "error", message: "ไม่พบข้อมูลที่ส่งมา" };
  }

  var dataObj = payload.data || {};
  var idCard = dataObj.idCard;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DATA_SHEET_NAME);
  
  if (!sheet) return { status: "error", message: "ไม่พบชีตชื่อ " + DATA_SHEET_NAME };
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return { status: "error", message: "ไม่มีข้อมูลในตารางให้แก้ไข" };

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIndex = headers.indexOf("เลขประจำตัวประชาชน");
  
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(idCard)) {
      var updateRow = [];
      for (var k = 0; k < headers.length; k++) {
        var engKey = THAI_TO_ENG[headers[k]];
        var cellValue = engKey && dataObj[engKey] !== undefined ? dataObj[engKey] : values[i][k];
        
        // ✅ แปลงวันที่
        if (headers[k].includes("วัน") || headers[k].includes("ปี")) {
          cellValue = formatDateToISO(cellValue);
        }
        
        updateRow.push(cellValue);
      }
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updateRow]);
      return { status: "success" };
    }
  }
  return { status: "error", message: "ไม่พบเลขบัตรนี้ในระบบ" };
}
