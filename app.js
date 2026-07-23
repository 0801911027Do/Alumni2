const API_URL = "https://script.google.com/macros/s/AKfycbwcPXx1vNxGrbSUTOEL8kERkGrx4e8rSSwcApYtQow7awF9NSxxFGkUCTCo3bBp26Sw/exec";

// 🌐 Cloudflare Images Configuration
window.CLOUDFLARE_CONFIG = {
  accountHash: "", // กรอก Account Hash ของ Cloudflare เช่น 'zP2w8n-2bS9oF-H1pQ9w' (หากปล่อยว่างจะใช้ระบบรูปภาพ Base64/Google Drive ตามปกติ)
  enabled: false   // ตั้งค่าเป็น true หากต้องการเปิดใช้งานรูปภาพจาก Cloudflare Images โดยใช้ รหัสนักศึกษา (studentId) เป็นตัวชี้วัด
};

// 📂 FTP / Local Server Images Configuration (กรณีอัปโหลดรูปผ่าน FileZilla ขึ้นเซิร์ฟเวอร์เว็บโดยตรง)
window.LOCAL_IMAGE_CONFIG = {
  enabled: false,         // ตั้งค่าเป็น true หากต้องการเปิดใช้งานการดึงรูปภาพที่อัปโหลดขึ้นเซิร์ฟเวอร์โดยตรง
  folderPath: "images/students/", // โฟลเดอร์รูปภาพบนเซิร์ฟเวอร์ (เช่น "images/students/")
  extension: ".jpg"       // นามสกุลไฟล์รูปภาพที่บันทึกบนเซิร์ฟเวอร์ (แนะนำให้เป็นไฟล์ .jpg เสมอ)
};

