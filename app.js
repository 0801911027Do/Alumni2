
const API_URL = "https://script.google.com/macros/s/AKfycbwcPXx1vNxGrbSUTOEL8kERkGrx4e8rSSwcApYtQow7awF9NSxxFGkUCTCo3bBp26Sw/exec";

// Lazy Load XLSX function to improve performance
let xlsxLoaded = false;
window.loadXLSX = function () {
  return new Promise((resolve, reject) => {
    if (xlsxLoaded || typeof XLSX !== 'undefined') return resolve();
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = () => { xlsxLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

window.$ = function (id) { return document.getElementById(id); };
window.esc = function (e) { return String(e || "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); };
window.fmtMoney = function (e) { return e && Number(e) > 0 ? Number(e).toLocaleString('th-TH') + " ฿" : "-"; };
window.cleanDate = function (e) { let t = String(e || "").trim(); return t.length >= 10 && "T" === t.charAt(10) ? t.substring(0, 10) : t; };
window.getVal = function (obj, key) { return String(obj[key] || "").trim(); };
window.normalizeCompany = function (name) {
  if (!name || name.trim() === "" || name.trim() === "-") return "ธุรกิจส่วนตัว / ไม่ระบุ";
  return name.trim().toUpperCase();
};

window.jcBadge = function (jobStatus, jobCurrentStatus) {
  if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(jobStatus) || (jobStatus === "อื่นๆ" && jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) return "badge-work";
  if (["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(jobStatus) || (jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(jobCurrentStatus))) return "badge-study";
  if (["กำลังศึกษา"].includes(jobStatus) || (jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(jobCurrentStatus))) return "badge-studying";
  if (jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(jobCurrentStatus)) return "badge-mission";
  if (["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(jobStatus) || (jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(jobCurrentStatus))) return "badge-danger";
  return "badge-seek";
};

window.getAvatar = function (n, g) { const i = n ? n.charAt(0) : 'U'; const c = g === 'หญิง' ? 'color:#DB2777;background:#FCE7F3;' : 'color:var(--primary);background:var(--primary-soft);'; return `<div class="smart-avatar" style="${c}">${i}</div>`; };

let dashYear = "";

window.checkSetup = function () {
  if (!API_URL || API_URL.trim() === "" || API_URL.includes("YOUR_DEPLOYMENT_ID")) {
    if ($("loginError")) { $("loginError").innerHTML = '<i data-lucide="alert-triangle" style="width:20px;height:20px;"></i> <strong style="color:var(--danger)">ยังไม่ได้ตั้งค่า API_URL</strong>'; $("loginError").classList.remove("hidden"); lucide.createIcons(); }
  }
};

window.openModal = function (e) { $("modalBackdrop").classList.remove("hidden"); $(e).classList.remove("hidden"); document.body.classList.add("modal-open"); };
window.closeAllModals = function () { $("modalBackdrop").classList.add("hidden"); document.querySelectorAll(".modal-box").forEach((e) => e.classList.add("hidden")); document.body.classList.remove("modal-open"); hasUnsavedChanges = false; };

window.safeCloseModal = function () {
  if (hasUnsavedChanges) {
    $("modalForm").classList.add("hidden");
    $("modalDiscard").classList.remove("hidden");
    lucide.createIcons();
  } else {
    window.closeAllModals();
  }
};

window.cancelDiscard = function () {
  $("modalDiscard").classList.add("hidden");
  $("modalForm").classList.remove("hidden");
};

window.forceCloseModals = function () {
  hasUnsavedChanges = false;
  window.closeAllModals();
};

// -------------------------------------------------------------
// 🟢 สมาร์ทฟังก์ชันสำหรับจัดการข้อมูลวันที่ที่มาจาก Excel 
// -------------------------------------------------------------
window.formatAndCleanDate = function (val) {
  if (!val || val === "-" || String(val).trim() === "") return "";
  let strVal = String(val).trim();

  if (!isNaN(Number(strVal)) && Number(strVal) > 10000) {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + Number(strVal) * 86400000);
    const d = String(jsDate.getDate()).padStart(2, '0');
    const m = String(jsDate.getMonth() + 1).padStart(2, '0');
    const y = jsDate.getFullYear();
    return `${y}-${m}-${d}`;
  }

  strVal = strVal.replace(/\//g, '-');

  let p = strVal.split('-');
  if (p.length === 3) {
    let y = 0, m = 0, d = 0;
    if (p[0].length === 4) {
      y = parseInt(p[0]); m = parseInt(p[1]); d = parseInt(p[2]);
    } else if (p[2].length === 4 || p[2].length === 2) {
      d = parseInt(p[0]); m = parseInt(p[1]); y = parseInt(p[2]);
      if (y < 100) { y += 2500; }
    }
    if (y > 2400) y -= 543;

    if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return "";
};

window.checkIDCard = function (id) {
  if (id.length != 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseFloat(id.charAt(i)) * (13 - i);
  if ((11 - sum % 11) % 10 != parseFloat(id.charAt(12))) return false;
  return true;
};

window.calcYMD = function (gradDate, jobDate) {
  if (!gradDate || !jobDate || "-" === gradDate || "-" === jobDate) return "-";
  const gradParts = String(gradDate).split("-").map(Number);
  const jobParts = String(jobDate).split("-").map(Number);
  if (gradParts.length !== 3 || jobParts.length !== 3) return "-";

  const gradDateObj = new Date(gradParts[0], gradParts[1] - 1, gradParts[2]);
  const jobDateObj = new Date(jobParts[0], jobParts[1] - 1, jobParts[2]);

  if (isNaN(gradDateObj) || isNaN(jobDateObj)) return "-";
  if (jobDateObj < gradDateObj) return "ได้งานก่อนเรียนจบ";

  let years = jobDateObj.getFullYear() - gradDateObj.getFullYear();
  let months = jobDateObj.getMonth() - gradDateObj.getMonth();
  let days = jobDateObj.getDate() - gradDateObj.getDate();

  if (days < 0) { months--; days += new Date(jobDateObj.getFullYear(), jobDateObj.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }

  let result = [];
  if (years > 0) result.push(`${years} ปี`);
  if (months > 0) result.push(`${months} เดือน`);
  if (days > 0) result.push(`${days} วัน`);

  return result.length > 0 ? result.join(" ") : "0 วัน";
};

// --- Core Utils ---
window.gregorianToThaiStr = function (e) { if (!e || "-" === e) return ""; const t = e.split("T")[0].split("-"); if (3 !== t.length) return e; const n = parseInt(t[0]) + 543; return `${t[2].padStart(2, "0")}/${t[1].padStart(2, "0")}/${n}`; };

window.thaiStrToGregorian = function (e) {
  if (!e) return "";
  const t = e.split("/");
  if (3 === t.length) {
    let y = parseInt(t[2]);
    if (y >= 2500) y -= 543;
    else if (y > 2400) y -= 543;
    return `${y}-${t[1].padStart(2, "0")}-${t[0].padStart(2, "0")}`;
  }
  return e;
};

window.thaiStrToDateInput = function (e) {
  if (!e || "-" === e) return "";
  const t = e.split("T")[0].split("-");
  if (t.length === 3) return e.split("T")[0];
  const n = e.split("/");
  if (n.length === 3) {
    let y = parseInt(n[2]);
    if (y > 2400) y -= 543;
    return `${y}-${n[1].padStart(2, '0')}-${n[0].padStart(2, '0')}`;
  }
  return "";
};

const FACULTY_DATA = {
  "คณะวิศวกรรมศาสตร์และเทคโนโลยี": [
    { id: "CAI", name: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์" },
    { id: "CYB", name: "การรักษาความมั่นคงปลอดภัยไซเบอร์" },
    { id: "RAE", name: "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ" },
    { id: "AME", name: "วิศวกรรมการผลิตยานยนต์" },
    { id: "IEM", name: "วิศวกรรมอุตสาหการและการผลิตอัจฉริยะ" },
    { id: "DIT", name: "เทคโนโลยีดิจิทัลและสารสนเทศ" }
  ]
};

const FORM_FIELDS = [
  "batchYear", "faculty", "branchCode", "branch", "idCard", "studentId", "prefix", "nameTH", "surnameTH",
  "nameEN", "surnameEN", "nickname", "gender", "birthDate", "phone", "email", "disease",
  "currentAddress", "homeAddress", "parentName", "parentPhone", "parentRelation",
  "internY1_711Branch", "internY1_711Area", "internY1_711EmpID", "internY2_Company",
  "internY2_Position", "internY2_Dept", "internY3_Company", "internY3_Position", "internY3_Dept",
  "internY4_Company", "internY4_Position", "internY4_Dept", "gradDate", "jobStatus",
  "jobStartDate", "jobCurrentStatus", "jobCurrentStatus_other", "jobCompany", "jobCompanyAddress", "jobCompanyPhone", "jobPosition",
  "jobDept", "jobSalary", "jobRemark"
];

let STUDENTS = [], currentUser = null, currentPage = "dash", filterStatus = "ทั้งหมด", filterBr = "ทั้งหมด", filterBrId = "ทั้งหมด", filterFac = "ทั้งหมด", editingIdCard = null, formData = {}, deleteId = null, isFetching = false, hasAttemptedSave = false, hasUnsavedChanges = false;
let currentTablePage = 1;
const itemsPerPage = 25;

window.formatThaiDateShort = function (e) {
  if (!e || "-" === e) return "-";
  const t = e.split("T")[0].split("-");
  if (t.length !== 3) return e;
  let year = parseInt(t[0]);
  if (year < 2500) year += 543;
  return `${t[2].padStart(2, '0')}/${t[1].padStart(2, '0')}/${year}`;
};

window.exportToExcel = async function () {
  const filtered = window.getFilteredStudents();
  if (!filtered.length) return window.showToast("ไม่มีข้อมูลสำหรับส่งออก", true);

  window.showLoading(true, "กำลังเตรียมไลบรารี...");
  await window.loadXLSX();
  window.showLoading(true, "กำลังเตรียมไฟล์ Excel...");
  try {
    const dataToExport = filtered.map(s => ({
      "รหัสนักศึกษา": s.studentId || "-",
      "เลขประจำตัวประชาชน": s.idCard || "-",
      "คำนำหน้า": s.prefix || "-",
      "ชื่อ (ไทย)": s.nameTH || "-",
      "นามสกุล (ไทย)": s.surnameTH || "-",
      "ชื่อ (อังกฤษ)": s.nameEN || "-",
      "นามสกุล (อังกฤษ)": s.surnameEN || "-",
      "ชื่อเล่น": s.nickname || "-",
      "เพศ": s.gender || "-",
      "วัน/เดือน/ปีเกิด": window.formatThaiDateShort(s.birthDate),
      "คณะ": s.faculty || "-",
      "สาขา": s.branch || "-",
      "รหัสสาขา": s.branchCode || "-",
      "เบอร์โทรศัพท์": s.phone || "-",
      "อีเมล": s.email || "-",
      "สถานะการทำงาน": s.jobStatus === "อื่นๆ" ? s.jobCurrentStatus : s.jobStatus,
      "บริษัทที่ทำ": s.jobCompany || "-",
      "ตำแหน่ง": s.jobPosition || "-",
      "เงินเดือน": s.jobSalary || 0,
      "วันที่เริ่มงาน/บรรจุ": window.formatThaiDateShort(s.jobStartDate),
      "เวลาที่ใช้หางาน (นับจากจบ)": s.durationToGetJob || "-",
      "หมายเหตุ": s.jobRemark || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentData");
    XLSX.writeFile(wb, "Student_Data_Export.xlsx");
    window.showLoading(false);
    window.showToast("ส่งออกไฟล์ Excel สำเร็จ");
  } catch (e) {
    window.showLoading(false);
    window.showToast("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel", true);
    console.error("Export Error: ", e);
  }
};

// -------------------------------------------------------------
// 🟢 ส่วนนำเข้าข้อมูล Excel / CSV (จัดโครงสร้างใหม่ให้ตรงกับ Google Sheets)
// -------------------------------------------------------------
const IMPORT_KEY_MAP = {
  "เลขประจำตัวประชาชน": ["เลขประจำตัวประชาชน", "เลขบัตรประชาชน", "เลขบัตร", "บัตรประชาชน", "รหัสประจำตัว", "id card", "idcard", "id_card", "รหัสบัตร"],
  "รหัสนักศึกษา": ["รหัสนักศึกษา", "student id", "student_id", "รหัสประจำตัวนิสิต", "รหัสนิสิต"],
  "คำนำหน้า": ["คำนำหน้า", "prefix", "title"],
  "ชื่อ (ไทย)": ["ชื่อ (ไทย)", "ชื่อไทย", "ชื่อ", "name", "name_th", "ชื่อ(ไทย)", "first name", "firstname"],
  "นามสกุล (ไทย)": ["นามสกุล (ไทย)", "นามสกุล", "นามสกุลไทย", "surname", "last_name", "lastname", "lastname_th", "นามสกุล(ไทย)"],
  "ชื่อ (อังกฤษ)": ["ชื่อ (อังกฤษ)", "ชื่ออังกฤษ", "name_en", "ชื่อ(อังกฤษ)", "first name en"],
  "นามสกุล (อังกฤษ)": ["นามสกุล (อังกฤษ)", "นามสกุลอังกฤษ", "surname_en", "นามสกุล(อังกฤษ)", "last name en"],
  "ชื่อเล่น": ["ชื่อเล่น", "nickname"],
  "เพศ": ["เพศ", "gender", "sex"],
  "วัน/เดือน/ปีเกิด": ["วัน/เดือน/ปีเกิด", "วันเกิด", "birth", "birthdate", "dob", "วันเดือนปีเกิด"],
  "รหัสสาขา": ["รหัสสาขา", "branch code", "branch_code"],
  "สาขา": ["สาขา", "สาขาวิชา", "หลักสูตร", "branch"],
  "คณะ": ["คณะ", "faculty"],
  "อายุ": ["อายุ", "age"],
  "เบอร์โทรศัพท์": ["เบอร์โทรศัพท์", "เบอร์โทร", "เบอร์", "โทรศัพท์", "phone", "tel"],
  "อีเมล": ["อีเมล", "email", "e-mail", "mail"],
  "โรคประจำตัว": ["โรคประจำตัว", "disease", "โรค"],
  "ที่อยู่ปัจจุบัน": ["ที่อยู่ปัจจุบัน", "ที่อยู่", "current address"],
  "ที่อยู่ตามทะเบียนบ้าน": ["ที่อยู่ตามทะเบียนบ้าน", "ทะเบียนบ้าน", "home address"],
  "ชื่อ-สกุล ผู้ปกครอง": ["ชื่อ-สกุล ผู้ปกครอง", "ชื่อผู้ปกครอง", "parent name", "ชื่อ-นามสกุล ผู้ปกครอง"],
  "เบอร์โทร ผู้ปกครอง": ["เบอร์โทร ผู้ปกครอง", "เบอร์ผู้ปกครอง", "parent phone", "โทรศัพท์ผู้ปกครอง"],
  "ความสัมพันธ์": ["ความสัมพันธ์", "relation", "parent relation"],
  "ปี1 สาขา 7-Eleven": ["ปี1 สาขา 7-Eleven", "สาขา 7-11", "สาขา 7-11 ปี 1", "สาขา 7-eleven"],
  "ปี1 พื้นที่/ภาค": ["ปี1 พื้นที่/ภาค", "พื้นที่ 7-11", "ภาค 7-11", "พื้นที่/ภาค"],
  "ปี1 รหัสพนักงาน": ["ปี1 รหัสพนักงาน", "รหัสพนักงาน 7-11", "emp id 7-11", "รหัสพนักงาน"],
  "ปี2 บริษัท": ["ปี2 บริษัท", "บริษัท ปี 2", "บริษัท (ปี2)"],
  "ปี2 ตำแหน่ง": ["ปี2 ตำแหน่ง", "ตำแหน่ง ปี 2", "ตำแหน่ง (ปี2)"],
  "ปี2 แผนก": ["ปี2 แผนก", "แผนก ปี 2", "แผนก (ปี2)"],
  "ปี3 บริษัท": ["ปี3 บริษัท", "บริษัท ปี 3", "บริษัท (ปี3)"],
  "ปี3 ตำแหน่ง": ["ปี3 ตำแหน่ง", "ตำแหน่ง ปี 3", "ตำแหน่ง (ปี3)"],
  "ปี3 แผนก": ["ปี3 แผนก", "แผนก ปี 3", "แผนก (ปี3)"],
  "ปี4 บริษัท": ["ปี4 บริษัท", "บริษัท ปี 4", "สถานที่ฝึกงาน", "บริษัท (ปี4)"],
  "ปี4 ตำแหน่ง": ["ปี4 ตำแหน่ง", "ตำแหน่ง ปี 4", "ตำแหน่งฝึกงาน", "ตำแหน่ง (ปี4)"],
  "ปี4 แผนก": ["ปี4 แผนก", "แผนก ปี 4", "แผนก (ปี4)"],
  "วันจบการศึกษา": ["วันจบการศึกษา", "วันจบ", "จบการศึกษา", "วันที่จบ", "grad date"],
  "สถานะการทำงาน": ["สถานะการทำงาน", "สถานะ", "status", "job_status"],
  "วันที่ได้รับการบรรจุ": ["วันที่ได้รับการบรรจุ", "วันที่เริ่มทำงาน", "วันที่เริ่มงาน", "วันเริ่มงาน", "บรรจุ", "start_date"],
  "ชื่อบริษัทที่ทำงาน": ["ชื่อบริษัทที่ทำงาน", "ชื่อบริษัท", "บริษัทที่ทำ", "บริษัท", "company"],
  "ตำแหน่งที่ทำงาน": ["ตำแหน่งที่ทำงาน", "ตำแหน่งงาน", "ตำแหน่ง", "position"],
  "แผนกที่ทำงาน": ["แผนกที่ทำงาน", "แผนก", "dept", "department"],
  "เงินเดือน (บาท)": ["เงินเดือน (บาท)", "เงินเดือน", "salary", "รายได้", "เงินเดือน(บาท)"],
  "สถานะปัจจุบัน": ["สถานะปัจจุบัน", "สถานะการทำงานปัจจุบัน", "current status"],
  "ระยะเวลาได้งานทำ": ["ระยะเวลาได้งานทำ", "เวลาที่ใช้หางาน (นับจากจบ)", "ระยะเวลาได้งาน", "เวลาที่ใช้หางาน"],
  "หมายเหตุ": ["หมายเหตุ", "remark", "note", "เพิ่มเติม", "รายละเอียด"]
};

window.autoMapExcelData = function (row) {
  let newRow = {};

  let allAliases = [];
  for (let sk in IMPORT_KEY_MAP) {
    for (let al of IMPORT_KEY_MAP[sk]) {
      allAliases.push({ sk: sk, al: al.toLowerCase().replace(/\s+/g, '') });
    }
  }
  allAliases.sort((a, b) => b.al.length - a.al.length);

  for (let origKey in row) {
    let val = row[origKey];
    if (val !== undefined && val !== null) val = String(val).trim(); else val = "";

    let matchedKey = origKey;
    let cleanOrig = origKey.toLowerCase().replace(/\s+/g, '');

    let found = false;
    for (let standardKey in IMPORT_KEY_MAP) {
      for (let alias of IMPORT_KEY_MAP[standardKey]) {
        let cleanAlias = alias.toLowerCase().replace(/\s+/g, '');
        if (cleanOrig === cleanAlias) {
          matchedKey = standardKey;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      for (let item of allAliases) {
        if (item.al.length >= 4 && cleanOrig.includes(item.al)) {
          matchedKey = item.sk;
          break;
        }
      }
    }

    if (["เลขประจำตัวประชาชน", "เบอร์โทรศัพท์", "เบอร์โทร ผู้ปกครอง"].includes(matchedKey)) {
      val = val.replace(/\D/g, "");
    }

    if (["วันจบการศึกษา", "วันที่ได้รับการบรรจุ", "วัน/เดือน/ปีเกิด"].includes(matchedKey)) {
      val = window.formatAndCleanDate(val);
    }

    newRow[matchedKey] = val;
  }
  return newRow;
};

window.handleFileSelect = function (event) { if (event.target.files && event.target.files.length > 0) window.processLocalFile(event.target.files[0]); };
window.handleDrop = function (e) {
  e.preventDefault();
  const dz = document.getElementById('dropZone');
  if (dz) { dz.style.background = 'var(--surface)'; dz.style.borderColor = 'var(--border-hi)'; }
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) window.processLocalFile(e.dataTransfer.files[0]);
};

window.processLocalFile = async function (file) {
  const validExts = [".xlsx", ".xls", ".csv"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!validExts.includes(ext)) return window.showToast("กรุณาเลือกไฟล์ .xlsx, .xls หรือ .csv เท่านั้น", true);
  if (file.size > 5 * 1024 * 1024) return window.showToast("ขนาดไฟล์ต้องไม่เกิน 5MB", true);

  selectedExcelFile = { name: file.name, isDrive: false, file: file };
  const nameElem = document.getElementById("selectedFileName");
  if (nameElem) nameElem.textContent = file.name;
  window.closeAllModals();
  window.openModal("modalImportSettings");
  if (window.lucide) lucide.createIcons();
};

window.confirmImport = async function () {
  if (!selectedExcelFile) return;
  const importLocation = document.getElementById("importLocation") ? document.getElementById("importLocation").value : "upsert";

  window.closeAllModals();
  window.showToast(`กำลังเริ่มประมวลผลไฟล์: ${selectedExcelFile.name}`, false);
  window.showLoading(true, "กำลังอ่านข้อมูล...");

  try {
    let rawData = [];
    if (selectedExcelFile.isDrive) {
      rawData = selectedExcelFile.data;
    } else {
      await window.loadXLSX();
      rawData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            resolve(XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }));
          } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
        reader.readAsArrayBuffer(selectedExcelFile.file);
      });
    }

    if (!rawData || rawData.length === 0) {
      window.showLoading(false); window.showToast("ไม่พบข้อมูลในไฟล์", true); return;
    }

    let jsonDataToSync = [];

    rawData.forEach(record => {
      let mapped = window.autoMapExcelData(record);

      let idCard = mapped["เลขประจำตัวประชาชน"];
      let studentId = mapped["รหัสนักศึกษา"];
      let nameTH = mapped["ชื่อ (ไทย)"];

      // ข้ามบรรทัดที่ไม่มีข้อมูลสำคัญเลย
      if (!idCard && !studentId && !nameTH) return;

      let st = mapped["สถานะการทำงาน"] || "กำลังศึกษา";

      let gd = window.cleanDate(mapped["วันจบการศึกษา"]);
      if (gd === "-") gd = "";

      let js = window.cleanDate(mapped["วันที่ได้รับการบรรจุ"]);
      if (js === "-") js = "";

      let bd = window.cleanDate(mapped["วัน/เดือน/ปีเกิด"]);
      if (bd === "-") bd = "";

      let currentSt = mapped["สถานะปัจจุบัน"] || st;

      let dur = mapped["ระยะเวลาได้งานทำ"];
      if ((!dur || dur === "-") && ["ทำงาน", "ทำงานบริษัท", "ธุรกิจส่วนตัว", "ทำงานอิสระ", "ว่างงาน", "กำลังหางาน"].includes(st) && gd) {
        if (["ทำงาน", "ทำงานบริษัท", "ธุรกิจส่วนตัว", "ทำงานอิสระ"].includes(st) && js) {
          dur = window.calcYMD(gd, js);
        } else if (["ว่างงาน", "กำลังหางาน"].includes(st)) {
          dur = window.calcYMD(gd, new Date().toISOString().split("T")[0]);
        } else { dur = "-"; }
      } else if (!dur) { dur = "-"; }

      const payloadObj = {
        studentId: studentId || "-",
        idCard: idCard || `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        prefix: mapped["คำนำหน้า"] || "",
        nameTH: nameTH || "ไม่มีชื่อ",
        surnameTH: mapped["นามสกุล (ไทย)"] || "",
        nameEN: mapped["ชื่อ (อังกฤษ)"] || "",
        surnameEN: mapped["นามสกุล (อังกฤษ)"] || "",
        nickname: mapped["ชื่อเล่น"] || "",
        gender: mapped["เพศ"] || "",
        birthDate: bd,  // ส่งเป็นค่าว่างได้
        branchCode: mapped["รหัสสาขา"] || "",
        branch: mapped["สาขา"] || "ไม่ระบุสาขา",
        faculty: mapped["คณะ"] || "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
        age: mapped["อายุ"] || "",
        phone: mapped["เบอร์โทรศัพท์"] || "",
        email: mapped["อีเมล"] || "",
        disease: mapped["โรคประจำตัว"] || "",
        currentAddress: mapped["ที่อยู่ปัจจุบัน"] || "",
        homeAddress: mapped["ที่อยู่ตามทะเบียนบ้าน"] || "",
        parentName: mapped["ชื่อ-สกุล ผู้ปกครอง"] || "",
        parentPhone: mapped["เบอร์โทร ผู้ปกครอง"] || "",
        parentRelation: mapped["ความสัมพันธ์"] || "",
        internY1_711Branch: mapped["ปี1 สาขา 7-Eleven"] || "",
        internY1_711Area: mapped["ปี1 พื้นที่/ภาค"] || "",
        internY1_711EmpID: mapped["ปี1 รหัสพนักงาน"] || "",
        internY2_Company: mapped["ปี2 บริษัท"] || "",
        internY2_Position: mapped["ปี2 ตำแหน่ง"] || "",
        internY2_Dept: mapped["ปี2 แผนก"] || "",
        internY3_Company: mapped["ปี3 บริษัท"] || "",
        internY3_Position: mapped["ปี3 ตำแหน่ง"] || "",
        internY3_Dept: mapped["ปี3 แผนก"] || "",
        internY4_Company: mapped["ปี4 บริษัท"] || "",
        internY4_Position: mapped["ปี4 ตำแหน่ง"] || "",
        internY4_Dept: mapped["ปี4 แผนก"] || "",
        gradDate: gd,  // ส่งเป็นค่าว่างได้
        jobStatus: st,
        jobStartDate: js,  // ส่งเป็นค่าว่างได้
        jobCompany: mapped["ชื่อบริษัทที่ทำงาน"] || "-",
        jobPosition: mapped["ตำแหน่งที่ทำงาน"] || "-",
        jobDept: mapped["แผนกที่ทำงาน"] || "-",
        jobSalary: parseFloat(mapped["เงินเดือน (บาท)"]) || 0,
        jobCurrentStatus: currentSt,
        durationToGetJob: dur || "-",
        jobRemark: mapped["หมายเหตุ"] || "-"
      };

      jsonDataToSync.push(payloadObj);
    });

    window.showLoading(true, `กำลังส่งข้อมูล ${jsonDataToSync.length} รายการไปยัง Google Sheets...`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "import_excel", importMode: importLocation, data: jsonDataToSync })
    });
    const result = await response.json();

    window.showLoading(false);

    if (result && result.status === "success") {
      window.showToast(`สำเร็จ: ${result.message}`, false);
      await window.fetchData(true);
    } else {
      window.showToast("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: " + (result?.message || "ไม่ทราบสาเหตุ"), true);
    }
  } catch (error) {
    window.showLoading(false);
    window.showToast("ข้อผิดพลาดในการเชื่อมต่อ: " + error.message, true);
  }
};

window.showToast = function (message, isError = false) {
  const toast = $("toast");
  if (!toast) return;
  toast.innerHTML = (isError ? '<i data-lucide="alert-circle" style="width:20px;height:20px;"></i>' : '<i data-lucide="check-circle" style="width:20px;height:20px;"></i>') + " " + message;
  toast.style.background = isError ? "var(--danger)" : "var(--success)";
  toast.classList.add("show");
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.classList.remove("show"), 3500);
};

window.showLoading = function (show, text = "กำลังโหลด...") {
  const loader = $("global-loader");
  const loaderText = $("loader-text");
  if (!loader) return;
  if (loaderText) loaderText.innerText = text;
  if (show) loader.classList.remove("hidden");
  else loader.classList.add("hidden");
};

window.callAPI = async function (e = null) {
  if (!API_URL || API_URL.trim() === "" || API_URL.includes("YOUR_DEPLOYMENT_ID")) return { status: "error", message: "กรุณาตั้งค่า API_URL" };
  try {
    let t = e ? { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(e) } : { method: "GET" };
    const n = await fetch(API_URL, t);
    if (!n.ok) return { status: "error", message: "HTTP Error: " + n.status };
    const tx = await n.text();
    try { return JSON.parse(tx); } catch (err) { return { status: "error", message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" }; }
  } catch (err) { return { status: "error", message: "เชื่อมต่อไม่ได้: " + err.message }; }
};

window.doLogin = async function () {
  const ue = $("inpUser");
  const pe = $("inpPass");
  const n = $("loginError");
  const e = ue ? ue.value.trim() : "";
  const t = pe ? pe.value.trim() : "";
  const btn = $("btnLoginAction");

  if (!e || !t) {
    if (n) {
      n.innerHTML = '<i data-lucide="alert-circle" style="width:18px;height:18px;"></i> กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ';
      n.classList.remove("hidden");
    }
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="spin" style="width:18px;height:18px;"></i> กำลังตรวจสอบ...'; lucide.createIcons(); }
  window.showLoading(true, "ตรวจสอบสิทธิ์...");

  let a = await window.callAPI({ action: "login", username: e, password: t });

  if (btn) { btn.disabled = false; btn.innerHTML = "เข้าสู่ระบบ"; }
  window.showLoading(false);

  if (a && "success" === a.status) {
    n?.classList.add("hidden");
    currentUser = { username: e, role: a.role, name: a.name };
    localStorage.setItem("alumni_user", JSON.stringify(currentUser));
    $("loginPage")?.classList.add("hidden");
    window.initApp();
    window.fetchData(true);
  } else {
    if (n) {
      n.innerHTML = '<i data-lucide="x-circle" style="width:20px;height:20px;"></i> รหัสผ่านไม่ถูกต้อง หรือเชื่อมต่อไม่สำเร็จ';
      n.classList.remove("hidden");
      lucide.createIcons();
    }
  }
};

window.togglePasswordVisibility = function () {
  const p = $("inpPass");
  const i = $("togglePassword");
  if (p && i) {
    if (p.type === 'password') {
      p.type = 'text';
      i.setAttribute('data-lucide', 'eye-off');
    } else {
      p.type = 'password';
      i.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
  }
};

window.doLogout = function () { currentUser = null; localStorage.removeItem("alumni_user"); $("loginPage")?.classList.remove("hidden"); $("app")?.classList.add("hidden"); if ($("inpPass")) $("inpPass").value = ""; STUDENTS = []; };

document.addEventListener("DOMContentLoaded", () => {
  window.checkSetup(); if (window.lucide) lucide.createIcons();

  if (localStorage.getItem("alumni_user")) {
    try {
      currentUser = JSON.parse(localStorage.getItem("alumni_user"));
      if (localStorage.getItem("alumni_data")) {
        STUDENTS = JSON.parse(localStorage.getItem("alumni_data"));
      }
      $("loginPage")?.classList.add("hidden");
      window.initApp();
      window.fetchData(false);
    }
    catch (e) { $("loginPage")?.classList.remove("hidden"); }
  } else {
    $("loginPage")?.classList.remove("hidden");
  }

  $("inpPass")?.addEventListener("keydown", e => { if (e.key === "Enter") window.doLogin(); });
  $("inpUser")?.addEventListener("keydown", e => { if (e.key === "Enter") window.doLogin(); });
});

window.fetchData = async function (e = false) {
  if (isFetching) return; isFetching = true;
  if (e || STUDENTS.length === 0) window.showLoading(true, "กำลังอัปเดตข้อมูลล่าสุด...");

  const t = await window.callAPI();

  if (e || STUDENTS.length === 0) window.showLoading(false);
  isFetching = false;

  if (t && "success" === t.status) {
    STUDENTS = t.data.map((e) => {
      const gradDate = window.cleanDate(e["วันจบการศึกษา"]), jobStartDate = window.cleanDate(e["วันที่ได้รับการบรรจุ"]);
      let rawStatus = window.getVal(e, "สถานะการทำงาน") || "กำลังศึกษา";
      let jobStatus = "กำลังศึกษา";
      let jobCurrentStatus = "กำลังศึกษาอยู่";

      if (rawStatus.includes("ทำงาน") || rawStatus.includes("พนักงาน")) { jobStatus = "ทำงานบริษัท"; jobCurrentStatus = "ยังทำงานอยู่"; }
      else if (rawStatus.includes("ส่วนตัว") || rawStatus.includes("ฟรีแลนซ์")) { jobStatus = "ทำงานอิสระ"; jobCurrentStatus = "ประกอบธุรกิจส่วนตัว"; }
      else if (rawStatus.includes("ศึกษาต่อ")) { jobStatus = "ศึกษาต่อ"; jobCurrentStatus = "กำลังศึกษาต่อไทย"; }
      else if (rawStatus.includes("ว่าง") || rawStatus.includes("หางาน")) { jobStatus = "ว่างงาน"; jobCurrentStatus = "กำลังหางาน"; }
      else if (rawStatus.includes("ครอบครัว")) { jobStatus = "อื่นๆ"; jobCurrentStatus = "ช่วยธุรกิจครอบครัว"; }
      else if (rawStatus.includes("ทหาร") || rawStatus.includes("บวช") || rawStatus.includes("ภารกิจ") || rawStatus.includes("สุขภาพ")) { jobStatus = "อื่นๆ"; jobCurrentStatus = "ติดทหาร"; }
      else if (rawStatus.includes("ดรอป") || rawStatus.includes("พัก")) { jobStatus = "ดรอปเรียน"; jobCurrentStatus = "ดรอปเรียน / ลาพัก"; }
      else if (rawStatus.includes("ออก") || rawStatus.includes("ย้าย")) { jobStatus = "อื่นๆ"; jobCurrentStatus = "ลาออก"; }
      else if (rawStatus.includes("พ้นสภาพ") || rawStatus.includes("ไม่จบ")) { jobStatus = "พ้นสภาพ"; jobCurrentStatus = "พ้นสภาพ / ไม่จบการศึกษา"; }
      else if (rawStatus.includes("รอ") || rawStatus.includes("อนุมัติ")) { jobStatus = "อื่นๆ"; jobCurrentStatus = "รออนุมัติจบ"; }

      let calculatedDuration = window.getVal(e, "ระยะเวลาได้งานทำ");
      if (["ทำงานบริษัท", "ทำงานอิสระ"].includes(jobStatus) || (jobStatus === "อื่นๆ" && jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) {
        if (gradDate && jobStartDate) calculatedDuration = window.calcYMD(gradDate, jobStartDate);
      } else if (["ว่างงาน", "กำลังหางาน"].includes(jobStatus) && gradDate) {
        calculatedDuration = window.calcYMD(gradDate, new Date().toISOString().split("T")[0]);
      } else if (!calculatedDuration) {
        calculatedDuration = "-";
      }

      let stId = window.getVal(e, "รหัสนักศึกษา") || "-";
      let batchCode = "";
      let idMatch = stId.match(/^(\d{2})/);
      if (idMatch) {
        batchCode = idMatch[1];
      }
      if (!batchCode) {
        batchCode = "ไม่ระบุ";
      }

      return {
        idCard: window.getVal(e, "เลขประจำตัวประชาชน").replace(/\D/g, ""),
        studentId: stId,
        batchYear: batchCode,
        prefix: window.getVal(e, "คำนำหน้า"), nameTH: window.getVal(e, "ชื่อ (ไทย)"), surnameTH: window.getVal(e, "นามสกุล (ไทย)"), nameEN: window.getVal(e, "ชื่อ (อังกฤษ)"),
        surnameEN: window.getVal(e, "นามสกุล (อังกฤษ)"), nickname: window.getVal(e, "ชื่อเล่น"), gender: window.getVal(e, "เพศ"), birthDate: window.cleanDate(e["วัน/เดือน/ปีเกิด"]), branchCode: window.getVal(e, "รหัสสาขา"),
        branch: window.getVal(e, "สาขา"), faculty: window.getVal(e, "คณะ"), age: window.getVal(e, "อายุ"), phone: window.getVal(e, "เบอร์โทรศัพท์"), email: window.getVal(e, "อีเมล"), disease: window.getVal(e, "โรคประจำตัว"),
        currentAddress: window.getVal(e, "ที่อยู่ปัจจุบัน"), homeAddress: window.getVal(e, "ที่อยู่ตามทะเบียนบ้าน"), parentName: window.getVal(e, "ชื่อ-สกุล ผู้ปกครอง"), parentPhone: window.getVal(e, "เบอร์โทร ผู้ปกครอง"),
        parentRelation: window.getVal(e, "ความสัมพันธ์"), internY1_711Branch: window.getVal(e, "ปี1 สาขา 7-Eleven"), internY1_711Area: window.getVal(e, "ปี1 พื้นที่/ภาค"), internY1_711EmpID: window.getVal(e, "ปี1 รหัสพนักงาน"),
        internY2_Company: window.getVal(e, "ปี2 บริษัท"), internY2_Position: window.getVal(e, "ปี2 ตำแหน่ง"), internY2_Dept: window.getVal(e, "ปี2 แผนก"), internY3_Company: window.getVal(e, "ปี3 บริษัท"),
        internY3_Position: window.getVal(e, "ปี3 ตำแหน่ง"), internY3_Dept: window.getVal(e, "ปี3 แผนก"), internY4_Company: window.getVal(e, "ปี4 บริษัท"), internY4_Position: window.getVal(e, "ปี4 ตำแหน่ง"),
        internY4_Dept: window.getVal(e, "ปี4 แผนก"), gradDate, jobStatus, jobStartDate, jobCompany: window.getVal(e, "ชื่อบริษัทที่ทำงาน") ? window.getVal(e, "ชื่อบริษัทที่ทำงาน").trim() : "-", jobPosition: window.getVal(e, "ตำแหน่งที่ทำงาน"),
        jobDept: window.getVal(e, "แผนกที่ทำงาน"), jobSalary: e["เงินเดือน (บาท)"] || 0, jobCurrentStatus: jobCurrentStatus, durationToGetJob: calculatedDuration, jobRemark: window.getVal(e, "หมายเหตุ") || "-"
      };
    });
    localStorage.setItem("alumni_data", JSON.stringify(STUDENTS)); window.updateDashboardAndTable(); if (e) window.showToast("อัปเดตข้อมูลล่าสุดแล้ว", false);
  } else if (e) window.showToast("เชื่อมต่อข้อมูลล้มเหลว", true);
};

window.updateDashboardAndTable = function () {
  const e = [...new Set(STUDENTS.map(e => e.batchYear))].filter(Boolean).sort().reverse();
  const companies = [...new Set(STUDENTS.map(e => e.jobCompany ? e.jobCompany.trim().toUpperCase() : null))].filter(c => c && c !== "-").sort();

  if ($("yearFilter")) {
    const currVal = $("yearFilter").value;
    $("yearFilter").innerHTML = '<option value="" style="color:var(--primary); font-weight:800;">ทุกรหัส</option>' + e.map(y => `<option value="${y}" style="color:var(--text-bold);">รหัส ${y}</option>`).join("");
    $("yearFilter").value = currVal;
    $("yearFilter").style.color = currVal === "" ? "var(--primary)" : "var(--text-bold)";
  }

  if ($("companyFilter")) {
    const cCurrVal = $("companyFilter").value;
    $("companyFilter").innerHTML = '<option value="" style="color:var(--primary); font-weight:800;">ทุกบริษัทที่ทำงาน</option>' + companies.map(c => `<option value="${c}" style="color:var(--text-bold);">${c}</option>`).join("");
    $("companyFilter").value = cCurrVal;
    $("companyFilter").style.color = cCurrVal === "" ? "var(--primary)" : "var(--text-bold)";
  }

  if ("dash" === currentPage) window.renderDash(); if ("students" === currentPage) window.renderTable();
};

window.initApp = function () {
  $("app")?.classList.remove("hidden");

  if ($("sideNav")) {
    $("sideNav").innerHTML = [{ id: "dash", icon: "layout-dashboard", label: "ภาพรวมระบบ" }, { id: "students", icon: "users", label: "ฐานข้อมูลนักศึกษา" }].map(e => `<a href="#${e.id}" class="nav-item${e.id === currentPage ? " active" : ""}" onclick="window.navTo('${e.id}'); return false;"><div class="nav-icon"><i data-lucide="${e.icon}"></i></div><span class="nav-label">${e.label}</span></a>`).join("");
  }
  if (window.lucide) lucide.createIcons(); window.initFacultyFilters(); window.updateDashboardAndTable(); window.navTo("dash");
};

window.navTo = function (e) {
  currentPage = e;
  document.querySelectorAll(".nav-item").forEach(t => t.classList.toggle("active", t.getAttribute("onclick") === `window.navTo('${e}'); return false;`));
  ["dash", "students"].forEach(t => { if ($("page" + t.charAt(0).toUpperCase() + t.slice(1))) $("page" + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle("hidden", t !== e); });

  const titles = { dash: "ภาพรวมระบบสำหรับผู้บริหาร", students: "ฐานข้อมูลนักศึกษา" };
  if ($("topbarTitle")) $("topbarTitle").textContent = titles[e];
  if ($("topbarSub")) $("topbarSub").textContent = `ข้อมูลปรับปรุงล่าสุด: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`;

  const isAdm = currentUser?.role === "admin";
  if ($("topAddBtn")) $("topAddBtn").classList.toggle("hidden", !(e === "students" && isAdm));
  if ($("topImportBtn")) $("topImportBtn").classList.toggle("hidden", !(e === "students" && isAdm));
  if ($("topExportBtn")) $("topExportBtn").classList.toggle("hidden", !(e === "students" && isAdm));

  if (e === "dash") window.renderDash();
  if (e === "students") window.renderTable();
};

window.initFacultyFilters = function () {
  filterFac = "ทั้งหมด";
  filterBr = "ทั้งหมด";
  filterBrId = "ทั้งหมด";

  const sel = $("branchFilter");
  if (sel) {
    let h = `<option value="ทั้งหมด" data-id="ทั้งหมด" style="color:var(--primary); font-weight:800;">ทุกสาขาวิชา</option>`;
    FACULTY_DATA["คณะวิศวกรรมศาสตร์และเทคโนโลยี"].forEach(b => {
      h += `<option value="${b.name}" data-id="${b.id}" style="color:var(--text-bold);">${b.id} ${b.name}</option>`;
    });
    sel.innerHTML = h;
  }
  window.updateDashboardAndTable();
};

window.setFilterBr = function (e, t) {
  filterBrId = e;
  filterBr = t;
  const sel = $("branchFilter");
  if (sel) { sel.style.color = t === 'ทั้งหมด' ? 'var(--primary)' : 'var(--text-bold)'; }
  currentTablePage = 1;
  window.updateDashboardAndTable();
};

window.setFilterStatus = function (e) {
  filterStatus = e;
  const sel = $("statusFilter");
  if (sel) { sel.style.color = e === 'ทั้งหมด' ? 'var(--primary)' : 'var(--text-bold)'; }
  currentTablePage = 1;
  window.renderTable();
};

window.getFilteredStudents = function () {
  const yf = $("yearFilter") ? $("yearFilter").value : "";
  const cf = $("companyFilter") ? $("companyFilter").value : "";
  const q = $("searchInput") ? $("searchInput").value.toLowerCase().trim() : "";
  const arrQ = q ? q.split(/\s+/) : [];

  return STUDENTS.filter(e => {
    const text = [e.nameTH, e.surnameTH, e.nameEN, e.studentId, e.idCard, e.jobCompany, e.jobPosition, e.phone, e.email, e.branchCode, e.branch].join(" ").toLowerCase();
    const yMatch = !yf || String(e.batchYear) === yf;
    const cMatch = !cf || (e.jobCompany && e.jobCompany.trim().toUpperCase() === cf);
    const bMatch = "ทั้งหมด" === filterBr || (e.branch || "").includes(filterBr) || (e.branchCode || "").includes(filterBrId);
    const sMatch = arrQ.length === 0 || arrQ.every((w) => text.includes(w));

    const statusMatch = "ทั้งหมด" === filterStatus ||
      e.jobStatus === filterStatus ||
      (["ทำงานแล้ว", "ทำงาน"].includes(filterStatus) && (["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว"))) ||
      ("ศึกษาต่อ" === filterStatus && ["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(e.jobStatus)) ||
      ("พ้นสภาพ" === filterStatus && (["พ้นสภาพ", "ไม่จบการศึกษา", "ดรอปเรียน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(e.jobCurrentStatus)))) ||
      ("กำลังศึกษา" === filterStatus && (["กำลังศึกษา"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)"].includes(e.jobCurrentStatus)))) ||
      ("ติดภารกิจ" === filterStatus && e.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ", "อุปสมบท"].includes(e.jobCurrentStatus)) ||
      ("ว่างงาน" === filterStatus && ["ว่างงาน", "กำลังหางาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["กำลังหางาน", "เตรียมสอบราชการ", "เตรียมศึกษาต่อ"].includes(e.jobCurrentStatus)));

    return yMatch && cMatch && bMatch && sMatch && statusMatch;
  });
};

window.filterDashCompanies = function () {
  const si = document.getElementById("dashCompanySearch");
  if (!si) return;
  const q = si.value.toLowerCase().trim();
  const it = document.querySelectorAll(".dash-company-item");
  let f = 0;
  it.forEach(i => {
    if (i.getAttribute("data-name").includes(q)) {
      i.style.display = "flex"; f++;
    } else {
      i.style.display = "none";
    }
  });
  const em = document.getElementById("dashCompanyEmpty");
  if (em) {
    if (f === 0 && it.length > 0) em.classList.remove("hidden");
    else em.classList.add("hidden");
  }
};

window.renderDash = function () {
  const e = $("pageDash");
  let dashStudents = STUDENTS;
  if (dashYear) dashStudents = dashStudents.filter(s => String(s.batchYear) === dashYear);

  const yearsSet = [...new Set(STUDENTS.map(s => s.batchYear))].filter(Boolean).sort().reverse();
  const yearOptions = '<option value="" style="color:var(--primary); font-weight:800;">ทุกรหัส</option>' + yearsSet.map(y => `<option value="${y}" ${dashYear === String(y) ? 'selected' : ''} style="color:var(--text-bold);">รหัส ${y}</option>`).join("");

  const filterUI = `
    <div style="display: flex; gap: 20px; margin-bottom: 24px; background: var(--surface); padding: 24px 32px; border-radius: var(--r-lg); box-shadow: var(--shadow-sm); align-items: center; flex-wrap: wrap; border: 1px solid var(--border);">
      <h3 style="margin: 0; font-size: 18px; color: var(--text-bold); display: flex; align-items: center; gap: 12px;"><i data-lucide="filter" style="width:20px; color: var(--primary);"></i> กรองข้อมูลสถิติภาพรวม:</h3>
      <select id="dashYearFilter" name="dashYearFilter" class="filter-select" aria-label="กรองตามรหัส" onchange="dashYear = this.value; this.style.color = this.value === '' ? 'var(--primary)' : 'var(--text-bold)'; window.renderDash();" style="min-width: 200px; color: ${dashYear === '' ? 'var(--primary)' : 'var(--text-bold)'}; padding: 8px 16px;">
        ${yearOptions}
      </select>
      <div style="margin-left: auto; font-size: 15px; color: var(--primary); font-weight: 700; background: var(--primary-soft); padding: 8px 16px; border-radius: var(--r-pill);">วิเคราะห์จาก ${dashStudents.length} คน</div>
    </div>
  `;

  if (dashStudents.length === 0) {
    e.innerHTML = filterUI + '<div class="empty-state" style="margin-top:40px;"><i data-lucide="bar-chart-3" class="empty-icon" style="width:80px;height:80px;"></i><div style="font-size:18px; font-weight:700;">ไม่พบข้อมูลนักศึกษาในเงื่อนไขที่เลือก</div></div>';
    if (window.lucide) lucide.createIcons();
    return;
  }

  const total = dashStudents.length;
  const current = dashStudents.filter(s => ["กำลังศึกษา", "ดรอปเรียน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(s.jobCurrentStatus)));
  const dropouts = dashStudents.filter(s => ["พ้นสภาพ", "ไม่จบการศึกษา"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(s.jobCurrentStatus)));
  const grads = dashStudents.filter(s => !["พ้นสภาพ", "ไม่จบการศึกษา", "ดรอปเรียน", "กำลังศึกษา"].includes(s.jobStatus) && !(s.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา", "รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(s.jobCurrentStatus)));
  const totalGrads = grads.length;

  const employed = grads.filter(s => ["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && s.jobCurrentStatus === "ช่วยธุรกิจครอบครัว"));
  const furtherStudy = grads.filter(s => ["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(s.jobCurrentStatus)));
  const unavailable = grads.filter(s => s.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ", "อุปสมบท"].includes(s.jobCurrentStatus));
  const unemployed = grads.filter(s => ["ว่างงาน", "กำลังหางาน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["กำลังหางาน", "เตรียมสอบราชการ", "เตรียมศึกษาต่อ"].includes(s.jobCurrentStatus)));

  let p_working = 0, p_studyFurther = 0, p_unavailable = 0, p_unemployed = 0, p_current = 0, p_dropout = 0;
  if (total > 0) {
    const groups = [
      { key: 'working', count: employed.length }, { key: 'current', count: current.length }, { key: 'unemployed', count: unemployed.length },
      { key: 'study', count: furtherStudy.length }, { key: 'unavailable', count: unavailable.length }, { key: 'dropout', count: dropouts.length }
    ];

    let sumFloor = 0;
    groups.forEach(g => { g.exact = (g.count / total) * 100; g.floor = Math.floor(g.exact); g.remainder = g.exact - g.floor; sumFloor += g.floor; });

    let diff = 100 - sumFloor;
    groups.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < diff; i++) { groups[i].floor += 1; }

    p_working = groups.find(g => g.key === 'working').floor;
    p_current = groups.find(g => g.key === 'current').floor;
    p_unemployed = groups.find(g => g.key === 'unemployed').floor;
    p_studyFurther = groups.find(g => g.key === 'study').floor;
    p_unavailable = groups.find(g => g.key === 'unavailable').floor;
    p_dropout = groups.find(g => g.key === 'dropout').floor;
  }

  let u = 0, m = 0;
  let fastestJob = null;
  employed.forEach(e => {
    if (e.gradDate && e.jobStartDate && e.gradDate !== "-" && e.jobStartDate !== "-") {
      const t = new Date(e.gradDate), n = new Date(e.jobStartDate);
      if (!isNaN(t) && !isNaN(n) && n >= t) {
        const diffTime = Math.abs(n - t);
        u += diffTime; m++;
        const diffDays = Math.floor(diffTime / 86400000);
        if (fastestJob === null || diffDays < fastestJob) { fastestJob = diffDays; }
      }
    }
  });
  let g = "0 วัน"; if (m > 0) { const d = Math.floor((u / m) / 86400000), yr = Math.floor(d / 365), mo = Math.floor((d % 365) / 30), dy = Math.floor((d % 365) % 30); let ta = []; if (yr > 0) ta.push(`${yr} ปี`); if (mo > 0) ta.push(`${mo} เดือน`); if (dy > 0) ta.push(`${dy} วัน`); g = ta.length ? ta.join(" ") : "0 วัน"; }
  let fastestText = fastestJob !== null ? `${fastestJob} วัน` : "-";

  const h = [...new Set(grads.map(x => x.batchYear))].filter(Boolean).sort().slice(-7), f = h.map(y => grads.filter(t => String(t.batchYear) === String(y)).length), b = h.map(y => employed.filter(t => String(t.batchYear) === String(y)).length);

  const E = {}; dashStudents.forEach(e => { const t = e.branch && e.branch !== "-" ? e.branch + (e.branchCode ? ` (${e.branchCode})` : "") : "ไม่ระบุสาขา"; if (!E[t]) E[t] = { total: 0, emp: 0 }; E[t].total++; if (["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) E[t].emp++; });

  let C = [];
  if (employed.length > 0) {
    const cObj = {};
    employed.forEach(t => {
      let rawName = (t.jobCompany && t.jobCompany.trim() !== "" && t.jobCompany.trim() !== "-") ? t.jobCompany.trim() : "ธุรกิจส่วนตัว / ฟรีแลนซ์";
      if (t.jobStatus === "อื่นๆ" && t.jobCurrentStatus === "ช่วยธุรกิจครอบครัว") rawName = "ธุรกิจครอบครัว";
      if (rawName === "ธุรกิจส่วนตัว / ฟรีแลนซ์" || rawName === "ธุรกิจครอบครัว") return;

      const key = rawName.toUpperCase();
      if (!cObj[key]) cObj[key] = { name: rawName, count: 0 };
      cObj[key].count++;
    });
    C = Object.values(cObj).sort((a, b) => b.count - a.count);
  }

  let dashboardContent = `
    <div class="exec-summary fade-in">
      <div class="exec-summary-icon"><i data-lucide="pie-chart" style="width:40px;height:40px;"></i></div>
      <div class="exec-summary-text" style="width: 100%;">
        <h3 style="margin-bottom: 6px;">ภาพรวมสถิตินักศึกษา</h3>
        <p style="font-size: 15px; opacity: 0.9;">สำเร็จการศึกษาแล้ว ${totalGrads} คน จากทั้งหมด ${total} คน</p>
        
        <div style="display:flex; flex-wrap:nowrap; overflow-x:auto; gap:16px; margin-top:20px; background:rgba(255,255,255,0.05); padding:20px 24px; border-radius:16px; width: 100%; border: 1px solid rgba(255,255,255,0.1);">
          <div style="min-width:120px; flex-shrink:0;"><div style="color:#4ade80; font-size:13px; font-weight:700; margin-bottom:4px;">● ได้งานทำ</div><div style="color:white; font-size:24px; font-weight:800; line-height:1;">${p_working}% <span style="font-size:13px; font-weight:600; opacity:0.7;">(${employed.length})</span></div></div>
          <div style="min-width:120px; flex-shrink:0;"><div style="color:#60a5fa; font-size:13px; font-weight:700; margin-bottom:4px;">● กำลังศึกษา</div><div style="color:white; font-size:24px; font-weight:800; line-height:1;">${p_current}% <span style="font-size:13px; font-weight:600; opacity:0.7;">(${current.length})</span></div></div>
          <div style="min-width:120px; flex-shrink:0;"><div style="color:#facc15; font-size:13px; font-weight:700; margin-bottom:4px;">● ว่างงาน</div><div style="color:white; font-size:24px; font-weight:800; line-height:1;">${p_unemployed}% <span style="font-size:13px; font-weight:600; opacity:0.7;">(${unemployed.length})</span></div></div>
          <div style="min-width:140px; flex-shrink:0;"><div style="color:#a78bfa; font-size:13px; font-weight:700; margin-bottom:4px;">● ศึกษาต่อ</div><div style="color:white; font-size:24px; font-weight:800; line-height:1;">${p_studyFurther}% <span style="font-size:13px; font-weight:600; opacity:0.7;">(${furtherStudy.length})</span></div></div>
          <div style="min-width:120px; flex-shrink:0;"><div style="color:#fb923c; font-size:13px; font-weight:700; margin-bottom:4px;">● สถานะอื่นๆ</div><div style="color:white; font-size:24px; font-weight:800; line-height:1;">${p_unavailable}% <span style="font-size:13px; font-weight:600; opacity:0.7;">(${unavailable.length})</span></div></div>
          <div style="min-width:120px; flex-shrink:0;"><div style="color:#f87171; font-size:13px; font-weight:700; margin-bottom:4px;">● พ้นสภาพ</div><div style="color:white; font-size:24px; font-weight:800; line-height:1;">${p_dropout}% <span style="font-size:13px; font-weight:600; opacity:0.7;">(${dropouts.length})</span></div></div>
        </div>
      </div>
    </div>
    <div class="stats-grid fade-in">
      ${[["clock", "ระยะเวลาเฉลี่ยหางานหลังจบ", g, `เร็วที่สุด: <strong style="color:var(--warning)">${fastestText}</strong>`, "var(--warning)", "var(--warning-soft)", ""],
    ["book", "กำลังศึกษาอยู่", current.length, "คน", "var(--info)", "var(--info-soft)", "window.viewDashStatus('กำลังศึกษา')"],
    ["plane", "ศึกษาต่อ", `${furtherStudy.length}`, "คน", "var(--accent)", "var(--accent-soft)", "window.viewDashStatus('ศึกษาต่อ')"],
    ["shield-alert", "สถานะอื่นๆ", unavailable.length, "คน", "#D97706", "#FEF3C7", "window.viewDashStatus('ติดภารกิจ')"]
    ].map(([ic, ti, va, su, co, bg, fn]) => `<div class="stat-card" ${fn ? `onclick="${fn}"` : ''}><div class="stat-icon" style="background:${bg};color:${co};"><i data-lucide="${ic}"></i></div><div style="flex:1;"><div class="stat-label">${ti}</div><div class="stat-value" style="color:${co}">${va}</div><div class="stat-sub">${su}</div></div>${fn ? '<div class="click-hint"><i data-lucide="mouse-pointer-click" style="width:12px;"></i></div>' : ''}</div>`).join("")}
    </div>
    <div class="grid-2-col fade-in">
      <div class="card"><div class="card-header">สัดส่วนสถานะนักศึกษาทั้งหมด</div><div class="card-body" style="display:flex;flex-direction:column;gap:16px;">${[
      { l: "ทำงานแล้ว (รวมฟรีแลนซ์)", n: employed.length, c: "var(--success)", fn: "window.viewDashStatus('ทำงาน')" },
      { l: "ศึกษาต่อ (รวมต่างประเทศ)", n: furtherStudy.length, c: "var(--accent)", fn: "window.viewDashStatus('ศึกษาต่อ')" },
      { l: "กำลังศึกษาอยู่", n: current.length, c: "var(--info)", fn: "window.viewDashStatus('กำลังศึกษา')" },
      { l: "อยู่ระหว่างหางาน / ว่างงาน", n: unemployed.length, c: "var(--warning)", fn: "window.viewDashStatus('ว่างงาน')" }
    ].map((e) => { const d = total ? Math.round((e.n / total) * 100) : 0; return `<div class="clickable-item branch-stat-item" onclick="${e.fn}"><div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-bottom:8px;"><span>${e.l}</span><span class="click-hint"><i data-lucide="mouse-pointer-click" style="width:12px;"></i> ดูรายชื่อ</span></div><div style="display:flex;gap:16px;margin-bottom:12px;font-size:14px;"><div style="flex:1;"><div style="color:var(--text-muted);font-weight:600;">จำนวน</div><div style="font-size:20px;font-weight:800;color:var(--text-bold);">${e.n} <span style="font-size:13px; font-weight:500;">คน</span></div></div><div style="flex:1;text-align:right;"><div style="color:${e.c};font-weight:600;">สัดส่วนรวม</div><div style="font-size:20px;font-weight:800;color:${e.c};">${d}%</div></div></div><div style="height:6px;background:var(--bg);border-radius:99px;overflow:hidden;"><div style="width:${d}%;height:100%;background:${e.c};border-radius:99px;"></div></div></div>`; }).join("")}</div></div>
      <div class="card"><div class="card-header" style="display:flex; flex-direction:column; gap:16px; align-items:stretch;"><div style="font-size: 18px; display: flex; align-items: center;"><i data-lucide="building-2" style="width:20px; margin-right:8px; color:var(--primary);"></i> บริษัทที่รับเข้าทำงาน</div><div style="position: relative;"><i data-lucide="search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); width: 18px; height: 18px;"></i><input type="search" id="dashCompanySearch" placeholder="พิมพ์ค้นหาชื่อบริษัท..." oninput="window.filterDashCompanies()" style="width: 100%; padding: 10px 16px 10px 42px; border-radius: 8px; border: 1px solid var(--border-hi); font-size: 14px; outline: none; background: var(--bg);" /></div></div><div class="card-body" style="height:480px;overflow-y:auto;padding:16px;display:grid;grid-template-columns:1fr;gap:12px;align-content:start;">${C.length ? C.map((item, n) => `<div class="person-item dash-company-item" data-name="${window.esc(item.name).toLowerCase()}" style="margin:0; padding:12px 16px;" onclick="window.openCompany('${esc(item.name)}')"><div class="flex flex-center gap-16"><div class="co-rank" style="background:var(--bg);color:var(--text-muted);width:32px;height:32px;border-radius:8px;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;">${n + 1}</div><span style="font-size:15px;font-weight:700;color:var(--text-bold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${esc(item.name)}</span></div><div class="flex flex-center gap-12"><span style="font-size:14px;font-weight:700;color:var(--primary); background:var(--primary-soft); padding:4px 10px; border-radius:12px;">${item.count} คน</span></div></div>`).join("") : '<div class="empty-state" style="padding:48px;">ไม่พบข้อมูลบริษัท</div>'}<div id="dashCompanyEmpty" class="empty-state hidden" style="padding:32px;">ไม่พบชื่อบริษัทที่ค้นหา</div></div></div>
    </div>
    
    <div class="chart-grid fade-in" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
      <div class="card"><div class="card-header">กราฟจำนวนนักศึกษาแยกตามสาขา</div><div class="card-body"><div class="chart-wrapper" style="height:320px;"><canvas id="branchChart"></canvas></div></div></div>
      <div class="card"><div class="card-header">กราฟแนวโน้มการรับเข้าทำงานย้อนหลัง ${h.length} รุ่น</div><div class="card-body"><div class="chart-wrapper" style="height:320px;"><canvas id="trendChart"></canvas></div></div></div>
    </div>
  `;

  e.innerHTML = filterUI + dashboardContent;
  if (window.lucide) lucide.createIcons();

  if (window.Chart) {
    if (window.trendChartInst) window.trendChartInst.destroy();
    if (window.branchChartInst) window.branchChartInst.destroy();

    const branchLabels = Object.keys(E);
    const branchData = branchLabels.map(k => E[k].total);
    if ($("branchChart") && branchLabels.length) {
      window.branchChartInst = new Chart($("branchChart"), {
        type: "bar",
        data: { labels: branchLabels.map(l => l.length > 15 ? l.substring(0, 15) + "..." : l), datasets: [{ label: "จำนวนนักศึกษา (คน)", data: branchData, backgroundColor: "#059669", borderRadius: 6 }] },
        options: { responsive: !0, maintainAspectRatio: !1, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: !0, ticks: { stepSize: 1, precision: 0, font: { size: 13, family: "'Sarabun', sans-serif" } } }, x: { ticks: { font: { size: 12, family: "'Sarabun', sans-serif" } } } } }
      });
    }

    if ($("trendChart") && h.length) {
      window.trendChartInst = new Chart($("trendChart"), {
        type: "line",
        data: { labels: h.map((e) => `รหัส ${e}`), datasets: [{ label: "ผู้สำเร็จการศึกษาทั้งหมด", data: f, borderColor: "#CBD5E1", fill: !1, tension: 0.3, pointRadius: 4 }, { label: "ผู้ได้งานทำ", data: b, borderColor: "#059669", backgroundColor: "rgba(5, 150, 105, 0.1)", borderWidth: 3, fill: !0, tension: 0.3, pointRadius: 5 }] },
        options: { responsive: !0, maintainAspectRatio: !1, plugins: { legend: { position: 'bottom', labels: { font: { size: 13, family: "'Sarabun', sans-serif" } } } }, scales: { y: { beginAtZero: !0, ticks: { stepSize: 1, precision: 0, font: { size: 13, family: "'Sarabun', sans-serif" } } }, x: { ticks: { font: { size: 14 } } } } }
      });
    }
  }
};

window.renderTable = function () {
  const o = window.getFilteredStudents();

  if ($("rowCount")) $("rowCount").textContent = `พบ ${o.length} คน`;
  const isAdmin = currentUser && "admin" === currentUser.role, tbody = $("studentTbody"), empty = $("emptyState"), table = document.querySelector(".table-wrap table");
  let tableWrap = document.querySelector(".table-wrap");

  const oldPagination = document.querySelector(".pagination-container");
  if (oldPagination) oldPagination.remove();

  if (!o.length) { tbody.innerHTML = ""; empty.classList.remove("hidden"); table.classList.add("hidden"); return; }
  empty.classList.add("hidden"); table.classList.remove("hidden");

  const totalPages = Math.ceil(o.length / itemsPerPage);
  if (currentTablePage > totalPages) currentTablePage = totalPages;
  if (currentTablePage < 1) currentTablePage = 1;

  const startIndex = (currentTablePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayData = o.slice(startIndex, endIndex);

  tbody.innerHTML = displayData.map((e, t) => {
    let n = "-";
    if (e.durationToGetJob && e.durationToGetJob !== "-") {
      if (["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) {
        n = `<div style="font-size:12.5px; color:var(--success); font-weight:700; white-space:nowrap; background:var(--success-soft); padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; margin-top:6px;"><i data-lucide="clock" style="width:14px; height:14px;"></i> <span>ใช้เวลา ${window.esc(e.durationToGetJob)}</span></div>`;
      } else {
        n = `<div style="font-size:12.5px;font-weight:700;color:var(--danger);background:var(--danger-soft);padding:4px 10px;border-radius:6px;display:inline-flex; align-items:center; gap:4px; margin-top:6px;"><i data-lucide="clock" style="width:14px; height:14px;"></i> <span>ว่างงานมา ${window.esc(e.durationToGetJob)}</span></div>`;
      }
    }

    const icn = ["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว") ? "check-circle-2" : ["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(e.jobCurrentStatus)) ? "book-open" : ["กำลังศึกษา"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(e.jobCurrentStatus)) ? "book" : (e.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(e.jobCurrentStatus)) ? "shield-alert" : ["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(e.jobCurrentStatus)) ? "x-circle" : "search";

    const stLabelText = e.jobStatus === "อื่นๆ" && e.jobCurrentStatus ? e.jobCurrentStatus : e.jobStatus;
    const stLabel = "ศึกษาต่อต่างประเทศ" === e.jobStatus || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "กำลังศึกษาต่อตปท") ? `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px;"><span class="badge ${window.jcBadge(e.jobStatus, e.jobCurrentStatus)}"><i data-lucide="globe"></i> ศึกษาต่อ</span><span style="font-size:12px;font-weight:700;color:#DB2777;background:#FCE7F3;padding:2px 8px;border-radius:6px;">ต่างประเทศ</span></div>` : null;

    let formattedPhone = e.phone;
    if (formattedPhone && formattedPhone.length === 10) formattedPhone = formattedPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

    const genderIcon = e.gender === 'ชาย' ? '<i data-lucide="mars" style="width:14px; color:#0ea5e9; display:inline-block; vertical-align:middle; margin-left:4px;"></i>' : (e.gender === 'หญิง' ? '<i data-lucide="venus" style="width:14px; color:#ec4899; display:inline-block; vertical-align:middle; margin-left:4px;"></i>' : '');

    return `<tr class="fade-in" onclick="window.openDetail('${window.esc(e.idCard)}')">
      <td style="color:var(--text-muted);font-weight:700;text-align:center;">${startIndex + t + 1}</td>
      <td>
        <div style="font-weight:800; color:var(--primary); font-size:15px;">${window.esc(e.studentId)}</div>
        <div style="font-size:12.5px; color:var(--text-muted); font-weight:600; margin-top:2px;">รุ่นปี ${window.esc(e.batchYear)}</div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:flex;flex-direction:column;">
            <div style="font-weight:800;font-size:15px;color:var(--text-bold);display:flex;align-items:center;">${window.esc(e.prefix)}${window.esc(e.nameTH)} ${window.esc(e.surnameTH)} ${genderIcon}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">เลขบัตร ปชช: ${window.esc(e.idCard)}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:nowrap;">
          ${e.branchCode ? '<span style="font-size:11px;font-weight:800;color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:6px;">' + window.esc(e.branchCode) + "</span>" : ""}
          <span style="font-size:13.5px;font-weight:600;">${window.esc(e.branch || "")}</span>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:13px;">
        <div style="font-weight:600;display:flex;align-items:center;gap:6px;margin-bottom:4px;"><i data-lucide="phone" style="width:14px;"></i> ${window.esc(formattedPhone)}</div>
        <div style="font-weight:500;display:flex;align-items:center;gap:6px;"><i data-lucide="mail" style="width:14px;"></i> ${window.esc(e.email)}</div>
      </td>
      <td>
        <div style="margin-bottom: 6px;">${stLabel || `<span class="badge ${window.jcBadge(e.jobStatus, e.jobCurrentStatus)}"><i data-lucide="${icn}"></i> ${window.esc(stLabelText)}</span>`}</div>
        ${n}
      </td>
      <td>
        <div style="font-size:14px;font-weight:700;color:var(--text-bold);">${window.esc(e.jobCompany || "-")}</div>
        <div style="font-size:12.5px;color:var(--text-muted);margin:2px 0;">${window.esc(e.jobPosition || "-")}</div>
        <div style="font-size:13.5px;font-weight:700;color:var(--success);"><i data-lucide="coins" style="width:14px;display:inline-block;vertical-align:text-bottom;"></i> ${window.fmtMoney(e.jobSalary)}</div>
      </td>
      <td onclick="event.stopPropagation()">
        <div class="td-actions" style="justify-content:center;">
          ${isAdmin ? `<button aria-label="View" class="btn btn-outline btn-sm" onclick="window.openDetail('${window.esc(e.idCard)}')"><i data-lucide="eye" style="width:14px;"></i> ดูข้อมูล</button> <button aria-label="Edit" class="btn btn-outline btn-sm" onclick="window.openEdit('${window.esc(e.idCard)}')"><i data-lucide="edit-2" style="width:14px;"></i> แก้ไข</button>` : `<button aria-label="View" class="btn btn-outline btn-sm" onclick="window.openDetail('${window.esc(e.idCard)}')"><i data-lucide="eye" style="width:14px;"></i> ดูข้อมูล</button>`}
        </div>
      </td>
    </tr>`;
  }).join("");

  if (totalPages > 1) {
    let pageBtns = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentTablePage - 2 && i <= currentTablePage + 2)) {
        pageBtns += `<button class="page-btn ${i === currentTablePage ? 'active' : ''}" onclick="currentTablePage=${i}; window.renderTable();">${i}</button>`;
      } else if (i === currentTablePage - 3 || i === currentTablePage + 3) {
        pageBtns += `<span style="padding: 8px; color: var(--text-muted);">...</span>`;
      }
    }

    const paginationHTML = `
      <div class="pagination-container">
        <div style="font-size: 14px; font-weight: 600; color: var(--text-muted);">กำลังแสดง ${startIndex + 1} - ${Math.min(endIndex, o.length)} จากทั้งหมด ${o.length} รายการ</div>
        <div class="page-numbers">
            <button class="page-btn" aria-label="หน้าก่อนหน้า" ${currentTablePage === 1 ? 'disabled' : ''} onclick="currentTablePage--; window.renderTable();"><i data-lucide="chevron-left" style="width:14px;"></i></button>
            ${pageBtns}
            <button class="page-btn" aria-label="หน้าถัดไป" ${currentTablePage === totalPages ? 'disabled' : ''} onclick="currentTablePage++; window.renderTable();"><i data-lucide="chevron-right" style="width:14px;"></i></button>
        </div>
      </div>`;
    tableWrap.insertAdjacentHTML('afterend', paginationHTML);
  }
  if (window.lucide) lucide.createIcons();
};

window.viewDashStatus = function (e) {
  let dashStudents = STUDENTS;
  if (dashYear) dashStudents = dashStudents.filter(s => String(s.batchYear) === dashYear);

  let t = [], n = "", a = "", i = null;
  if ("ทำงาน" === e) { t = dashStudents.filter((s) => ["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && s.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")); n = "นักศึกษาที่ทำงานแล้ว"; a = "briefcase"; }
  else if ("ศึกษาต่อ" === e) { t = dashStudents.filter((s) => ["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(s.jobCurrentStatus))); n = "นักศึกษาที่ศึกษาต่อ"; a = "book-open"; i = (e) => e.jobStatus === "ศึกษาต่อต่างประเทศ" || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "กำลังศึกษาต่อตปท") ? '<span style="font-size:12px;font-weight:700;color:#DB2777;background:#FCE7F3;padding:2px 8px;border-radius:6px;">ต่างประเทศ</span>' : '<span style="font-size:12px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:6px;">ในประเทศ</span>'; }
  else if ("ว่างงาน" === e) { t = dashStudents.filter((s) => ["ว่างงาน", "กำลังหางาน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["กำลังหางาน", "เตรียมสอบราชการ", "เตรียมศึกษาต่อ"].includes(s.jobCurrentStatus))); n = "นักศึกษาที่อยู่ระหว่างหางาน"; a = "search"; }
  else if ("กำลังศึกษา" === e) { t = dashStudents.filter((s) => ["กำลังศึกษา"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(s.jobCurrentStatus))); n = "นักศึกษาที่กำลังศึกษาอยู่"; a = "book"; }
  else if ("ติดภารกิจ" === e) { t = dashStudents.filter((s) => s.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ", "อุปสมบท"].includes(s.jobCurrentStatus)); n = "นักศึกษาที่มีสถานะอื่นๆ"; a = "shield-alert"; }

  if (t.length > 0) {
    window.openGroupModal(n, a, t, i);
  } else {
    window.showToast(`ไม่พบข้อมูล${n}ในระบบ`, true);
  }
};

window.viewDashBranch = function (e) {
  let dashStudents = STUDENTS;
  if (dashYear) dashStudents = dashStudents.filter(s => String(s.batchYear) === dashYear);

  let t = [];
  if (e === "สาขาอื่นๆ") {
    const v = {}; dashStudents.forEach(s => { const bName = s.branch + (s.branchCode ? ` (${s.branchCode})` : ""); v[bName] = (v[bName] || 0) + 1; });
    const sorted = Object.entries(v).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5).map(item => item[0]);
    t = dashStudents.filter(s => !top5.includes(s.branch + (s.branchCode ? ` (${s.branchCode})` : "")));
  } else {
    t = dashStudents.filter((s) => (s.branch && "-" !== s.branch ? s.branch + (s.branchCode ? ` (${s.branchCode})` : "") : "ไม่ระบุสาขา") === e || s.branch === e);
  }

  if (t.length > 0) {
    window.openGroupModal(`สาขา: ${e}`, "graduation-cap", t);
  } else {
    window.showToast(`ไม่พบข้อมูลนักศึกษาสาขา ${e}`, true);
  }
};

window.renderGroupList = function () {
  const arr = window.currentGroupFilterData || [];
  const q = $("modalSearchInput") ? $("modalSearchInput").value.toLowerCase() : "";
  const yF = $("modalYearFilter") ? $("modalYearFilter").value : "";
  const bF = $("modalBranchFilter") ? $("modalBranchFilter").value : "";

  const filtered = arr.filter(e => {
    const brTxt = (e.branch || "ไม่ระบุสาขา") + (e.branchCode ? ` (${e.branchCode})` : "");
    const text = (e.nameTH + " " + e.surnameTH + " " + e.nameEN + " " + e.surnameEN + " " + brTxt).toLowerCase();
    return text.includes(q) && (yF === "" || (e.batchYear || "ไม่ระบุ") === yF) && (bF === "" || brTxt === bF);
  });

  const byYear = {};
  filtered.forEach(e => { const y = e.batchYear || "ไม่ระบุ"; if (!byYear[y]) byYear[y] = []; byYear[y].push(e); });
  const years = Object.keys(byYear).sort((a, b) => b - a);

  let html = "";
  if (filtered.length === 0) html = '<div class="empty-state" style="padding:64px;"><i data-lucide="search-x" style="width:80px;height:80px; margin-bottom:24px;"></i><div style="font-size:20px;">ไม่พบข้อมูลนักศึกษาในหมวดหมู่นี้</div></div>';
  years.forEach(y => {
    html += `<div class="list-group-header"><i data-lucide="users-2" style="width:24px;margin-right:12px;"></i> รหัส ${window.esc(y)} <span style="font-size:16px; opacity:0.8; font-weight:600; margin-left:16px; background:rgba(0,0,0,0.05); padding:4px 12px; border-radius:12px;">รวม ${byYear[y].length} คน</span></div>`;
    const byBranch = {};
    byYear[y].forEach(e => { const b = (e.branch || "ไม่ระบุสาขา") + (e.branchCode ? ` (${e.branchCode})` : ""); if (!byBranch[b]) byBranch[b] = []; byBranch[b].push(e); });
    Object.keys(byBranch).sort().forEach(b => {
      html += `<div class="list-branch-header"><i data-lucide="graduation-cap" style="width:20px;"></i> สาขา: ${window.esc(b)} <span style="color:var(--text-muted);font-size:15px;margin-left:8px;">(${byBranch[b].length} คน)</span></div>`;
      byBranch[b].forEach(e => {
        let jobContext = window.currentGroupLabel ? window.currentGroupLabel(e) : "";
        let subText = ["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว") ? `ตำแหน่ง: ${window.esc(e.jobPosition)} @ ${window.esc(e.jobCompany)}` : `อีเมล: ${window.esc(e.email)}`;

        let stLabelText = e.jobStatus === "อื่นๆ" && e.jobCurrentStatus ? e.jobCurrentStatus : e.jobStatus;
        let badgeStyle = "color:var(--text-muted); background:var(--bg);";
        if (["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) { badgeStyle = "color:var(--success); background:var(--success-soft);"; stLabelText = "ทำงาน"; }
        else if (["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(e.jobCurrentStatus))) badgeStyle = "color:var(--accent); background:var(--accent-soft);";
        else if (["กำลังศึกษา"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(e.jobCurrentStatus))) badgeStyle = "color:var(--info); background:var(--info-soft);";
        else if (e.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(e.jobCurrentStatus)) badgeStyle = "color:#D97706; background:#FEF3C7;";
        else if (["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(e.jobCurrentStatus))) badgeStyle = "color:var(--danger); background:var(--danger-soft);";

        let badgeHTML = `<div style="font-size:15px;font-weight:800; ${badgeStyle} padding:8px 16px; border-radius:12px; white-space:nowrap;">${window.esc(stLabelText)}</div>`;

        html += `<div class="person-item" onclick="window.closeAllModals(); window.openDetail('${window.esc(e.idCard)}')">
          <div>
            <div style="font-weight:800;font-size:17px;color:var(--text-bold);display:flex;align-items:center;gap:12px;">${window.esc(e.prefix + e.nameTH + " " + e.surnameTH)} ${jobContext}</div>
            <div style="font-size:15px;color:var(--text-muted);margin-top:6px;font-weight:600;">${subText}</div>
          </div>
          <div style="text-align:right">${badgeHTML}</div>
        </div>`;
      });
    });
  });
  $("listModalBody").innerHTML = html;
  if (window.lucide) lucide.createIcons();
};

window.openGroupModal = function (title, icon, dataList, customLabelFn = null) {
  window.currentGroupFilterData = dataList;
  window.currentGroupLabel = customLabelFn;

  const ySet = new Set(dataList.map(s => s.batchYear || "ไม่ระบุ"));
  const bSet = new Set(dataList.map(s => (s.branch || "ไม่ระบุสาขา") + (s.branchCode ? ` (${s.branchCode})` : "")));
  const yOpts = '<option value="" style="color:var(--primary); font-weight:800;">ทุกรหัส</option>' + Array.from(ySet).sort().map(y => `<option value="${y}" style="color:var(--text-bold);">รหัส ${y}</option>`).join('');
  const bOpts = '<option value="" style="color:var(--primary); font-weight:800;">ทุกสาขา</option>' + Array.from(bSet).sort().map(b => `<option value="${b}" style="color:var(--text-bold);">${b}</option>`).join('');

  $("listModalHeader").innerHTML = `
    <div style="width: 100%;">
      <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 24px;">
        <div>
          <h2 style="display: flex; align-items: center; gap: 16px; font-size: 32px; font-weight: 800; margin-bottom: 12px; color:white;">
            <i data-lucide="${icon}" style="width: 36px; height: 36px; color:rgba(255,255,255,0.8);"></i> ${title}
          </h2>
          <div style="font-size: 18px; opacity: 0.9; font-weight: 600; color:white;">ค้นพบทั้งหมด <strong>${dataList.length} คน</strong></div>
        </div>
        <button type="button" class="modal-close-fancy" aria-label="ปิดหน้าต่าง" onclick="window.closeAllModals()"><i data-lucide="x" style="width: 28px; height: 28px"></i></button>
      </div>
      <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top: 32px;">
        <input type="search" id="modalSearchInput" name="modalSearchInput" aria-label="ค้นหาข้อมูล" placeholder="ค้นหา ชื่อ, นามสกุล..." oninput="window.renderGroupList()" style="flex:1; min-width:240px; padding:16px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.3); background:rgba(255,255,255,0.1); color:white; font-size:16px; font-weight:500;">
        <select id="modalYearFilter" name="modalYearFilter" aria-label="กรองรหัส" onchange="this.style.color = this.value === '' ? 'var(--primary)' : 'var(--text-bold)'; window.renderGroupList()" style="padding:16px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.3); background:#fff; color:var(--primary); font-size:16px; font-weight:700;">
          ${yOpts}
        </select>
        <select id="modalBranchFilter" name="modalBranchFilter" aria-label="กรองสาขา" onchange="this.style.color = this.value === '' ? 'var(--primary)' : 'var(--text-bold)'; window.renderGroupList()" style="padding:16px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.3); background:#fff; color:var(--primary); font-size:16px; max-width:280px; font-weight:700;">
          ${bOpts}
        </select>
      </div>
    </div>
  `;
  window.renderGroupList();
  window.openModal("modalGenericList");
};

window.openCompany = function (cName) {
  const normCName = window.normalizeCompany(cName);

  const employedList = STUDENTS.filter(s => (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && s.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) && window.normalizeCompany(s.jobCompany) === normCName);

  const internList = STUDENTS.filter(s => {
    const matchY1 = s.internY1_711Branch && window.normalizeCompany(s.internY1_711Branch).includes(normCName);
    const matchY2 = s.internY2_Company && window.normalizeCompany(s.internY2_Company).includes(normCName);
    const matchY3 = s.internY3_Company && window.normalizeCompany(s.internY3_Company).includes(normCName);
    const matchY4 = s.internY4_Company && window.normalizeCompany(s.internY4_Company).includes(normCName);
    return matchY1 || matchY2 || matchY3 || matchY4;
  });

  const employedIds = employedList.map(s => s.idCard);
  const pureInternList = internList.filter(s => !employedIds.includes(s.idCard));

  window.currentCompanyFilterData = { employed: employedList, intern: pureInternList };

  const arr = [...employedList, ...pureInternList];
  const ySet = new Set(arr.map(s => s.batchYear || "ไม่ระบุ"));
  const bSet = new Set(arr.map(s => (s.branch || "ไม่ระบุสาขา") + (s.branchCode ? ` (${s.branchCode})` : "")));

  const yOpts = '<option value="" style="color:var(--text-bold); font-weight:700;">ทุกรหัสรุ่น</option>' + Array.from(ySet).sort().map(y => `<option value="${y}">รหัส ${y}</option>`).join('');
  const bOpts = '<option value="" style="color:var(--text-bold); font-weight:700;">ทุกสาขาวิชา</option>' + Array.from(bSet).sort().map(b => `<option value="${b}">${b}</option>`).join('');

  const posCount = {};
  employedList.forEach(s => {
    let p = (s.jobPosition && s.jobPosition !== "-") ? s.jobPosition : 'ไม่ระบุตำแหน่ง';
    posCount[p] = (posCount[p] || 0) + 1;
  });
  const posSummary = Object.entries(posCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span style="font-weight:600;">${k}</span> <span style="color:var(--success); font-weight:700;">(${v})</span>`).join('<span style="color:rgba(255,255,255,0.4); margin:0 8px;">|</span>');

  window.$("coHeader").innerHTML = `
    <div style="width: 100%;">
      <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 24px;">
        <div>
          <h2 style="display:flex;align-items:center;gap:12px;font-size:26px;font-weight:800;margin-bottom:8px; color:white;"><i data-lucide="building-2" style="width:28px;height:28px;color:rgba(255,255,255,0.8);"></i> ${window.esc(cName)}</h2>
          <div style="font-size:15px;opacity:0.9;font-weight:500; color:white; margin-bottom:16px;">
             <span style="background:var(--success); padding:4px 12px; border-radius:6px; margin-right:8px;">พนักงานประจำ ${employedList.length} คน</span>
             <span style="background:var(--warning); color:white; padding:4px 12px; border-radius:6px;">นักศึกษาฝึกงาน ${pureInternList.length} คน</span>
          </div>
          ${employedList.length > 0 ? `<div style="font-size:14px;color:white; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); padding:10px 16px; border-radius:8px; display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis;"><i data-lucide="briefcase" style="width:16px;height:16px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:#A7F3D0;"></i> <span style="opacity:0.8;">ตำแหน่ง:</span> ${posSummary}</div>` : ''}
        </div>
        <button type="button" class="modal-close-fancy" aria-label="ปิด" onclick="window.closeAllModals()"><i data-lucide="x" style="width:24px;height:24px;"></i></button>
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:24px;">
        <input type="search" id="coSearchInput" aria-label="ค้นหา" placeholder="ค้นหา ชื่อ, นามสกุล..." oninput="window.renderCompanyList()" style="flex:1; min-width:200px;">
        <select id="coYearFilter" aria-label="กรองรหัส" onchange="window.renderCompanyList()">${yOpts}</select>
        <select id="coBranchFilter" aria-label="กรองสาขา" onchange="window.renderCompanyList()" style="max-width:240px;">${bOpts}</select>
      </div>
    </div>
  `;
  window.renderCompanyList();
  window.openModal("modalCompany");
};

window.renderCompanyList = function () {
  const data = window.currentCompanyFilterData || { employed: [], intern: [] };
  const q = window.$("coSearchInput") ? window.$("coSearchInput").value.toLowerCase() : "";
  const yF = window.$("coYearFilter") ? window.$("coYearFilter").value : "";
  const bF = window.$("coBranchFilter") ? window.$("coBranchFilter").value : "";

  const filterFn = e => {
    const brTxt = (e.branch || "ไม่ระบุสาขา") + (e.branchCode ? ` (${e.branchCode})` : "");
    const text = (e.nameTH + " " + e.surnameTH + " " + e.nameEN + " " + e.surnameEN + " " + brTxt).toLowerCase();
    return text.includes(q) && (yF === "" || (e.batchYear || "ไม่ระบุ") === yF) && (bF === "" || brTxt === bF);
  };

  const filteredEmployed = data.employed.filter(filterFn);
  const filteredIntern = data.intern.filter(filterFn);

  let html = "";
  if (filteredEmployed.length === 0 && filteredIntern.length === 0) {
    html = '<div class="empty-state" style="padding:64px;"><i data-lucide="search-x" style="width:80px;height:80px;"></i><div style="font-size:20px;">ไม่พบข้อมูลนักศึกษา</div></div>';
  }

  const renderGroup = (arr, title, badgeColor, badgeText) => {
    if (arr.length === 0) return '';
    let groupHtml = `<div class="list-group-header"><i data-lucide="users-2" style="width:20px;margin-right:8px;"></i> ${title} <span style="font-size:14px; opacity:0.8; font-weight:600; margin-left:12px; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:6px;">รวม ${arr.length} คน</span></div>`;

    const byYear = {};
    arr.forEach(e => { const y = e.batchYear || "ไม่ระบุ"; if (!byYear[y]) byYear[y] = []; byYear[y].push(e); });
    const years = Object.keys(byYear).sort((a, b) => b - a);

    years.forEach(y => {
      groupHtml += `<div class="list-branch-header" style="color:var(--text-bold);"><i data-lucide="calendar" style="width:18px;"></i> รหัสรุ่น: ${window.esc(y)}</div>`;
      const byBranch = {};
      byYear[y].forEach(e => { const b = (e.branch || "ไม่ระบุสาขา") + (e.branchCode ? ` (${e.branchCode})` : ""); if (!byBranch[b]) byBranch[b] = []; byBranch[b].push(e); });

      Object.keys(byBranch).sort().forEach(b => {
        groupHtml += `<div class="list-branch-header" style="margin-left:32px; font-size:14.5px;"><i data-lucide="git-branch" style="width:14px;"></i> ${window.esc(b)} <span style="color:var(--text-muted);font-size:13px;margin-left:6px;">(${byBranch[b].length} คน)</span></div>`;
        byBranch[b].forEach(e => {
          const posText = title === "พนักงานประจำ" ? e.jobPosition : "เคยฝึกงาน";
          groupHtml += `<div class="person-item" style="margin-left:48px;" onclick="window.closeAllModals(); window.openDetail('${window.esc(e.idCard)}')">
              <div>
                <div style="font-weight:700;font-size:15px;color:var(--text-bold);">${window.esc(e.prefix + e.nameTH + " " + e.surnameTH)}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:2px;font-weight:500;">ตำแหน่ง: <span style="color:var(--text);">${window.esc(posText)}</span></div>
              </div>
              <div style="text-align:right">
                <div style="font-size:13px;font-weight:700;${badgeColor} padding:4px 10px; border-radius:6px;">${badgeText}</div>
              </div>
            </div>`;
        });
      });
    });
    return groupHtml;
  };

  html += renderGroup(filteredEmployed, "พนักงานประจำ", "color:var(--success); background:var(--success-soft);", "พนักงาน");
  html += renderGroup(filteredIntern, "นักศึกษาฝึกงาน", "color:var(--warning); background:var(--warning-soft);", "นักศึกษาฝึกงาน");

  window.$("coBody").innerHTML = html;
  if (window.lucide) lucide.createIcons();
};

window.openDetail = function (e) {
  const t = STUDENTS.find(s => String(s.idCard) === String(e)); if (!t) return;

  let badgeColor = "var(--seek)";
  if (["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && t.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) badgeColor = "var(--success)";
  else if (["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(t.jobCurrentStatus))) badgeColor = "var(--accent)";
  else if (["กำลังศึกษา"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(t.jobCurrentStatus))) badgeColor = "var(--info)";
  else if (t.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(t.jobCurrentStatus)) badgeColor = "var(--warning)";
  else if (["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(t.jobCurrentStatus))) badgeColor = "var(--danger)";

  const a = currentUser && "admin" === currentUser.role;
  const stLabelText = t.jobStatus === "อื่นๆ" && t.jobCurrentStatus ? t.jobCurrentStatus : t.jobStatus;

  const hd = document.getElementById("detailHeader");
  if (hd) {
    hd.innerHTML = `<div><h2 style="margin-top:0; font-size:24px;">${window.esc(t.prefix + t.nameTH + " " + t.surnameTH)}</h2><div class="sub" style="font-size:14.5px; font-weight:500;">${window.esc(t.nameEN + " " + t.surnameEN)} · รหัสนักศึกษา: <span style="color:var(--primary); font-weight:700;">${window.esc(t.studentId)}</span></div></div><div class="flex flex-center gap-12"><span class="badge" style="background:${badgeColor};color:#fff;padding:6px 16px;font-size:13.5px;box-shadow:var(--shadow-sm);">${window.esc(stLabelText)}</span><button type="button" class="close-btn" aria-label="ปิด" onclick="window.closeAllModals()"><i data-lucide="x" style="width:24px;height:24px;"></i></button></div>`;
  }

  const i = (lbl, val, sp = !1) => `<div class="detail-field${sp ? " span-2" : ""}"><label>${lbl}</label><p>${window.esc(val || "-")}</p></div>`;
  const r = (lbl, icn, cont) => `<div class="form-category-card" style="box-shadow: var(--shadow-sm); border:1px solid var(--border); margin-bottom: 24px;"><div class="cat-header" style="padding: 16px 24px; font-size: 16px; border-radius: 12px 12px 0 0;"><i data-lucide="${icn}" style="width:20px;height:20px;"></i> ${lbl}</div><div class="cat-body detail-grid" style="padding: 24px;">${cont}</div></div>`;

  if ($("detailFooter")) $("detailFooter").style.display = 'none';

  const bd = document.getElementById("detailBody");
  if (bd) {
    bd.innerHTML = `
      ${r("1. ข้อมูลส่วนบุคคลและการศึกษา", "user", i("รหัสนักศึกษา", t.studentId, !0) + i("เลขบัตรประชาชน", t.idCard) + i("รหัสสาขา", t.branchCode) + i("สาขา", t.branch, !0) + i("ชื่อเล่น", t.nickname) + i("เพศ", t.gender) + i("วันเกิด", window.formatThaiDateShort(t.birthDate)) + i("โรคประจำตัว", t.disease, !0) + i("โทรศัพท์", t.phone) + i("อีเมล", t.email) + i("ที่อยู่ปัจจุบัน", t.currentAddress, !0) + i("ที่อยู่ทะเบียนบ้าน", t.homeAddress, !0))}
      
      ${r("2. ข้อมูลผู้ปกครอง", "users", i("ชื่อผู้ปกครอง", t.parentName, !0) + i("ความสัมพันธ์", t.parentRelation) + i("โทรศัพท์", t.parentPhone))}
      
      ${r("3. ประวัติการฝึกงาน / สหกิจศึกษา (WBL)", "building-2", `
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 16px;">
          <div style="font-size: 14.5px; font-weight: 700; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="pin" style="width:16px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 1 : ฝึกงาน 7-Eleven</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("สาขา 7-Eleven", t.internY1_711Branch)}
            ${i("พื้นที่ / ภาค", t.internY1_711Area)}
            ${i("รหัสพนักงาน", t.internY1_711EmpID)}
          </div>
        </div>
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 16px;">
          <div style="font-size: 14.5px; font-weight: 700; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="briefcase" style="width:16px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 2 : ฝึกงานวิชาชีพ</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("ชื่อบริษัท", t.internY2_Company)}
            ${i("ตำแหน่ง", t.internY2_Position)}
            ${i("แผนก", t.internY2_Dept)}
          </div>
        </div>
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 16px;">
          <div style="font-size: 14.5px; font-weight: 700; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="briefcase" style="width:16px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 3 : ฝึกงานวิชาชีพต่อเนื่อง</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("ชื่อบริษัท", t.internY3_Company)}
            ${i("ตำแหน่ง", t.internY3_Position)}
            ${i("แผนก", t.internY3_Dept)}
          </div>
        </div>
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 0;">
          <div style="font-size: 14.5px; font-weight: 700; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="award" style="width:16px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 4 : สหกิจศึกษา (Co-op)</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("ชื่อบริษัท", t.internY4_Company)}
            ${i("ตำแหน่ง", t.internY4_Position)}
            ${i("แผนก", t.internY4_Dept)}
          </div>
        </div>
      `)}
      
      ${r("4. สถานะปัจจุบัน (วงจรชีวิตนักศึกษา)", "briefcase", i("วันที่จบการศึกษา", window.formatThaiDateShort(t.gradDate)) + i("วันที่เริ่มงาน / บรรจุ", window.formatThaiDateShort(t.jobStartDate)) + i("บริษัท / องค์กร", t.jobCompany) + i("ที่ตั้งบริษัท", t.jobCompanyAddress) + i("เบอร์ติดต่อบริษัท", t.jobCompanyPhone) + i("ตำแหน่ง", t.jobPosition) + i("อัตราเงินเดือน", window.fmtMoney(t.jobSalary)) + i("สถานะงาน", t.jobCurrentStatus) + i("เวลาที่ใช้หางาน (นับจากจบ)", t.durationToGetJob) + i("หมายเหตุเพิ่มเติม", t.jobRemark || "-", !0))}
    `;
  }
  if (window.lucide) lucide.createIcons();
  window.openModal("modalDetail");
};

window.getFormHTML = function () {
  return `
  <div class="form-category-card" id="sec-personal"><div class="cat-header"><i data-lucide="user"></i> 1. ข้อมูลส่วนบุคคลและการศึกษา</div><div class="cat-body form-grid"><div class="form-sub-header"><i data-lucide="graduation-cap"></i> ข้อมูลการศึกษา</div><div class="form-group span-2" style="background:var(--primary-soft);padding:24px;border-radius:12px;border:1px solid rgba(5,150,105,0.2);margin-bottom:0;"><label style="margin-top:0;">รหัสนักศึกษา <span class="required-indicator">*</span></label><input type="text" id="f_studentId" name="studentId" placeholder="10 หลัก (เช่น 6752300852)" maxlength="10" style="font-size:16px; font-weight:700;" oninput="this.value=this.value.replace(/[^0-9]/g,''); if(this.value.length>=2){let p=this.value.substring(0,2); document.getElementById('f_batchYear').value=p;}"></div><div class="form-group"><label>รหัสรุ่น (Batch) <span class="required-indicator">*</span></label><input type="text" id="f_batchYear" name="batchYear" placeholder="เช่น 67" maxlength="2" readonly></div><div class="form-group"><label>เลขบัตรประชาชน <span class="required-indicator">*</span></label><input type="text" id="f_idCard" name="idCard" placeholder="13 หลัก" maxlength="13" oninput="this.value=this.value.replace(/[^0-9]/g,'')"></div><input type="hidden" id="f_faculty" name="faculty" value="คณะวิศวกรรมศาสตร์และเทคโนโลยี"><div class="form-group span-2" style="background:var(--bg);padding:24px;border-radius:12px;border:1px solid var(--border);margin-bottom:0;"><label style="margin-top:0;">สาขาวิชา <span class="required-indicator">*</span></label><div id="form-branch-btns" style="display:flex;flex-wrap:wrap;gap:8px;"></div><input type="hidden" id="f_branch" name="branch"></div><div class="form-group span-2"><label>รหัสสาขา</label><input type="text" id="f_branchCode" name="branchCode" readonly placeholder="เลือกระบุสาขาด้านบนเพื่อเติมรหัสอัตโนมัติ"></div><div class="form-sub-header" style="margin-top:16px;"><i data-lucide="user-circle"></i> ข้อมูลส่วนบุคคล</div><div class="form-group"><label>คำนำหน้า</label><select id="f_prefix" name="prefix"><option value="">เลือก</option><option>นาย</option><option>นางสาว</option></select></div><div class="form-group"><label>เพศ</label><select id="f_gender" name="gender"><option value="">เลือก</option><option>ชาย</option><option>หญิง</option></select></div><div class="form-group"><label>ชื่อจริง (ไทย) <span class="required-indicator">*</span></label><input type="text" id="f_nameTH" name="nameTH"></div><div class="form-group"><label>นามสกุล (ไทย) <span class="required-indicator">*</span></label><input type="text" id="f_surnameTH" name="surnameTH"></div><div class="form-group"><label>ชื่อจริง (อังกฤษ)</label><input type="text" id="f_nameEN" name="nameEN"></div><div class="form-group"><label>นามสกุล (อังกฤษ)</label><input type="text" id="f_surnameEN" name="surnameEN"></div><div class="form-group"><label>ชื่อเล่น</label><input type="text" id="f_nickname" name="nickname"></div><div class="form-group"><label>วันเกิด</label><input type="date" id="f_birthDate" name="birthDate"></div><div class="form-group span-2"><label>โรคประจำตัว</label><input type="text" id="f_disease" name="disease" placeholder="หากไม่มีให้เว้นว่างไว้"></div><div class="form-sub-header" style="margin-top:16px;"><i data-lucide="map-pin"></i> ข้อมูลติดต่อ</div><div class="form-group"><label>เบอร์โทรศัพท์ <span class="required-indicator">*</span></label><input type="tel" id="f_phone" name="phone" placeholder="08xxxxxxxx (10 หลัก)" maxlength="10" oninput="this.value=this.value.replace(/[^0-9]/g,'')"></div><div class="form-group"><label>อีเมล</label><input type="email" id="f_email" name="email" placeholder="email@example.com"></div><div class="form-group span-2"><label>ที่อยู่ปัจจุบัน</label><input type="text" id="f_currentAddress" name="currentAddress" placeholder="บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์"></div><div class="form-group span-2"><label>ที่อยู่ทะเบียนบ้าน</label><input type="text" id="f_homeAddress" name="homeAddress" placeholder="บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์"></div></div></div>

  <div class="form-category-card" id="sec-parents"><div class="cat-header"><i data-lucide="users"></i> 2. ข้อมูลผู้ปกครอง</div><div class="cat-body form-grid"><div class="form-group span-2"><label>ชื่อ-สกุลผู้ปกครอง</label><input id="f_parentName" name="parentName" placeholder="ระบุ ชื่อ-นามสกุล"></div><div class="form-group"><label>โทรศัพท์ผู้ปกครอง</label><input type="tel" id="f_parentPhone" name="parentPhone" placeholder="10 หลัก" maxlength="10" oninput="this.value=this.value.replace(/[^0-9]/g,'')"></div><div class="form-group"><label>ความสัมพันธ์</label><select id="f_parentRelation" name="parentRelation"><option value="">เลือกความสัมพันธ์</option><option>บิดา</option><option>มารดา</option><option>พี่ชาย</option><option>น้องชาย</option><option>พี่สาว</option><option>น้องสาว</option><option>ปู่/ย่า/ตา/ยาย</option><option>อื่นๆ</option></select></div></div></div>

  <div class="form-category-card" id="sec-intern"><div class="cat-header"><i data-lucide="building-2"></i> 3. ประวัติการฝึกงาน / สหกิจศึกษา (WBL)</div><div class="cat-body form-grid"><div class="form-note note-yellow span-2" style="justify-content:center; padding:12px; font-size:15px;"><i data-lucide="pin" style="width:20px;height:20px;"></i> ปี 1 : ฝึกงาน 7-Eleven</div><div class="form-group"><label>สาขา 7-Eleven</label><input type="text" id="f_internY1_711Branch" name="internY1_711Branch" placeholder="สาขา..."></div><div class="form-group"><label>พื้นที่ / ภาค</label><input type="text" id="f_internY1_711Area" name="internY1_711Area" placeholder="กทม. / ภาคเหนือ..."></div><div class="form-group span-2"><label>รหัสพนักงานประจำร้าน</label><input type="text" id="f_internY1_711EmpID" name="internY1_711EmpID" placeholder="EMP-XXXXX"></div><div class="divider"></div><div class="form-sub-header"><i data-lucide="briefcase"></i> ปี 2 : ฝึกงานวิชาชีพ</div><div class="form-group"><label>ชื่อบริษัท</label><input type="text" id="f_internY2_Company" name="internY2_Company" placeholder="บริษัท..."></div><div class="form-group"><label>ตำแหน่ง</label><input type="text" id="f_internY2_Position" name="internY2_Position" placeholder="ตำแหน่ง..."></div><div class="form-group span-2"><label>แผนก</label><input type="text" id="f_internY2_Dept" name="internY2_Dept" placeholder="แผนก..."></div><div class="divider"></div><div class="form-sub-header"><i data-lucide="briefcase"></i> ปี 3 : ฝึกงานวิชาชีพต่อเนื่อง</div><div class="form-group"><label>ชื่อบริษัท</label><input type="text" id="f_internY3_Company" name="internY3_Company" placeholder="บริษัท..."></div><div class="form-group"><label>ตำแหน่ง</label><input type="text" id="f_internY3_Position" name="internY3_Position" placeholder="ตำแหน่ง..."></div><div class="form-group span-2"><label>แผนก</label><input type="text" id="f_internY3_Dept" name="internY3_Dept" placeholder="แผนก..."></div><div class="divider"></div><div class="form-note note-green span-2" style="justify-content:center; padding:12px; font-size:15px;"><i data-lucide="award" style="width:20px;height:20px;"></i> ปี 4 : สหกิจศึกษา (Co-op)</div><div class="form-group"><label>ชื่อบริษัท</label><input type="text" id="f_internY4_Company" name="internY4_Company" placeholder="บริษัท..."></div><div class="form-group"><label>ตำแหน่ง</label><input type="text" id="f_internY4_Position" name="internY4_Position" placeholder="ตำแหน่ง..."></div><div class="form-group span-2"><label>แผนก</label><input type="text" id="f_internY4_Dept" name="internY4_Dept" placeholder="แผนก..."></div></div></div>

  <div class="form-category-card" id="sec-job">
    <div class="cat-header"><i data-lucide="briefcase"></i> 4. สถานะปัจจุบัน (วงจรชีวิตนักศึกษา)</div>
    <div class="cat-body form-grid">
      
      <div class="form-group span-2" style="background:var(--accent-soft); padding:24px; border-radius:12px;">
        <label style="font-size:16px;">สถานะหลักของนักศึกษา <span class="required-indicator">*</span></label>
        <select id="f_jobStatus" name="jobStatus" onchange="window.toggleJobFields()" style="font-weight:700; padding:14px; font-size:15px;">
          <option value="กำลังศึกษา">กำลังศึกษา (Current Student)</option>
          <option value="ทำงานบริษัท">ทำงานองค์กร / บริษัท (Employed)</option>
          <option value="ทำงานอิสระ">ประกอบธุรกิจส่วนตัว / ฟรีแลนซ์ (Self-Employed)</option>
          <option value="ศึกษาต่อ">ศึกษาต่อ (Further Study)</option>
          <option value="ว่างงาน">ว่างงาน / กำลังหางาน (Unemployed)</option>
          <option value="ดรอปเรียน">ดรอปเรียน / ลาพักการศึกษา (Suspended)</option>
          <option value="พ้นสภาพ">พ้นสภาพนักศึกษา (Terminated)</option>
          <option value="อื่นๆ">อื่นๆ (Others)</option>
        </select>
      </div>
      
      <div id="gradDateWrapper" class="form-group span-2" style="display:none;">
        <label>วันที่จบการศึกษา <span class="required-indicator req-grad">*</span></label>
        <input type="date" id="f_gradDate" name="gradDate">
      </div>
      
      <div id="jobFieldsWrapper" class="span-2" style="display:none;background:var(--bg);padding:24px;border-radius:12px; border:1px solid var(--border);">
        <div class="form-grid">
          <div class="form-group">
            <label>วันที่เริ่มทำงาน / บรรจุ <span class="required-indicator req-job">*</span></label>
            <input type="date" id="f_jobStartDate" name="jobStartDate">
          </div>
          <div class="form-group">
            <label>สถานะการทำงาน</label>
            <select id="f_jobCurrentStatus_working" name="jobCurrentStatus_working" onchange="document.getElementById('f_jobCurrentStatus').value = this.value;">
              <option value="ยังทำงานอยู่">ยังทำงานอยู่</option>
              <option value="ลาออกแล้ว">ลาออกแล้ว</option>
              <option value="ประกอบธุรกิจส่วนตัว">ประกอบธุรกิจส่วนตัว</option>
              <option value="ได้งานแล้ว รอเริ่มงาน">ได้งานแล้ว รอเริ่มงาน</option>
            </select>
          </div>
          <div class="form-group span-2">
            <label>ชื่อบริษัท / องค์กรที่ทำงาน <span class="required-indicator req-job">*</span></label>
            <input type="text" id="f_jobCompany" name="jobCompany" placeholder="ระบุชื่อบริษัท...">
          </div>
          <div class="form-group span-2">
            <label>ที่ตั้งบริษัท</label>
            <input type="text" id="f_jobCompanyAddress" name="jobCompanyAddress" placeholder="ระบุที่ตั้ง อาคาร จังหวัด...">
          </div>
          <div class="form-group">
            <label>เบอร์ติดต่อบริษัท</label>
            <input type="text" id="f_jobCompanyPhone" name="jobCompanyPhone" placeholder="เบอร์โทรศัพท์ของบริษัท...">
          </div>
          <div class="form-group">
            <label>ตำแหน่งงาน</label>
            <input type="text" id="f_jobPosition" name="jobPosition" placeholder="ระบุตำแหน่ง...">
          </div>
          <div class="form-group">
            <label>แผนกที่สังกัด</label>
            <input type="text" id="f_jobDept" name="jobDept" placeholder="ระบุแผนก...">
          </div>
          <div class="form-group span-2">
            <label>เงินเดือน (บาท)</label>
            <input type="number" id="f_jobSalary" name="jobSalary" placeholder="ตัวเลขเท่านั้น">
          </div>
        </div>
      </div>
      
      <div id="otherFieldsWrapper" class="span-2" style="display:none; background:var(--primary-soft); padding:24px; border-radius:12px; border:1px solid rgba(5,150,105,0.2);">
        <div class="form-group span-2" style="margin-bottom:0;">
            <label style="color:var(--primary); font-size:15px;"><i data-lucide="list-tree" style="width:18px; display:inline-block; vertical-align:text-bottom;"></i> เลือกรายละเอียดเพิ่มเติม</label>
            <select id="f_jobCurrentStatus_other" name="jobCurrentStatus_other" onchange="document.getElementById('f_jobCurrentStatus').value = this.value; window.toggleJobFields();" style="padding:14px; font-weight:700; border-color:rgba(5,150,105,0.3); background:var(--surface);">
            </select>
        </div>
      </div>
      
      <input type="hidden" id="f_jobCurrentStatus" name="jobCurrentStatus">
      
      <div id="jobRemarkWrapper" class="form-group span-2" style="display:none; margin-top: 8px;">
        <label><i data-lucide="message-square" style="width:18px; display:inline-block; vertical-align:text-bottom; color:var(--primary);"></i> หมายเหตุ / ข้อมูลเพิ่มเติม (พิมพ์กรอกเองได้)</label>
        <textarea id="f_jobRemark" name="jobRemark" rows="3" placeholder="ระบุข้อมูลอื่นๆ เพิ่มเติมอย่างอิสระ" style="width: 100%; padding: 14px; border-radius: var(--r-sm); border: 1px solid var(--border-hi); font-size: 15px; outline: none; background: var(--surface); color: var(--text-bold); font-family: 'Sarabun', sans-serif; resize: vertical;"></textarea>
      </div>

    </div>
  </div>
  `;
};

window.openAddForm = function () {
  editingIdCard = null; hasAttemptedSave = false;
  try { formData = JSON.parse(localStorage.getItem("alumni_draft")) || {}; } catch { formData = {}; }
  window.renderForm("เพิ่มข้อมูลนักศึกษาใหม่"); window.openModal("modalForm");
};

window.openEdit = function (e, t = null) {
  editingIdCard = e; hasAttemptedSave = false; const n = STUDENTS.find((s) => String(s.idCard) === String(e));
  if (n) {
    formData = { ...n };
    formData.birthDate = window.thaiStrToDateInput(formData.birthDate);
    formData.gradDate = window.thaiStrToDateInput(formData.gradDate);
    formData.jobStartDate = window.thaiStrToDateInput(formData.jobStartDate);
    window.renderForm("แก้ไขข้อมูลนักศึกษา"); window.openModal("modalForm");
  }
};

window.renderForm = function (e) {
  const ft = $("formTitle");
  if (ft) ft.innerHTML = `<i data-lucide="edit" style="width:24px;height:24px;color:var(--primary);"></i> ${e}`;
  const fb = $("formBody");
  if (fb) fb.innerHTML = window.getFormHTML();

  FORM_FIELDS.forEach((f) => {
    const t = $("f_" + f);
    if (t && void 0 !== formData[f]) {
      if (t.tagName === "SELECT" && t.id === "f_jobStatus" && formData[f]) t.value = formData[f];
      else if (t.tagName === "TEXTAREA" && formData[f] && formData[f] !== "-") t.value = formData[f];
      else if (t.tagName !== "TEXTAREA") t.value = formData[f];
    }
  });

  window.renderFormFacultyButtons(); if (window.lucide) lucide.createIcons(); window.toggleJobFields();

  if (hasAttemptedSave) {
    setTimeout(() => {
      const err = window.validateForm();
      document.querySelectorAll(".form-field-error").forEach((e) => e.classList.remove("form-field-error"));
      document.querySelectorAll(".field-error-msg").forEach((e) => e.remove());
      err.forEach((e) => {
        const t = $("f_" + e.key), n = "branch" === e.key ? $("form-branch-btns").parentElement : t;
        if (n && (!n.parentElement.querySelector(".field-error-msg"))) {
          n.classList.add("form-field-error");
          let d = document.createElement("div"); d.className = "field-error-msg show"; d.innerHTML = `<i data-lucide="alert-circle" style="width:16px;height:16px;margin-bottom:-2px;"></i> กรุณาระบุ${e.label}`;
          "branch" === e.key ? n.appendChild(d) : n.parentElement?.appendChild(d);
        }
      });
      if (window.lucide) lucide.createIcons();
    }, 50);
  }
};

window.renderFormFacultyButtons = function () {
  formData.faculty = "คณะวิศวกรรมศาสตร์และเทคโนโลยี";
  if ($("f_faculty")) $("f_faculty").value = formData.faculty;
  window.renderFormBranchButtons(formData.faculty);
};

window.renderFormBranchButtons = function (e) {
  const n = $("form-branch-btns");
  if (n) {
    n.innerHTML = FACULTY_DATA[e] ? FACULTY_DATA[e].map((item) => `<button type="button" class="choice-btn ${formData.branch === item.name ? "selected" : ""}" style="padding:12px 20px;" onclick="window.selectFormBranch('${item.name}', '${item.id}')">${item.id}</button>`).join("") : "";
  }
};

window.selectFormBranch = function (e, t) {
  formData.branch = e; formData.branchCode = t;
  if ($("f_branch")) $("f_branch").value = e;
  if ($("f_branchCode")) $("f_branchCode").value = t;
  window.renderFormBranchButtons(formData.faculty);
  if (!editingIdCard) localStorage.setItem("alumni_draft", JSON.stringify(formData));
};

window.collectFormData = function () { FORM_FIELDS.forEach((e) => { const t = $("f_" + e); if (t) formData[e] = t.value; }); };

window.validateForm = function () {
  let e = [];
  const t = [
    { key: "batchYear", label: "รหัสรุ่น (Batch)" },
    { key: "studentId", label: "รหัสนักศึกษา (10 หลัก)" },
    { key: "idCard", label: "เลขบัตรประชาชน (13 หลัก)" },
    { key: "branch", label: "สาขา" },
    { key: "nameTH", label: "ชื่อจริง (ไทย)" },
    { key: "surnameTH", label: "นามสกุล (ไทย)" },
    { key: "phone", label: "เบอร์โทรศัพท์ (10 หลัก)" }
  ];

  if (["ทำงานบริษัท", "ทำงานอิสระ", "ศึกษาต่อ", "ว่างงาน"].includes(formData.jobStatus)) {
    t.push({ key: "gradDate", label: "วันที่จบการศึกษา" });
  }

  if (["ทำงานบริษัท", "ทำงาน", "ทำงานอิสระ"].includes(formData.jobStatus)) {
    t.push(
      { key: "jobStartDate", label: "วันที่เริ่มทำงาน" },
      { key: "jobCompany", label: "ชื่อบริษัท" }
    );
  } else if (["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ", "ว่างงาน", "กำลังศึกษา", "อื่นๆ"].includes(formData.jobStatus)) {
    t.push({ key: "jobCurrentStatus_other", label: "รายละเอียดเพิ่มเติม", valKey: "jobCurrentStatus" });
  }

  t.forEach((t) => { const n = formData[t.valKey || t.key]; if (!n || "" === String(n).trim()) e.push(t); });

  const idc = formData.idCard ? formData.idCard.replace(/\D/g, "") : "";
  if (idc && idc.length !== 13) e.push({ key: "idCard", label: "ต้องครบ 13 หลัก" });

  const stId = formData.studentId ? formData.studentId.replace(/\D/g, "") : "";
  if (stId && stId.length !== 10) e.push({ key: "studentId", label: "ต้องครบ 10 หลัก" });

  const phone = formData.phone ? formData.phone.replace(/\D/g, "") : "";
  if (phone && phone.length > 0 && phone.length !== 10) e.push({ key: "phone", label: "ต้องครบ 10 หลัก" });

  return e;
};

window.saveStudent = async function () {
  window.collectFormData(); hasAttemptedSave = true;

  const btn = $("btnSave");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="spin"></i> กำลังบันทึก...'; if (window.lucide) lucide.createIcons(); }

  if (!formData.batchYear && formData.studentId && formData.studentId.length >= 2) {
    formData.batchYear = formData.studentId.substring(0, 2);
  }

  if (!["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(formData.jobStatus)) { formData.jobCompany = "-"; formData.jobPosition = "-"; formData.jobSalary = 0; formData.jobStartDate = ""; formData.jobDept = "-"; }
  if (["กำลังศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(formData.jobStatus) || (formData.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา", "รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(formData.jobCurrentStatus))) { formData.gradDate = ""; }

  if (window.validateForm().length > 0) {
    window.showToast("กรุณาตรวจสอบและกรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน", true); window.renderForm($("formTitle").textContent);
    setTimeout(() => { const e = document.querySelector(".form-field-error"); if (e) { e.focus(); e.scrollIntoView({ behavior: "smooth", block: "center" }); } }, 100);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width: 20px; height: 20px"></i> บันทึกข้อมูล'; if (window.lucide) lucide.createIcons(); }
    return;
  }

  let e = { ...formData };
  e.gradDate = e.gradDate ? window.thaiStrToGregorian(e.gradDate) : ""; e.jobStartDate = e.jobStartDate ? window.thaiStrToGregorian(e.jobStartDate) : ""; e.jobSalary = Number(e.jobSalary) || 0; e.jobRemark = e.jobRemark && e.jobRemark.trim() !== "" ? e.jobRemark : "-";

  if (e.jobStatus !== "อื่นๆ") e.jobRemark = "-";

  if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ", "ว่างงาน", "กำลังหางาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["ช่วยธุรกิจครอบครัว", "กำลังหางาน", "เตรียมสอบราชการ"].includes(e.jobCurrentStatus))) {
    if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) {
      if (e.gradDate && e.jobStartDate) e.durationToGetJob = window.calcYMD(e.gradDate, e.jobStartDate);
      else e.durationToGetJob = "-";
    } else if (["ว่างงาน", "กำลังหางาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["กำลังหางาน", "เตรียมสอบราชการ"].includes(e.jobCurrentStatus))) {
      if (e.gradDate) e.durationToGetJob = window.calcYMD(e.gradDate, new Date().toISOString().split("T")[0]);
      else e.durationToGetJob = "-";
    } else { e.durationToGetJob = "-"; }
  } else { e.durationToGetJob = "-"; }

  if (!e.jobCurrentStatus) {
    if (["พ้นสภาพ", "ดรอปเรียน"].includes(e.jobStatus)) e.jobCurrentStatus = e.jobStatus;
    if (e.jobStatus === "กำลังศึกษา") e.jobCurrentStatus = "กำลังศึกษาอยู่ (ปี 1-4)";
  }

  window.showLoading(true, "กำลังบันทึกข้อมูลลงฐานข้อมูล...");
  try {
    const n = await window.callAPI({ action: editingIdCard ? "edit" : "add_data", data: e });
    if (n && "success" === n.status) {
      window.showToast("บันทึกข้อมูลเรียบร้อยแล้ว", false);
      if (!editingIdCard) localStorage.removeItem("alumni_draft");
      window.closeAllModals();
      hasUnsavedChanges = false;

      const existingIdx = STUDENTS.findIndex(s => s.idCard === e.idCard);
      if (existingIdx > -1) STUDENTS[existingIdx] = e; else STUDENTS.push(e);
      localStorage.setItem("alumni_data", JSON.stringify(STUDENTS));

      window.updateDashboardAndTable();
      await window.fetchData(false);
    }
    else { window.showToast("เกิดข้อผิดพลาด: " + (n?.message || "ไม่สามารถเชื่อมต่อได้"), true); }
  } catch (err) {
    window.showToast("Error: " + err.message, true);
  } finally {
    window.showLoading(false);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width: 20px; height: 20px"></i> บันทึกข้อมูล'; if (window.lucide) lucide.createIcons(); }
  }
};

window.openConfirmDel = function (e) {
  deleteId = e; const t = STUDENTS.find((t) => String(t.idCard) === String(e));
  if (t) { $("confirmDesc").innerHTML = `คุณต้องการลบข้อมูลของ <strong style="color:var(--danger);">${esc(t.prefix + t.nameTH + " " + t.surnameTH)}</strong> ใช่หรือไม่?<br>ข้อมูลนี้จะถูกลบออกจากระบบทันที ไม่สามารถกู้คืนได้`; window.openModal("modalConfirm"); }
};

window.confirmDelete = async function () {
  const btn = $("btnConfirmDelete");
  if (btn) { btn.disabled = true; btn.innerHTML = "กำลังลบ..."; }
  window.showLoading(true, "กำลังลบข้อมูล...");
  try {
    const e = await window.callAPI({ action: "delete", idCard: deleteId });
    if (e && "success" === e.status) {
      window.showToast("ลบข้อมูลเรียบร้อยแล้ว", false);
      window.closeAllModals();

      STUDENTS = STUDENTS.filter(s => s.idCard !== deleteId);
      localStorage.setItem("alumni_data", JSON.stringify(STUDENTS));
      window.updateDashboardAndTable();

      window.fetchData(false);
    }
    else { window.showToast("ลบล้มเหลว: " + (e?.message || "ไม่สามารถเชื่อมต่อได้"), true); }
  } catch (err) {
    window.showToast("Error: " + err.message, true);
  } finally {
    window.showLoading(false);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="trash-2" style="width: 18px; height: 18px"></i> ยืนยันลบทันที'; if (window.lucide) lucide.createIcons(); }
  }
};

window.toggleJobFields = function () {
  const e = $("f_jobStatus")?.value;
  const t = $("jobFieldsWrapper");
  const n = $("otherFieldsWrapper");
  const gd = $("gradDateWrapper");
  const otherSelect = $("f_jobCurrentStatus_other");
  const workingSelect = $("f_jobCurrentStatus_working");
  const remarkWrap = $("jobRemarkWrapper");
  const reqGrad = document.querySelector(".req-grad");

  if (!t || !n) return;

  const setF = (id, v) => { if ($(id)) $(id).value = v; };

  if (reqGrad) {
    reqGrad.style.display = ["ทำงานบริษัท", "ทำงานอิสระ", "ศึกษาต่อ", "ว่างงาน"].includes(e) ? "inline" : "none";
  }

  if (remarkWrap) {
    remarkWrap.style.display = e === "อื่นๆ" ? "block" : "none";
  }

  if (otherSelect && ["ว่างงาน", "ศึกษาต่อ", "ศึกษาต่อต่างประเทศ", "กำลังศึกษา", "อื่นๆ"].includes(e)) {
    if (otherSelect.dataset.category !== e) {
      let opts = '<option value="">-- โปรดเลือกรายละเอียด --</option>';
      if (e === "กำลังศึกษา") {
        opts += '<option value="กำลังศึกษาอยู่ (ปี 1-4)">กำลังศึกษาอยู่ (ปี 1-4)</option><option value="รอลงทะเบียนเรียน">รอลงทะเบียนเรียน / รักษาสภาพ</option><option value="อื่นๆ">อื่นๆ (โปรดระบุในหมายเหตุ)</option>';
      }
      else if (e === "ว่างงาน") {
        opts += '<option value="กำลังหางาน">กำลังหางาน</option><option value="เตรียมสอบราชการ">เตรียมสอบราชการ / รัฐวิสาหกิจ</option><option value="เตรียมศึกษาต่อ">เตรียมตัวศึกษาต่อ</option><option value="อื่นๆ">อื่นๆ (โปรดระบุในหมายเหตุ)</option>';
      }
      else if (e === "ศึกษาต่อ" || e === "ศึกษาต่อต่างประเทศ") {
        opts += '<option value="กำลังศึกษาต่อไทย">กำลังศึกษาต่อในประเทศ</option><option value="กำลังศึกษาต่อตปท">กำลังศึกษาต่อต่างประเทศ</option><option value="กำลังเตรียมตัวสอบ">กำลังเตรียมตัวสอบเรียนต่อ</option>';
      }
      else if (e === "อื่นๆ") {
        opts += '<option value="รออนุมัติจบ">รออนุมัติจบ / รอรับปริญญา</option><option value="ช่วยธุรกิจครอบครัว">ช่วยธุรกิจครอบครัว</option><option value="ติดทหาร">ติดภารกิจทหาร / เกณฑ์ทหาร / อุปสมบท</option><option value="ปัญหาสุขภาพ">พักรักษาตัว / ปัญหาสุขภาพ</option><option value="ลาออก">ลาออก</option><option value="ย้ายสถานศึกษา">ย้ายสถานศึกษา / เปลี่ยนคณะ</option><option value="อื่นๆ">อื่นๆ (โปรดระบุในหมายเหตุ)</option>';
      }

      otherSelect.innerHTML = opts;
      otherSelect.dataset.category = e;

      let currentV = formData.jobCurrentStatus;
      if (currentV && opts.includes(`value="${currentV}"`)) {
        otherSelect.value = currentV;
      } else {
        const firstValidOpt = otherSelect.options.length > 1 ? otherSelect.options[1].value : "";
        otherSelect.value = firstValidOpt;
      }
    }
    setF("f_jobCurrentStatus", otherSelect.value);
  }

  if (["กำลังศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(e) || (e === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา", "รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(otherSelect?.value))) {
    if (gd) gd.style.display = "none";
  } else {
    if (gd) gd.style.display = "block";
  }

  if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(e)) {
    t.style.display = "block"; n.style.display = "none";
    setF("f_jobCurrentStatus", workingSelect?.value || "ยังทำงานอยู่");
  } else if (["ว่างงาน", "ศึกษาต่อ", "ศึกษาต่อต่างประเทศ", "กำลังศึกษา", "อื่นๆ"].includes(e)) {
    t.style.display = "none"; n.style.display = "block";
    setF("f_jobCurrentStatus", otherSelect?.value || "ไม่มีข้อมูล");
    ["f_jobStartDate", "f_jobCompany", "f_jobPosition", "f_jobDept", "f_jobSalary"].forEach(id => setF(id, ""));
  } else if (["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(e)) {
    t.style.display = "none"; n.style.display = "none";
    setF("f_jobCurrentStatus", e === "ดรอปเรียน" ? "ดรอปเรียน / ลาพัก" : "พ้นสภาพ / ไม่จบการศึกษา");
    ["f_jobStartDate", "f_jobCompany", "f_jobPosition", "f_jobDept", "f_jobSalary"].forEach(id => setF(id, ""));
  } else { t.style.display = "none"; n.style.display = "none"; }
};

document.addEventListener("input", (e) => { if (e.target.closest("#formBody")) { hasUnsavedChanges = true; if (!editingIdCard) { window.collectFormData(); localStorage.setItem("alumni_draft", JSON.stringify(formData)); } } });
document.addEventListener("change", (e) => { if (e.target.closest("#formBody")) { hasUnsavedChanges = true; if (!editingIdCard) { window.collectFormData(); localStorage.setItem("alumni_draft", JSON.stringify(formData)); } } });

window.openManual = function () {
  const isAdmin = currentUser && currentUser.role === "admin";
  const roleText = isAdmin ? "สำหรับผู้ดูแลระบบ Admin" : "สำหรับผู้บริหารและผู้ชม Viewer";

  let manualHTML = `
    <div style="display: flex; flex-direction: column; gap: 32px;">

        <!-- Step 1: Login -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--bg); padding: 16px; border-radius: 12px; height: fit-content; border: 1px solid var(--border-hi);">
                    <i data-lucide="log-in" style="width: 28px; height: 28px; color: var(--text-bold);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--text-bold); margin-bottom: 8px;">1. การเข้าสู่ระบบ (Login)</h4>
                    <p style="color: var(--text); font-size: 15px; margin-bottom: 0; line-height: 1.6;">กรอก <strong>Username</strong> และ <strong>Password</strong> ของคุณให้ถูกต้อง จากนั้นกดปุ่ม <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">เข้าสู่ระบบ</span> เมื่อข้อมูลถูกต้อง ระบบจะพาเข้าสู่หน้าภาพรวม (Dashboard) โดยอัตโนมัติ</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 16px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <img src="image_70e1a4.png" alt="หน้า Login" style="width: 100%; height: 200px; object-fit: contain; border-radius: 8px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'">
                <i data-lucide="monitor-stop" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0;" onload="this.style.display='none'"></i>
            </div>
        </div>

        <!-- Step 2: ฐานข้อมูลนักศึกษา -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--info-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--info-soft); padding: 16px; border-radius: 12px; height: fit-content;">
                    <i data-lucide="users" style="width: 28px; height: 28px; color: var(--info);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--info); margin-bottom: 8px;">2. เมนูฐานข้อมูลนักศึกษา (หน้าหลัก)</h4>
                    <p style="color: var(--text); font-size: 15px; margin-bottom: 0; line-height: 1.6;">ไปที่เมนู <strong>"ฐานข้อมูลนักศึกษา"</strong> ด้านซ้ายมือ หน้านี้จะเป็นตารางรายชื่อทั้งหมด คุณสามารถพิมพ์ค้นหาชื่อ หรือกดกรองข้อมูลตามสถานะ และรุ่นที่จบได้</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 16px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <i data-lucide="table" style="width: 48px; height: 48px; color: var(--info); margin-bottom: 12px;"></i>
                <div style="font-weight: 700; color: var(--text-muted);">ตารางแสดงข้อมูลนักศึกษาทั้งหมด</div>
            </div>
        </div>

        ${isAdmin ? `
        <!-- Step 3: นำเข้าข้อมูล (เฉพาะ Admin) -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 2px solid var(--primary-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--primary-soft); padding: 16px; border-radius: 12px; height: fit-content;">
                    <i data-lucide="upload-cloud" style="width: 28px; height: 28px; color: var(--primary);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--primary); margin-bottom: 8px;">3. การนำเข้าข้อมูล และส่งไปที่ Google Sheets</h4>
                    <ul style="color: var(--text); font-size: 15px; padding-left: 20px; line-height: 1.6; margin-bottom: 0;">
                        <li>คลิกปุ่ม <span style="border: 1px solid var(--primary); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i data-lucide="upload-cloud" style="width: 12px; display: inline;"></i> นำเข้าข้อมูล</span> ด้านบนขวา</li>
                        <li>หน้าต่างอัปโหลดจะเด้งขึ้นมา ให้ลากไฟล์ <strong>.xlsx, .xls หรือ .csv</strong> มาวาง</li>
                        <li>เมื่อกดยืนยัน ข้อมูลจะถูกส่งเข้าไปบันทึกลง <strong>Google Sheets</strong> ทันที!</li>
                    </ul>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--primary);">1. คลิกปุ่มนำเข้าข้อมูล</div>
                    <img src="image_71ac96.png" alt="คลิกปุ่มนำเข้า" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0; display:none;"></i>
                </div>
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--primary);">2. หน้าต่างอัปโหลด</div>
                    <img src="image_71ac7a.png" alt="หน้าต่างอัปโหลด" style="max-width: 100%; height: 120px; object-fit: contain; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="monitor" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0; display:none;"></i>
                </div>
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--primary);">3. เลือกไฟล์ .xlsx หรือ .csv</div>
                    <img src="image_71ac75.png" alt="เลือกไฟล์" style="max-width: 100%; height: 120px; object-fit: cover; object-position: left top; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="file-spreadsheet" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0; display:none;"></i>
                </div>
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--success);">4. บันทึกลง Google Sheets ทันที</div>
                    <img src="image_71ac3a.png" alt="Google Sheets" style="max-width: 100%; height: 120px; object-fit: cover; object-position: left top; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="database" style="width: 48px; height: 48px; color: var(--success); margin: 12px 0; display:none;"></i>
                </div>
            </div>
        </div>

        <!-- Step 4: เพิ่มข้อมูลใหม่ (เฉพาะ Admin) -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--success-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--success-soft); padding: 16px; border-radius: 12px; height: fit-content;">
                    <i data-lucide="plus-circle" style="width: 28px; height: 28px; color: var(--success);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--success); margin-bottom: 8px;">4. การเพิ่มข้อมูลใหม่ทีละรายการ</h4>
                    <p style="color: var(--text); font-size: 15px; margin-bottom: 0; line-height: 1.6;">คลิกปุ่ม <span style="background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i data-lucide="plus-circle" style="width: 12px; display: inline;"></i> เพิ่มข้อมูลใหม่</span> กรอกรายละเอียดที่จำเป็น เมื่อกดยืนยัน <strong>ข้อมูลนี้จะถูกส่งไปต่อท้ายใน Google Sheets ของคุณทันที</strong> เหมือนกับการนำเข้าไฟล์</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 24px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <i data-lucide="user-plus" style="width: 48px; height: 48px; color: var(--success); margin-bottom: 12px;"></i>
                <div style="font-weight: 700; color: var(--text-muted);">หน้าต่างสำหรับกรอกข้อมูลเพิ่มใหม่</div>
            </div>
        </div>
        ` : ''}

        <!-- Step 5/3: ดูข้อมูล -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--bg-hover); padding: 16px; border-radius: 12px; height: fit-content; border: 1px solid var(--border-hi);">
                    <i data-lucide="eye" style="width: 28px; height: 28px; color: var(--text-bold);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--text-bold); margin-bottom: 8px;">${isAdmin ? '5' : '3'}. การดูรายละเอียดข้อมูล (View)</h4>
                    <p style="color: var(--text); font-size: 15px; margin-bottom: 0; line-height: 1.6;">ในตารางข้อมูล ให้ <strong>"คลิกที่แถวของชื่อนักศึกษา"</strong> หรือคลิกปุ่ม <span style="border: 1px solid var(--border-hi); padding: 2px 6px; border-radius: 4px;"><i data-lucide="eye" style="width: 14px; display: inline;"></i></span> ด้านขวา ระบบจะเปิดหน้าต่างป๊อปอัปแสดงประวัติส่วนตัว, ประวัติฝึกงาน และสถานะการทำงานปัจจุบันแบบครบถ้วน</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 24px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <i data-lucide="contact-2" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
                <div style="font-weight: 700; color: var(--text-muted);">หน้าต่างแสดงรายละเอียดข้อมูลส่วนบุคคล</div>
            </div>
        </div>

        ${isAdmin ? `
        <!-- Step 6: ส่งออกข้อมูล -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--accent-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--accent-gold-soft); padding: 16px; border-radius: 12px; height: fit-content;">
                    <i data-lucide="download" style="width: 28px; height: 28px; color: var(--accent-gold);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--accent-gold); margin-bottom: 8px;">6. การส่งออกข้อมูล (Export Excel)</h4>
                    <p style="color: var(--text); font-size: 15px; margin-bottom: 0; line-height: 1.6;">คุณสามารถคลิกปุ่ม <span style="border: 1px solid var(--text-bold); padding: 4px 8px; border-radius: 4px; font-size: 12px;"><i data-lucide="download" style="width: 12px; display: inline;"></i> ส่งออก Excel</span> ระบบจะดึงรายชื่อที่กำลังแสดงอยู่ในตาราง นำมาสร้างเป็นไฟล์ Excel (.xlsx) และโหลดลงเครื่องให้ทันที</p>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Step 7/4: ออกจากระบบ -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--danger-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--danger-soft); padding: 16px; border-radius: 12px; height: fit-content;">
                    <i data-lucide="log-out" style="width: 28px; height: 28px; color: var(--danger);"></i>
                </div>
                <div>
                    <h4 style="font-size: 18px; color: var(--danger); margin-bottom: 8px;">${isAdmin ? '7' : '4'}. การออกจากระบบ (Logout)</h4>
                    <p style="color: var(--text); font-size: 15px; margin-bottom: 0; line-height: 1.6;">เมื่อเสร็จสิ้นการใช้งาน ให้คลิกที่ปุ่มเมนูมุมบนขวา และเลือก <span style="background: var(--danger-soft); color: var(--danger); padding: 4px 8px; border-radius: 99px; font-size: 12px;"><i data-lucide="log-out" style="width: 12px; display: inline;"></i> ออกจากระบบ</span> เพื่อตัดการเชื่อมต่อและรักษาความปลอดภัยของข้อมูล</p>
                </div>
            </div>
        </div>

    </div>
    `;

  const mt = document.getElementById("manualTitle");
  const mb = document.getElementById("manualBodyContent");

  if (mt) {
    mt.innerHTML = `
            <i data-lucide="book-open" style="width:32px; height:32px; color: var(--primary); margin-right: 12px;"></i> 
            คู่มือการใช้งานระบบ (${roleText})
        `;
  }
  if (mb) mb.innerHTML = manualHTML;

  if (window.lucide) lucide.createIcons();
  window.openModal('modalManual');
};