// Lazy Load XLSX function to improve performance
let xlsxLoaded = false;
window.loadXLSX = function() {
    return new Promise((resolve, reject) => {
        if(xlsxLoaded || typeof XLSX !== 'undefined') return resolve();
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
        script.onload = () => { xlsxLoaded = true; resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

window.loadLocalUsers = function() {
    try {
        const list = JSON.parse(localStorage.getItem("alumni_users") || "[]");
        const arrayList = Array.isArray(list) ? list : [];
        
        // Always ensure default admin accounts exist
        const defaults = [
            { username: "admin", password: "password", name: "Administrator", role: "admin" },
            { username: "admin", password: "admin1234", name: "Administrator", role: "admin" }
        ];
        
        // Merge defaults with existing list, avoiding duplicates
        const merged = [...arrayList];
        defaults.forEach(def => {
            if (!merged.some(u => u.username.toLowerCase() === def.username.toLowerCase() && u.password === def.password)) {
                merged.push(def);
            }
        });
        return merged;
    } catch (err) {
        return [
            { username: "admin", password: "password", name: "Administrator", role: "admin" },
            { username: "admin", password: "admin1234", name: "Administrator", role: "admin" }
        ];
    }
};

window.saveLocalUsers = function(users) {
    localStorage.setItem("alumni_users", JSON.stringify(Array.isArray(users) ? users : []));
};

window.getCachedStudents = function() {
    try {
        const raw = localStorage.getItem("alumni_data");
        if (!raw) return [];
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];
        
        // หากตรวจพบว่ามีไอดีการ์ดนักศึกษาจากชุดข้อมูลจำลอง (Mock Data) หรือมีอีเมลในช่องสาขาวิชา ให้เคลียร์ Cache ทันที
        const hasMock = list.some(s => s.idCard === "1100100200301" || s.studentId === "6212345678" || (s.branch && s.branch.includes("@")));
        if (hasMock) {
            localStorage.removeItem("alumni_data");
            return [];
        }
        return list;
    } catch (err) {
        return [];
    }
};

window.openAdminModal = function() {
    window.openModal('modalAdminSetup');
};

window.createLocalUser = function() {
    const username = $("f_adminUsername")?.value.trim();
    const password = $("f_adminPassword")?.value.trim();
    const name = $("f_adminName")?.value.trim();
    const role = $("f_adminRole")?.value || "admin";

    if (!username || !password) {
        return window.showToast("กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน", true);
    }

    const users = window.loadLocalUsers();
    if (users.some(u => u.username === username)) {
        return window.showToast("ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว", true);
    }

    users.push({ username, password, name: name || username, role });
    window.saveLocalUsers(users);
    window.showToast("สร้างบัญชีผู้ใช้งานเรียบร้อยแล้ว", false);
    window.closeAllModals();
    $("inpUser").value = username;
    $("inpPass").value = "";
};

window.$ = function(id) { return document.getElementById(id); };
window.esc = function(e) { return String(e || "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); };
window.fmtMoney = function(e) { return e && Number(e) > 0 ? Number(e).toLocaleString('th-TH') + " ฿" : "-"; };
window.cleanDate = function(e) { let t = String(e || "").trim(); return t.length >= 10 && "T" === t.charAt(10) ? t.substring(0, 10) : t; };
window.getVal = function(obj, key) { return String(obj[key] || "").trim(); };
window.normalizeCompany = function(name) {
    if(!name || name.trim() === "" || name.trim() === "-") return "ธุรกิจส่วนตัว / ไม่ระบุ";
    return name.trim().toUpperCase();
};

window.jcBadge = function(jobStatus, jobCurrentStatus) {
    if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(jobStatus) || (jobStatus === "อื่นๆ" && jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) return "badge-work";
    if (["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(jobStatus) || (jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(jobCurrentStatus))) return "badge-study";
    if (["กำลังศึกษา"].includes(jobStatus) || (jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(jobCurrentStatus))) return "badge-studying";
    if (jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(jobCurrentStatus)) return "badge-mission";
    if (["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(jobStatus) || (jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(jobCurrentStatus))) return "badge-danger";
    return "badge-seek";
};

window.getAvatar = function(n,g){const i=n?n.charAt(0):'U';const c='color:var(--text-bold);background:var(--surface);';return`<div class="smart-avatar" style="${c}">${i}</div>`;};

let dashYear = "";
let dashCompanyPage = 1;

window.checkSetup = function() {
  if (!API_URL || API_URL.trim() === "" || API_URL.includes("YOUR_DEPLOYMENT_ID")) {
    if ($("loginError")) { $("loginError").innerHTML = '<i data-lucide="alert-triangle" style="width:20px;height:20px;"></i> <strong style="color:var(--danger)">ยังไม่ได้ตั้งค่า API_URL</strong>'; $("loginError").classList.remove("hidden"); lucide.createIcons(); }
  }
};

window.openModal = function(e) { $("modalBackdrop").classList.remove("hidden"); $(e).classList.remove("hidden"); document.body.classList.add("modal-open"); };
window.closeAllModals = function() { $("modalBackdrop").classList.add("hidden"); document.querySelectorAll(".modal-box").forEach((e) => e.classList.add("hidden")); document.body.classList.remove("modal-open"); hasUnsavedChanges = false; };

window.safeCloseModal = function() {
  if(hasUnsavedChanges) {
    $("modalForm").classList.add("hidden");
    $("modalDiscard").classList.remove("hidden");
    lucide.createIcons();
  } else {
    window.closeAllModals();
  }
};

window.cancelDiscard = function() {
  $("modalDiscard").classList.add("hidden");
  $("modalForm").classList.remove("hidden");
};

window.forceCloseModals = function() {
  hasUnsavedChanges = false;
  window.closeAllModals();
};

// -------------------------------------------------------------
// 🟢 ส่วนจัดการข้อมูลวันที่และการแปลงวันที่ (Date Processing Utilities)
// -------------------------------------------------------------

/**
 * ทำความสะอาดและแปลงฟอร์แมตข้อมูลวันที่ (รองรับทั้ง ค.ศ., พ.ศ. และรูปแบบเลข Serial Date จาก Excel)
 * โดยจะแปลงข้อมูลวันที่จากหน้าตาแบบต่างๆ ให้กลายเป็นฟอร์แมตมาตรฐานสำหรับฟิลด์ input[type=date] คือ 'YYYY-MM-DD'
 * 
 * @param {string|number} val - ข้อมูลวันที่นำเข้า เช่น "2026/05/19", "19-05-2569", 45678 (Excel date)
 * @returns {string} วันที่ในรูปแบบมาตรฐาน 'YYYY-MM-DD' หรือค่าว่างหากแปลงไม่ได้
 */
window.formatAndCleanDate = function(val) {
  if (!val || val === "-" || String(val).trim() === "") return "";
  let strVal = String(val).trim();

  // กรณีเป็นตัวเลขจำนวนเต็มที่มีค่ามาก (รูปแบบ Serial Date ของ Excel เช่น 45015)
  if (!isNaN(Number(strVal)) && Number(strVal) > 10000) {
    // Excel เริ่มนับ 1 ที่วันที่ 1 มกราคม 1900 แต่อ้างอิงบั๊กวันอธิกสุรทินปี 1900 ทำให้ค่าคลาดเคลื่อนไป 2 วัน 
    // จึงใช้จุดอ้างอิงเริ่มต้น (Epoch) เป็นวันที่ 30 ธันวาคม 1899 เพื่อชดเชยค่านี้
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + Number(strVal) * 86400000); // 86,400,000 มิลลิวินาทีใน 1 วัน
    const d = String(jsDate.getDate()).padStart(2, '0');
    const m = String(jsDate.getMonth() + 1).padStart(2, '0');
    const y = jsDate.getFullYear();
    return `${y}-${m}-${d}`;
  }

  // แปลงเครื่องหมายเครื่องหมายทับ (/) ให้เป็นขีด (-) เพื่อให้ง่ายต่อการแบ่งส่วนย่อย
  strVal = strVal.replace(/\//g, '-');

  let p = strVal.split('-');
  if (p.length === 3) {
    let y = 0, m = 0, d = 0;
    // กรณีที่ 1: ขึ้นต้นด้วยปี 4 หลัก (เช่น YYYY-MM-DD)
    if (p[0].length === 4) {
      y = parseInt(p[0]); m = parseInt(p[1]); d = parseInt(p[2]);
    } 
    // กรณีที่ 2: ขึ้นต้นด้วยวันหรือเดือน (เช่น DD-MM-YYYY หรือ DD-MM-YY)
    else if (p[2].length === 4 || p[2].length === 2) {
      d = parseInt(p[0]); m = parseInt(p[1]); y = parseInt(p[2]);
      if (y < 100) { y += 2500; } // รองรับระบบปี 2 หลัก เช่น พ.ศ. 69 เป็น 2569
    }
    
    // หากเป็นปี พ.ศ. (ค่าเกิน 2400) ให้ลบด้วย 543 เพื่อแปลงกลับเป็น ค.ศ. (Gregorian Calendar)
    if (y > 2400) y -= 543;

    // ตรวจสอบความถูกต้องขั้นพื้นฐานของวัน เดือน ปี ก่อนส่งกลับ
    if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return "";
};

/**
 * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชนไทย (13 หลัก) ตามสูตร Modulo 11
 * 
 * @param {string} id - เลขบัตรประชาชนที่ป้อนเข้ามา
 * @returns {boolean} true ถ้ารหัสถูกต้องตามสูตรคำนวณ, false หากไม่ถูกต้อง
 */
window.checkIDCard = function(id) {
    if(id.length != 13) return false;
    let sum = 0;
    // คำนวณผลรวมถ่วงน้ำหนักของหลักที่ 1 ถึง 12 โดยคูณน้ำหนักถอยหลังตั้งแต่ 13 ลงไปจนถึง 2
    for(let i=0; i<12; i++) sum += parseFloat(id.charAt(i)) * (13-i);
    // ถอดรหัสตรวจสอบหลักสุดท้าย (Check Digit) โดยสูตร (11 - (sum % 11)) % 10
    if((11 - sum % 11) % 10 != parseFloat(id.charAt(12))) return false;
    return true;
};

/**
 * คำนวณความต่างเวลาแบบละเอียด เป็นปี เดือน และวัน จากวันเรียนจบไปจนถึงวันเริ่มงาน
 * 
 * @param {string} gradDate - วันจบการศึกษามาตรฐาน (YYYY-MM-DD)
 * @param {string} jobDate - วันเริ่มทำงานมาตรฐาน (YYYY-MM-DD)
 * @returns {string} ข้อความอธิบายระยะเวลา เช่น "1 ปี 2 เดือน" หรือ "ได้งานก่อนเรียนจบ"
 */
window.calcYMD = function(gradDate, jobDate) {
  if (!gradDate || !jobDate || "-" === gradDate || "-" === jobDate) return "-";
  const gradParts = String(gradDate).split("-").map(Number);
  const jobParts = String(jobDate).split("-").map(Number);
  if (gradParts.length !== 3 || jobParts.length !== 3) return "-";

  // สร้าง Date Object ในระบบ ค.ศ. (หมายเหตุ: เดือนของ JavaScript Date เริ่มจาก 0 = มกราคม)
  const gradDateObj = new Date(gradParts[0], gradParts[1] - 1, gradParts[2]);
  const jobDateObj = new Date(jobParts[0], jobParts[1] - 1, jobParts[2]);

  if (isNaN(gradDateObj) || isNaN(jobDateObj)) return "-";
  
  // กรณีพิเศษ: ถ้านักศึกษาได้รับการบรรจุก่อนวันจบการศึกษาอย่างเป็นทางการ
  if (jobDateObj < gradDateObj) return "ได้งานก่อนเรียนจบ";

  let years = jobDateObj.getFullYear() - gradDateObj.getFullYear();
  let months = jobDateObj.getMonth() - gradDateObj.getMonth();
  let days = jobDateObj.getDate() - gradDateObj.getDate();

  // ปรับการคำนวณวันติดลบ (ยืมวันจากเดือนก่อนหน้า)
  if (days < 0) { 
    months--; 
    days += new Date(jobDateObj.getFullYear(), jobDateObj.getMonth(), 0).getDate(); 
  }
  // ปรับการคำนวณเดือนติดลบ (ยืมเดือนจากปีก่อนหน้า)
  if (months < 0) { 
    years--; 
    months += 12; 
  }

  let result = [];
  if (years > 0) result.push(`${years} ปี`);
  if (months > 0) result.push(`${months} เดือน`);
  if (days > 0) result.push(`${days} วัน`);

  return result.length > 0 ? result.join(" ") : "0 วัน";
};

// -------------------------------------------------------------
// 🟢 ส่วนอำนวยความสะดวกในระบบ Core (Core Date Utilities)
// -------------------------------------------------------------

/**
 * แปลงค่าวันที่ระบบสากล ค.ศ. (YYYY-MM-DD) ให้เป็นรูปแบบสตริงไทย พ.ศ. (DD/MM/YYYY) สำหรับการแสดงผลบนตาราง
 * 
 * @param {string} e - วันที่ ค.ศ. (เช่น "2026-05-19")
 * @returns {string} วันที่ พ.ศ. (เช่น "19/05/2569")
 */
window.gregorianToThaiStr = function(e) { 
  if (!e || "-" === e) return ""; 
  const t = e.split("T")[0].split("-"); 
  if (3 !== t.length) return e; 
  const n = parseInt(t[0]) + 543; 
  return `${t[2].padStart(2, "0")}/${t[1].padStart(2, "0")}/${n}`; 
};

/**
 * แปลงสตริงวันที่ภาษาไทย พ.ศ. (DD/MM/YYYY) กลับเป็นรูปแบบสากล ค.ศ. (YYYY-MM-DD) สำหรับเก็บข้อมูล
 * 
 * @param {string} e - วันที่ไทย (เช่น "19/05/2569")
 * @returns {string} วันที่ ค.ศ. (เช่น "2026-05-19")
 */
window.thaiStrToGregorian = function(e) {
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

/**
 * จัดการแปลงค่าที่อาจเป็นทั้งแบบ พ.ศ. หรือ ค.ศ. ให้พร้อมใช้ใน element <input type="date">
 * 
 * @param {string} e - สตริงวันที่นำเข้า
 * @returns {string} วันที่ฟอร์แมต YYYY-MM-DD
 */
window.thaiStrToDateInput = function(e) {
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
  "internY1_711Branch", "internY1_Position", "internY1_Duration",
  "internY2_Company", "internY2_Position", "internY2_Duration",
  "internY3_Company", "internY3_Position", "internY3_Duration",
  "finalProject", "startDate", "gradDate", "jobStatus",
  "jobStartDate", "jobCurrentStatus", "jobCurrentStatus_other", "jobCompany", "jobCompanyAddress", "jobCompanyPhone", "jobPosition",
  "jobDept", "jobSalary", "allowance", "profileImage", "jobRemark"
];

let STUDENTS = [], ORGANIZATIONS = [], POSITIONS = [], currentUser = null, currentPage = "dash", filterStatus = "ทั้งหมด", filterBr = "ทั้งหมด", filterBrId = "ทั้งหมด", filterFac = "ทั้งหมด", editingIdCard = null, formData = {}, deleteId = null, isFetching = false, hasAttemptedSave = false, hasUnsavedChanges = false;
let currentTablePage = 1;
const itemsPerPage = 25;

window.formatThaiDateShort = function(e) {
  if (!e || "-" === e) return "-";
  const t = e.split("T")[0].split("-");
  if (t.length !== 3) return e;
  let year = parseInt(t[0]);
  if(year < 2500) year += 543;
  return `${t[2].padStart(2,'0')}/${t[1].padStart(2,'0')}/${year}`;
};

window.exportToExcel = async function() {
  const filtered = window.getFilteredStudents();
  if(!filtered.length) return window.showToast("ไม่มีข้อมูลสำหรับส่งออก", true);

  window.showLoading(true, "กำลังเตรียมไลบรารี...");
  await window.loadXLSX();
  window.showLoading(true, "กำลังเตรียมไฟล์ Excel...");
  try {
    const dataToExport = filtered.map(s => ({
      "รหัสนักศึกษา": s.studentId || "-",
      "เลขบัตรประชาชน": s.idCard || "-",
      "คำนำหน้า": s.prefix || "-",
      "ชื่อจริง_TH": s.nameTH || "-",
      "นามสกุล_TH": s.surnameTH || "-",
      "ชื่อจริง_EN": s.nameEN || "-",
      "นามสกุล_EN": s.surnameEN || "-",
      "ชื่อเล่น": s.nickname || "-",
      "เพศ": s.gender || "-",
      "วัน/เดือน/ปีเกิด": window.formatThaiDateShort(s.birthDate),
      "เบอร์โทรศัพท์": s.phone || "-",
      "อีเมล": s.email || "-",
      "โรคประจำตัว": s.disease || "-",
      "ที่อยู่ปัจจุบัน": s.currentAddress || "-",
      "ที่อยู่ตามทะเบียนบ้าน": s.homeAddress || "-",
      "ชื่อผู้ปกครอง": s.parentName || "-",
      "ความสัมพันธ์": s.parentRelation || "-",
      "เบอร์โทรศัพท์ (ผู้ปกครอง)": s.parentPhone || "-",
      "สาขาเรียน": s.branch || "-",
      "ชื่อย่อสาขา": s.branchCode || "-",
      "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)": s.internY1_711Branch || "-",
      "ตำแหน่งปี 1": s.internY1_Position || "-",
      "ระยะเวลาฝึกงานปี 1": s.internY1_Duration || "-",
      "ชื่อสถานประกอบการฝึกงานปี 2": s.internY2_Company || "-",
      "ตำแหน่งปี2 ": s.internY2_Position || "-",
      "ระยะเวลาฝึกงานปี 2 ": s.internY2_Duration || "-",
      "ชื่อสถานประกอบการฝึกงานปี 3-4": s.internY3_Company || "-",
      "ตำแหน่งปี 3-4": s.internY3_Position || "-",
      "ระยะเวลาฝึกงานปี 3-4": s.internY3_Duration || "-",
      "Final Project": s.finalProject || "-",
      "วันที่เริ่มศึกษา": window.formatThaiDateShort(s.startDate),
      "วันที่จบการศึกษา": window.formatThaiDateShort(s.gradDate),
      "ปีการศึกษาที่จบ": s.batchYear || "-",
      "สถานะการทำงาน": s.jobStatus || "-",
      "วันที่เริ่มงาน": window.formatThaiDateShort(s.jobStartDate),
      "ชือสถานประกอบการที่บรรจุงาน": s.jobCompany || "-",
      "ตำแหน่งงาน": s.jobPosition || "-",
      "สถานะการได้งานจากที่ฝึกงาน": s.jobCurrentStatus || "-",
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
const IMPORT_KEY_MAP = {
  "เลขบัตรประชาชน": ["เลขประจำตัวประชาชน", "เลขบัตรประชาชน", "เลขบัตร", "บัตรประชาชน", "รหัสประจำตัว", "id card", "idcard", "id_card", "รหัสบัตร"],
  "รหัสนักศึกษา": ["รหัสนักศึกษา", "student id", "student_id", "รหัสประจำตัวนิสิต", "รหัสนิสิต"],
  "คำนำหน้า": ["คำนำหน้า", "prefix", "title"],
  "ชื่อจริง_TH": ["ชื่อจริง_TH", "ชื่อ (ไทย)", "ชื่อไทย", "ชื่อ", "name", "name_th", "ชื่อ(ไทย)", "first name", "firstname"],
  "นามสกุล_TH": ["นามสกุล_TH", "นามสกุล (ไทย)", "นามสกุล", "นามสกุลไทย", "surname", "last_name", "lastname", "lastname_th", "นามสกุล(ไทย)"],
  "ชื่อจริง_EN": ["ชื่อจริง_EN", "ชื่อ (อังกฤษ)", "ชื่ออังกฤษ", "name_en", "ชื่อ(อังกฤษ)", "first name en"],
  "นามสกุล_EN": ["นามสกุล_EN", "นามสกุล (อังกฤษ)", "นามสกุลอังกฤษ", "surname_en", "นามสกุล(อังกฤษ)", "last name en"],
  "ชื่อเล่น": ["ชื่อเล่น", "nickname"],
  "เพศ": ["เพศ", "gender", "sex"],
  "วัน/เดือน/ปีเกิด": ["วัน/เดือน/ปีเกิด", "วันเกิด", "birth", "birthdate", "dob", "วันเดือนปีเกิด"],
  "ชื่อย่อสาขา": ["ชื่อย่อสาขา", "รหัสสาขา", "branch code", "branch_code"],
  "สาขาเรียน": ["สาขาเรียน", "สาขาวิชาเรียน", "สาขา", "สาขาวิชา", "หลักสูตร", "branch"],
  "เบอร์โทรศัพท์": ["เบอร์โทรศัพท์", "เบอร์โทร", "เบอร์", "โทรศัพท์", "phone", "tel"],
  "อีเมล": ["อีเมล", "email", "e-mail", "mail"],
  "โรคประจำตัว": ["โรคประจำตัว", "disease", "โรค"],
  "ที่อยู่ปัจจุบัน": ["ที่อยู่ปัจจุบัน", "ที่อยู่", "current address"],
  "ที่อยู่ตามทะเบียนบ้าน": ["ที่อยู่ตามทะเบียนบ้าน", "ทะเบียนบ้าน", "ที่อยู่ตามทะเบียน", "home address"],
  "ชื่อผู้ปกครอง": ["ชื่อผู้ปกครอง", "ชื่อ-สกุล ผู้ปกครอง", "parent name", "ชื่อ-นามสกุล ผู้ปกครอง"],
  "เบอร์โทรศัพท์ (ผู้ปกครอง)": ["เบอร์โทรศัพท์ (ผู้ปกครอง)", "เบอร์โทร ผู้ปกครอง", "เบอร์ผู้ปกครอง", "เบอร์โทรศัพท์ผู้ปกครอง", "parent phone", "โทรศัพท์ผู้ปกครอง"],
  "ความสัมพันธ์": ["ความสัมพันธ์", "relation", "parent relation"],
  "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)": ["ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)", "ปี1 สาขา 7-Eleven", "สาขา 7-11", "สาขา 7-11 ปี 1", "สาขา 7-eleven", "ชื่อย่อสาขาชื่อย่อสาขา"],
  "ตำแหน่งปี 1": ["ตำแหน่งปี 1", "ตำแหน่ง ปี 1", "ตำแหน่งฝึกงานปี 1", "ปี1 ตำแหน่ง"],
  "ระยะเวลาฝึกงานปี 1": ["ระยะเวลาฝึกงานปี 1", "ระยะเวลา ปี 1", "ระยะเวลาฝึกงาน ปี 1", "ปี1 ระยะเวลาฝึกงาน"],
  "ชื่อสถานประกอบการฝึกงานปี 2": ["ชื่อสถานประกอบการฝึกงานปี 2", "ปี2 บริษัท", "บริษัท ปี 2", "บริษัท (ปี2)"],
  "ตำแหน่งปี2 ": ["ตำแหน่งปี2 ", "ตำแหน่งปี2", "ตำแหน่ง ปี 2", "ตำแหน่ง (ปี2)"],
  "ระยะเวลาฝึกงานปี 2 ": ["ระยะเวลาฝึกงานปี 2 ", "ระยะเวลาฝึกงานปี 2", "ระยะเวลา ปี 2", "ระยะเวลาฝึกงาน ปี 2"],
  "ชื่อสถานประกอบการฝึกงานปี 3-4": ["ชื่อสถานประกอบการฝึกงานปี 3-4", "ปี3 บริษัท", "บริษัท ปี 3", "บริษัท (ปี3)", "ปี4 บริษัท", "บริษัท ปี 4", "สถานที่ฝึกงาน", "บริษัท (ปี4)"],
  "ตำแหน่งปี 3-4": ["ตำแหน่งปี 3-4", "ตำแหน่ง ปี 3-4", "ตำแหน่ง ปี 3", "ตำแหน่ง ปี 4", "ตำแหน่งฝึกงาน", "ตำแหน่ง (ปี3)", "ตำแหน่ง (ปี4)"],
  "ระยะเวลาฝึกงานปี 3-4": ["ระยะเวลาฝึกงานปี 3-4", "ระยะเวลา ปี 3-4", "ระยะเวลา ปี 3", "ระยะเวลา ปี 4", "ระยะเวลาฝึกงาน ปี 3-4"],
  "Final Project": ["Final Project", "โครงงานพิเศษ", "โปรเจกต์จบ"],
  "วันที่เริ่มศึกษา": ["วันที่เริ่มศึกษา", "เริ่มศึกษา", "start date"],
  "วันที่จบการศึกษา": ["วันที่จบการศึกษา", "วันจบการศึกษา", "วันจบ", "จบการศึกษา", "วันที่จบ", "grad date"],
  "ปีการศึกษาที่จบ": ["ปีการศึกษาที่จบ", "ปีการศึกษา", "จบปีการศึกษา", "จบปี"],
  "สถานะการทำงาน": ["สถานะการทำงาน", "สถานะ", "status", "job_status"],
  "วันที่เริ่มงาน": ["วันที่เริ่มงาน", "วันที่ได้รับการบรรจุ", "วันที่เริ่มทำงาน", "วันเริ่มงาน", "บรรจุ", "start_date"],
  "ชือสถานประกอบการที่บรรจุงาน": ["ชือสถานประกอบการที่บรรจุงาน", "ชื่อสถานประกอบการ", "ชื่อบริษัทที่ทำงาน", "ชื่อบริษัท", "บริษัทที่ทำ", "บริษัท", "company"],
  "ตำแหน่งงาน": ["ตำแหน่งงาน", "ตำแหน่งที่ทำงาน", "ตำแหน่งงาน", "ตำแหน่ง", "position"],
  "สถานะการได้งานจากที่ฝึกงาน": ["สถานะการได้งานจากที่ฝึกงาน", "สถานะการได้งาน", "สถานะปัจจุบัน", "สถานะการทำงานปัจจุบัน", "current status"],
  "หมายเหตุ": ["หมายเหตุ", "remark", "note", "เพิ่มเติม", "รายละเอียด"]
};

window.autoMapExcelData = function(row) {
  let newRow = {};

  let allAliases = [];
  for (let sk in IMPORT_KEY_MAP) {
    for (let al of IMPORT_KEY_MAP[sk]) {
      allAliases.push({ sk: sk, al: al.toLowerCase().replace(/\s+/g, '') });
    }
  }
  allAliases.sort((a, b) => b.al.length - a.al.length);

  for(let origKey in row) {
    let val = row[origKey];
    if (val !== undefined && val !== null) val = String(val).trim(); else val = "";

    let matchedKey = origKey;
    let cleanOrig = origKey.toLowerCase().replace(/\s+/g, '');

    let found = false;
    for(let standardKey in IMPORT_KEY_MAP) {
      for(let alias of IMPORT_KEY_MAP[standardKey]) {
        let cleanAlias = alias.toLowerCase().replace(/\s+/g, '');
        if(cleanOrig === cleanAlias) {
          matchedKey = standardKey;
          found = true;
          break;
        }
      }
      if(found) break;
    }

    if(!found) {
      for(let item of allAliases) {
        if(item.al.length >= 4 && cleanOrig.includes(item.al)) {
          matchedKey = item.sk;
          break;
        }
      }
    }

    if(["เลขประจำตัวประชาชน", "เบอร์โทรศัพท์", "เบอร์โทร ผู้ปกครอง"].includes(matchedKey)) {
      val = val.replace(/\D/g, "");
    }

    if (["วันจบการศึกษา", "วันที่ได้รับการบรรจุ", "วัน/เดือน/ปีเกิด"].includes(matchedKey)) {
      val = window.formatAndCleanDate(val);
    }

    newRow[matchedKey] = val;
  }
  return newRow;
};

window.handleFileSelect = function(event) { if (event.target.files && event.target.files.length > 0) window.processLocalFile(event.target.files[0]); };
window.handleDrop = function(e) {
  e.preventDefault();
  const dz = document.getElementById('dropZone');
  if (dz) { dz.style.background = 'var(--surface)'; dz.style.borderColor = 'var(--border-hi)'; }
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) window.processLocalFile(e.dataTransfer.files[0]);
};

window.processLocalFile = async function(file) {
  const validExts = [".xlsx", ".xls", ".csv"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!validExts.includes(ext)) return window.showToast("กรุณาเลือกไฟล์ .xlsx, .xls หรือ .csv เท่านั้น", true);
  if (file.size > 5 * 1024 * 1024) return window.showToast("ขนาดไฟล์ต้องไม่เกิน 5MB", true);

  selectedExcelFile = { name: file.name, isDrive: false, file: file };
  const nameElem = document.getElementById("selectedFileName");
  if (nameElem) nameElem.textContent = file.name;
  window.closeAllModals();
  window.openModal("modalImportSettings");
  if(window.lucide) lucide.createIcons();
};

window.confirmImport = async function() {
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
        reader.onload = function(e) {
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

      let idCard = mapped["เลขบัตรประชาชน"];
      let studentId = mapped["รหัสนักศึกษา"];
      let nameTH = mapped["ชื่อจริง_TH"];

      // ข้ามบรรทัดที่ไม่มีข้อมูลสำคัญเลย
      if(!idCard && !studentId && !nameTH) return;

      let st = mapped["สถานะการทำงาน"] || "กำลังศึกษา";

      let gd = window.cleanDate(mapped["วันที่จบการศึกษา"]);
      if(gd === "-") gd = "";

      let js = window.cleanDate(mapped["วันที่เริ่มงาน"]);
      if(js === "-") js = "";

      let bd = window.cleanDate(mapped["วัน/เดือน/ปีเกิด"]);
      if(bd === "-") bd = "";

      let currentSt = mapped["สถานะการได้งานจากที่ฝึกงาน"] || st;

      let dur = mapped["ระยะเวลาได้งานทำ"] || "-";
      if ((!dur || dur === "-") && ["ทำงาน", "ทำงานบริษัท", "ธุรกิจส่วนตัว", "ทำงานอิสระ", "ทำงานแล้ว", "ว่างงาน", "กำลังหางาน"].includes(st) && gd) {
          if(["ทำงาน", "ทำงานบริษัท", "ธุรกิจส่วนตัว", "ทำงานอิสระ", "ทำงานแล้ว"].includes(st) && js) {
               dur = window.calcYMD(gd, js);
          } else if (["ว่างงาน", "กำลังหางาน"].includes(st)) {
               dur = window.calcYMD(gd, new Date().toISOString().split("T")[0]);
          } else { dur = "-"; }
      }

      const payloadObj = {
          studentId: studentId || "-",
          idCard: idCard || `MOCK-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          prefix: mapped["คำนำหน้า"] || "",
          nameTH: nameTH || "ไม่มีชื่อ",
          surnameTH: mapped["นามสกุล_TH"] || "",
          nameEN: mapped["ชื่อจริง_EN"] || "",
          surnameEN: mapped["นามสกุล_EN"] || "",
          nickname: mapped["ชื่อเล่น"] || "",
          gender: mapped["เพศ"] || "",
          birthDate: bd,
          branchCode: mapped["ชื่อย่อสาขา"] || "",
          branch: mapped["สาขาเรียน"] || "ไม่ระบุสาขา",
          faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
          phone: mapped["เบอร์โทรศัพท์"] || "",
          email: mapped["อีเมล"] || "",
          disease: mapped["โรคประจำตัว"] || "",
          currentAddress: mapped["ที่อยู่ปัจจุบัน"] || "",
          homeAddress: mapped["ที่อยู่ตามทะเบียนบ้าน"] || "",
          parentName: mapped["ชื่อผู้ปกครอง"] || "",
          parentPhone: mapped["เบอร์โทรศัพท์ (ผู้ปกครอง)"] || "",
          parentRelation: mapped["ความสัมพันธ์"] || "",
          internY1_711Branch: mapped["ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)"] || "",
          internY1_Position: mapped["ตำแหน่งปี 1"] || "",
          internY1_Duration: mapped["ระยะเวลาฝึกงานปี 1"] || "",
          internY2_Company: mapped["ชื่อสถานประกอบการฝึกงานปี 2"] || "",
          internY2_Position: mapped["ตำแหน่งปี2 "] || "",
          internY2_Duration: mapped["ระยะเวลาฝึกงานปี 2 "] || "",
          internY3_Company: mapped["ชื่อสถานประกอบการฝึกงานปี 3-4"] || "",
          internY3_Position: mapped["ตำแหน่งปี 3-4"] || "",
          internY3_Duration: mapped["ระยะเวลาฝึกงานปี 3-4"] || "",
          finalProject: mapped["Final Project"] || "",
          startDate: window.cleanDate(mapped["วันที่เริ่มศึกษา"]),
          gradDate: gd,
          batchYear: mapped["ปีการศึกษาที่จบ"] || "",
          jobStatus: st,
          jobStartDate: js,
          jobCompany: mapped["ชือสถานประกอบการที่บรรจุงาน"] || "-",
          jobPosition: mapped["ตำแหน่งงาน"] || "-",
          jobDept: "-",
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
      window.showToast("สำเร็จ: " + result.message, false);
      await window.fetchData(true);
    } else {
      window.showToast("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: " + (result?.message || "ไม่ทราบสาเหตุ"), true);
    }
  } catch (error) {
    window.showLoading(false);
    window.showToast("ข้อผิดพลาดในการเชื่อมต่อ: " + error.message, true);
  }
};

window.showToast = function(message, isError = false) {
  const toast = $("toast");
  if (!toast) return;
  toast.innerHTML = (isError ? '<i data-lucide="alert-circle" style="width:20px;height:20px;"></i>' : '<i data-lucide="check-circle" style="width:20px;height:20px;"></i>') + " " + message;
  toast.style.background = isError ? "var(--danger)" : "var(--success)";
  toast.classList.add("show");
  if (window.lucide) lucide.createIcons();
  setTimeout(() => toast.classList.remove("show"), 3500);
};

window.showLoading = function(show, text = "กำลังโหลด...") {
  const loader = $("global-loader");
  const loaderText = $("loader-text");
  if (!loader) return;
  if (loaderText) loaderText.innerText = text;
  if (show) loader.classList.remove("hidden");
  else loader.classList.add("hidden");
};

/**
 * ฟังก์ชันสำหรับเชื่อมต่อและส่งคำขอไปยัง API Web App (Google Apps Script)
 * โดยจะทำการดึงและแนบข้อมูลสิทธิ์เข้าสู่ระบบ (Username & Password) 
 * เข้าไปใน Request Payload แบบ POST โดยอัตโนมัติ เพื่อผ่านระบบความปลอดภัย (Security Guard) ของฝั่ง Backend
 * 
 * @param {Object} [e=null] - Payload ข้อมูลที่ต้องการส่ง หากเป็น null จะใช้คำขอแบบ GET เสมอ
 * @returns {Promise<Object>} ผลลัพธ์ที่ตอบกลับจากเซิร์ฟเวอร์ในรูปแบบ JSON Object
 */
window.callAPI = async function(e = null) {
  if (!API_URL || API_URL.trim() === "" || API_URL.includes("YOUR_DEPLOYMENT_ID")) return { status: "error", message: "กรุณาตั้งค่า API_URL" };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // กำหนด Timeout ไว้ที่ 45 วินาทีเพื่อให้ดึงข้อมูลขนาดใหญ่จาก Google Sheets ได้สำเร็จ
  
  try {
    let requestOptions;
    
    if (e) {
      // 1. ถ้ามีข้อมูลส่งเข้ามา และมีผู้ใช้กำลังล็อกอินอยู่ในระบบ (ยกเว้นคำสั่ง login เองที่ส่งรหัสผ่านตรงๆ มาแล้ว)
      if (typeof e === "object" && currentUser && e.action !== "login") {
        // ดึงรายการผู้ใช้งานท้องถิ่นเพื่อดึงรหัสผ่านที่จับคู่กันมาใช้ในการยืนยันสิทธิ์หลังบ้าน
        const users = window.loadLocalUsers();
        const matchedUser = users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
        if (matchedUser) {
          // แทรกข้อมูลผู้ใช้งานและรหัสผ่านเข้าไปในพารามิเตอร์ส่งออกสำหรับตรวจสิทธิ์
          e.username = currentUser.username;
          e.password = matchedUser.password;
        }
      }
      
      requestOptions = {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(e),
        signal: controller.signal
      };
    } else {
      // สำหรับคำสั่งดึงข้อมูลดั้งเดิม ให้เรียกใช้ GET ตามสถาปัตยกรรมของเซิร์ฟเวอร์
      requestOptions = { method: "GET", signal: controller.signal };
    }
    
    const n = await fetch(API_URL, requestOptions);
    clearTimeout(timeoutId);
    if (!n.ok) return { status: "error", message: "HTTP Error: " + n.status };
    const tx = await n.text();
    try { return JSON.parse(tx); } catch (err) { return { status: "error", message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" }; }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { status: "error", message: "เชื่อมต่อฐานข้อมูลล่าช้า (Timeout)" };
    }
    return { status: "error", message: "เชื่อมต่อไม่ได้: " + err.message };
  }
};

window.doLogin = async function() {
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

  if(btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="spin" style="width:18px;height:18px;"></i> กำลังตรวจสอบ...'; if (window.lucide) lucide.createIcons(); }

  // 1. Check local users first to support offline/default login instantly
  const localUsers = window.loadLocalUsers();
  const localUser = localUsers.find(u => u.username.toLowerCase() === e.toLowerCase() && u.password === t);
  if (localUser) {
    if(btn) { btn.disabled = false; btn.innerHTML = "เข้าสู่ระบบ"; }
    n?.classList.add("hidden");
    currentUser = { username: localUser.username, role: localUser.role || "admin", name: localUser.name || localUser.username };
    localStorage.setItem("alumni_user", JSON.stringify(currentUser));
    
    // Load cached data immediately
    STUDENTS = window.getCachedStudents();
    ORGANIZATIONS = JSON.parse(localStorage.getItem("alumni_orgs") || "[]");
    POSITIONS = JSON.parse(localStorage.getItem("alumni_positions") || "[]");
    
    $("loginPage")?.classList.add("hidden");
    window.initApp();
    window.fetchData(false); // Background fetch (no blocking loader)
    return;
  }

  // 2. Fallback to API if not a local user
  let a = await window.callAPI({ action: "login", username: e, password: t });

  if(btn) { btn.disabled = false; btn.innerHTML = "เข้าสู่ระบบ"; }

  if (a && "success" === a.status) {
    n?.classList.add("hidden");
    currentUser = { username: e, role: a.role, name: a.name };
    localStorage.setItem("alumni_user", JSON.stringify(currentUser));

    // Save to local users list for instant subsequent logins
    try {
      const currentUsers = window.loadLocalUsers();
      if (!currentUsers.some(u => u.username.toLowerCase() === e.toLowerCase() && u.password === t)) {
        currentUsers.push({ username: e, password: t, name: a.name, role: a.role });
        localStorage.setItem("alumni_users", JSON.stringify(currentUsers));
      }
    } catch(err) {}
    
    // Load cached data immediately
    STUDENTS = window.getCachedStudents();
    ORGANIZATIONS = JSON.parse(localStorage.getItem("alumni_orgs") || "[]");
    POSITIONS = JSON.parse(localStorage.getItem("alumni_positions") || "[]");
    
    $("loginPage")?.classList.add("hidden");
    window.initApp();
    window.fetchData(false); // Background fetch (no blocking loader)
  } else {
    if(n) {
      n.innerHTML = `<i data-lucide="x-circle" style="width:20px;height:20px;"></i> ${a?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือการเชื่อมต่อล้มเหลว"}`;
      n.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }
  }
};

window.togglePasswordVisibility = function() {
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

window.toggleAdminPasswordVisibility = function() {
  const p = $("f_adminPassword");
  const i = $("toggleAdminPassword");
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

window.doLogout = function() { currentUser = null; localStorage.removeItem("alumni_user"); $("loginPage")?.classList.remove("hidden"); $("app")?.classList.add("hidden"); if($("inpPass")) $("inpPass").value = ""; STUDENTS = []; ORGANIZATIONS = []; POSITIONS = []; };

document.addEventListener("DOMContentLoaded", () => {
  window.checkSetup(); if(window.lucide) lucide.createIcons();

  if (localStorage.getItem("alumni_user")) {
    try {
      currentUser = JSON.parse(localStorage.getItem("alumni_user"));
      STUDENTS = window.getCachedStudents();
      ORGANIZATIONS = JSON.parse(localStorage.getItem("alumni_orgs") || "[]");
      POSITIONS = JSON.parse(localStorage.getItem("alumni_positions") || "[]");
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

window.getMockData = function() {
  return [];
  // ปิดใช้งานข้อมูล Mock (ระบบใช้เฉพาะข้อมูลจริงเท่านั้น)
  const disabledMockData = [
    {
      idCard: "1100100200301",
      studentId: "6212345678",
      batchYear: "62",
      prefix: "นาย",
      nameTH: "สมชาย",
      surnameTH: "รักดี",
      nameEN: "Somchai",
      surnameEN: "Rakdee",
      nickname: "ชาย",
      gender: "ชาย",
      birthDate: "2543-05-15",
      branchCode: "CAI",
      branch: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์",
      faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
      age: "26",
      phone: "0812345678",
      email: "somchai.rak@mail.com",
      disease: "-",
      currentAddress: "123/45 ถนนแจ้งวัฒนะ นนทบุรี",
      homeAddress: "123/45 ถนนแจ้งวัฒนะ นนทบุรี",
      parentName: "นายรัก ดีงาม",
      parentPhone: "0898765432",
      parentRelation: "บิดา",
      internY1_711Branch: "สาขาธาราพัทยา",
      internY1_711Area: "RE",
      internY1_711EmpID: "123456",
      internY2_Company: "บริษัท จีเอเบิล จำกัด",
      internY2_Position: "Developer",
      internY2_Dept: "IT",
      internY3_Company: "บริษัท เอคเซนเชอร์ จำกัด",
      internY3_Position: "Frontend Dev",
      internY3_Dept: "Technology",
      internY4_Company: "บริษัท เทนเซ็นต์ จำกัด",
      internY4_Position: "Software Engineer",
      internY4_Dept: "Cloud",
      gradDate: "2566-03-15",
      jobStatus: "ทำงานบริษัท",
      jobStartDate: "2566-04-01",
      jobCompany: "Tencent (Thailand)",
      jobPosition: "Software Engineer",
      jobDept: "Engineering",
      jobSalary: 45000,
      jobCurrentStatus: "ยังทำงานอยู่",
      durationToGetJob: "0 ปี 0 เดือน 17 วัน",
      jobRemark: "-"
    },
    {
      idCard: "1100100200302",
      studentId: "6212345679",
      batchYear: "62",
      prefix: "นางสาว",
      nameTH: "ใจดี",
      surnameTH: "เรียนเก่ง",
      nameEN: "Jaidee",
      surnameEN: "Riankeng",
      nickname: "จ๋า",
      gender: "หญิง",
      birthDate: "2543-08-20",
      branchCode: "CYB",
      branch: "การรักษาความมั่นคงปลอดภัยไซเบอร์",
      faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
      age: "26",
      phone: "0823456789",
      email: "jaidee.rian@mail.com",
      disease: "-",
      currentAddress: "55/9 ถนนรามอินทรา กรุงเทพฯ",
      homeAddress: "55/9 ถนนรามอินทรา กรุงเทพฯ",
      parentName: "นางสมศรี เรียนเก่ง",
      parentPhone: "0876543210",
      parentRelation: "มารดา",
      internY1_711Branch: "สาขาแจ้งวัฒนะ",
      internY1_711Area: "RE",
      internY1_711EmpID: "654321",
      internY2_Company: "บริษัท ซีพี ออลล์ จำกัด",
      internY2_Position: "Support",
      internY2_Dept: "IT Security",
      internY3_Company: "ธนาคารกสิกรไทย",
      internY3_Position: "Security Analyst",
      internY3_Dept: "Cyber Security",
      internY4_Company: "ธนาคารไทยพาณิชย์",
      internY4_Position: "Security Engineer",
      internY4_Dept: "Cyber Security",
      gradDate: "2566-03-15",
      jobStatus: "ทำงานบริษัท",
      jobStartDate: "2566-05-10",
      jobCompany: "KASIKORNBANK",
      jobPosition: "Security Engineer",
      jobDept: "IT Security",
      jobSalary: 35000,
      jobCurrentStatus: "ยังทำงานอยู่",
      durationToGetJob: "0 ปี 1 เดือน 25 วัน",
      jobRemark: "-"
    },
    {
      idCard: "1100100200303",
      studentId: "6312345680",
      batchYear: "63",
      prefix: "นาย",
      nameTH: "วิทยา",
      surnameTH: "ประดิษฐ์",
      nameEN: "Witthaya",
      surnameEN: "Pradit",
      nickname: "วิทย์",
      gender: "ชาย",
      birthDate: "2544-12-05",
      branchCode: "RAE",
      branch: "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ",
      faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
      age: "25",
      phone: "0834567890",
      email: "wit.pradit@mail.com",
      disease: "ภูมิแพ้",
      currentAddress: "88 ถนนสุขุมวิท กรุงเทพฯ",
      homeAddress: "88 ถนนสุขุมวิท กรุงเทพฯ",
      parentName: "นายสมเกียรติ ประดิษฐ์",
      parentPhone: "0865432109",
      parentRelation: "บิดา",
      internY1_711Branch: "สาขาพัฒนาการ",
      internY1_711Area: "RE",
      internY1_711EmpID: "112233",
      internY2_Company: "บริษัท ซิสโก้ จำกัด",
      internY2_Position: "Network Intern",
      internY2_Dept: "Network",
      internY3_Company: "บริษัท เอสซีจี จำกัด",
      internY3_Position: "Automation Intern",
      internY3_Dept: "Engineering",
      internY4_Company: "บริษัท ดับบลิวเอชเอ จำกัด",
      internY4_Position: "Robot Control Eng",
      internY4_Dept: "WHA Robot",
      gradDate: "2567-03-15",
      jobStatus: "ทำงานบริษัท",
      jobStartDate: "2567-03-20",
      jobCompany: "SCG Chemicals",
      jobPosition: "Automation Engineer",
      jobDept: "Production",
      jobSalary: 28000,
      jobCurrentStatus: "ยังทำงานอยู่",
      durationToGetJob: "0 ปี 0 เดือน 5 วัน",
      jobRemark: "-"
    },
    {
      idCard: "1100100200304",
      studentId: "6312345681",
      batchYear: "63",
      prefix: "นางสาว",
      nameTH: "กนกวรรณ",
      surnameTH: "มีทอง",
      nameEN: "Kanokwan",
      surnameEN: "Meethong",
      nickname: "กิ๊ฟ",
      gender: "หญิง",
      birthDate: "2544-03-12",
      branchCode: "DIT",
      branch: "เทคโนโลยีดิจิทัลและสารสนเทศ",
      faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
      age: "25",
      phone: "0845678901",
      email: "gift.meethong@mail.com",
      disease: "-",
      currentAddress: "9/99 หมู่บ้านพฤกษา นนทบุรี",
      homeAddress: "9/99 หมู่บ้านพฤกษา นนทบุรี",
      parentName: "นางกนกพร มีทอง",
      parentPhone: "0854321098",
      parentRelation: "มารดา",
      internY1_711Branch: "สาขาตลาดไท",
      internY1_711Area: "RE",
      internY1_711EmpID: "445566",
      internY2_Company: "บริษัท ทรู คอร์ปอเรชั่น จำกัด",
      internY2_Position: "UI Designer",
      internY2_Dept: "Design Team",
      internY3_Company: "บริษัท ทรู คอร์ปอเรชั่น จำกัด",
      internY3_Position: "UX Researcher",
      internY3_Dept: "Product",
      internY4_Company: "บริษัท นนทเวช จำกัด",
      internY4_Position: "System Admin",
      internY4_Dept: "IT Department",
      gradDate: "2567-03-15",
      jobStatus: "ศึกษาต่อ",
      jobStartDate: "",
      jobCompany: "-",
      jobPosition: "-",
      jobDept: "-",
      jobSalary: 0,
      jobCurrentStatus: "กำลังศึกษาต่อไทย",
      durationToGetJob: "-",
      jobRemark: "ต่อปริญญาโท คณะ IT ที่ PIM"
    },
    {
      idCard: "1100100200305",
      studentId: "6412345682",
      batchYear: "64",
      prefix: "นาย",
      nameTH: "อนันต์",
      surnameTH: "ยอดเยี่ยม",
      nameEN: "Anan",
      surnameEN: "Yodyiam",
      nickname: "เปี๊ยก",
      gender: "ชาย",
      birthDate: "2545-10-10",
      branchCode: "CAI",
      branch: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์",
      faculty: "คณะวิศวกรรมศาสตร์และเทคโนโลยี",
      age: "24",
      phone: "0856789012",
      email: "anan.yod@mail.com",
      disease: "-",
      currentAddress: "22/1 ซอยอารีย์ กรุงเทพฯ",
      homeAddress: "22/1 ซอยอารีย์ กรุงเทพฯ",
      parentName: "นายอำนาจ ยอดเยี่ยม",
      parentPhone: "0843210987",
      parentRelation: "บิดา",
      internY1_711Branch: "สาขาลาดพร้าว 101",
      internY1_711Area: "RE",
      internY1_711EmpID: "778899",
      internY2_Company: "บริษัท เมทัลเทค จำกัด",
      internY2_Position: "IT Support",
      internY2_Dept: "Support",
      internY3_Company: "บริษัท ดิจิตอลเวฟ จำกัด",
      internY3_Position: "Backend Dev",
      internY3_Dept: "Dev",
      internY4_Company: "บริษัท ดิจิตอลเวฟ จำกัด",
      internY4_Position: "Node.js Developer",
      internY4_Dept: "Dev",
      gradDate: "2568-03-15",
      jobStatus: "ว่างงาน",
      jobStartDate: "",
      jobCompany: "-",
      jobPosition: "-",
      jobDept: "-",
      jobSalary: 0,
      jobCurrentStatus: "กำลังหางาน",
      durationToGetJob: "0 ปี 4 เดือน 0 วัน",
      jobRemark: "เตรียมสมัครงาน Software House"
    }
  ];
};

/**
 * ดึงข้อมูลรายชื่อนักศึกษาจาก API Web App (Google Apps Script Backend)
 * และจัดการจัดกลุ่มความถูกต้องสถานะการทำงาน ล้างฟอร์แมตข้อมูล และนำไปเก็บในตัวแปรหลัก STUDENTS และ LocalStorage
 * 
 * @param {boolean} [e=false] - กำหนดให้เป็น true เพื่อบังคับแสดงหน้าต่าง Loading Spinner (ใช้เวลาเกิดเหตุการณ์ผู้ใช้กด Manual Refresh)
 * @returns {Promise<void>}
 */
window.fetchData = async function(e = false) {
  // ระบบป้องกันการส่ง Request ซ้ำซ้อนขณะกำลังดึงข้อมูล (Concurrency Lock)
  if (isFetching) return; 
  isFetching = true;

  if (e || STUDENTS.length === 0) window.showLoading(true, "กำลังอัปเดตข้อมูลล่าสุด...");

  // เรียกใช้ API ขาเข้า
  const t = await window.callAPI();

  if (e || STUDENTS.length === 0) window.showLoading(false);
  isFetching = false;

  // ตรวจเช็คเมื่อตอบกลับสำเร็จ และมี data array ครบถ้วน
  if (t && "success" === t.status && (Array.isArray(t.data) || Array.isArray(t.students))) {
    const rawList = t.students || t.data;
    let fetchedData = rawList.map((e) => {
      // 1. ทำความสะอาดข้อมูลวันที่จบและวันเริ่มทำงานให้เหลือเฉพาะรูปแบบสากล YYYY-MM-DD
      const gradDate = window.cleanDate(e["gradDate"] || e["วันจบการศึกษา"] || e["วันที่จบการศึกษา"]), 
            jobStartDate = window.cleanDate(e["jobStartDate"] || e["วันที่เริ่มงาน"] || e["วันที่ได้รับการบรรจุ"]);
            
      // 2. วิเคราะห์และแมปข้อมูล 'สถานะการทำงาน' ที่เป็นตัวอักษรภาษาไทยหลากหลายประเภทให้เข้ากับประเภทหลัก
      let rawStatus = window.getVal(e, "jobStatus") || window.getVal(e, "สถานะการทำงาน") || "กำลังศึกษา";
      let jobStatus = "กำลังศึกษา";
      let jobCurrentStatus = "กำลังศึกษาอยู่";

      if(rawStatus.includes("ทำงาน") || rawStatus.includes("พนักงาน") || rawStatus.includes("บริษัท")) { 
        jobStatus = "ทำงานบริษัท"; 
        jobCurrentStatus = "ยังทำงานอยู่"; 
      }
      else if(rawStatus.includes("ส่วนตัว") || rawStatus.includes("ฟรีแลนซ์") || rawStatus.includes("อิสระ")) { 
        jobStatus = "ทำงานอิสระ"; 
        jobCurrentStatus = "ประกอบธุรกิจส่วนตัว"; 
      }
      else if(rawStatus.includes("ศึกษาต่อ")) { 
        jobStatus = "ศึกษาต่อ"; 
        jobCurrentStatus = "กำลังศึกษาต่อไทย"; 
      }
      else if(rawStatus.includes("ว่าง") || rawStatus.includes("หางาน")) { 
        jobStatus = "ว่างงาน"; 
        jobCurrentStatus = "กำลังหางาน"; 
      }
      else if(rawStatus.includes("ครอบครัว")) { 
        jobStatus = "อื่นๆ"; 
        jobCurrentStatus = "ช่วยธุรกิจครอบครัว"; 
      }
      else if(rawStatus.includes("ทหาร") || rawStatus.includes("บวช") || rawStatus.includes("ภารกิจ") || rawStatus.includes("สุขภาพ")) { 
        jobStatus = "อื่นๆ"; 
        jobCurrentStatus = "ติดทหาร"; 
      }
      else if(rawStatus.includes("ดรอป") || rawStatus.includes("พัก")) { 
        jobStatus = "ดรอปเรียน"; 
        jobCurrentStatus = "ดรอปเรียน / ลาพัก"; 
      }
      else if(rawStatus.includes("ออก") || rawStatus.includes("ย้าย")) { 
        jobStatus = "อื่นๆ"; 
        jobCurrentStatus = "ลาออก"; 
      }
      else if(rawStatus.includes("พ้นสภาพ") || rawStatus.includes("ไม่จบ")) { 
        jobStatus = "พ้นสภาพ"; 
        jobCurrentStatus = "พ้นสภาพ / ไม่จบการศึกษา"; 
      }
      else if(rawStatus.includes("รอ") || rawStatus.includes("อนุมัติ")) { 
        jobStatus = "อื่นๆ"; 
        jobCurrentStatus = "รออนุมัติจบ"; 
      }

      // 3. คำนวณระยะเวลาหางาน (Duration) อิงตามเงื่อนไขสถานะ
      let calculatedDuration = window.getVal(e, "durationToGetJob") || window.getVal(e, "ระยะเวลาได้งานทำ");
      if (["ทำงานบริษัท", "ทำงานอิสระ"].includes(jobStatus) || (jobStatus === "อื่นๆ" && jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) {
          if (gradDate && jobStartDate) calculatedDuration = window.calcYMD(gradDate, jobStartDate);
      } else if (["ว่างงาน", "กำลังหางาน"].includes(jobStatus) && gradDate) {
          calculatedDuration = window.calcYMD(gradDate, new Date().toISOString().split("T")[0]);
      } else if (!calculatedDuration) {
          calculatedDuration = "-";
      }

      // 4. ดึงข้อมูลปีรุ่น (Batch Code) จากตัวเลข 2 หลักแรกของรหัสนักศึกษา เช่น 6412345682 => รหัสรุ่น 64
      let stId = window.getVal(e, "studentId") || window.getVal(e, "รหัสนักศึกษา") || "-";
      let batchCode = window.getVal(e, "batchYear") || window.getVal(e, "ปีการศึกษาที่จบ") || "";
      if (!batchCode) {
          let idMatch = stId.match(/^(\d{2})/);
          if (idMatch) {
              batchCode = idMatch[1];
          }
      }
      if (!batchCode) {
          batchCode = "ไม่ระบุ";
      }

      // ส่งกลับโครงสร้าง Object มาตรฐานของ Student
      return {
        idCard: (window.getVal(e, "idCard") || window.getVal(e, "เลขบัตรประชาชน") || window.getVal(e, "เลขประจำตัวประชาชน")).replace(/\D/g, ""),
        studentId: stId,
        batchYear: batchCode,
        prefix: window.getVal(e, "prefix") || window.getVal(e, "คำนำหน้า"), 
        nameTH: window.getVal(e, "nameTH") || window.getVal(e, "ชื่อจริง_TH") || window.getVal(e, "ชื่อ (ไทย)"), 
        surnameTH: window.getVal(e, "surnameTH") || window.getVal(e, "นามสกุล_TH") || window.getVal(e, "นามสกุล (ไทย)"), 
        nameEN: window.getVal(e, "nameEN") || window.getVal(e, "ชื่อจริง_EN") || window.getVal(e, "ชื่อ (อังกฤษ)"),
        surnameEN: window.getVal(e, "surnameEN") || window.getVal(e, "นามสกุล_EN") || window.getVal(e, "นามสกุล (อังกฤษ)"), 
        nickname: window.getVal(e, "nickname") || window.getVal(e, "ชื่อเล่น"), 
        gender: window.getVal(e, "gender") || window.getVal(e, "เพศ"), 
        birthDate: window.cleanDate(e["birthDate"] || e["วัน/เดือน/ปีเกิด"]), 
        branchCode: window.getVal(e, "branchCode") || window.getVal(e, "ชื่อย่อสาขา") || window.getVal(e, "รหัสสาขา"),
        branch: window.getVal(e, "branch") || window.getVal(e, "สาขาเรียน") || window.getVal(e, "สาขา"), 
        faculty: window.getVal(e, "faculty") || window.getVal(e, "คณะ"), 
        age: window.getVal(e, "age") || window.getVal(e, "อายุ"), 
        phone: window.getVal(e, "phone") || window.getVal(e, "เบอร์โทรศัพท์"), 
        email: window.getVal(e, "email") || window.getVal(e, "อีเมล"), 
        disease: window.getVal(e, "disease") || window.getVal(e, "โรคประจำตัว"),
        currentAddress: window.getVal(e, "currentAddress") || window.getVal(e, "ที่อยู่ปัจจุบัน"), 
        homeAddress: window.getVal(e, "homeAddress") || window.getVal(e, "ที่อยู่ตามทะเบียนบ้าน"), 
        parentName: window.getVal(e, "parentName") || window.getVal(e, "ชื่อผู้ปกครอง") || window.getVal(e, "ชื่อ-สกุล ผู้ปกครอง"), 
        parentPhone: window.getVal(e, "parentPhone") || window.getVal(e, "เบอร์โทรศัพท์ (ผู้ปกครอง)") || window.getVal(e, "เบอร์โทร ผู้ปกครอง"),
        parentRelation: window.getVal(e, "parentRelation") || window.getVal(e, "ความสัมพันธ์"), 
        internY1_711Branch: window.getVal(e, "internY1_711Branch") || window.getVal(e, "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)") || window.getVal(e, "ปี1 สาขา 7-Eleven"), 
        internY1_Position: window.getVal(e, "internY1_Position") || window.getVal(e, "ตำแหน่งปี 1"), 
        internY1_Duration: window.getVal(e, "internY1_Duration") || window.getVal(e, "ระยะเวลาฝึกงานปี 1"), 
        internY2_Company: window.getVal(e, "internY2_Company") || window.getVal(e, "ชื่อสถานประกอบการฝึกงานปี 2") || window.getVal(e, "ปี2 บริษัท"), 
        internY2_Position: window.getVal(e, "internY2_Position") || window.getVal(e, "ตำแหน่งปี2 ") || window.getVal(e, "ปี2 ตำแหน่ง"), 
        internY2_Duration: window.getVal(e, "internY2_Duration") || window.getVal(e, "ระยะเวลาฝึกงานปี 2 ") || window.getVal(e, "ปี2 ระยะเวลาฝึกงาน"), 
        internY3_Company: window.getVal(e, "internY3_Company") || window.getVal(e, "ชื่อสถานประกอบการฝึกงานปี 3-4") || window.getVal(e, "ปี3 บริษัท"),
        internY3_Position: window.getVal(e, "internY3_Position") || window.getVal(e, "ตำแหน่งปี 3-4") || window.getVal(e, "ปี3 ตำแหน่ง"), 
        internY3_Duration: window.getVal(e, "internY3_Duration") || window.getVal(e, "ระยะเวลาฝึกงานปี 3-4") || window.getVal(e, "ปี3 ระยะเวลาฝึกงาน"), 
        finalProject: window.getVal(e, "finalProject") || window.getVal(e, "Final Project"),
        startDate: window.cleanDate(e["startDate"] || e["วันที่เริ่มศึกษา"]),
        gradDate, 
        jobStatus, 
        jobStartDate, 
        jobCompany: window.getVal(e, "jobCompany") || window.getVal(e, "ชือสถานประกอบการที่บรรจุงาน") || window.getVal(e, "ชื่อบริษัทที่ทำงาน") || "-", 
        jobPosition: window.getVal(e, "jobPosition") || window.getVal(e, "ตำแหน่งงาน") || window.getVal(e, "ตำแหน่งที่ทำงาน") || "-",
        jobDept: window.getVal(e, "jobDept") || window.getVal(e, "แผนกที่ทำงาน") || "-", 
        jobSalary: parseFloat(e["jobSalary"] || e["เงินเดือน (บาท)"]) || 0, 
        jobCurrentStatus: window.getVal(e, "jobCurrentStatus") || window.getVal(e, "สถานะการได้งานจากที่ฝึกงาน") || jobCurrentStatus, 
        durationToGetJob: calculatedDuration, 
        jobRemark: window.getVal(e, "jobRemark") || window.getVal(e, "หมายเหตุ") || "-",
        profileImage: window.getVal(e, "profileImage") || window.getVal(e, "รูปโปรไฟล์") || ""
      };
    });

    STUDENTS = fetchedData;
    ORGANIZATIONS = t.organizations || [];
    POSITIONS = t.positions || [];

    // รีเซ็ต Statistics Page เพื่อให้ filter ถูก rebuild ด้วยข้อมูลใหม่
    STAT_INITIALIZED = false;

    // เก็บลง Cache LocalStorage เพื่อเพิ่มประสิทธิภาพความเร็วและสามารถใช้งาน Offline ได้
    // ⚠️ ต้องตัด profileImage (base64) ออกก่อนเก็บ เพราะ localStorage มี quota จำกัด 5MB
    // ถ้าเก็บ base64 ทั้งหมดจะเกิน quota ทำให้ QuotaExceededError และ crash
    try {
      const cacheableStudents = STUDENTS.map(s => { 
        const { profileImage, ...rest } = s;
        return rest;
      });
      localStorage.setItem("alumni_data", JSON.stringify(cacheableStudents));
      localStorage.setItem("alumni_orgs", JSON.stringify(ORGANIZATIONS));
      localStorage.setItem("alumni_positions", JSON.stringify(POSITIONS));
    } catch(quotaErr) {
      // ถ้า localStorage เต็ม ก็ข้ามการ cache ไปก่อน ไม่ให้ crash
      console.warn("localStorage quota exceeded, skipping cache:", quotaErr);
      localStorage.removeItem("alumni_data");
    }
    window.updateDashboardAndTable(); 
    if (e) window.showToast("อัปเดตข้อมูลล่าสุดแล้ว", false);
  } else {
    // กรณีติดต่อ API ไม่สำเร็จ ให้พยายามใช้ข้อมูลจาก LocalStorage
    if (STUDENTS.length === 0) {
      STUDENTS = window.getCachedStudents();
      window.updateDashboardAndTable();
    }
    // แสดง toast ข้อผิดพลาดในทุกกรณีเพื่อให้รู้ว่า API มีปัญหา
    const errMsg = t?.message || "เชื่อมต่อฐานข้อมูลล้มเหลว";
    window.showToast(`⚠️ ${errMsg} (ใช้ข้อมูลล่าสุดในเครื่อง)`, true);
  }
};

window.updateDashboardAndTable = function() {
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

  if ("dash" === currentPage) window.renderDash(); if ("students" === currentPage) window.renderTable(); if ("statistics" === currentPage) window.renderStatistics();
};

window.initApp = function() {
  $("app")?.classList.remove("hidden");

  if($("sideNav")) {
      $("sideNav").innerHTML = [
        { id: "dash", icon: "layout-dashboard", label: "ภาพรวมระบบ" }, 
        { id: "students", icon: "users", label: "ฐานข้อมูลนักศึกษา" },
        { id: "orgs", icon: "building-2", label: "ฐานข้อมูลองค์กร" },
        { id: "positions", icon: "briefcase", label: "ตำแหน่งงานที่เปิดรับ" },
        { id: "statistics", icon: "bar-chart-3", label: "สถิตินักศึกษา" }
      ].map(e => `<a href="#${e.id}" class="nav-item${e.id === currentPage ? " active" : ""}" onclick="window.navTo('${e.id}'); return false;"><div class="nav-icon"><i data-lucide="${e.icon}"></i></div><span class="nav-label">${e.label}</span></a>`).join("");
  }
  if(window.lucide) lucide.createIcons(); window.initFacultyFilters(); window.updateDashboardAndTable(); window.navTo("dash");
};

window.navTo = function(e) {
  currentPage = e;
  document.querySelectorAll(".nav-item").forEach(t => t.classList.toggle("active", t.getAttribute("onclick") === `window.navTo('${e}'); return false;`));
  ["dash", "students", "orgs", "positions", "statistics"].forEach(t => { if ($("page" + t.charAt(0).toUpperCase() + t.slice(1))) $("page" + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle("hidden", t !== e); });

  const titles = { dash: "ภาพรวมระบบสำหรับผู้บริหาร", students: "ฐานข้อมูลนักศึกษา", orgs: "ฐานข้อมูลองค์กร", positions: "ตำแหน่งงานที่เปิดรับ", statistics: "สถิตินักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยี" };
  if($("topbarTitle")) $("topbarTitle").textContent = titles[e];
  if($("topbarSub")) {
    const updated = `ข้อมูลปรับปรุงล่าสุด: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`;
    if (currentUser) {
      const label = currentUser.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ชม";
      $("topbarSub").textContent = `${currentUser.name || currentUser.username} • ${label} • ${updated}`;
    } else {
      $("topbarSub").textContent = updated;
    }
  }

  const isAdm = currentUser?.role === "admin";
  if ($("topAddBtn")) $("topAddBtn").classList.toggle("hidden", !(e === "students" && isAdm));
  if ($("topImportBtn")) $("topImportBtn").classList.toggle("hidden", !(e === "students" && isAdm));
  if ($("topSyncPhotosBtn")) $("topSyncPhotosBtn").classList.toggle("hidden", !(e === "students" && isAdm));
  if ($("topExportBtn")) $("topExportBtn").classList.toggle("hidden", e !== "students");

  if (e === "dash") window.renderDash();
  if (e === "students") window.renderTable();
  if (e === "orgs") window.renderOrgsTable();
  if (e === "positions") window.renderPositionsTable();
  if (e === "statistics") window.renderStatistics();
};


window.initFacultyFilters = function() {
  filterFac = "ทั้งหมด";
  filterBr = "ทั้งหมด";
  filterBrId = "ทั้งหมด";

  const sel = $("branchFilter");
  if(sel) {
    let h = `<option value="ทั้งหมด" data-id="ทั้งหมด" style="color:var(--primary); font-weight:800;">ทุกสาขาวิชา</option>`;
    FACULTY_DATA["คณะวิศวกรรมศาสตร์และเทคโนโลยี"].forEach(b => {
      h += `<option value="${b.name}" data-id="${b.id}" style="color:var(--text-bold);">${b.id} ${b.name}</option>`;
    });
    sel.innerHTML = h;
  }
  window.updateDashboardAndTable();
};

window.setFilterBr = function(e, t) {
  filterBrId = e;
  filterBr = t;
  const sel = $("branchFilter");
  if (sel) { sel.style.color = t === 'ทั้งหมด' ? 'var(--primary)' : 'var(--text-bold)'; }
  currentTablePage = 1;
  window.updateDashboardAndTable();
};

window.setFilterStatus = function(e) {
  filterStatus = e;
  const sel = $("statusFilter");
  if (sel) { sel.style.color = e === 'ทั้งหมด' ? 'var(--primary)' : 'var(--text-bold)'; }
  currentTablePage = 1;
  window.renderTable();
};

window.getFilteredStudents = function() {
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

window.filterDashCompanies = function(){
  const si=document.getElementById("dashCompanySearch");
  if(!si)return;
  dashCompanyPage = 1;
  const q=si.value.toLowerCase().trim();
  const it=document.querySelectorAll(".dash-company-item");
  let f=0;
  it.forEach(i=>{
    if(i.getAttribute("data-name").includes(q)){
      i.style.display="flex";f++;
    }else{
      i.style.display="none";
    }
  });
  const em=document.getElementById("dashCompanyEmpty");
  if(em){
    if(f===0&&it.length>0)em.classList.remove("hidden");
    else em.classList.add("hidden");
  }
};

window.renderDash = function() {
  const e = $("pageDash");
  let dashStudents = STUDENTS;
  
  let isMockData = false;

  if (dashYear) dashStudents = dashStudents.filter(s => String(s.batchYear) === dashYear);

  const yearsSet = isMockData ? ["2567", "2566", "2565", "2564", "2563", "2562", "2561"] : [...new Set(STUDENTS.map(s => s.batchYear))].filter(Boolean).sort().reverse();
  const yearOptions = '<option value="" style="color:#047857; font-weight:800;">ทุกรหัส</option>' + yearsSet.map(y => `<option value="${y}" ${dashYear === String(y) ? 'selected' : ''} style="color:var(--text-bold);">รหัส ${y}</option>`).join("");

  const filterUI = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; background: var(--surface); padding: 20px 24px; border-radius: var(--r-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border); align-items: center;">
      <div style="display:flex; align-items:center; gap:12px; min-width:220px;">
        <i data-lucide="filter" style="width:20px; color: var(--primary);"></i>
        <div>
          <div style="font-size: 15px; font-weight: 700; color: var(--text-bold);">กรองข้อมูลสถิติภาพรวม</div>
          <div style="font-size: 13px; color: var(--text-muted);">เลือกปีที่ต้องการวิเคราะห์ข้อมูล</div>
        </div>
      </div>
      <select id="dashYearFilter" name="dashYearFilter" class="filter-select" aria-label="กรองตามรหัส" onchange="dashYear = this.value; this.style.color = this.value === '' ? '#047857' : 'var(--text-bold)'; window.renderDash();" style="min-width: 200px; color: ${dashYear === '' ? '#047857' : 'var(--text-bold)'}; padding: 10px 16px;">
        ${yearOptions}
      </select>
      <div style="display:flex; justify-content:flex-end; align-items:center; min-width:180px; font-size: 14px; color: #047857; font-weight: 700; background: var(--primary-soft); padding: 10px 16px; border-radius: var(--r-pill);">
        ${isMockData ? 'ข้อมูลตัวอย่าง: ' : 'วิเคราะห์จาก '} ${dashStudents.length} คน
      </div>
    </div>
  `;

  if (dashStudents.length === 0) {
      const msg = STUDENTS.length === 0 
        ? "ยังไม่มีข้อมูลนักศึกษาในระบบ กรุณาอัปโหลดไฟล์ Excel หรือเพิ่มข้อมูลนักศึกษาใหม่" 
        : "ไม่พบข้อมูลนักศึกษาในเงื่อนไขที่เลือก";
      e.innerHTML = filterUI + `<div class="empty-state" style="margin-top:40px;"><i data-lucide="bar-chart-3" class="empty-icon" style="width:80px;height:80px;"></i><div style="font-size:18px; font-weight:700;">${msg}</div></div>`;
      if(window.lucide) lucide.createIcons();
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
  let earlyEmployCount = 0;
  employed.forEach(e => {
      if (e.gradDate && e.jobStartDate && e.gradDate !== "-" && e.jobStartDate !== "-") {
          const t = new Date(e.gradDate), n = new Date(e.jobStartDate);
          if (!isNaN(t) && !isNaN(n)) {
              let diffTime = 0;
              if (n >= t) {
                  diffTime = Math.abs(n - t);
              } else {
                  earlyEmployCount++;
              }
              u += diffTime; m++;
              const diffDays = Math.floor(diffTime / 86400000);
              if (fastestJob === null || diffDays < fastestJob) { fastestJob = diffDays; }
          }
      }
  });
  let g = "0 วัน"; 
  if (m > 0) { 
      if (earlyEmployCount === m) {
          g = "ได้งานก่อนเรียนจบ";
      } else {
          const d = Math.floor((u / m) / 86400000);
          const yr = Math.floor(d / 365);
          const mo = Math.floor((d % 365) / 30);
          const dy = Math.floor((d % 365) % 30); 
          let ta = []; 
          if (yr > 0) ta.push(`${yr} ปี`); 
          if (mo > 0) ta.push(`${mo} เดือน`); 
          if (dy > 0) ta.push(`${dy} วัน`); 
          g = ta.length ? ta.join(" ") : "0 วัน"; 
      }
  }
  let fastestText = fastestJob !== null ? `${fastestJob} วัน` : "-";

  let h = [...new Set(grads.map(x => x.batchYear))].filter(Boolean).sort().slice(-7);
  let f = h.map(y => grads.filter(t => String(t.batchYear) === String(y)).length);
  let b = h.map(y => employed.filter(t => String(t.batchYear) === String(y)).length);
  if (isMockData) {
    h = ["2561", "2562", "2563", "2564", "2565", "2566", "2567"];
    f = [10, 12, 11, 14, 12, 13, 14];
    b = [7, 9, 8, 11, 9, 11, 13];
  }

  const E = {}; dashStudents.forEach(e => { const t = e.branch && e.branch !== "-" ? e.branch + (e.branchCode ? ` (${e.branchCode})` : "") : "ไม่ระบุสาขา"; if (!E[t]) E[t] = { total: 0, emp: 0 }; E[t].total++; if (["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) E[t].emp++; });
  const topBranch = Object.entries(E).sort((a, b) => b[1].total - a[1].total)[0]?.[0] || "-";
  const avgJobTimeText = g || "-";

  let C = [];
  if (employed.length > 0) {
      const cObj = {};
      employed.forEach(t => {
          let rawName = (t.jobCompany && t.jobCompany.trim() !== "" && t.jobCompany.trim() !== "-") ? t.jobCompany.trim() : "ธุรกิจส่วนตัว / ฟรีแลนซ์";
          if(t.jobStatus === "อื่นๆ" && t.jobCurrentStatus === "ช่วยธุรกิจครอบครัว") rawName = "ธุรกิจครอบครัว";
          if (rawName === "ธุรกิจส่วนตัว / ฟรีแลนซ์" || rawName === "ธุรกิจครอบครัว") return;

          const key = rawName.toUpperCase();
          if(!cObj[key]) cObj[key] = { name: rawName, count: 0 };
          cObj[key].count++;
      });
      C = Object.values(cObj).sort((a, b) => b.count - a.count);
  }

  const mockNotice = isMockData ? `
    <div style="background: #fef3c7; color: #b45309; border: 1px solid rgba(217,119,6,0.2); padding: 12px 18px; border-radius: var(--r-md); margin-bottom: 20px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;" class="fade-in">
      <i data-lucide="info" style="width: 18px; height: 18px;"></i>
      <span>ระบบกำลังแสดงข้อมูลสถิติตัวอย่าง (Mock Data) เนื่องจากยังไม่มีการอัปโหลดหรือเพิ่มข้อมูลในระบบ</span>
    </div>
  ` : '';

  const getMetricFontSize = (val) => {
    const str = String(val || "");
    if (str.length > 25) return '19px';
    if (str.length > 15) return '23px';
    return '34px';
  };

  let dashboardContent = mockNotice + `

    <div class="exec-summary fade-in">
      <div class="exec-summary-icon"><i data-lucide="pie-chart" style="width:40px;height:40px;"></i></div>
      <div class="exec-summary-text" style="width: 100%;">
        <h3 style="margin-bottom: 6px;">ภาพรวมสถิตินักศึกษา</h3>
        <p style="font-size: 15px; opacity: 0.9;">สำเร็จการศึกษาแล้ว ${totalGrads} คน จากทั้งหมด ${total} คน</p>

        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 20px; background:rgba(255,255,255,0.05); padding:16px 20px; border-radius:16px; width:100%; border: 1px solid rgba(255,255,255,0.1); box-sizing: border-box;">
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:5px;">
            <div style="color:#4ade80; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">ได้งานทำ</div>
            <div style="color:white; font-size:22px; font-weight:800; line-height:1.1;">${p_working}%</div>
            <div style="color:rgba(255,255,255,0.55); font-size:12px; font-weight:500;">${employed.length} คน</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:5px;">
            <div style="color:#60a5fa; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">กำลังศึกษา</div>
            <div style="color:white; font-size:22px; font-weight:800; line-height:1.1;">${p_current}%</div>
            <div style="color:rgba(255,255,255,0.55); font-size:12px; font-weight:500;">${current.length} คน</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:5px;">
            <div style="color:#facc15; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">ว่างงาน</div>
            <div style="color:white; font-size:22px; font-weight:800; line-height:1.1;">${p_unemployed}%</div>
            <div style="color:rgba(255,255,255,0.55); font-size:12px; font-weight:500;">${unemployed.length} คน</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:5px;">
            <div style="color:#a78bfa; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">ศึกษาต่อ</div>
            <div style="color:white; font-size:22px; font-weight:800; line-height:1.1;">${p_studyFurther}%</div>
            <div style="color:rgba(255,255,255,0.55); font-size:12px; font-weight:500;">${furtherStudy.length} คน</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:5px;">
            <div style="color:#f87171; font-size:11px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase;">พ้นสภาพ</div>
            <div style="color:white; font-size:22px; font-weight:800; line-height:1.1;">${p_dropout}%</div>
            <div style="color:rgba(255,255,255,0.55); font-size:12px; font-weight:500;">${dropouts.length} คน</div>
          </div>
        </div>
      </div>
    </div>
    <div class="grid-dash-bottom fade-in">
      <div class="card">
        <div class="card-header">สัดส่วนสถานะนักศึกษาทั้งหมด</div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px;padding:16px 24px;">${[
          { l: "ทำงานแล้ว (รวมฟรีแลนซ์)", n: employed.length, c: "var(--success)", fn: "window.viewDashStatus('ทำงาน')" },
          { l: "ศึกษาต่อ (รวมต่างประเทศ)", n: furtherStudy.length, c: "var(--accent)", fn: "window.viewDashStatus('ศึกษาต่อ')" },
          { l: "กำลังศึกษาอยู่", n: current.length, c: "var(--info)", fn: "window.viewDashStatus('กำลังศึกษา')" },
          { l: "อยู่ระหว่างหางาน / ว่างงาน", n: unemployed.length, c: "var(--warning)", fn: "window.viewDashStatus('ว่างงาน')" }
          ].map((e) => {
            const d = total ? Math.round((e.n / total) * 100) : 0;
            return `
            <div class="clickable-item branch-stat-item" style="padding: 12px 16px; margin: 0; border-radius: var(--r-md);" onclick="${e.fn}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:${e.c}; display:inline-block; flex-shrink:0;"></span>
                  <span style="font-size:14.5px; font-weight:700; color:var(--text-bold);">${e.l}</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:14.5px; font-weight:800; color:var(--text-bold);">${e.n} <span style="font-size:12px; font-weight:500; color:var(--text-muted);">คน</span></span>
                  <span style="font-size:13px; font-weight:800; color:${e.c}; background:var(--bg); padding:2px 8px; border-radius:99px; min-width:46px; text-align:center; border: 1px solid var(--border);">${d}%</span>
                  <span class="click-hint" style="padding:2px 6px; font-size:11px;"><i data-lucide="mouse-pointer-click" style="width:12px;"></i></span>
                </div>
              </div>
              <div style="height:5px; background:var(--bg); border-radius:99px; overflow:hidden;">
                <div style="width:${d}%; height:100%; background:${e.c}; border-radius:99px; transition: width 0.5s ease;"></div>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>

      <div class="card">
        <div class="card-header">กราฟจำนวนนักศึกษาแยกตามสาขา</div>
        <div class="card-body"><div class="chart-wrapper" style="height:320px;"><canvas id="branchChart"></canvas></div></div>
      </div>

      <div class="card">
        <div class="card-header">กราฟแนวโน้มการรับเข้าทำงานย้อนหลัง ${h.length} รุ่น</div>
        <div class="card-body"><div class="chart-wrapper" style="height:320px;"><canvas id="trendChart"></canvas></div></div>
      </div>
    </div>
  `;

  e.innerHTML = filterUI + dashboardContent;
  if(window.lucide) lucide.createIcons();

  if (window.Chart) {
    if (window.trendChartInst) window.trendChartInst.destroy();
    if (window.branchChartInst) window.branchChartInst.destroy();

    const branchLabels = Object.keys(E);
    const branchData = branchLabels.map(k => E[k].total);
    if ($("branchChart") && branchLabels.length) {
      window.branchChartInst = new Chart($("branchChart"), {
          type: "bar",
          data: { 
            labels: branchLabels.map(l => l.length > 15 ? l.substring(0,15)+"..." : l), 
            datasets: [{ 
              label: "จำนวนนักศึกษา (คน)", 
              data: branchData, 
              backgroundColor: ['#10b981', '#3b82f6', '#f97316', '#a855f7'], 
              borderRadius: 6 
            }] 
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins:{ 
              legend: { display: false },
              tooltip: {
                titleFont: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' },
                bodyFont: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' },
                padding: 12
              }
            }, 
            scales: { 
              y: { 
                beginAtZero: true, 
                ticks: { 
                  stepSize: 2, 
                  precision: 0, 
                  font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' } 
                },
                title: {
                  display: true,
                  text: 'จำนวนคน (คน)',
                  font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' }
                }
              }, 
              x: { 
                ticks: { 
                  font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' } 
                } 
              } 
            } 
          }
      });
    }

    if ($("trendChart") && h.length) {
        window.trendChartInst = new Chart($("trendChart"), {
            type: "line",
            data: { 
              labels: h.map((e) => `รหัส ${e}`), 
              datasets: [
                { 
                  label: "ผู้สำเร็จการศึกษาทั้งหมด", 
                  data: f, 
                  borderColor: "#475569", 
                  borderWidth: 4,
                  fill: false, 
                  tension: 0.4, 
                  pointRadius: 7,
                  pointHoverRadius: 10,
                  pointBackgroundColor: "#475569"
                }, 
                { 
                  label: "ผู้ได้งานทำ", 
                  data: b, 
                  borderColor: "#16a34a", 
                  backgroundColor: "rgba(22, 163, 74, 0.15)", 
                  borderWidth: 5, 
                  fill: true, 
                  tension: 0.4, 
                  pointRadius: 8,
                  pointHoverRadius: 12,
                  pointBackgroundColor: "#16a34a"
                }
              ] 
            },
            options: { 
              responsive: true, 
              maintainAspectRatio: false, 
              plugins:{ 
                legend: { 
                  position: 'bottom', 
                  labels: { 
                    boxWidth: 24,
                    padding: 20,
                    font: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' } 
                  } 
                },
                tooltip: {
                  titleFont: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' },
                  bodyFont: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' },
                  padding: 12
                }
              }, 
              scales: { 
                y: { 
                  beginAtZero: true, 
                  ticks: { 
                    stepSize: 2, 
                    precision: 0, 
                    font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' } 
                  },
                  title: {
                    display: true,
                    text: 'จำนวนคน (คน)',
                    font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' }
                  }
                }, 
                x: { 
                  ticks: { 
                    font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' } 
                  } 
                } 
              } 
            }
        });
    }
  }
};

window.getStudentAvatarHtml = function(s, size, fontSize, className) {
  const sz = size || "40px";
  const fSz = fontSize || "14px";
  const initials = ((s.nameTH || "?").charAt(0) + (s.surnameTH || "").charAt(0)).toUpperCase() || "?";
  let imgUrl = s.profileImage || "";
  
  if (!imgUrl && s.studentId) {
    if (window.LOCAL_IMAGE_CONFIG && window.LOCAL_IMAGE_CONFIG.enabled) {
      imgUrl = window.LOCAL_IMAGE_CONFIG.folderPath + s.studentId + window.LOCAL_IMAGE_CONFIG.extension;
    } else if (window.CLOUDFLARE_CONFIG && window.CLOUDFLARE_CONFIG.enabled) {
      imgUrl = "https://imagedelivery.net/" + window.CLOUDFLARE_CONFIG.accountHash + "/" + s.studentId + "/public";
    }
  }

  const clsAttr = className ? ' class="' + className + '"' : '';

  if (imgUrl) {
    return '<img src="' + window.esc(imgUrl) + '"' + clsAttr + ' style="width:' + sz + '; height:' + sz + '; border-radius:50%; object-fit:cover; border:2px solid var(--border-hi); flex-shrink:0;" onerror="this.style.display=\'none\'; if(this.nextElementSibling) this.nextElementSibling.style.display=\'flex\';"><div' + clsAttr + ' style="display:none; width:' + sz + '; height:' + sz + '; border-radius:50%; background:var(--border); align-items:center; justify-content:center; font-size:' + fSz + '; font-weight:800; color:var(--text-muted); flex-shrink:0;">' + initials + '</div>';
  } else {
    return '<div' + clsAttr + ' style="width:' + sz + '; height:' + sz + '; border-radius:50%; background:var(--border); display:flex; align-items:center; justify-content:center; font-size:' + fSz + '; font-weight:800; color:var(--text-muted); flex-shrink:0;">' + initials + '</div>';
  }
};


window.renderTable = function() {
  const o = window.getFilteredStudents();

  if ($("rowCount")) $("rowCount").textContent = `พบ ${o.length} คน`;
  const isAdmin = currentUser && "admin" === currentUser.role,
        tbody = $("studentTbody"),
        empty = $("emptyState"),
        table = document.querySelector(".table-wrap table"),
        studentSummary = $("studentSummary");
  let tableWrap = document.querySelector(".table-wrap");

  const oldPagination = document.querySelector(".pagination-container");
  if(oldPagination) oldPagination.remove();

  if (!o.length) { tbody.innerHTML = ""; empty.classList.remove("hidden"); table.classList.add("hidden"); return; }
  empty.classList.add("hidden"); table.classList.remove("hidden");

  const totalPages = Math.ceil(o.length / itemsPerPage);
  if (currentTablePage > totalPages) currentTablePage = totalPages;
  if (currentTablePage < 1) currentTablePage = 1;

  const currentCount = o.filter(s => ["กำลังศึกษา"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(s.jobCurrentStatus))).length;
  const employedCount = o.filter(s => ["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && s.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")).length;
  const studyCount = o.filter(s => ["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(s.jobCurrentStatus))).length;
  const unemployedCount = o.filter(s => ["ว่างงาน", "กำลังหางาน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["กำลังหางาน", "เตรียมสอบราชการ", "เตรียมศึกษาต่อ"].includes(s.jobCurrentStatus))).length;
  const dropoutCount = o.filter(s => ["พ้นสภาพ", "ไม่จบการศึกษา", "ดรอปเรียน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(s.jobCurrentStatus))).length;
  const activeStatuses = o.filter(s => ["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน", "ช่วยธุรกิจครอบครัว", "ศึกษาต่อ", "ศึกษาต่อต่างประเทศ", "กำลังศึกษา", "ว่างงาน", "กำลังหางาน", "พ้นสภาพ", "ไม่จบการศึกษา", "ดรอปเรียน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && s.jobCurrentStatus));
  const totalSalary = o.reduce((sum, s) => sum + (Number(s.jobSalary) || 0), 0);
  const avgSalary = employedCount ? Math.round(totalSalary / employedCount) : 0;
  const durationDays = o.map(s => {
      if (!s.durationToGetJob || typeof s.durationToGetJob !== 'string') return null;
      const m = s.durationToGetJob.match(/(\d+)/);
      return m ? Number(m[1]) : null;
  }).filter(Boolean);
  const avgDuration = durationDays.length ? Math.round(durationDays.reduce((a, b) => a + b, 0) / durationDays.length) : 0;

  if (studentSummary) {
      studentSummary.style.display = "none";
  }

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
    if(formattedPhone && formattedPhone.length === 10) formattedPhone = formattedPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

    const avatarHtml = window.getStudentAvatarHtml(e, "40px", "14px");
    return `<tr class="fade-in" onclick="window.openDetail('${window.esc(e.idCard)}')">
      <td style="color:var(--text-muted);font-weight:800;text-align:center;font-size:15px;">${startIndex + t + 1}</td>
      <td>
        <div style="font-weight:800; color:var(--primary); font-size:16.5px;">${window.esc(e.studentId)}</div>
        <div style="font-size:13.5px; color:var(--text-muted); font-weight:700; margin-top:2px;">รุ่นปี ${window.esc(e.batchYear)}</div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          ${avatarHtml}
          <div style="display:flex;flex-direction:column;">
            <div style="font-weight:800;font-size:16.5px;color:var(--text-bold);display:flex;align-items:center;">${window.esc(e.prefix)}${window.esc(e.nameTH)} ${window.esc(e.surnameTH)} </div>
            <div style="font-size:14px;color:var(--text-muted);margin-top:2px;font-weight:600;">เลขบัตร ปชช: ${window.esc(e.idCard)}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:nowrap;">
          ${e.branchCode?'<span style="font-size:12.5px;font-weight:800;color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:6px;">'+window.esc(e.branchCode)+"</span>":""}
          <span style="font-size:15px;font-weight:700;">${window.esc(e.branch||"")}</span>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:14.5px;">
        <div style="font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:4px;"><i data-lucide="phone" style="width:14px;height:14px;"></i> ${window.esc(formattedPhone)}</div>
        <div style="font-weight:600;display:flex;align-items:center;gap:6px;"><i data-lucide="mail" style="width:14px;height:14px;"></i> ${window.esc(e.email)}</div>
      </td>
      <td>
        <div style="margin-bottom: 6px;">${stLabel || `<span class="badge ${window.jcBadge(e.jobStatus, e.jobCurrentStatus)}"><i data-lucide="${icn}"></i> ${window.esc(stLabelText)}</span>`}</div>
        ${n}
      </td>
      <td>
        <div style="font-size:15.5px;font-weight:800;color:var(--text-bold);">${window.esc(e.jobCompany||"-")}</div>
        <div style="font-size:14px;color:var(--text-muted);margin:2px 0;font-weight:600;">${window.esc(e.jobPosition||"-")}</div>
        <div style="font-size:15px;font-weight:800;color:var(--success);"><i data-lucide="coins" style="width:14px;display:inline-block;vertical-align:text-bottom;"></i> ${window.fmtMoney(e.jobSalary)}</div>
      </td>
      <td onclick="event.stopPropagation()">
        <div class="td-actions" style="justify-content:center;">
          ${isAdmin ? `<button aria-label="View" class="btn btn-outline btn-sm" onclick="window.openDetail('${window.esc(e.idCard)}')"><i data-lucide="eye" style="width:14px;"></i> ดูข้อมูล</button> <button aria-label="Edit" class="btn btn-outline btn-sm" onclick="window.openEdit('${window.esc(e.idCard)}')"><i data-lucide="edit-2" style="width:14px;"></i> แก้ไข</button> <button aria-label="Delete" class="btn btn-danger btn-sm" onclick="window.openConfirmDel('${window.esc(e.idCard)}')"><i data-lucide="trash-2" style="width:14px;"></i> ลบออก</button>` : `<button aria-label="View" class="btn btn-outline btn-sm" onclick="window.openDetail('${window.esc(e.idCard)}')"><i data-lucide="eye" style="width:14px;"></i> ดูข้อมูล</button>`}
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
  if(window.lucide) lucide.createIcons();
};

window.viewDashStatus = function(e) {
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

window.viewDashBranch = function(e) {
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

window.renderGroupList = function() {
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
  const years = Object.keys(byYear).sort((a,b) => b - a);

  let html = "";
  if(filtered.length === 0) html = '<div class="empty-state" style="padding:64px;"><i data-lucide="search-x" style="width:80px;height:80px; margin-bottom:24px;"></i><div style="font-size:20px;">ไม่พบข้อมูลนักศึกษาในหมวดหมู่นี้</div></div>';
  years.forEach(y => {
    html += `<div class="list-group-header"><i data-lucide="users-2" style="width:24px;margin-right:12px;"></i> รหัส ${window.esc(y)} <span style="font-size:16px; opacity:0.8; font-weight:600; margin-left:16px; background:rgba(0,0,0,0.05); padding:4px 12px; border-radius:12px;">รวม ${byYear[y].length} คน</span></div>`;
    const byBranch = {};
    byYear[y].forEach(e => { const b = (e.branch || "ไม่ระบุสาขา") + (e.branchCode ? ` (${e.branchCode})` : ""); if(!byBranch[b]) byBranch[b] = []; byBranch[b].push(e); });
    Object.keys(byBranch).sort().forEach(b => {
      html += `<div class="list-branch-header"><i data-lucide="graduation-cap" style="width:20px;"></i> สาขา: ${window.esc(b)} <span style="color:var(--text-muted);font-size:15px;margin-left:8px;">(${byBranch[b].length} คน)</span></div>`;
      byBranch[b].forEach(e => {
        let jobContext = window.currentGroupLabel ? window.currentGroupLabel(e) : "";
        let subText = ["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว") ? `ตำแหน่ง: ${window.esc(e.jobPosition)} @ ${window.esc(e.jobCompany)}` : `อีเมล: ${window.esc(e.email)}`;

        let stLabelText = e.jobStatus === "อื่นๆ" && e.jobCurrentStatus ? e.jobCurrentStatus : e.jobStatus;
        let badgeStyle = "color:var(--text-muted); background:var(--bg);";
        if(["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) { badgeStyle = "color:var(--success); background:var(--success-soft);"; stLabelText = "ทำงาน"; }
        else if(["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(e.jobCurrentStatus))) badgeStyle = "color:var(--accent); background:var(--accent-soft);";
        else if(["กำลังศึกษา"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(e.jobCurrentStatus))) badgeStyle = "color:var(--info); background:var(--info-soft);";
        else if(e.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(e.jobCurrentStatus)) badgeStyle = "color:#D97706; background:#FEF3C7;";
        else if(["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(e.jobCurrentStatus))) badgeStyle = "color:var(--danger); background:var(--danger-soft);";

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
  if(window.lucide) lucide.createIcons();
};

window.openGroupModal = function(title, icon, dataList, customLabelFn = null) {
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

window.openCompany = function(cName) {
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
  const posSummary = Object.entries(posCount).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `<span style="font-weight:600;">${k}</span> <span style="color:var(--success); font-weight:700;">(${v})</span>`).join('<span style="color:rgba(255,255,255,0.4); margin:0 8px;">|</span>');

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

window.renderCompanyList = function() {
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
  if(filteredEmployed.length === 0 && filteredIntern.length === 0) {
      html = '<div class="empty-state" style="padding:64px;"><i data-lucide="search-x" style="width:80px;height:80px;"></i><div style="font-size:20px;">ไม่พบข้อมูลนักศึกษา</div></div>';
  }

  const renderGroup = (arr, title, badgeColor, badgeText) => {
      if(arr.length === 0) return '';
      let groupHtml = `<div class="list-group-header"><i data-lucide="users-2" style="width:20px;margin-right:8px;"></i> ${title} <span style="font-size:14px; opacity:0.8; font-weight:600; margin-left:12px; background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:6px;">รวม ${arr.length} คน</span></div>`;

      const byYear = {};
      arr.forEach(e => { const y = e.batchYear || "ไม่ระบุ"; if (!byYear[y]) byYear[y] = []; byYear[y].push(e); });
      const years = Object.keys(byYear).sort((a,b) => b - a);

      years.forEach(y => {
        groupHtml += `<div class="list-branch-header" style="color:var(--text-bold);"><i data-lucide="calendar" style="width:18px;"></i> รหัสรุ่น: ${window.esc(y)}</div>`;
        const byBranch = {};
        byYear[y].forEach(e => { const b = (e.branch || "ไม่ระบุสาขา") + (e.branchCode ? ` (${e.branchCode})` : ""); if(!byBranch[b]) byBranch[b] = []; byBranch[b].push(e); });

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
  if(window.lucide) lucide.createIcons();
};

window.openDetail = function(e) {
  const t = STUDENTS.find(s => String(s.idCard) === String(e)); if (!t) return;

  let badgeColor = "var(--seek)";
  if(["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && t.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) badgeColor = "var(--success)";
  else if(["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && ["กำลังศึกษาต่อไทย", "กำลังศึกษาต่อตปท", "กำลังเตรียมตัวสอบ"].includes(t.jobCurrentStatus))) badgeColor = "var(--accent)";
  else if(["กำลังศึกษา"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && ["รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(t.jobCurrentStatus))) badgeColor = "var(--info)";
  else if(t.jobStatus === "อื่นๆ" && ["ติดทหาร", "ปัญรักษาสุขภาพ"].includes(t.jobCurrentStatus)) badgeColor = "var(--warning)";
  else if(["ไม่จบการศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(t.jobStatus) || (t.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา"].includes(t.jobCurrentStatus))) badgeColor = "var(--danger)";

  const a = currentUser && "admin" === currentUser.role;
  const stLabelText = t.jobStatus === "อื่นๆ" && t.jobCurrentStatus ? t.jobCurrentStatus : t.jobStatus;

  // สร้าง Avatar สำหรับ header ของ modal รายละเอียดนักศึกษา
  const avatarForDetail = window.getStudentAvatarHtml(t, "80px", "28px", "detail-avatar");

  const hd = document.getElementById("detailHeader");
  if (hd) {
    hd.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px; flex:1; min-width:0;">
        ${avatarForDetail}
        <div style="min-width:0;">
          <h2 style="margin-top:0; font-size:22px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${window.esc(t.prefix + t.nameTH + " " + t.surnameTH)}</h2>
          <div class="sub" style="font-size:14px; font-weight:500; margin-top:2px;">${window.esc(t.nameEN + " " + t.surnameEN)} · รหัสนักศึกษา: <span style="color:var(--primary); font-weight:700;">${window.esc(t.studentId)}</span></div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
        <span class="badge" style="background:${badgeColor};color:#fff;padding:8px 16px;font-size:13.5px;box-shadow:var(--shadow-sm); font-weight:700; border-radius:8px;">${window.esc(stLabelText)}</span>
        <button type="button" class="close-btn" aria-label="ปิด" onclick="window.closeAllModals()" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; padding:6px; border-radius:6px; transition: all 0.2s;"><i data-lucide="x" style="width:24px;height:24px;"></i></button>
      </div>`;
  }

  const i = (lbl, val, sp = !1) => `<div class="detail-field${sp ? " span-2" : ""}"><label>${lbl}</label><p>${window.esc(val || "-")}</p></div>`;
  const r = (lbl, icn, cont) => `<div class="form-category-card" style="box-shadow: var(--shadow-sm); border:1px solid var(--border); margin-bottom: 24px;"><div class="cat-header" style="padding: 16px 24px; font-size: 16px; border-radius: 12px 12px 0 0;"><i data-lucide="${icn}" style="width:20px;height:20px;"></i> ${lbl}</div><div class="cat-body detail-grid" style="padding: 24px;">${cont}</div></div>`;

  if ($("detailFooter")) $("detailFooter").style.display = 'none';

  const bd = document.getElementById("detailBody");
  if (bd) {
    bd.innerHTML = `
      ${r("1. ข้อมูลส่วนบุคคลและการศึกษา", "user", i("รหัสนักศึกษา", t.studentId, !0) + i("เลขบัตรประชาชน", t.idCard) + i("รหัสสาขา", t.branchCode) + i("สาขาเรียน", t.branch, !0) + i("ชื่อเล่น", t.nickname) + i("เพศ", t.gender) + i("วันเกิด", window.formatThaiDateShort(t.birthDate)) + i("โรคประจำตัว", t.disease, !0) + i("โทรศัพท์", t.phone) + i("อีเมล", t.email) + i("วันที่เริ่มศึกษา", window.formatThaiDateShort(t.startDate)) + i("ปีการศึกษาที่จบ", t.batchYear) + i("หัวข้อโครงงานพิเศษ (Final Project)", t.finalProject, !0) + i("ที่อยู่ปัจจุบัน", t.currentAddress, !0) + i("ที่อยู่ทะเบียนบ้าน", t.homeAddress, !0))}

      ${r("2. ข้อมูลผู้ปกครอง", "users", i("ชื่อผู้ปกครอง", t.parentName, !0) + i("ความสัมพันธ์", t.parentRelation) + i("โทรศัพท์", t.parentPhone))}

      ${r("3. ประวัติการฝึกงาน / สหกิจศึกษา (WBL)", "building-2", `
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 16px;">
          <div style="font-size: 16.5px; font-weight: 800; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="pin" style="width:18px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 1 : ฝึกงาน 7-Eleven</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("ชื่อสถานประกอบการ", t.internY1_711Branch, !0)}
            ${i("ตำแหน่งปี 1", t.internY1_Position)}
            ${i("ระยะเวลาฝึกงานปี 1", t.internY1_Duration)}
          </div>
        </div>
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 16px;">
          <div style="font-size: 16.5px; font-weight: 800; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="briefcase" style="width:18px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 2 : ฝึกงานวิชาชีพ</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("ชื่อสถานประกอบการ", t.internY2_Company, !0)}
            ${i("ตำแหน่งปี 2", t.internY2_Position)}
            ${i("ระยะเวลาฝึกงานปี 2", t.internY2_Duration)}
          </div>
        </div>
        <div style="grid-column: span 2; background: transparent; padding: 0; margin-bottom: 0;">
          <div style="font-size: 16.5px; font-weight: 800; color: var(--text-bold); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);"><i data-lucide="award" style="width:18px;display:inline-block;vertical-align:text-bottom;margin-right:6px; color:var(--primary);"></i> ปี 3-4 : ฝึกงานวิชาชีพ / สหกิจศึกษา (Co-op)</div>
          <div class="detail-grid" style="gap: 16px 24px;">
            ${i("ชื่อสถานประกอบการ", t.internY3_Company, !0)}
            ${i("ตำแหน่งปี 3-4", t.internY3_Position)}
            ${i("ระยะเวลาฝึกงานปี 3-4", t.internY3_Duration)}
          </div>
        </div>
      `)}

      ${r("4. สถานะปัจจุบัน", "briefcase", i("วันที่จบการศึกษา", window.formatThaiDateShort(t.gradDate)) + i("วันที่เริ่มงาน", window.formatThaiDateShort(t.jobStartDate)) + i("บริษัท / องค์กร", t.jobCompany) + i("ที่ตั้งบริษัท", t.jobCompanyAddress) + i("เบอร์ติดต่อบริษัท", t.jobCompanyPhone) + i("ตำแหน่ง", t.jobPosition) + i("อัตราเงินเดือน", window.fmtMoney(t.jobSalary)) + i("สถานะงาน", t.jobCurrentStatus) + i("เวลาที่ใช้หางาน (นับจากจบ)", t.durationToGetJob) + i("หมายเหตุเพิ่มเติม", t.jobRemark || "-", !0))}
    `;
  }
  if(window.lucide) lucide.createIcons();
  window.openModal("modalDetail");
};

window.getFormHTML = function() {
  // สร้าง initials จากชื่อนักศึกษาสำหรับ Avatar Placeholder
  const initials = ((formData.nameTH || "?").charAt(0) + (formData.surnameTH || "").charAt(0)).toUpperCase() || "?";
  // ถ้ามีรูปโปรไฟล์เก่าอยู่แล้ว ให้แสดงรูปนั้น; ถ้าไม่มีให้แสดงตัวอักษร
  let formProfileImgUrl = formData.profileImage || "";
  if (!formProfileImgUrl && formData.studentId) {
    if (window.LOCAL_IMAGE_CONFIG && window.LOCAL_IMAGE_CONFIG.enabled) {
      formProfileImgUrl = `${window.LOCAL_IMAGE_CONFIG.folderPath}${formData.studentId}${window.LOCAL_IMAGE_CONFIG.extension}`;
    } else if (window.CLOUDFLARE_CONFIG && window.CLOUDFLARE_CONFIG.enabled) {
      formProfileImgUrl = `https://imagedelivery.net/${window.CLOUDFLARE_CONFIG.accountHash}/${formData.studentId}/public`;
    }
  }

  const avatarHTML = formProfileImgUrl
    ? `<img class="profile-avatar-img" id="profilePreview" src="${window.esc(formProfileImgUrl)}" alt="รูปโปรไฟล์" onerror="const initials='${initials}'; const ph = document.createElement('div'); ph.id='profilePreview'; ph.className='profile-avatar-placeholder'; ph.textContent=initials; this.replaceWith(ph); const btn = document.getElementById('profileRemoveBtn'); if(btn) btn.classList.remove('visible');">`
    : `<div class="profile-avatar-placeholder" id="profilePreview">${initials}</div>`;
  return `
  <!-- ══ 0. อัปโหลดรูปโปรไฟล์ ══ -->
  <div style="grid-column: span 2; display: flex; flex-direction: column; align-items: center; gap: 16px; background: var(--surface); padding: 24px; border: 1px solid var(--border); border-radius: 16px; margin-bottom: 8px;">
    <!-- โซนลากวางรูปภาพอย่างเดียว (ไม่เปิดเบราว์เซอร์เมื่อคลิกที่ว่าง) -->
    <div class="profile-upload-zone" id="profileUploadZone" ondragover="event.preventDefault(); this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.handleProfileFileDrop(event.dataTransfer.files[0])" style="width: 100%; border: 2px dashed var(--border-hi); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: default; background: var(--bg); margin: 0;">
      <div class="profile-avatar-wrap" onclick="document.getElementById('f_profileImageFile').click()" style="cursor: pointer;">
        ${avatarHTML}
        <div class="profile-upload-badge"><i data-lucide="camera"></i></div>
      </div>
      <div class="profile-upload-hint">
        <strong>รูปโปรไฟล์นักศึกษา</strong>
        <span>ลากรูปภาพมาวางที่นี่เพื่ออัปโหลด</span><br>
        <span>รองรับ JPG, PNG, WEBP ขนาดสูงสุด 5 MB</span>
      </div>
    </div>
    
    <!-- ปุ่มควบคุมแยกออกมาด้านล่าง เพื่อให้กดง่ายและชัดเจน -->
    <div style="display: flex; gap: 12px; justify-content: center; width: 100%;">
      <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('f_profileImageFile').click()" style="padding: 10px 20px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
        <i data-lucide="upload" style="width: 16px; height: 16px;"></i> เลือกรูปภาพ
      </button>
      <button type="button" class="btn btn-danger btn-sm profile-remove-btn${formProfileImgUrl ? ' visible' : ''}" id="profileRemoveBtn" onclick="window.removeProfileImage()" style="padding: 10px 20px; font-weight: 700; align-items: center; gap: 8px;">
        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i> ลบรูปภาพ
      </button>
    </div>
    <!-- hidden input รับไฟล์จากดิสก์ (ไม่แสดงผลในฟอร์ม) -->
    <input type="file" id="f_profileImageFile" accept="image/*" style="display:none" onchange="window.handleProfileFileSelect(this.files[0])">
    <!-- hidden text input เก็บ base64 สำหรับส่งไป API -->
    <input type="hidden" id="f_profileImage" name="profileImage" value="${window.esc(formData.profileImage || '')}">
  </div>

  <div class="form-category-card" id="sec-personal"><div class="cat-header"><i data-lucide="user"></i> 1. ข้อมูลส่วนบุคคลและการศึกษา</div><div class="cat-body form-grid"><div class="form-sub-header"><i data-lucide="graduation-cap"></i> ข้อมูลการศึกษา</div><div class="form-group span-2" style="background:var(--primary-soft);padding:24px;border-radius:12px;border:1px solid rgba(5,150,105,0.2);margin-bottom:0;"><label style="margin-top:0;">รหัสนักศึกษา <span class="required-indicator">*</span></label><input type="text" id="f_studentId" name="studentId" placeholder="10 หลัก (เช่น 6752300852)" maxlength="10" style="font-size:16px; font-weight:700;" oninput="this.value=this.value.replace(/[^0-9]/g,''); if(this.value.length>=2){let p=this.value.substring(0,2); document.getElementById('f_batchYear').value=p;}"></div><div class="form-group"><label>รหัสรุ่น (Batch) <span class="required-indicator">*</span></label><input type="text" id="f_batchYear" name="batchYear" placeholder="เช่น 67" maxlength="2" readonly></div><div class="form-group"><label>เลขบัตรประชาชน <span class="required-indicator">*</span></label><input type="text" id="f_idCard" name="idCard" placeholder="13 หลัก" maxlength="13" oninput="this.value=this.value.replace(/[^0-9]/g,'')"></div><input type="hidden" id="f_faculty" name="faculty" value="คณะวิศวกรรมศาสตร์และเทคโนโลยี"><div class="form-group span-2" style="background:var(--bg);padding:24px;border-radius:12px;border:1px solid var(--border);margin-bottom:0;"><label style="margin-top:0;">สาขาวิชา <span class="required-indicator">*</span></label><div id="form-branch-btns" style="display:flex;flex-wrap:wrap;gap:8px;"></div><input type="hidden" id="f_branch" name="branch"></div><div class="form-group span-2"><label>รหัสสาขา</label><input type="text" id="f_branchCode" name="branchCode" readonly placeholder="เลือกระบุสาขาด้านบนเพื่อเติมรหัสอัตโนมัติ"></div><div class="form-sub-header" style="margin-top:16px;"><i data-lucide="user-circle"></i> ข้อมูลส่วนบุคคล</div><div class="form-group"><label>คำนำหน้า</label><select id="f_prefix" name="prefix"><option value="">เลือก</option><option>นาย</option><option>นางสาว</option></select></div><div class="form-group"><label>เพศ</label><select id="f_gender" name="gender"><option value="">เลือก</option><option>ชาย</option><option>หญิง</option></select></div><div class="form-group"><label>ชื่อจริง (ไทย) <span class="required-indicator">*</span></label><input type="text" id="f_nameTH" name="nameTH"></div><div class="form-group"><label>นามสกุล (ไทย) <span class="required-indicator">*</span></label><input type="text" id="f_surnameTH" name="surnameTH"></div><div class="form-group"><label>ชื่อจริง (อังกฤษ)</label><input type="text" id="f_nameEN" name="nameEN"></div><div class="form-group"><label>นามสกุล (อังกฤษ)</label><input type="text" id="f_surnameEN" name="surnameEN"></div><div class="form-group"><label>ชื่อเล่น</label><input type="text" id="f_nickname" name="nickname"></div><div class="form-group"><label>วันเกิด</label><input type="date" id="f_birthDate" name="birthDate"></div><div class="form-group span-2"><label>โรคประจำตัว</label><input type="text" id="f_disease" name="disease" placeholder="หากไม่มีให้เว้นว่างไว้"></div><div class="form-sub-header" style="margin-top:16px;"><i data-lucide="map-pin"></i> ข้อมูลติดต่อ</div><div class="form-group"><label>เบอร์โทรศัพท์ <span class="required-indicator">*</span></label><input type="tel" id="f_phone" name="phone" placeholder="08xxxxxxxx (10 หลัก)" maxlength="10" oninput="this.value=this.value.replace(/[^0-9]/g,'')"></div><div class="form-group"><label>อีเมล</label><input type="email" id="f_email" name="email" placeholder="email@example.com"></div><div class="form-group span-2"><label>ที่อยู่ปัจจุบัน</label><input type="text" id="f_currentAddress" name="currentAddress" placeholder="บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์"></div><div class="form-group span-2"><label>ที่อยู่ทะเบียนบ้าน</label><input type="text" id="f_homeAddress" name="homeAddress" placeholder="บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์"></div><div class="form-group"><label>วันที่เริ่มศึกษา</label><input type="date" id="f_startDate" name="startDate"></div><div class="form-group span-2"><label>หัวข้อโครงงานพิเศษ (Final Project)</label><input type="text" id="f_finalProject" name="finalProject" placeholder="ระบุหัวข้อโครงงานวิจัย/พัฒนา..."></div></div></div>

  <div class="form-category-card" id="sec-parents"><div class="cat-header"><i data-lucide="users"></i> 2. ข้อมูลผู้ปกครอง</div><div class="cat-body form-grid"><div class="form-group span-2"><label>ชื่อ-สกุลผู้ปกครอง</label><input id="f_parentName" name="parentName" placeholder="ระบุ ชื่อ-นามสกุล"></div><div class="form-group"><label>โทรศัพท์ผู้ปกครอง</label><input type="tel" id="f_parentPhone" name="parentPhone" placeholder="10 หลัก" maxlength="10" oninput="this.value=this.value.replace(/[^0-9]/g,'')"></div><div class="form-group"><label>ความสัมพันธ์</label><select id="f_parentRelation" name="parentRelation"><option value="">เลือกความสัมพันธ์</option><option>บิดา</option><option>มารดา</option><option>พี่ชาย</option><option>น้องชาย</option><option>พี่สาว</option><option>น้องสาว</option><option>ปู่/ย่า/ตา/ยาย</option><option>อื่นๆ</option></select></div></div></div>

  <div class="form-category-card" id="sec-intern"><div class="cat-header"><i data-lucide="building-2"></i> 3. ประวัติการฝึกงาน / สหกิจศึกษา (WBL)</div><div class="cat-body form-grid"><div class="form-note note-yellow span-2" style="justify-content:center; padding:12px; font-size:15px;"><i data-lucide="pin" style="width:20px;height:20px;"></i> ปี 1 : ฝึกงาน 7-Eleven</div><div class="form-group span-2"><label>ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)</label><input type="text" id="f_internY1_711Branch" name="internY1_711Branch" placeholder="สาขา 7-Eleven..."></div><div class="form-group"><label>ตำแหน่งปี 1</label><input type="text" id="f_internY1_Position" name="internY1_Position" placeholder="ตำแหน่งปี 1..."></div><div class="form-group"><label>ระยะเวลาฝึกงานปี 1</label><input type="text" id="f_internY1_Duration" name="internY1_Duration" placeholder="ระยะเวลาฝึกงาน..."></div><div class="divider"></div><div class="form-sub-header"><i data-lucide="briefcase"></i> ปี 2 : ฝึกงานวิชาชีพ</div><div class="form-group span-2"><label>ชื่อสถานประกอบการฝึกงานปี 2</label><input type="text" id="f_internY2_Company" name="internY2_Company" placeholder="บริษัทปี 2..."></div><div class="form-group"><label>ตำแหน่งปี 2</label><input type="text" id="f_internY2_Position" name="internY2_Position" placeholder="ตำแหน่งปี 2..."></div><div class="form-group"><label>ระยะเวลาฝึกงานปี 2</label><input type="text" id="f_internY2_Duration" name="internY2_Duration" placeholder="ระยะเวลาฝึกงาน..."></div><div class="divider"></div><div class="form-sub-header"><i data-lucide="award"></i> ปี 3-4 : ฝึกงานวิชาชีพ / สหกิจศึกษา (Co-op)</div><div class="form-group span-2"><label>ชื่อสถานประกอบการฝึกงานปี 3-4</label><input type="text" id="f_internY3_Company" name="internY3_Company" placeholder="บริษัทปี 3-4..."></div><div class="form-group"><label>ตำแหน่งปี 3-4</label><input type="text" id="f_internY3_Position" name="internY3_Position" placeholder="ตำแหน่งปี 3-4..."></div><div class="form-group"><label>ระยะเวลาฝึกงานปี 3-4</label><input type="text" id="f_internY3_Duration" name="internY3_Duration" placeholder="ระยะเวลาฝึกงาน..."></div></div></div>

  <div class="form-category-card" id="sec-job">
    <div class="cat-header"><i data-lucide="briefcase"></i> 4. สถานะปัจจุบัน </div>
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

window.openAddForm = function() {
  editingIdCard = null; hasAttemptedSave = false;
  try { formData = JSON.parse(localStorage.getItem("alumni_draft")) || {}; } catch { formData = {}; }
  window.renderForm("เพิ่มข้อมูลนักศึกษาใหม่"); window.openModal("modalForm");
};

window.openEdit = function(e, t = null) {
  editingIdCard = e; hasAttemptedSave = false; const n = STUDENTS.find((s) => String(s.idCard) === String(e));
  if (n) {
    formData = { ...n };
    formData.birthDate = window.thaiStrToDateInput(formData.birthDate);
    formData.startDate = window.thaiStrToDateInput(formData.startDate);
    formData.gradDate = window.thaiStrToDateInput(formData.gradDate);
    formData.jobStartDate = window.thaiStrToDateInput(formData.jobStartDate);
    window.renderForm("แก้ไขข้อมูลนักศึกษา"); window.openModal("modalForm");
  }
};

window.renderForm = function(e) {
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

  window.renderFormFacultyButtons();
  if(window.lucide) lucide.createIcons();
  window.toggleJobFields();

  // เรียก initProfileUpload เพื่อผูก event อัปโหลดรูปหลังฟอร์มถูกสร้าง
  // (ต้องรอ 1 tick ก่อนเพราะ innerHTML เพิ่งถูกเซ็ต)
  setTimeout(() => window.initProfileUpload(), 0);

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
      if(window.lucide) lucide.createIcons();
    }, 50);
  }
};

window.renderFormFacultyButtons = function() {
  formData.faculty = "คณะวิศวกรรมศาสตร์และเทคโนโลยี";
  if ($("f_faculty")) $("f_faculty").value = formData.faculty;
  window.renderFormBranchButtons(formData.faculty);
};

window.renderFormBranchButtons = function(e) {
  const n = $("form-branch-btns");
  if (n) {
    n.innerHTML = FACULTY_DATA[e] ? FACULTY_DATA[e].map((item) => `<button type="button" class="choice-btn ${formData.branch === item.name ? "selected" : ""}" style="padding:12px 20px;" onclick="window.selectFormBranch('${item.name}', '${item.id}')">${item.id}</button>`).join("") : "";
  }
};

window.selectFormBranch = function(e, t) {
    formData.branch = e; formData.branchCode = t;
    if ($("f_branch")) $("f_branch").value = e;
    if ($("f_branchCode")) $("f_branchCode").value = t;
    window.renderFormBranchButtons(formData.faculty);
    if (!editingIdCard) localStorage.setItem("alumni_draft", JSON.stringify(formData));
};

/**
 * รวบรวมข้อมูลจากฟิลด์ทั้งหมดในฟอร์มลงใน formData object
 * ฟิลด์ profileImage อ่านจาก hidden input ที่เก็บ base64 string
 */
window.collectFormData = function() {
  FORM_FIELDS.forEach((e) => {
    const t = $("f_" + e);
    // อ่านค่าจาก input โดยตรง (รวมถึง hidden input ของ profileImage)
    if (t) formData[e] = t.value;
  });
};

/**
 * เริ่มต้น event handlers สำหรับ profile upload zone
 * (ถูกเรียกหลังจาก renderForm วาด HTML เสร็จแล้ว)
 */
window.initProfileUpload = function() {
  // ไม่ต้องทำอะไรเพิ่ม เพราะ event ถูก bind inline ใน HTML แล้ว
  // ฟังก์ชันนี้เตรียมไว้สำหรับ logic เพิ่มเติมในอนาคต
};

/**
 * จัดการไฟล์รูปที่ผู้ใช้เลือกจาก file input
 * แปลงเป็น base64 แล้วเซ็ตลงใน formData.profileImage
 * @param {File} file - ไฟล์รูปภาพที่เลือก
 */
window.handleProfileFileSelect = function(file) {
  if (!file) return;
  // ตรวจสอบว่าเป็นไฟล์รูปภาพ
  if (!file.type.startsWith('image/')) {
    window.showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)', true);
    return;
  }
  
  // โหลดรูปและทำการย่อขนาด+บีบอัดด้วย Canvas
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new Image();
    img.onload = function() {
      // ขนาดปลายทาง 150x150 พิกเซล
      const targetSize = 150;
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        window.showToast('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', true);
        return;
      }
      
      // หาขนาดที่สั้นที่สุดเพื่อใช้ในการ Crop ตรงกลางเป็นสี่เหลี่ยมจัตุรัส
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      
      // วาดรูปครอปตรงกลางลงบน Canvas ขนาด 150x150
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
      
      // บีบอัดเป็น JPEG ที่คุณภาพ 0.7 (ได้ขนาดประมาณ 5-15 KB)
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      formData.profileImage = base64;
      // อัปเดต hidden input เพื่อให้ collectFormData รับค่าได้
      const hiddenInput = document.getElementById('f_profileImage');
      if (hiddenInput) hiddenInput.value = base64;
      
      // อัปเดต Preview รูปโปรไฟล์
      const previewEl = document.getElementById('profilePreview');
      if (previewEl) {
        // แทนที่ element เดิม (ไม่ว่าจะเป็น img หรือ div placeholder) ด้วย <img> ใหม่
        const newImg = document.createElement('img');
        newImg.id = 'profilePreview';
        newImg.className = 'profile-avatar-img';
        newImg.src = base64;
        newImg.alt = 'รูปโปรไฟล์';
        previewEl.replaceWith(newImg);
      }
      // แสดงปุ่มลบรูป
      const removeBtn = document.getElementById('profileRemoveBtn');
      if (removeBtn) removeBtn.classList.add('visible');
      if (window.lucide) lucide.createIcons();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

/**
 * จัดการไฟล์รูปที่ผู้ใช้ drag & drop มาวาง
 * @param {File} file - ไฟล์รูปภาพที่วาง
 */
window.handleProfileFileDrop = function(file) {
  window.handleProfileFileSelect(file);
};

/**
 * ลบรูปโปรไฟล์ออกจากฟอร์มและ formData
 */
window.removeProfileImage = function() {
  formData.profileImage = '';
  const hiddenInput = document.getElementById('f_profileImage');
  if (hiddenInput) hiddenInput.value = '';
  // ดึง initials จากชื่อนักศึกษา
  const initials = ((formData.nameTH || '?').charAt(0) + (formData.surnameTH || '').charAt(0)).toUpperCase() || '?';
  const previewEl = document.getElementById('profilePreview');
  if (previewEl) {
    const placeholder = document.createElement('div');
    placeholder.id = 'profilePreview';
    placeholder.className = 'profile-avatar-placeholder';
    placeholder.textContent = initials;
    previewEl.replaceWith(placeholder);
  }
  // ซ่อนปุ่มลบรูป
  const removeBtn = document.getElementById('profileRemoveBtn');
  if (removeBtn) removeBtn.classList.remove('visible');
  // รีเซ็ต file input เพื่อให้เลือกไฟล์เดิมได้ใหม่
  const fileInput = document.getElementById('f_profileImageFile');
  if (fileInput) fileInput.value = '';
};

/**
 * ตรวจสอบความสมบูรณ์และถูกต้องของข้อมูลฟอร์มก่อนการบันทึก (Validation Logic)
 * 
 * ฟังก์ชันนี้จะสแกนฟิลด์ฟอร์มเพื่อตรวจหาฟิลด์บังคับที่ว่างอยู่ หรือกรณีที่ความยาวของข้อมูลไม่ถูกต้อง
 * (เช่น รหัสนักศึกษาไม่ครบ 10 หลัก, บัตรประชาชนไม่ครบ 13 หลัก, เบอร์โทรศัพท์ไม่ครบ 10 หลัก)
 * 
 * @returns {Array<{key: string, label: string, valKey?: string}>} รายการฟิลด์ที่มีข้อผิดพลาด (ความยาว 0 แปลว่าฟอร์มผ่านการตรวจสอบ)
 */
window.validateForm = function() {
  let e = [];
  
  // 1. กำหนดฟิลด์พื้นฐานที่จำเป็นต้องกรอกในทุกๆ สถานะ
  const t = [
    { key: "batchYear", label: "รหัสรุ่น (Batch)" },
    { key: "studentId", label: "รหัสนักศึกษา (10 หลัก)" },
    { key: "idCard", label: "เลขบัตรประชาชน (13 หลัก)" },
    { key: "branch", label: "สาขา" },
    { key: "nameTH", label: "ชื่อจริง (ไทย)" },
    { key: "surnameTH", label: "นามสกุล (ไทย)" },
    { key: "phone", label: "เบอร์โทรศัพท์ (10 หลัก)" }
  ];

  // 2. กำหนดฟิลด์เพิ่มเติมในกรณีที่นักศึกษาเรียนจบแล้ว (มีวันจบการศึกษา)
  if (["ทำงานบริษัท", "ทำงานอิสระ", "ศึกษาต่อ", "ว่างงาน"].includes(formData.jobStatus)) {
      t.push({ key: "gradDate", label: "วันที่จบการศึกษา" });
  }

  // 3. กำหนดฟิลด์เพิ่มเติมกรณีที่มีงานทำ หรืออยู่ระหว่างเรียนต่อ/อื่นๆ
  if (["ทำงานบริษัท", "ทำงาน", "ทำงานอิสระ"].includes(formData.jobStatus)) {
    t.push(
        { key: "jobStartDate", label: "วันที่เริ่มทำงาน" },
        { key: "jobCompany", label: "ชื่อบริษัท" }
    );
  } else if (["ศึกษาต่อ", "ศึกษาต่อต่างประเทศ", "ว่างงาน", "กำลังศึกษา", "อื่นๆ"].includes(formData.jobStatus)) {
    // บังคับกรอกรายละเอียดอื่นๆ หากผู้ใช้เลือกหมวดหมู่สถานะเพิ่มเติม
    t.push({ key: "jobCurrentStatus_other", label: "รายละเอียดเพิ่มเติม", valKey: "jobCurrentStatus" });
  }

  // 4. วนลูปตรวจสอบฟิลด์ทั้งหมดที่ระบุว่าห้ามว่าง
  t.forEach((t) => { 
    const n = formData[t.valKey || t.key]; 
    if (!n || "" === String(n).trim()) e.push(t); 
  });

  // 5. ตรวจสอบความถูกต้องความยาวของเลขประจำตัวประชาชน (13 หลัก)
  const idc = formData.idCard ? formData.idCard.replace(/\D/g, "") : "";
  if (idc && idc.length !== 13) e.push({ key: "idCard", label: "ต้องครบ 13 หลัก" });

  // 6. ตรวจสอบความถูกต้องความยาวของรหัสนักศึกษา (10 หลัก)
  const stId = formData.studentId ? formData.studentId.replace(/\D/g, "") : "";
  if (stId && stId.length !== 10) e.push({ key: "studentId", label: "ต้องครบ 10 หลัก" });

  // 7. ตรวจสอบความถูกต้องความยาวของเบอร์โทรศัพท์ (10 หลัก)
  const phone = formData.phone ? formData.phone.replace(/\D/g, "") : "";
  if (phone && phone.length > 0 && phone.length !== 10) e.push({ key: "phone", label: "ต้องครบ 10 หลัก" });

  return e;
};

window.saveStudent = async function() {
  window.collectFormData(); hasAttemptedSave = true;

  const btn = $("btnSave");
  if(btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" class="spin"></i> กำลังบันทึก...'; if(window.lucide) lucide.createIcons(); }

  if (!formData.batchYear && formData.studentId && formData.studentId.length >= 2) {
      formData.batchYear = formData.studentId.substring(0,2);
  }

  if (!["ทำงานบริษัท", "ทำงานอิสระ", "ทำงาน"].includes(formData.jobStatus)) { formData.jobCompany = "-"; formData.jobPosition = "-"; formData.jobSalary = 0; formData.jobStartDate = ""; formData.jobDept = "-"; }
  if (["กำลังศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(formData.jobStatus) || (formData.jobStatus === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา", "รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(formData.jobCurrentStatus))) { formData.gradDate = ""; }

  if (window.validateForm().length > 0) {
    window.showToast("กรุณาตรวจสอบและกรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน", true); window.renderForm($("formTitle").textContent);
    setTimeout(() => { const e = document.querySelector(".form-field-error"); if (e) { e.focus(); e.scrollIntoView({ behavior: "smooth", block: "center" }); } }, 100);
    if(btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width: 20px; height: 20px"></i> บันทึกข้อมูล'; if(window.lucide) lucide.createIcons(); }
    return;
  }

  let e = { ...formData };
  e.startDate = e.startDate ? window.thaiStrToGregorian(e.startDate) : "";
  e.gradDate = e.gradDate ? window.thaiStrToGregorian(e.gradDate) : ""; e.jobStartDate = e.jobStartDate ? window.thaiStrToGregorian(e.jobStartDate) : ""; e.jobSalary = Number(e.jobSalary) || 0; e.jobRemark = e.jobRemark && e.jobRemark.trim() !== "" ? e.jobRemark : "-";

  if (e.jobStatus !== "อื่นๆ") e.jobRemark = "-";

  if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ", "ว่างงาน", "กำลังหางาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["ช่วยธุรกิจครอบครัว", "กำลังหางาน", "เตรียมสอบราชการ"].includes(e.jobCurrentStatus))) {
    if (["ทำงาน", "ทำงานบริษัท", "ทำงานอิสระ"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && e.jobCurrentStatus === "ช่วยธุรกิจครอบครัว")) {
        if (e.gradDate && e.jobStartDate) e.durationToGetJob = window.calcYMD(e.gradDate, e.jobStartDate);
        else e.durationToGetJob = "-";
    } else if (["ว่างงาน", "กำลังหางาน"].includes(e.jobStatus) || (e.jobStatus === "อื่นๆ" && ["กำลังหางาน", "เตรียมสอบราชการ"].includes(e.jobCurrentStatus))) {
        if(e.gradDate) e.durationToGetJob = window.calcYMD(e.gradDate, new Date().toISOString().split("T")[0]);
        else e.durationToGetJob = "-";
    } else { e.durationToGetJob = "-"; }
  } else { e.durationToGetJob = "-"; }

  if(!e.jobCurrentStatus) {
      if(["พ้นสภาพ", "ดรอปเรียน"].includes(e.jobStatus)) e.jobCurrentStatus = e.jobStatus;
      if(e.jobStatus === "กำลังศึกษา") e.jobCurrentStatus = "กำลังศึกษาอยู่ (ปี 1-4)";
  }

  window.showLoading(true, "กำลังบันทึกข้อมูลลงฐานข้อมูล...");
  try {
    // ส่งข้อมูลทั้งหมดรวมถึง profileImage (ที่บีบอัดแล้วมีขนาด 5-15KB) ไปบันทึกใน Google Sheet
    const n = await window.callAPI({ action: editingIdCard ? "edit" : "add_data", data: e });
    if (n && "success" === n.status) {
      window.showToast("บันทึกข้อมูลเรียบร้อยแล้ว", false);
      if (!editingIdCard) localStorage.removeItem("alumni_draft");
      window.closeAllModals();
      hasUnsavedChanges = false;

      // เก็บข้อมูลรวมถึง profileImage ไว้ใน STUDENTS array ใน memory
      const existingIdx = STUDENTS.findIndex(s => s.idCard === e.idCard);
      if(existingIdx > -1) STUDENTS[existingIdx] = e; else STUDENTS.push(e);
      // ⚠️ ตัด profileImage ออกก่อน cache เพื่อป้องกัน QuotaExceededError
      try {
        const cacheableStudents = STUDENTS.map(s => { const { profileImage, ...rest } = s; return rest; });
        localStorage.setItem("alumni_data", JSON.stringify(cacheableStudents));
      } catch(quotaErr) { localStorage.removeItem("alumni_data"); }

      window.updateDashboardAndTable();
      await window.fetchData(false);
    }
    else { window.showToast("เกิดข้อผิดพลาด: " + (n?.message || "ไม่สามารถเชื่อมต่อได้"), true); }
  } catch(err) {
    window.showToast("Error: " + err.message, true);
  } finally {
    window.showLoading(false);
    if(btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width: 20px; height: 20px"></i> บันทึกข้อมูล'; if(window.lucide) lucide.createIcons(); }
  }
};

window.openConfirmDel = function(e) {
  deleteId = e; const t = STUDENTS.find((t) => String(t.idCard) === String(e));
  if (t) { $("confirmDesc").innerHTML = `คุณต้องการลบข้อมูลของ <strong style="color:var(--danger);">${esc(t.prefix + t.nameTH + " " + t.surnameTH)}</strong> ใช่หรือไม่?<br>ข้อมูลนี้จะถูกลบออกจากระบบทันที ไม่สามารถกู้คืนได้`; window.openModal("modalConfirm"); }
};

window.confirmDelete = async function() {
  const btn = $("btnConfirmDelete");
  if(btn) { btn.disabled = true; btn.innerHTML = "กำลังลบ..."; }
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
  } catch(err) {
    window.showToast("Error: " + err.message, true);
  } finally {
    window.showLoading(false);
    if(btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="trash-2" style="width: 18px; height: 18px"></i> ยืนยันลบทันที'; if(window.lucide) lucide.createIcons();}
  }
};

window.toggleJobFields = function() {
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
        if(currentV && opts.includes(`value="${currentV}"`)) {
            otherSelect.value = currentV;
        } else {
            const firstValidOpt = otherSelect.options.length > 1 ? otherSelect.options[1].value : "";
            otherSelect.value = firstValidOpt;
        }
    }
    setF("f_jobCurrentStatus", otherSelect.value);
  }

  if (["กำลังศึกษา", "พ้นสภาพ", "ดรอปเรียน"].includes(e) || (e === "อื่นๆ" && ["ลาออก", "ย้ายสถานศึกษา", "รออนุมัติจบ", "กำลังศึกษาอยู่ (ปี 1-4)", "รอลงทะเบียนเรียน"].includes(otherSelect?.value))) {
      if(gd) gd.style.display = "none";
  } else {
      if(gd) gd.style.display = "block";
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

window.openManual = function() {
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
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--text-bold); margin-bottom: 8px;">1. การเข้าสู่ระบบ (Login)</h4>
                    <p style="color: var(--text-bold); font-size: 16.5px; margin-bottom: 0; line-height: 1.7; font-weight: 600;">กรอก <strong>Username</strong> และ <strong>Password</strong> ของคุณให้ถูกต้อง จากนั้นกดปุ่ม <span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 700;">เข้าสู่ระบบ</span> เมื่อข้อมูลถูกต้อง ระบบจะพาเข้าสู่หน้าภาพรวม (Dashboard) โดยอัตโนมัติ</p>
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
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--info); margin-bottom: 8px;">2. เมนูฐานข้อมูลนักศึกษา (หน้าหลัก)</h4>
                    <p style="color: var(--text-bold); font-size: 16.5px; margin-bottom: 0; line-height: 1.7; font-weight: 600;">ไปที่เมนู <strong>"ฐานข้อมูลนักศึกษา"</strong> ด้านซ้ายมือ หน้านี้จะเป็นตารางรายชื่อทั้งหมด คุณสามารถพิมพ์ค้นหาชื่อ หรือกดกรองข้อมูลตามสถานะ และรุ่นที่จบได้</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 16px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <i data-lucide="table" style="width: 48px; height: 48px; color: var(--info); margin-bottom: 12px;"></i>
                <div style="font-weight: 700; color: var(--text-muted); font-size: 14.5px;">ตารางแสดงข้อมูลนักศึกษาทั้งหมด</div>
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
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--primary); margin-bottom: 8px;">3. การนำเข้าข้อมูล และส่งไปที่ Google Sheets</h4>
                    <ul style="color: var(--text-bold); font-size: 16.5px; padding-left: 20px; line-height: 1.7; margin-bottom: 0; font-weight: 600;">
                        <li>คลิกปุ่ม <span style="border: 1px solid var(--primary); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 700; background: var(--primary-soft);"><i data-lucide="upload-cloud" style="width: 14px; display: inline;"></i> นำเข้าข้อมูล</span> ด้านบนขวา</li>
                        <li>หน้าต่างอัปโหลดจะเด้งขึ้นมา ให้ลากไฟล์ <strong>.xlsx, .xls หรือ .csv</strong> มาวาง</li>
                        <li>เมื่อกดยืนยัน ข้อมูลจะถูกส่งเข้าไปบันทึกลง <strong>Google Sheets</strong> ทันที!</li>
                    </ul>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--primary);">1. คลิกปุ่มนำเข้าข้อมูล</div>
                    <img src="image_71ac96.png" alt="คลิกปุ่มนำเข้า" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0; display:none;"></i>
                </div>
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--primary);">2. หน้าต่างอัปโหลด</div>
                    <img src="image_71ac7a.png" alt="หน้าต่างอัปโหลด" style="max-width: 100%; height: 120px; object-fit: contain; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="monitor" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0; display:none;"></i>
                </div>
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--primary);">3. เลือกไฟล์ .xlsx หรือ .csv</div>
                    <img src="image_71ac75.png" alt="เลือกไฟล์" style="max-width: 100%; height: 120px; object-fit: cover; object-position: left top; border-radius: 6px; box-shadow: var(--shadow-sm);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i data-lucide="file-spreadsheet" style="width: 48px; height: 48px; color: var(--primary); margin: 12px 0; display:none;"></i>
                </div>
                <div style="text-align: center; background: var(--bg-hover); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                    <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--success);">4. บันทึกลง Google Sheets ทันที</div>
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
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--success); margin-bottom: 8px;">4. การเพิ่มข้อมูลใหม่ทีละรายการ</h4>
                    <p style="color: var(--text-bold); font-size: 16.5px; margin-bottom: 0; line-height: 1.7; font-weight: 600;">คลิกปุ่ม <span style="background: var(--success); color: white; padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 700;"><i data-lucide="plus-circle" style="width: 14px; display: inline;"></i> เพิ่มข้อมูลใหม่</span> กรอกรายละเอียดที่จำเป็น เมื่อกดยืนยัน <strong>ข้อมูลนี้จะถูกส่งไปต่อท้ายใน Google Sheets ของคุณทันที</strong> เหมือนกับการนำเข้าไฟล์</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 24px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <i data-lucide="user-plus" style="width: 48px; height: 48px; color: var(--success); margin-bottom: 12px;"></i>
                <div style="font-weight: 700; color: var(--text-muted); font-size: 14.5px;">หน้าต่างสำหรับกรอกข้อมูลเพิ่มใหม่</div>
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
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--text-bold); margin-bottom: 8px;">${isAdmin ? '5' : '3'}. การดูรายละเอียดข้อมูล (View)</h4>
                    <p style="color: var(--text-bold); font-size: 16.5px; margin-bottom: 0; line-height: 1.7; font-weight: 600;">ในตารางข้อมูล ให้ <strong>"คลิกที่แถวของชื่อนักศึกษา"</strong> หรือคลิกปุ่ม <span style="border: 1px solid var(--border-hi); padding: 4px 10px; border-radius: 6px; font-size: 14px; background: var(--bg-hover);"><i data-lucide="eye" style="width: 14px; display: inline;"></i> ดูข้อมูล</span> ด้านขวา ระบบจะเปิดหน้าต่างป๊อปอัปแสดงประวัติส่วนตัว, ประวัติฝึกงาน และสถานะการทำงานปัจจุบันแบบครบถ้วน</p>
                </div>
            </div>
            <div style="text-align: center; background: var(--bg-hover); padding: 24px; border-radius: 12px; border: 1px dashed var(--border-hi);">
                <i data-lucide="contact-2" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
                <div style="font-weight: 700; color: var(--text-muted); font-size: 14.5px;">หน้าต่างแสดงรายละเอียดข้อมูลส่วนบุคคล</div>
            </div>
        </div>

        <!-- Step 6/4: นำออกข้อมูล -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--accent-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--accent-soft); padding: 16px; border-radius: 12px; height: fit-content; border: 1px solid var(--border-hi);">
                    <i data-lucide="download" style="width: 28px; height: 28px; color: var(--accent);"></i>
                </div>
                <div>
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--accent); margin-bottom: 8px;">${isAdmin ? '6' : '4'}. การนำออกข้อมูล (Export Excel)</h4>
                    <p style="color: var(--text-bold); font-size: 16.5px; margin-bottom: 0; line-height: 1.7; font-weight: 600;">คุณสามารถคลิกปุ่ม <span style="border: 1px solid var(--text-bold); padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 700; background: var(--surface);"><i data-lucide="download" style="width: 14px; display: inline;"></i> นำออก Excel</span> ระบบจะดึงรายชื่อที่กำลังแสดงอยู่ในตาราง นำมาสร้างเป็นไฟล์ Excel (.xlsx) และโหลดลงเครื่องให้ทันที</p>
                </div>
            </div>
        </div>

        <!-- Step 7/5: ออกจากระบบ -->
        <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--danger-soft); box-shadow: var(--shadow-sm);">
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="background: var(--danger-soft); padding: 16px; border-radius: 12px; height: fit-content;">
                    <i data-lucide="log-out" style="width: 28px; height: 28px; color: var(--danger);"></i>
                </div>
                <div>
                    <h4 style="font-size: 20px; font-weight: 800; color: var(--danger); margin-bottom: 8px;">${isAdmin ? '7' : '5'}. การออกจากระบบ (Logout)</h4>
                    <p style="color: var(--text-bold); font-size: 16.5px; margin-bottom: 0; line-height: 1.7; font-weight: 600;">เมื่อเสร็จสิ้นการใช้งาน ให้คลิกที่ปุ่มเมนูมุมบนขวา และเลือก <span style="background: var(--danger-soft); color: var(--danger); padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 700;"><i data-lucide="log-out" style="width: 14px; display: inline;"></i> ออกจากระบบ</span> เพื่อตัดการเชื่อมต่อและรักษาความปลอดภัยของข้อมูล</p>
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

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("pagePartners")) {
    const pPage = document.createElement("div");
    pPage.id = "pagePartners";
    pPage.className = "hidden content fade-in";
    pPage.style.display = "flex";
    pPage.style.flexDirection = "column";

    pPage.innerHTML = `
  <div class="filter-bar" style="display: flex; flex-direction: row !important; gap: 12px; flex-wrap: wrap; align-items: center; position: sticky; top: 64px; z-index: 40; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-radius: 8px; padding: 12px 16px; border: 1px solid var(--border); margin-bottom: 16px; width: 100%;">
    <div style="flex: 1 1 200px; position: relative; min-width: 180px;">
      <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--text-muted); pointer-events: none;"></i>
      <input type="text" id="partnerSearchInput" placeholder="ค้นหาชื่อบริษัท, สถานประกอบการ..." oninput="window.renderPartners()" style="width: 100%; padding: 8px 12px 8px 32px; border-radius: 6px; border: 1px solid var(--border); font-family: inherit; font-size: 13px; outline: none; background: var(--surface); color: var(--text);" />
    </div>
    <select id="partnerBranchFilter" onchange="window.renderPartners()" style="color: var(--primary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); font-family: inherit; font-size: 13px; font-weight: 600; outline: none; background: var(--surface); cursor: pointer;">
      <option value="">✨ ทุกสาขาวิชา</option>
      <option value="CAI">CAI</option><option value="CYB">CYB</option><option value="DIT">DIT</option>
      <option value="AME">AME</option><option value="RAE">RAE</option>
    </select>
    <span id="partnerCount" style="font-size: 12.5px; font-weight: 800; color: var(--primary); background: var(--primary-soft); padding: 6px 12px; border-radius: 99px; white-space: nowrap;">กำลังคำนวณ...</span>
  </div>
  <div id="partnerSummary" class="summary-grid"></div>
  <div id="partnerChartWrapper" style="margin-bottom: 24px;"></div>
  <div class="table-wrap partner-table-wrap" style="flex: 1; overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse; text-align: left;">
      <thead>
        <tr style="background: var(--bg); border-bottom: 2px solid var(--border); color: var(--text-bold); font-size: 12.5px;">
          <th style="width: 40px; text-align: center; padding: 10px 12px;">#</th>
          <th style="padding: 10px 12px; min-width: 200px;">ชื่อบริษัท / สถานประกอบการ</th>
          <th style="padding: 10px 12px; min-width: 130px;">สาขาที่รับ</th>
          <th style="text-align: center; padding: 10px 12px; width: 110px;">จำนวนรุ่นที่รับ</th>
          <th style="text-align: center; padding: 10px 12px; width: 110px;">ยอดรับรวม</th>
          <th style="text-align: center; padding: 10px 12px; width: 140px;">สถานะความร่วมมือ</th>
          <th style="text-align: center; padding: 10px 12px; width: 100px;">จัดการ</th>
        </tr>
      </thead>
      <tbody id="partnerTbody"></tbody>
    </table>
  </div>
`;
    const pageStudents =
      document.getElementById("pageStudents") ||
      document.querySelector(".content");
    if (pageStudents) pageStudents.after(pPage);
  }
});

const originalInitApp = window.initApp;
window.initApp = function () {
  if (originalInitApp) originalInitApp();
  const sideNav = document.getElementById("sideNav");
  if (sideNav && !document.getElementById("nav-partners")) {
    const partnerBtn = document.createElement("a");
    partnerBtn.href = "#partners";
    partnerBtn.id = "nav-partners";
    partnerBtn.className = "nav-item";
    partnerBtn.setAttribute(
      "onclick",
      "window.navTo('partners'); return false;",
    );
    partnerBtn.innerHTML = `<div class="nav-icon"><i data-lucide="building-2"></i></div><span class="nav-label">เครือข่ายพันธมิตร</span>`;
    sideNav.appendChild(partnerBtn);
    if (window.lucide) lucide.createIcons();
  }
};

const originalNavTo = window.navTo;
window.navTo = function (e) {
  if (originalNavTo) originalNavTo(e);
  document.querySelectorAll(".nav-item").forEach((t) => {
    t.classList.toggle(
      "active",
      t.getAttribute("onclick")?.includes(`'${e}'`),
    );
  });
  const pagePartners = document.getElementById("pagePartners");
  if (pagePartners)
    pagePartners.classList.toggle("hidden", e !== "partners");
  if (e === "partners") {
    const titleEl = document.getElementById("topbarTitle");
    if (titleEl) titleEl.textContent = "รายชื่อเครือข่ายพันธมิตร";
    window.renderPartners();
  }
};

window.renderPartners = function () {
  const searchVal = (
    document.getElementById("partnerSearchInput")?.value || ""
  )
    .toLowerCase()
    .trim();
  const branchVal =
    document.getElementById("partnerBranchFilter")?.value || "";

  // ปรับปรุง: แยกพจนานุกรมการสะกด (Normalization Map) ออกมาเป็นโครงสร้างข้อมูลที่ชัดเจนเพื่อความง่ายต่อการบำรุงรักษา
  const NORMALIZATION_RULES = [
    {
      pattern: /\bcp\s*all\b|\bcpall\b|ซีพี\s*ออลล์|เซเว่น|7-eleven|7\s*-\s*11/i,
      target: "7-Eleven (CP ALL)"
    },
    {
      pattern: /\btrue\b|ทรู/i,
      target: "True Corporation"
    }
  ];

  const compMap = {};
  const dataList = STUDENTS || [];
  dataList.forEach((s) => {
    const branchMap = {
      "DIT": "เทคโนโลยีดิจิทัลและสารสนเทศ",
      "AME": "วิศวกรรมการผลิตยานยนต์",
      "CAI": "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์",
      "RAE": "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ",
      "IEM": "วิศวกรรมอุตสาหการและการผลิตอัจฉริยะ",
      "CYB": "การรักษาความมั่นคงปลอดภัยไซเบอร์"
    };
    let branch = s.branchCode && s.branchCode.trim() !== "-" && s.branchCode.trim() !== "" ? s.branchCode.trim() : "";
    if (!branch && s.branch) {
      const cleanBranch = s.branch.trim();
      const found = Object.entries(branchMap).find(([k, v]) => v === cleanBranch);
      branch = found ? found[0] : cleanBranch;
    }
    if (!branch) branch = "ET";
    const batch = String(s.batchYear || s.batch || "67");
    const records = [
      {
        name: s.internY1_711Branch || s.internY1?.company,
        type: "intern",
      },
      { name: s.internY2_Company || s.internY2?.company, type: "intern" },
      { name: s.internY3_Company || s.internY3?.company, type: "intern" },
      { name: s.internY4_Company || s.internY4?.company, type: "intern" },
      { name: s.jobCompany, type: "job" },
    ];

    records.forEach((rec, recIdx) => {
      if (!rec || !rec.name || typeof rec.name !== "string") return;
      let cName = rec.name.trim();
      const cleanLower = cName.toLowerCase();

      // 1. คัดกรองคำที่ไม่เกี่ยวข้องออก (Exclusion)
      if (
        ["-", "ไม่มี", "ไม่ได้ฝึก", "ว่างงาน", "ไม่ระบุ", "n/a", "na", "", "null", "undefined"].includes(cleanLower) ||
        /^(ไม่ได้ฝึกงาน|ไม่ได้ทำงาน|ศึกษาต่อ|เรียนต่อ|ว่างงาน|ว่าง|ไม่มีข้อมูล)$/.test(cleanLower)
      )
        return;

      if (cleanLower.includes("ธุรกิจส่วนตัว") || cleanLower.includes("ครอบครัว") || cleanLower.includes("ฟรีแลนซ์"))
        return;

      let displayName = cName;

      // 2. จัดกลุ่มฝึกงานปี 1 (7-Eleven) - ตรวจสอบเฉพาะถ้ามีชื่อสาขาหรือคำสำคัญ เพื่อป้องกันกรณีศึกษาปีแรกไปฝึกที่อื่น
      if (recIdx === 0) {
        const is711 = /7-eleven|7-11|เซเว่น|สาขา|cp|all|\d+/i.test(cleanLower);
        if (is711) {
          displayName = "7-Eleven (CP ALL)";
        } else {
          displayName = cName;
        }
      } else {
        // 3. Normalization แปลงชื่อสะกดโดยเช็คคู่เงื่อนไขที่ปลอดภัย
        for (const rule of NORMALIZATION_RULES) {
          if (rule.pattern.test(cleanLower)) {
            displayName = rule.target;
            break;
          }
        }
      }

      const key = displayName.toLowerCase();
      if (!compMap[key]) {
        compMap[key] = {
          displayName: displayName,
          branches: new Set(),
          batches: new Set(),
          internCount: 0,
          jobCount: 0,
        };
      }
      compMap[key].branches.add(branch);
      compMap[key].batches.add(batch);
      if (rec.type === "job") compMap[key].jobCount++;
      else compMap[key].internCount++;
    });
  });

  let compList = Object.values(compMap).map((c) => {
    const total = c.internCount + c.jobCount;
    let badge = "";
    if (c.jobCount > 0 && c.internCount > 0)
      badge = `<span style="background:#f0fdf4;color:#15803d;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:600;border:1px solid #dcfce7;display:inline-flex;align-items:center;gap:5px;"><span style="width:6px;height:6px;background:#22c55e;border-radius:50%;"></span> พันธมิตรหลัก</span>`;
    else if (c.jobCount > 0)
      badge = `<span style="background:#f0f9ff;color:#1d4ed8;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:600;border:1px solid #e0f2fe;display:inline-flex;align-items:center;gap:5px;"><span style="width:6px;height:6px;background:#3b82f6;border-radius:50%;"></span> รับบรรจุทำงาน</span>`;
    else
      badge = `<span style="background:#fefce8;color:#a16207;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:600;border:1px solid #fef9c3;display:inline-flex;align-items:center;gap:5px;"><span style="width:6px;height:6px;background:#eab308;border-radius:50%;"></span> รับฝึกงาน</span>`;

    return {
      name: c.displayName,
      branches: Array.from(c.branches).sort(),
      batches: Array.from(c.batches).sort(),
      total,
      internCount: c.internCount,
      jobCount: c.jobCount,
      badge,
    };
  });

  compList.sort((a, b) => b.total - a.total);
  if (searchVal)
    compList = compList.filter((c) =>
      c.name.toLowerCase().includes(searchVal),
    );
  if (branchVal)
    compList = compList.filter((c) =>
      c.branches.some((b) => String(b).includes(branchVal)),
    );

  const tbody = document.getElementById("partnerTbody");
  const countEl = document.getElementById("partnerCount");
  if (countEl) countEl.innerText = `พบพาร์ทเนอร์ ${compList.length} แห่ง`;

  const partnerSummary = document.getElementById("partnerSummary");
  const allBranches = new Set();
  compList.forEach((c) => c.branches.forEach((b) => allBranches.add(b)));
  const totalIntern = compList.reduce((sum, c) => sum + c.internCount, 0);
  const totalJobCount = compList.reduce((sum, c) => sum + c.jobCount, 0);
  if (partnerSummary) {
    partnerSummary.style.display = "none";
  }

  const partnerChartWrapper = document.getElementById("partnerChartWrapper");
  if (partnerChartWrapper) {
    partnerChartWrapper.style.display = "none";
  }

    if (window.Chart) {
      if (window.partnerChartInst) window.partnerChartInst.destroy();
      const ctx = document.getElementById("partnerChart");
      if (ctx) {
        const topCompanies = compList.slice(0, 5);
        window.partnerChartInst = new Chart(ctx, {
          type: "bar",
          data: {
            labels: topCompanies.map((c) =>
              c.name.length > 18
                ? c.name.substring(0, 18) + "..."
                : c.name,
            ),
            datasets: [
              {
                label: "รวมผู้รับงาน/ฝึกงาน",
                data: topCompanies.map((c) => c.total),
                backgroundColor: "#059669",
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: {
                titleFont: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' },
                bodyFont: { size: 16, family: "'Sarabun', sans-serif", weight: 'bold' },
                padding: 12
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' },
                },
                title: {
                  display: true,
                  text: 'จำนวนคน (คน)',
                  font: { size: 15, family: "'Sarabun', sans-serif", weight: 'bold' }
                }
              },
              x: {
                ticks: {
                  font: { size: 14, family: "'Sarabun', sans-serif", weight: 'bold' },
                },
              },
            },
          },
        });
      }
    }
  if (!tbody) return;

  if (compList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);font-weight:600;font-size:13px;">ไม่พบข้อมูลเครือข่ายพันธมิตร</td></tr>`;
    return;
  }

  tbody.innerHTML = compList
    .map((c, idx) => {
      const safeName = (c.name || "")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
      const branchBadges = c.branches
        .map(
          (b) =>
            `<span style="font-size:12.5px;font-weight:800;background:var(--bg);padding:3px 8px;border-radius:6px;border:1px solid var(--border);color:var(--primary);display:inline-block;margin:2px;">${b}</span>`,
        )
        .join("");
      const batchText = c.batches.join(", ");

      return `
    <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">
      <td style="text-align:center;color:var(--text-muted);font-weight:800;padding:12px 14px;font-size:14.5px;">${idx + 1}</td>
      <td style="padding:12px 14px;">
        <div style="font-weight:800;font-size:16px;color:var(--text-bold);">${c.name}</div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-top:4px;font-weight:600;">ฝึกงาน ${c.internCount.toLocaleString('th-TH')} ครั้ง | บรรจุ ${c.jobCount.toLocaleString('th-TH')} คน</div>
      </td>
      <td style="padding:12px 14px;">${branchBadges}</td>
      <td style="text-align:center;padding:12px 14px;">
        <span style="font-weight:800;color:var(--text-bold);font-size:15px;">${c.batches.length} รุ่น</span>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;font-weight:500;">(รุ่น ${batchText})</div>
      </td>
      <td style="text-align:center;padding:12px 14px;"><span style="font-size:15px;font-weight:800;color:var(--success);background:#ecfdf5;padding:4px 12px;border-radius:99px;border:1px solid #a7f3d0;display:inline-block;">${c.total.toLocaleString('th-TH')} คน</span></td>
      <td style="text-align:center;padding:12px 14px;">${c.badge}</td>
      <td style="text-align:center;padding:12px 14px;">
        <button class="btn btn-outline btn-sm" style="background:var(--surface);border:1px solid var(--border);cursor:pointer;padding:6px 14px;border-radius:6px;font-weight:700;color:var(--text-bold);font-size:13.5px;" onclick="window.openCompanyStudents('${safeName}')">
          <i data-lucide="eye" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> ดูข้อมูล
        </button>
      </td>
    </tr>
  `;
    })
    .join("");

  if (window.lucide) window.lucide.createIcons();
};

window.openCompanyStudents = function (cName) {
  window.navTo("students");
  setTimeout(() => {
    const compSel = document.getElementById("filterCompany");
    if (compSel) {
      let found = false;
      for (let i = 0; i < compSel.options.length; i++) {
        if (compSel.options[i].value === cName) {
          compSel.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const sInput = document.getElementById("searchInput");
        if (sInput) sInput.value = cName;
      }
    }
    if (window.renderTable) window.renderTable();
  }, 100);
};

window.renderOrgsTable = function() {
  const tbody = $("orgsTbody");
  if (!tbody) return;
  const query = ($("orgSearchInput")?.value || "").trim().toLowerCase();
  
  let list = ORGANIZATIONS;
  if (query) {
    list = list.filter(o => 
      String(o["ชื่อบริษัท/องค์กร"] || "").toLowerCase().includes(query) ||
      String(o["ที่อยู่"] || "").toLowerCase().includes(query) ||
      String(o["ลักษณะธุรกิจ"] || "").toLowerCase().includes(query) ||
      String(o["ผู้ประสานงาน"] || "").toLowerCase().includes(query)
    );
  }
  
  if ($("orgCount")) $("orgCount").textContent = `พบ ${list.length} แห่ง`;
  
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px 20px;">ไม่พบข้อมูลองค์กรในระบบ</td></tr>`;
    return;
  }
  
  tbody.innerHTML = list.map((o, idx) => `
    <tr>
      <td style="text-align:center;color:var(--text-muted);font-weight:700;">${idx + 1}</td>
      <td style="font-weight:700;color:var(--primary);">${window.esc(o["ชื่อบริษัท/องค์กร"])}</td>
      <td><span style="font-size:12.5px;background:var(--primary-soft);color:var(--primary);padding:4px 8px;border-radius:6px;font-weight:600;">${window.esc(o["ลักษณะธุรกิจ"])}</span></td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${window.esc(o["ที่อยู่"])}">${window.esc(o["ที่อยู่"])}</td>
      <td style="font-weight:600;">${window.esc(o["ผู้ประสานงาน"])}</td>
      <td>${window.esc(o["ตำแหน่ง"])}</td>
      <td>
        <div style="font-weight:600;">📱 ${window.esc(o["เบอร์มือถือ"] || "-")}</div>
        <div style="font-size:12px;color:var(--text-muted);">☎️ ${window.esc(o["เบอร์โทรศัพท์"] || "-")}</div>
      </td>
      <td><a href="mailto:${window.esc(o["อีเมล"])}" style="color:var(--primary);font-weight:600;text-decoration:none;">${window.esc(o["อีเมล"])}</a></td>
    </tr>
  `).join("");
};

window.renderPositionsTable = function() {
  const tbody = $("positionsTbody");
  if (!tbody) return;
  const query = ($("posSearchInput")?.value || "").trim().toLowerCase();
  
  let list = POSITIONS;
  if (query) {
    list = list.filter(p => 
      String(p["ชื่อตำแหน่ง"] || "").toLowerCase().includes(query) ||
      String(p["แผนก/หน่วยงาน"] || "").toLowerCase().includes(query) ||
      String(p["หน้าที่/ความรับผิดชอบ"] || "").toLowerCase().includes(query) ||
      String(p["คุณสมบัติ"] || "").toLowerCase().includes(query)
    );
  }
  
  if ($("posCount")) $("posCount").textContent = `พบ ${list.length} อัตรา`;
  
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:40px 20px;">ไม่พบข้อมูลตำแหน่งงานในระบบ</td></tr>`;
    return;
  }
  
  tbody.innerHTML = list.map((p, idx) => `
    <tr>
      <td style="text-align:center;color:var(--text-muted);font-weight:700;">${idx + 1}</td>
      <td style="font-weight:800;color:var(--primary);">${window.esc(p["ชื่อตำแหน่ง"])}</td>
      <td style="font-weight:600;color:var(--text-bold);">${window.esc(p["แผนก/หน่วยงาน"])}</td>
      <td style="font-size:13px;max-width:250px;white-space:normal;line-height:1.4;">${window.esc(p["หน้าที่/ความรับผิดชอบ"])}</td>
      <td style="font-size:13px;max-width:250px;white-space:normal;line-height:1.4;color:var(--text-muted);">${window.esc(p["คุณสมบัติ"])}</td>
      <td style="text-align:center;font-weight:700;color:var(--warning);"><span style="background:var(--warning-soft);padding:4px 8px;border-radius:6px;">${window.esc(p["จำนวน"])}</span></td>
      <td>
        <div style="font-weight:600;">📅 ${window.esc(p["วันทำงาน"])}</div>
        <div style="font-size:12px;color:var(--text-muted);">⏰ ${window.esc(p["เวลา"])}</div>
      </td>
      <td><span class="badge" style="background:${p["รูปแบบการปฏิบัติงาน (Onsite/Hybrid/WFH)"] === "WFH" ? "#fee2e2;color:#ef4444" : p["รูปแบบการปฏิบัติงาน (Onsite/Hybrid/WFH)"] === "Hybrid" ? "#fef3c7;color:#d97706" : "#dcfce7;color:#15803d"};">${window.esc(p["รูปแบบการปฏิบัติงาน (Onsite/Hybrid/WFH)"])}</span></td>
      <td style="font-weight:700;color:var(--success);">${window.esc(p["เบี้ยเลี้ยง"])}</td>
    </tr>
  `).join("");
};

// 📤 ฟังก์ชันสำหรับซิงค์ข้อมูลรูปภาพนักศึกษาจากไฟล์ที่ผู้ใช้อัปโหลดแบบกลุ่ม (Local Bulk Upload)
window.processBulkLocalPhotosSelect = async function(files) {
  if (!files || files.length === 0) return;
  
  const statusEl = document.getElementById("bulkUploadStatus");
  
  if (statusEl) {
    statusEl.style.display = "block";
    statusEl.innerHTML = `<strong>กำลังเตรียมประมวลผลไฟล์...</strong>`;
  }
  
  const photos = [];
  const total = files.length;
  
  // ฟังก์ชันย่อและครอบตัดรูปภาพด้วย Canvas (150x150px)
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 150;
          canvas.width = size;
          canvas.height = size;
          
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.indexOf("image/") === -1) continue;
    
    // ดึงชื่อไฟล์ตัดนามสกุลออก เพื่อใช้เป็นคีย์ค้นหานักศึกษา
    const filename = file.name;
    const key = filename.substring(0, filename.lastIndexOf('.')).trim();
    
    if (statusEl) {
      statusEl.innerHTML = `<strong>กำลังย่อขนาดรูปภาพ:</strong> ${i + 1} จาก ${total} รูป<br><span style="font-size:12px;color:var(--text-muted);">${filename}</span>`;
    }
    
    try {
      const base64 = await resizeImage(file);
      photos.push({ key: key, base64: base64 });
    } catch (err) {
      console.error("Error resizing file: " + filename, err);
    }
  }
  
  if (photos.length === 0) {
    alert("⚠️ ไม่พบไฟล์รูปภาพที่รองรับสำหรับการนำเข้า");
    if (statusEl) statusEl.style.display = "none";
    return;
  }
  
  if (statusEl) {
    statusEl.innerHTML = `<i data-lucide="refresh-cw" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:6px;animation:spin 1s linear infinite;"></i> <strong>กำลังนำเข้ารูปภาพจำนวน ${photos.length} รูป ไปยังฐานข้อมูล...</strong>`;
    if (window.lucide) lucide.createIcons();
  }
  
  try {
    const data = await window.callAPI({ action: "bulk_import_photos_local", photos: photos });
    if (data && data.status === "success") {
      alert(`✅ นำเข้ารูปภาพสำเร็จ!\nจับคู่รูปภาพและอัปเดตลงตารางศิษย์เก่าเรียบร้อยแล้วทั้งหมด ${data.updateCount} คน`);
      window.closeAllModals();
      window.fetchData(true); // รีโหลดตารางใหม่เพื่อดึงภาพมาแสดงผล
    } else {
      alert(`❌ เกิดข้อผิดพลาด: ${data.message || "ไม่สามารถอัปเดตรูปภาพได้"}`);
    }
  } catch (err) {
    console.error(err);
    alert(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${err.message}`);
  } finally {
    if (statusEl) statusEl.style.display = "none";
    // ล้างค่าใน file input เพื่อให้สามารถเลือกรูปเดิมซ้ำได้ถ้าหากต้องการแก้
    const fileInput = document.getElementById("bulkPhotoInput");
    if (fileInput) fileInput.value = "";
  }
};

// 📥 ฟังก์ชันสำหรับสร้างและดาวน์โหลดไฟล์เทมเพลตตัวอย่าง Excel (.xlsx) ให้ผู้ใช้นำไปกรอกข้อมูล
window.downloadExcelTemplate = async function() {
  window.showToast("กำลังสร้างไฟล์ตัวอย่าง...", false);
  try {
    await window.loadXLSX();
    
    // กำหนดโครงสร้างหัวตาราง (Headers) มาตรฐานที่ระบบรองรับ
    const headers = [
      "รหัสนักศึกษา",
      "เลขบัตรประชาชน",
      "คำนำหน้า",
      "ชื่อจริง_TH",
      "นามสกุล_TH",
      "ชื่อจริง_EN",
      "นามสกุล_EN",
      "ชื่อเล่น",
      "เพศ",
      "วัน/เดือน/ปีเกิด",
      "ชื่อย่อสาขา",
      "สาขาเรียน",
      "เบอร์โทรศัพท์",
      "อีเมล",
      "โรคประจำตัว",
      "ที่อยู่ปัจจุบัน",
      "ที่อยู่ตามทะเบียนบ้าน",
      "ชื่อผู้ปกครอง",
      "เบอร์โทรศัพท์ (ผู้ปกครอง)",
      "ความสัมพันธ์",
      "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)",
      "ตำแหน่งปี 1",
      "ระยะเวลาฝึกงานปี 1",
      "ชื่อสถานประกอบการฝึกงานปี 2",
      "ตำแหน่งปี2 ",
      "ระยะเวลาฝึกงานปี 2 ",
      "ชื่อสถานประกอบการฝึกงานปี 3-4",
      "ตำแหน่งปี 3-4",
      "ระยะเวลาฝึกงานปี 3-4",
      "Final Project",
      "วันที่เริ่มศึกษา",
      "วันที่จบการศึกษา",
      "ปีการศึกษาที่จบ",
      "สถานะการทำงาน",
      "วันที่เริ่มงาน",
      "ชือสถานประกอบการที่บรรจุงาน",
      "ตำแหน่งงาน",
      "สถานะการได้งานจากที่ฝึกงาน",
      "หมายเหตุ"
    ];
    
    // ข้อมูลตัวอย่างจำลอง 1 แถวเพื่อเป็นแนวทางในการกรอกข้อมูล
    const sampleRow = {
      "รหัสนักศึกษา": "6752300852",
      "เลขบัตรประชาชน": "1234567890123",
      "คำนำหน้า": "นาย",
      "ชื่อจริง_TH": "สมชาย",
      "นามสกุล_TH": "เรียนดี",
      "ชื่อจริง_EN": "Somchai",
      "นามสกุล_EN": "Reandee",
      "ชื่อเล่น": "ชาย",
      "เพศ": "ชาย",
      "วัน/เดือน/ปีเกิด": "15/07/2545",
      "ชื่อย่อสาขา": "CPE",
      "สาขาเรียน": "วิศวกรรมคอมพิวเตอร์",
      "เบอร์โทรศัพท์": "0812345678",
      "อีเมล": "somchai@example.com",
      "โรคประจำตัว": "ไม่มี",
      "ที่อยู่ปัจจุบัน": "123/45 ถนนแจ้งวัฒนะ ปากเกร็ด นนทบุรี",
      "ที่อยู่ตามทะเบียนบ้าน": "123/45 ถนนแจ้งวัฒนะ ปากเกร็ด นนทบุรี",
      "ชื่อผู้ปกครอง": "นายสมศักดิ์ เรียนดี",
      "เบอร์โทรศัพท์ (ผู้ปกครอง)": "0898765432",
      "ความสัมพันธ์": "บิดา",
      "ชื่อสถานประกอบการฝึกงานปี 1 (7-Eleven)": "สาขาธาราพลาซ่า",
      "ตำแหน่งปี 1": "ผู้ช่วยผู้จัดการร้านฝึกหัด",
      "ระยะเวลาฝึกงานปี 1": "3 เดือน",
      "ชื่อสถานประกอบการฝึกงานปี 2": "บริษัท เอ บี ซี จำกัด",
      "ตำแหน่งปี2 ": "พนักงานฝึกหัดฝ่ายไอที",
      "ระยะเวลาฝึกงานปี 2 ": "3 เดือน",
      "ชื่อสถานประกอบการฝึกงานปี 3-4": "บริษัท ซี พี ออลล์ จำกัด (มหาชน)",
      "ตำแหน่งปี 3-4": "นักศึกษาฝึกงานพัฒนาซอฟต์แวร์",
      "ระยะเวลาฝึกงานปี 3-4": "4 เดือน",
      "Final Project": "ระบบติดตามศิษย์เก่าอัจฉริยะ",
      "วันที่เริ่มศึกษา": "01/06/2567",
      "วันที่จบการศึกษา": "31/03/2571",
      "ปีการศึกษาที่จบ": "2570",
      "สถานะการทำงาน": "ทำงานบริษัท",
      "วันที่เริ่มงาน": "01/05/2571",
      "ชือสถานประกอบการที่บรรจุงาน": "บริษัท เทคโนโลยี จำกัด",
      "ตำแหน่งงาน": "Software Engineer",
      "สถานะการได้งานจากที่ฝึกงาน": "ตรงสาย",
      "หมายเหตุ": "จบการศึกษาเกียรตินิยมอันดับ 1"
    };

    // แปลงข้อมูลและหัวตารางเป็นแผ่นงาน Excel
    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายชื่อศิษย์เก่า (ตัวอย่าง)");
    
    // เขียนไฟล์และดาวน์โหลดออกมายังเครื่องผู้ใช้
    XLSX.writeFile(wb, "Alumni_Template_Example.xlsx");
    window.showToast("ดาวน์โหลดไฟล์ตัวอย่างสำเร็จ");
  } catch (err) {
    console.error(err);
    window.showToast("เกิดข้อผิดพลาดในการสร้างไฟล์ตัวอย่าง", true);
  }
};

// ==========================================
// 🛠️ COLLAPSIBLE SIDEBAR SYSTEM
// ==========================================
window.toggleSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const icon = document.getElementById("sidebarToggleIcon");
  
  if (sidebar && main) {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    main.classList.toggle("sidebar-collapsed", isCollapsed);
    
    // Save state to local storage
    localStorage.setItem("sidebar_collapsed", isCollapsed ? "true" : "false");
    
    // Update direction of chevron toggle icon
    if (icon) {
      icon.setAttribute("data-lucide", isCollapsed ? "chevron-right" : "chevron-left");
      if (window.lucide) lucide.createIcons();
    }
  }
};

// Auto-restore sidebar collapse state on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const isCollapsed = localStorage.getItem("sidebar_collapsed") === "true";
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main");
  const icon = document.getElementById("sidebarToggleIcon");
  
  if (isCollapsed && window.innerWidth > 1024) {
    if (sidebar) sidebar.classList.add("collapsed");
    if (main) main.classList.add("sidebar-collapsed");
    if (icon) {
      icon.setAttribute("data-lucide", "chevron-right");
      if (window.lucide) lucide.createIcons();
    }
  }
});

// ==========================================
// 📊 STATISTICS PAGE (จาก dashboard.html)
// ==========================================

const STAT_BRANCH_MAP = {
  "DIT": "เทคโนโลยีดิจิทัลและสารสนเทศ",
  "AME": "วิศวกรรมการผลิตยานยนต์",
  "CAI": "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์",
  "RAE": "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ",
  "IEM": "วิศวกรรมอุตสาหการและการผลิตอัจฉริยะ",
  "CYB": "การรักษาความมั่นคงปลอดภัยไซเบอร์"
};

let STAT_ACTIVE_FILTERS = { years: [], progs: [], statuses: [] };
let STAT_CHARTS = {};
let STAT_INITIALIZED = false;


window.statGetFilteredData = function() {
  return STUDENTS.filter(s => {
    if (STAT_ACTIVE_FILTERS.years.length && !STAT_ACTIVE_FILTERS.years.includes(String(s.batchYear))) return false;
    if (STAT_ACTIVE_FILTERS.progs.length && !STAT_ACTIVE_FILTERS.progs.includes(s.branchCode)) return false;
    if (STAT_ACTIVE_FILTERS.statuses.length && !STAT_ACTIVE_FILTERS.statuses.includes(s.jobStatus)) return false;
    return true;
  });
};

window.statToggleFilter = function(type, val) {
  const idx = STAT_ACTIVE_FILTERS[type].indexOf(val);
  const chip = document.getElementById(`stat-chip-${type}-${val}`);
  if (idx === -1) {
    STAT_ACTIVE_FILTERS[type].push(val);
    if (chip) { chip.style.background = "var(--primary-soft)"; chip.style.fontWeight = "600"; chip.style.color = "var(--primary)"; chip.style.borderColor = "rgba(5,150,105,0.2)"; }
  } else {
    STAT_ACTIVE_FILTERS[type].splice(idx, 1);
    if (chip) { chip.style.background = ""; chip.style.fontWeight = ""; chip.style.color = ""; chip.style.borderColor = "transparent"; }
  }
  window.statUpdateDashboard();
};

window.statAllProgs = function(status) {
  STAT_ACTIVE_FILTERS.progs = [];
  document.querySelectorAll("#statFProg input").forEach(cb => {
    cb.checked = status;
    const val = cb.value;
    const chip = document.getElementById(`stat-chip-progs-${val}`);
    if (status) {
      STAT_ACTIVE_FILTERS.progs.push(val);
      if (chip) { chip.style.background = "var(--primary-soft)"; chip.style.fontWeight = "600"; chip.style.color = "var(--primary)"; chip.style.borderColor = "rgba(5,150,105,0.2)"; }
    } else {
      if (chip) { chip.style.background = ""; chip.style.fontWeight = ""; chip.style.color = ""; chip.style.borderColor = "transparent"; }
    }
  });
  window.statUpdateDashboard();
};

window.statResetAll = function() {
  STAT_ACTIVE_FILTERS = { years: [], progs: [], statuses: [] };
  document.querySelectorAll("#statFYear input, #statFProg input, #statFStatus input").forEach(cb => { cb.checked = false; });
  document.querySelectorAll("[id^='stat-chip-']").forEach(c => { c.style.background = ""; c.style.fontWeight = ""; c.style.color = ""; c.style.borderColor = "transparent"; });
  window.statUpdateDashboard();
};

window.toggleStatSidebar = function() {
  const sidebar = document.getElementById("statSidebar");
  if (sidebar) {
    sidebar.classList.toggle("mobile-open");
  }
};

window.statRenderFilterGroup = function(containerId, list, type, labelFn = v => v) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = list.map(val => `
    <label id="stat-chip-${type}-${val}" style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:13px; border:1px solid transparent; transition:background .12s; margin-bottom:4px;">
      <input type="checkbox" value="${val}" onchange="window.statToggleFilter('${type}','${val}')" style="accent-color:var(--primary); width:14px; height:14px; cursor:pointer; flex-shrink:0;">
      <span>${labelFn(val)}</span>
    </label>
  `).join("");
};

window.statSwitchTab = function(tabName, btn) {
  // Update tab button styles
  document.querySelectorAll("[id^='statTab-']").forEach(b => {
    b.style.color = "var(--text-muted)";
    b.style.borderBottom = "3px solid transparent";
  });
  btn.style.color = "var(--primary)";
  btn.style.borderBottom = "3px solid var(--primary)";

  // Show/hide panels
  document.querySelectorAll(".stat-panel").forEach(p => p.style.display = "none");
  const panel = document.getElementById(`statPanel-${tabName}`);
  if (panel) panel.style.display = "block";

  if (tabName === "program") window.statRenderProgTable();
};

window.statDrawChart = function(canvasId, type, data, extraOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (STAT_CHARTS[canvasId]) { STAT_CHARTS[canvasId].destroy(); }
  STAT_CHARTS[canvasId] = new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: "'Sarabun', sans-serif" },
      ...extraOptions
    }
  });
};

window.statUpdateDashboard = function() {
  const data = window.statGetFilteredData();

  // Active filter tags
  const tagsEl = document.getElementById("statActiveTags");
  if (tagsEl) {
    let tags = [];
    if (STAT_ACTIVE_FILTERS.years.length) tags.push(`ปีการศึกษา: ${STAT_ACTIVE_FILTERS.years.join(", ")}`);
    if (STAT_ACTIVE_FILTERS.progs.length) tags.push(`สาขา: ${STAT_ACTIVE_FILTERS.progs.join(", ")}`);
    if (STAT_ACTIVE_FILTERS.statuses.length) tags.push(`สถานะ: ${STAT_ACTIVE_FILTERS.statuses.join(", ")}`);
    tagsEl.innerHTML = tags.length === 0
      ? `<span style="font-size:12px; color:#aaa;">ตัวกรองปัจจุบัน: ทั้งหมด (ไม่มีการเลือกตัวกรอง)</span>`
      : tags.map(t => `<span style="background:var(--primary-soft); color:var(--primary); border-radius:20px; padding:3px 10px; font-size:11.5px; font-weight:600;">${t}</span>`).join("");
  }

  // KPI
  const k0 = document.getElementById("statK0"); if (k0) k0.textContent = data.length.toLocaleString("th-TH");
  const normal = data.filter(s => ["กำลังศึกษา","ทำงานแล้ว","ทำงานบริษัท","ทำงานอิสระ","ศึกษาต่อ","ศึกษาต่อต่างประเทศ","ทำงาน"].includes(s.jobStatus)).length;
  const k1 = document.getElementById("statK1"); if (k1) k1.textContent = normal.toLocaleString("th-TH");
  const k1p = document.getElementById("statK1p"); if (k1p) k1p.textContent = data.length ? `(${Math.round((normal / data.length) * 100)}%)` : "-";
  const graduated = data.filter(s => ["ทำงานแล้ว","ทำงานบริษัท","ทำงานอิสระ","ทำงาน","ศึกษาต่อ","ศึกษาต่อต่างประเทศ","ว่างงาน","กำลังหางาน"].includes(s.jobStatus)).length;
  const k2 = document.getElementById("statK2"); if (k2) k2.textContent = graduated.toLocaleString("th-TH");
  const k2p = document.getElementById("statK2p"); if (k2p) k2p.textContent = data.length ? `(${Math.round((graduated / data.length) * 100)}%)` : "-";
  const drop = data.filter(s => ["พ้นสภาพ","ไม่จบการศึกษา","ดรอปเรียน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["ลาออก","ย้ายสถานศึกษา"].includes(s.jobCurrentStatus))).length;
  const k3 = document.getElementById("statK3"); if (k3) k3.textContent = drop.toLocaleString("th-TH");
  const k3p = document.getElementById("statK3p"); if (k3p) k3p.textContent = data.length ? `(${Math.round((drop / data.length) * 100)}%)` : "-";

  // Year chart
  const yCounts = {};
  data.forEach(s => { if (s.batchYear) yCounts[s.batchYear] = (yCounts[s.batchYear] || 0) + 1; });
  const yLabels = Object.keys(yCounts).sort();
  window.statDrawChart("statCYear", "bar", {
    labels: yLabels.map(l => `รุ่น ${l}`),
    datasets: [{ label: "จำนวนนักศึกษา (คน)", data: yLabels.map(l => yCounts[l]), backgroundColor: "#059669", borderRadius: 6 }]
  }, { plugins: { legend: { display: false } } });

  // Status chart
  const sCounts = { "ทำงานแล้ว": 0, "ศึกษาต่อ": 0, "กำลังศึกษา": 0, "ว่างงาน": 0, "พ้นสภาพ": 0 };
  data.forEach(s => {
    if (["ทำงานแล้ว","ทำงานบริษัท","ทำงานอิสระ","ทำงาน"].includes(s.jobStatus)) sCounts["ทำงานแล้ว"]++;
    else if (["ศึกษาต่อ","ศึกษาต่อต่างประเทศ"].includes(s.jobStatus)) sCounts["ศึกษาต่อ"]++;
    else if (["กำลังศึกษา"].includes(s.jobStatus)) sCounts["กำลังศึกษา"]++;
    else if (["ว่างงาน","กำลังหางาน"].includes(s.jobStatus)) sCounts["ว่างงาน"]++;
    else if (["พ้นสภาพ","ไม่จบการศึกษา","ดรอปเรียน"].includes(s.jobStatus) || (s.jobStatus === "อื่นๆ" && ["ลาออก","ย้ายสถานศึกษา"].includes(s.jobCurrentStatus))) sCounts["พ้นสภาพ"]++;
  });
  window.statDrawChart("statCStatus", "doughnut", {
    labels: Object.keys(sCounts),
    datasets: [{ data: Object.values(sCounts), backgroundColor: ["#16a34a","#8b5cf6","#2563eb","#f59e0b","#ef4444"], borderWidth: 0 }]
  }, { plugins: { legend: { position: "bottom" } } });

  // Branch chart
  const bCounts = {};
  Object.keys(STAT_BRANCH_MAP).forEach(k => bCounts[k] = 0);
  data.forEach(s => { if (s.branchCode && s.branchCode in bCounts) bCounts[s.branchCode]++; });
  window.statDrawChart("statCBranch", "bar", {
    labels: Object.keys(bCounts).map(l => `${STAT_BRANCH_MAP[l]} (${l})`),
    datasets: [{ label: "จำนวนนักศึกษา (คน)", data: Object.values(bCounts), backgroundColor: ["#10b981","#3b82f6","#f97316","#a855f7","#ec4899","#06b6d4","#64748b"], borderRadius: 6 }]
  }, { indexAxis: "y", plugins: { legend: { display: false } } });

  // Gender chart
  let gm = 0, gf = 0, gu = 0;
  data.forEach(s => {
    if (s.gender === "ชาย" || s.gender === "male" || s.gender === "M") gm++;
    else if (s.gender === "หญิง" || s.gender === "female" || s.gender === "F") gf++;
    else gu++;
  });
  window.statDrawChart("statCGender", "pie", {
    labels: ["ชาย", "หญิง", "ไม่ระบุ"],
    datasets: [{ data: [gm, gf, gu], backgroundColor: ["#3b82f6","#ec4899","#cbd5e1"] }]
  }, { plugins: { legend: { position: "right" } } });
  const gt = gm + gf + gu;
  const gTbl = document.getElementById("statGTbl");
  if (gTbl) {
    gTbl.innerHTML = `
      <tr><th style="padding:4px 8px; text-align:left; color:var(--text-muted); font-size:12px;">เพศ</th><th style="padding:4px 8px; text-align:center; color:var(--text-muted); font-size:12px;">คน</th><th style="padding:4px 8px; text-align:center; color:var(--text-muted); font-size:12px;">สัดส่วน</th></tr>
      <tr><td style="padding:4px 8px; border-bottom:1px solid var(--border);"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;background:#3b82f6;vertical-align:middle;"></span>ชาย</td><td style="padding:4px 8px; text-align:center; border-bottom:1px solid var(--border);">${gm}</td><td style="padding:4px 8px; text-align:center; border-bottom:1px solid var(--border);">${gt ? Math.round(gm/gt*100) : 0}%</td></tr>
      <tr><td style="padding:4px 8px; border-bottom:1px solid var(--border);"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;background:#ec4899;vertical-align:middle;"></span>หญิง</td><td style="padding:4px 8px; text-align:center; border-bottom:1px solid var(--border);">${gf}</td><td style="padding:4px 8px; text-align:center; border-bottom:1px solid var(--border);">${gt ? Math.round(gf/gt*100) : 0}%</td></tr>
      <tr><td style="padding:4px 8px;"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;background:#cbd5e1;vertical-align:middle;"></span>ไม่ระบุ</td><td style="padding:4px 8px; text-align:center;">${gu}</td><td style="padding:4px 8px; text-align:center;">${gt ? Math.round(gu/gt*100) : 0}%</td></tr>
    `;
  }

  window.statRenderProgTable();
};

window.statRenderProgTable = function() {
  const data = window.statGetFilteredData();
  const searchVal = (document.getElementById("statProgSearch")?.value || "").toLowerCase();
  const progStats = {};
  Object.keys(STAT_BRANCH_MAP).forEach(code => { progStats[code] = { total: 0, graduated: 0, employed: 0 }; });
  data.forEach(s => {
    if (s.branchCode && s.branchCode in progStats) {
      progStats[s.branchCode].total++;
      if (["ทำงานแล้ว","ทำงานบริษัท","ทำงานอิสระ","ทำงาน","ศึกษาต่อ","ศึกษาต่อต่างประเทศ","ว่างงาน","กำลังหางาน"].includes(s.jobStatus)) progStats[s.branchCode].graduated++;
      if (["ทำงานแล้ว","ทำงานบริษัท","ทำงานอิสระ","ทำงาน"].includes(s.jobStatus)) progStats[s.branchCode].employed++;
    }
  });
  const tbody = document.getElementById("statProgTbody");
  if (!tbody) return;
  let list = Object.entries(progStats).map(([code, val]) => ({ code, name: STAT_BRANCH_MAP[code] || code, ...val }))
    .filter(p => p.name.toLowerCase().includes(searchVal) || p.code.toLowerCase().includes(searchVal));
  const cnt = document.getElementById("statProgCount");
  if (cnt) cnt.textContent = `พบทั้งหมด ${list.length} สาขาวิชา`;
  tbody.innerHTML = list.map(p => {
    const rate = p.graduated ? Math.round((p.employed / p.graduated) * 100) : 0;
    return `<tr>
      <td style="padding:10px 12px; text-align:left; font-weight:700; border-bottom:1px solid #f1f5f9;">${p.name} (${p.code})</td>
      <td style="padding:10px 12px; text-align:center; border-bottom:1px solid #f1f5f9;"><span style="background:var(--primary-soft);color:var(--primary);border-radius:6px;padding:2px 8px;font-weight:700;">${p.total}</span></td>
      <td style="padding:10px 12px; text-align:center; border-bottom:1px solid #f1f5f9;">${p.graduated}</td>
      <td style="padding:10px 12px; text-align:center; border-bottom:1px solid #f1f5f9;">${p.employed}</td>
      <td style="padding:10px 12px; text-align:center; border-bottom:1px solid #f1f5f9;"><strong style="color:var(--primary); font-size:14px;">${rate}%</strong></td>
    </tr>`;
  }).join("");
};

window.renderStatistics = function() {
  if (!STAT_INITIALIZED) {
    // Init filter groups from STUDENTS data
    const years = new Set(), progs = new Set(), statuses = new Set();
    STUDENTS.forEach(s => {
      if (s.batchYear) years.add(String(s.batchYear));
      if (s.branchCode && s.branchCode in STAT_BRANCH_MAP) progs.add(s.branchCode);
      if (s.jobStatus) statuses.add(s.jobStatus);
    });
    window.statRenderFilterGroup("statFYear", Array.from(years).sort(), "years");
    window.statRenderFilterGroup("statFProg", Array.from(progs).sort(), "progs", val => STAT_BRANCH_MAP[val] || val);
    window.statRenderFilterGroup("statFStatus", Array.from(statuses).sort(), "statuses");
    STAT_INITIALIZED = true;
  }
  window.statUpdateDashboard();
};
