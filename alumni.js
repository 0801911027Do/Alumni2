// -------------------------------------------------------------
// 🔴 1. ตั้งค่าการเชื่อมต่อ (กรุณาแก้ไขให้ตรงกับระบบของคุณ)
// -------------------------------------------------------------

// URL ของ Google Apps Script (Backend)
const API_URL =
  "https://script.google.com/macros/s/AKfycbwcPXx1vNxGrbSUTOEL8kERkGrx4e8rSSwcApYtQow7awF9NSxxFGkUCTCo3bBp26Sw/exec";

// ตั้งค่ารหัสสำหรับการใช้งาน Google Drive Picker (ของแท้)
// หาได้จาก: Google Cloud Console -> Credentials
const GOOGLE_API_KEY = "AIzaSyBIiOs9UyCcjyoUVS_rLAjvwd64DKVODsU";
const GOOGLE_CLIENT_ID =
  "376990407675-1sa5o354astd9p4m2q1i8s2eg6vvg88q.apps.googleusercontent.com";
const GOOGLE_APP_ID = "376990407675 ";

// -------------------------------------------------------------

const FACULTY_DATA = {
  คณะวิศวกรรมศาสตร์และเทคโนโลยี: [
    { id: "CAI", name: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์" },
    { id: "CYB", name: "การรักษาความมั่นคงปลอดภัยไซเบอร์" },
    { id: "RAE", name: "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ" },
    { id: "AME", name: "วิศวกรรมการผลิตยานยนต์" },
    { id: "IEM", name: "วิศวกรรมอุตสาหการและการผลิตอัจฉริยะ" },
    { id: "DIT", name: "เทคโนโลยีดิจิทัลและสารสนเทศ" },
  ],
};

let STUDENTS = [],
  currentUser = null,
  currentPage = "dash",
  filterStatus = "ทั้งหมด",
  filterBr = "ทั้งหมด",
  filterBrId = "ทั้งหมด",
  editingIdCard = null,
  formData = {},
  deleteId = null,
  isFetching = false,
  hasAttemptedSave = false;
let selectedExcelFile = null;

// --- Google Picker API Init ---
let tokenClient;
let pickerAccessToken = null;
let pickerInited = false;
let gisInited = false;

// เปลี่ยนจาก function declaration ธรรมดา ให้เข้าถึงได้ทุก scope (Hoisting Fix)
window.gapiLoaded = function () {
  if (typeof gapi !== "undefined") {
    gapi.load("client:picker", async () => {
      const hasKey =
        GOOGLE_API_KEY &&
        GOOGLE_API_KEY !== "" &&
        !GOOGLE_API_KEY.includes("ใส่_API_KEY");
      if (hasKey) {
        await gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        });
        pickerInited = true;
      }
    });
  }
};

window.gisLoaded = function () {
  const hasClient =
    GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_ID !== "" &&
    !GOOGLE_CLIENT_ID.includes("ใส่_CLIENT_ID");
  if (typeof google !== "undefined" && google.accounts && hasClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: "",
    });
    gisInited = true;
  }
};

// ฟังก์ชันเปิด Google Picker
function openRealGooglePicker() {
  const hasKey =
    GOOGLE_API_KEY &&
    GOOGLE_API_KEY !== "" &&
    !GOOGLE_API_KEY.includes("ใส่_API_KEY");
  const hasClient =
    GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_ID !== "" &&
    !GOOGLE_CLIENT_ID.includes("ใส่_CLIENT_ID");

  // ตรวจสอบว่าใส่ API Key ครบหรือไม่
  if (hasKey && hasClient && pickerInited && gisInited) {
    // 🟢 ใช้ Google Picker ของจริง
    tokenClient.callback = async (response) => {
      if (response.error !== undefined) {
        throw response;
      }
      pickerAccessToken = response.access_token;
      createRealPicker();
    };

    if (pickerAccessToken === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  } else {
    // 🟡 ใช้วิธีสำรอง (อัปโหลดไฟล์/วางลิงก์) กรณีไม่ได้ใส่ API Key
    selectedExcelFile = null;
    const excelInput = document.getElementById("excelUploadInput");
    if (excelInput) excelInput.value = "";
    const driveInput = document.getElementById("driveLinkInput");
    if (driveInput) driveInput.value = "";
    document.getElementById("fallbackDriveLink").classList.add("hidden");

    closeAllModals();
    openModal("modalFallbackImport");
  }
}

function createRealPicker() {
  const view = new google.picker.DocsView(
    google.picker.ViewId.SPREADSHEETS,
  ).setMimeTypes(
    "application/vnd.google-apps.spreadsheet,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  const uploadView = new google.picker.DocsUploadView();

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setDeveloperKey(GOOGLE_API_KEY)
    .setAppId(GOOGLE_APP_ID)
    .setOAuthToken(pickerAccessToken)
    .addView(view)
    .addView(uploadView)
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
}

async function pickerCallback(data) {
  if (data.action === google.picker.Action.PICKED) {
    const doc = data.docs[0];
    await fetchDriveFileContent(doc.id, doc.name);
  }
}

async function fetchDriveFileContent(fileId, fileName) {
  showLoading(true, "กำลังอ่านข้อมูลจาก Google Drive...");
  try {
    // ดึงไฟล์ Spreadsheet ออกมาเป็น CSV
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    let response = await fetch(url, {
      headers: { Authorization: `Bearer ${pickerAccessToken}` },
    });

    // หากไฟล์ที่เลือกไม่ใช่ Google Sheets (เช่นเป็นไฟล์ .csv ที่อัปโหลดไว้เฉยๆ) ให้ดึงแบบ media
    if (!response.ok) {
      const urlMedia = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      response = await fetch(urlMedia, {
        headers: { Authorization: `Bearer ${pickerAccessToken}` },
      });
      if (!response.ok) throw new Error("ไม่สามารถอ่านรูปแบบไฟล์นี้ได้");
    }

    const csvText = await response.text();
    processFetchedCsv(csvText, fileName);
  } catch (error) {
    showToast(error.message, true);
    showLoading(false);
  }
}

function processFetchedCsv(csvText, fileName) {
  try {
    const workbook = XLSX.read(csvText, { type: "string" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    if (jsonData.length === 0) {
      showToast("ไม่พบข้อมูลในไฟล์ที่เลือก", true);
      showLoading(false);
      return;
    }

    selectedExcelFile = { name: fileName, isDrive: true, data: jsonData };
    const nameElem = document.getElementById("selectedFileName");
    if (nameElem) nameElem.textContent = fileName;

    showLoading(false);
    openModal("modalImportSettings");
    lucide.createIcons();
  } catch (e) {
    showToast("โครงสร้างไฟล์ไม่ถูกต้อง", true);
    showLoading(false);
  }
}

// เมื่อ User กดเลือกไฟล์จากเครื่องคอมพิวเตอร์
function handleFileSelect(event) {
  if (event.target.files && event.target.files.length > 0) {
    processLocalFile(event.target.files[0]);
  }
}

function processLocalFile(file) {
  const validExts = [".xlsx", ".xls", ".csv"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!validExts.includes(ext)) {
    showToast("กรุณาเลือกไฟล์นามสกุล .xlsx, .xls หรือ .csv เท่านั้น", true);
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("ขนาดไฟล์ต้องไม่เกิน 5MB", true);
    return;
  }

  selectedExcelFile = { name: file.name, isDrive: false, file: file };
  const nameElem = document.getElementById("selectedFileName");
  if (nameElem) nameElem.textContent = file.name;

  closeAllModals();
  openModal("modalImportSettings");
  lucide.createIcons();
}

// ดึงข้อมูลผ่านการวาง URL จากวิธีสำรอง (Fallback)
async function fetchFromDriveLink() {
  const urlInput = document.getElementById("driveLinkInput");
  if (!urlInput) return;
  const url = urlInput.value.trim();

  if (!url.includes("docs.google.com/spreadsheets/d/")) {
    showToast("กรุณาวางลิงก์ Google Sheets ที่ถูกต้อง", true);
    return;
  }
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    showToast("ลิงก์ไม่ถูกต้อง ไม่พบรหัสไฟล์", true);
    return;
  }
  const fileId = match[1];

  showLoading(true, "กำลังดึงข้อมูลจาก Google Sheets...");
  try {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv`;
    const response = await fetch(exportUrl);
    if (!response.ok)
      throw new Error("เข้าถึงไม่ได้ กรุณาเปิดแชร์ไฟล์เป็น 'ทุกคนที่มีลิงก์'");

    const csvText = await response.text();
    if (
      csvText.trim().startsWith("<!DOCTYPE html>") ||
      csvText.trim().startsWith("<html")
    ) {
      throw new Error(
        "ติดสิทธิ์การเข้าถึง กรุณาตั้งค่าแชร์เป็น 'ทุกคนที่มีลิงก์สามารถดูได้'",
      );
    }

    processFetchedCsv(csvText, "ไฟล์นำเข้าจากลิงก์_Google_Sheets");
  } catch (error) {
    showToast(error.message, true);
    showLoading(false);
  }
}

async function confirmImport() {
  if (!selectedExcelFile) return;

  const importLocation = document.getElementById("importLocation")
    ? document.getElementById("importLocation").value
    : "append";
  const convertData = document.getElementById("importConvert")
    ? document.getElementById("importConvert").checked
    : true;

  closeAllModals();
  showToast(`กำลังเริ่มนำเข้าข้อมูล: ${selectedExcelFile.name}`, false);
  showLoading(true, "กำลังประมวลผลข้อมูล...");

  try {
    let jsonData = [];
    if (selectedExcelFile.isDrive) {
      jsonData = selectedExcelFile.data;
    } else {
      jsonData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            resolve(
              XLSX.utils.sheet_to_json(worksheet, {
                defval: "",
                raw: !convertData,
              }),
            );
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
        reader.readAsArrayBuffer(selectedExcelFile.file);
      });
    }

    if (!jsonData || jsonData.length === 0) {
      showLoading(false);
      showToast("ไม่พบข้อมูลในไฟล์ที่อัปโหลด", true);
      return;
    }

    // Auto-calculate duration for imported data
    jsonData = jsonData.map((record) => {
      const gradDate = cleanDate(record["วันจบการศึกษา"]);
      const jobStartDate = cleanDate(record["วันที่ได้รับการบรรจุ"]);
      const jobStatus = String(record["สถานะการทำงาน"] || "").trim();

      // Only auto-calculate if employment-related and dates are valid
      if (
        (!record["ระยะเวลาได้งานทำ"] || record["ระยะเวลาได้งานทำ"] === "-") &&
        (jobStatus === "ทำงาน" ||
          jobStatus === "ว่างงาน" ||
          jobStatus === "กำลังหางาน") &&
        gradDate &&
        jobStartDate
      ) {
        record["ระยะเวลาได้งานทำ"] = calcYMD(gradDate, jobStartDate);
      }
      return record;
    });

    showLoading(
      true,
      `กำลังส่งข้อมูล ${jsonData.length} รายการไปที่ฐานข้อมูล...`,
    );

    if (!API_URL || !API_URL.startsWith("http")) {
      throw new Error("API URL ไม่ถูกต้อง");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "import_excel",
        importMode: importLocation,
        data: jsonData,
      }),
    });

    const result = await response.json();
    showLoading(false);

    if (result && result.status === "success") {
      showToast(`นำเข้าข้อมูล ${jsonData.length} รายการสำเร็จ!`, false);
      await fetchData(true);
    } else {
      showToast(
        "เกิดข้อผิดพลาดจากระบบ: " + (result?.message || "ไม่ทราบสาเหตุ"),
        true,
      );
    }
  } catch (error) {
    showLoading(false);
    showToast("เกิดข้อผิดพลาดในการทำงาน: " + error.message, true);
    console.error("Import error:", error);
  }
}

// --- Core Functions ---
function gregorianToThaiStr(e) {
  if (!e || "-" === e) return "";
  const t = e.split("T")[0].split("-");
  if (3 !== t.length) return e;
  const n = parseInt(t[0]) + 543;
  return `${t[2]}/${t[1]}/${n}`;
}

function thaiStrToGregorian(e) {
  if (!e) return "";
  const t = e.split("/");
  if (3 === t.length) {
    let e = parseInt(t[2]);
    (e < 2500 && e > 1900) || (e >= 2500 && (e -= 543));
    return `${e}-${t[1].padStart(2, "0")}-${t[0].padStart(2, "0")}`;
  }
  return e;
}

function formatThaiDateShort(e) {
  if (!e || "-" === e) return "-";
  const t = e.split("T")[0].split("-");
  if (3 !== t.length) return e;
  const n = parseInt(t[1]) - 1,
    a = parseInt(t[0]) + 543;
  return `${parseInt(t[2])} ${["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][n]} ${a}`;
}

const ALL_PANELS = ["profileWrap"];

function closeAllPanels(e) {
  ALL_PANELS.forEach((t) => {
    if (t === e) return;
    const n = document.getElementById(t);
    n &&
      (n.querySelector(".panel").classList.remove("open"),
      n.querySelector("button").classList.remove("active"));
  });
}

function bindPanel(e) {
  const t = document.getElementById(e);
  if (!t) return;
  const n = t.querySelector("button"),
    a = t.querySelector(".panel");
  n.addEventListener("click", (t) => {
    t.stopPropagation();
    const i = a.classList.contains("open");
    closeAllPanels(e);
    i
      ? (a.classList.remove("open"), n.classList.remove("active"))
      : (a.classList.add("open"), n.classList.add("active"));
  });
}

document.addEventListener("click", () => closeAllPanels(null));
document.addEventListener("keydown", (e) => {
  "Escape" === e.key && closeAllPanels(null);
});

const fmtMoney = (e) =>
  e && Number(e) > 0 ? "฿" + Number(e).toLocaleString("th-TH") : "-";
const jcBadge = (e) =>
  "ทำงาน" === e
    ? "badge-work"
    : "ศึกษาต่อต่างประเทศ" === e
      ? "badge-study-abroad"
      : "ศึกษาต่อ" === e || "ศึกษาต่อในประเทศ" === e
        ? "badge-study"
        : "ไม่จบการศึกษา" === e || "พ้นสภาพ" === e
          ? "badge-danger"
          : "badge-seek";
const esc = (e) =>
  String(e || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
const cleanDate = (e) => {
  let t = String(e || "").trim();
  return t.length >= 10 && "T" === t.charAt(10) ? t.substring(0, 10) : t;
};

function showToast(e, t = !1) {
  const n = document.getElementById("toast"),
    a = t
      ? '<i data-lucide="x-circle" style="width:20px;height:20px;"></i>'
      : '<i data-lucide="check-circle" style="width:20px;height:20px;"></i>';
  n.innerHTML = a + " " + e;
  n.style.background = t ? "var(--danger)" : "var(--success)";
  n.classList.add("show");
  lucide.createIcons();
  setTimeout(() => n.classList.remove("show"), 3500);
}

function showLoading(e, t = "กำลังซิงค์ข้อมูล...") {
  const n = document.getElementById("global-loader");
  document.getElementById("loader-text").innerText = t;
  e ? n.classList.remove("hidden") : n.classList.add("hidden");
}

function checkSetup() {
  if (
    !API_URL ||
    API_URL.trim() === "" ||
    API_URL.includes("YOUR_DEPLOYMENT_ID")
  ) {
    const e = document.getElementById("loginError");
    if (e) {
      e.innerHTML =
        '<i data-lucide="alert-triangle" style="width:18px;height:18px;"></i> <strong style="color:var(--danger)">ยังไม่ได้ตั้งค่า API_URL</strong>';
      e.classList.remove("hidden");
      lucide.createIcons();
    }
  }
}

async function callAPI(e = null) {
  if (
    !API_URL ||
    API_URL.trim() === "" ||
    API_URL.includes("YOUR_DEPLOYMENT_ID")
  )
    return { status: "error", message: "กรุณาตั้งค่า API_URL" };
  try {
    let t = e
      ? {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(e),
        }
      : { method: "GET" };
    const n = await fetch(API_URL, t);
    return await n.json();
  } catch (error) {
    console.error("API Error:", error);
    return { status: "error", message: error.message };
  }
}

async function doLogin() {
  const e = document.getElementById("inpUser").value.trim(),
    t = document.getElementById("inpPass").value.trim(),
    n = document.getElementById("loginError");
  if (!e || !t) return;
  showLoading(!0, "กำลังตรวจสอบสิทธิ์เข้าถึง...");
  let a = await callAPI({ action: "login", username: e, password: t });
  showLoading(!1);
  if (a && "success" === a.status) {
    n.classList.add("hidden");
    currentUser = { username: e, role: a.role, name: a.name };
    localStorage.setItem("alumni_user", JSON.stringify(currentUser));
    document.getElementById("loginPage").classList.add("hidden");
    initApp();
    fetchData(!0);
  } else {
    n.innerHTML =
      '<i data-lucide="x-circle" style="width:18px;height:18px;"></i> รหัสผ่านไม่ถูกต้อง หรือเชื่อมต่อไม่สำเร็จ';
    n.classList.remove("hidden");
    lucide.createIcons();
  }
}

function doLogout() {
  closeAllPanels();
  currentUser = null;
  localStorage.removeItem("alumni_user");
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("inpPass").value = "";
  STUDENTS = [];
}

async function fetchData(e = !1) {
  if (isFetching) return;
  isFetching = !0;
  e && showLoading(!0, "กำลังอัปเดตข้อมูลล่าสุด...");
  const t = await callAPI();
  e && showLoading(!1);
  isFetching = !1;
  if (t && "success" === t.status) {
    STUDENTS = t.data.map((e) => {
      const gradDate = cleanDate(e["วันจบการศึกษา"]);
      const jobStartDate = cleanDate(e["วันที่ได้รับการบรรจุ"]);
      const jobStatus = String(e["สถานะการทำงาน"] || "").trim();

      // Auto-calculate duration if employment-related
      let calculatedDuration = String(e["ระยะเวลาได้งานทำ"] || "").trim();
      if ("ทำงาน" === jobStatus && gradDate && jobStartDate) {
        calculatedDuration = calcYMD(gradDate, jobStartDate);
      } else if (
        ("ว่างงาน" === jobStatus || "กำลังหางาน" === jobStatus) &&
        gradDate
      ) {
        const today = new Date().toISOString().split("T")[0];
        calculatedDuration = calcYMD(gradDate, today);
      } else if (!calculatedDuration) {
        calculatedDuration = "-";
      }

      return {
        idCard: String(e["เลขประจำตัวประชาชน"] || "").trim(),
        prefix: String(e["คำนำหน้า"] || "").trim(),
        nameTH: String(e["ชื่อ (ไทย)"] || "").trim(),
        surnameTH: String(e["นามสกุล (ไทย)"] || "").trim(),
        nameEN: String(e["ชื่อ (อังกฤษ)"] || "").trim(),
        surnameEN: String(e["นามสกุล (อังกฤษ)"] || "").trim(),
        nickname: String(e["ชื่อเล่น"] || "").trim(),
        gender: String(e["เพศ"] || "").trim(),
        birthDate: cleanDate(e["วัน/เดือน/ปีเกิด"]),
        branchCode: String(e["รหัสสาขา"] || "").trim(),
        branch: String(e["สาขา"] || "").trim(),
        faculty: String(e["คณะ"] || "").trim(),
        age: String(e["อายุ"] || "").trim(),
        phone: String(e["เบอร์โทรศัพท์"] || "").trim(),
        email: String(e["อีเมล"] || "").trim(),
        disease: String(e["โรคประจำตัว"] || "").trim(),
        currentAddress: String(e["ที่อยู่ปัจจุบัน"] || "").trim(),
        homeAddress: String(e["ที่อยู่ตามทะเบียนบ้าน"] || "").trim(),
        parentName: String(e["ชื่อ-สกุล ผู้ปกครอง"] || "").trim(),
        parentPhone: String(e["เบอร์โทร ผู้ปกครอง"] || "").trim(),
        parentRelation: String(e["ความสัมพันธ์"] || "").trim(),
        internY1_711Branch: String(e["ปี1 สาขา 7-Eleven"] || "").trim(),
        internY1_711Area: String(e["ปี1 พื้นที่/ภาค"] || "").trim(),
        internY1_711EmpID: String(e["ปี1 รหัสพนักงาน"] || "").trim(),
        internY2_Company: String(e["ปี2 บริษัท"] || "").trim(),
        internY2_Position: String(e["ปี2 ตำแหน่ง"] || "").trim(),
        internY2_Dept: String(e["ปี2 แผนก"] || "").trim(),
        internY3_Company: String(e["ปี3 บริษัท"] || "").trim(),
        internY3_Position: String(e["ปี3 ตำแหน่ง"] || "").trim(),
        internY3_Dept: String(e["ปี3 แผนก"] || "").trim(),
        internY4_Company: String(e["ปี4 บริษัท"] || "").trim(),
        internY4_Position: String(e["ปี4 ตำแหน่ง"] || "").trim(),
        internY4_Dept: String(e["ปี4 แผนก"] || "").trim(),
        gradDate: gradDate,
        gradYear: (() => {
          let t = String(
            e["รุ่นปี (ปีที่จบ)"] ||
              e["รุ่น"] ||
              (e["วันจบการศึกษา"]
                ? String(e["วันจบการศึกษา"]).substring(0, 4)
                : ""),
          ).trim();
          return (
            (t = t.replace(/\D/g, "")),
            2 === t.length
              ? "25" + t
              : 4 === t.length && parseInt(t) > 1900 && parseInt(t) < 2500
                ? String(parseInt(t) + 543)
                : t
          );
        })(),
        jobStatus: jobStatus,
        jobStartDate: jobStartDate,
        jobCompany: String(e["ชื่อบริษัทที่ทำงาน"] || "").trim(),
        jobPosition: String(e["ตำแหน่งที่ทำงาน"] || "").trim(),
        jobDept: String(e["แผนกที่ทำงาน"] || "").trim(),
        jobSalary: e["เงินเดือน (บาท)"] || 0,
        jobCurrentStatus: String(e["สถานะปัจจุบัน"] || "").trim(),
        durationToGetJob: calculatedDuration,
      };
    });
    localStorage.setItem("alumni_data", JSON.stringify(STUDENTS));
    updateDashboardAndTable();
    e && showToast("อัปเดตข้อมูลล่าสุดแล้ว", !1);
  } else {
    e && showToast("เชื่อมต่อข้อมูลล้มเหลว", !0);
  }
}

function updateDashboardAndTable() {
  const e = [...new Set(STUDENTS.map((e) => e.gradYear))]
    .filter((e) => e)
    .sort()
    .reverse();
  const t = document.getElementById("yearFilter");
  t &&
    (t.innerHTML =
      '<option value="">ทุกรุ่นที่จบ (พ.ศ.)</option>' +
      e.map((e) => `<option>${e}</option>`).join(""));
  "dash" === currentPage && renderDash();
  "students" === currentPage && renderTable();
}

function initApp() {
  document.getElementById("app").classList.remove("hidden");
  const e = currentUser.name || currentUser.username,
    t = "admin" === currentUser.role ? "👑 ผู้ดูแลระบบ" : "👁 ผู้บริหาร";
  document.getElementById("topUserName").textContent = e;
  document.getElementById("dropUserName").textContent = e;
  document.getElementById("dropUserRole").textContent = t;
  document.getElementById("sideNav").innerHTML = [
    { id: "dash", icon: "layout-dashboard", label: "ภาพรวมระบบ" },
    { id: "students", icon: "users", label: "ฐานข้อมูลศิษย์เก่า" },
  ]
    .map(
      (e) => `
    <a href="#${e.id}" class="nav-item${e.id === currentPage ? " active" : ""}" onclick="navTo('${e.id}'); return false;">
      <div class="nav-icon"><i data-lucide="${e.icon}"></i></div>
      <span class="nav-label">${e.label}</span>
    </a>`,
    )
    .join("");
  lucide.createIcons();
  initFacultyFilters();
  updateDashboardAndTable();
  navTo("dash");
}

function navTo(e) {
  currentPage = e;
  document.querySelectorAll(".nav-item").forEach((t) => {
    t.classList.toggle("active", t.getAttribute("onclick") === `navTo('${e}')`);
  });
  ["dash", "students"].forEach((t) => {
    const n = document.getElementById(
      "page" + t.charAt(0).toUpperCase() + t.slice(1),
    );
    n && n.classList.toggle("hidden", t !== e);
  });
  document.getElementById("topbarTitle").textContent = {
    dash: "ภาพรวมระบบสำหรับผู้บริหาร",
    students: "ฐานข้อมูลศิษย์เก่า",
  }[e];
  document.getElementById("topbarSub").textContent =
    `ข้อมูลปรับปรุงล่าสุด: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`;
  document
    .getElementById("topAddBtn")
    .classList.toggle(
      "hidden",
      !("students" === e && currentUser && "admin" === currentUser.role),
    );
  const importBtn = document.getElementById("topImportBtn");
  if (importBtn)
    importBtn.classList.toggle(
      "hidden",
      !("students" === e && currentUser && "admin" === currentUser.role),
    );
  "dash" === e && renderDash();
  "students" === e && renderTable();
}

function initFacultyFilters() {
  const defaultFaculty = "คณะวิศวกรรมศาสตร์และเทคโนโลยี";
  const brContainer = document.getElementById("filter-br-btns");
  if (brContainer && FACULTY_DATA[defaultFaculty]) {
    let html =
      "<button class=\"choice-btn choice-btn-sm selected\" onclick=\"setFilterBr('ทั้งหมด', 'ทั้งหมด', this)\">สาขาทั้งหมด</button>";
    FACULTY_DATA[defaultFaculty].forEach((e) => {
      html += `<button class="choice-btn choice-btn-sm" onclick="setFilterBr('${e.id}', '${e.name}', this)">${e.id} ${e.name}</button>`;
    });
    brContainer.innerHTML = html;
  }
}

function setFilterBr(e, t, n) {
  filterBrId = e;
  filterBr = t;
  document
    .getElementById("filter-br-btns")
    .querySelectorAll(".choice-btn")
    .forEach((e) => e.classList.remove("selected"));
  n && n.classList.add("selected");
  renderTable();
}

function setFilterStatus(e, t) {
  filterStatus = e;
  const n = document.getElementById("filter-status-group");
  n &&
    (n.querySelectorAll("button").forEach((e) => e.classList.remove("active")),
    t && t.classList.add("active"));
  renderTable();
}

document.addEventListener("DOMContentLoaded", () => {
  checkSetup();
  lucide.createIcons();
  bindPanel("profileWrap");

  const e = localStorage.getItem("alumni_user");
  if (e) {
    try {
      currentUser = JSON.parse(e);
      const t = localStorage.getItem("alumni_data");
      t && (STUDENTS = JSON.parse(t));
      document.getElementById("loginPage").classList.add("hidden");
      initApp();
      fetchData(!1);
    } catch (e) {
      document.getElementById("loginPage").classList.remove("hidden");
    }
  } else {
    document.getElementById("loginPage").classList.remove("hidden");
  }
  const t = document.getElementById("inpPass"),
    n = document.getElementById("inpUser");
  t &&
    t.addEventListener("keydown", (e) => {
      "Enter" === e.key && doLogin();
    });
  n &&
    n.addEventListener("keydown", (e) => {
      "Enter" === e.key && doLogin();
    });
});

let chartLibraryLoading = null;
function loadChartLibrary() {
  return window.Chart
    ? Promise.resolve()
    : chartLibraryLoading ||
        ((chartLibraryLoading = new Promise((e) => {
          const t = document.createElement("script");
          t.src =
            "https://cdn.jsdelivr.net/npm/chart.js@latest/dist/chart.umd.js";
          t.async = !0;
          t.onload = () => e();
          document.body.appendChild(t);
        })),
        chartLibraryLoading);
}

function renderDash() {
  const e = document.getElementById("pageDash"),
    t = STUDENTS.length;
  if (0 === t)
    return (
      (e.innerHTML =
        '<div class="empty-state" style="margin-top:60px;"><i data-lucide="bar-chart-3" class="empty-icon" style="width:64px;height:64px;"></i><div>ยังไม่มีข้อมูลศิษย์เก่าในระบบ</div></div>'),
      void lucide.createIcons()
    );
  const n = STUDENTS.filter(
    (e) => "ไม่จบการศึกษา" === e.jobStatus || "พ้นสภาพ" === e.jobStatus,
  );
  const a = STUDENTS.filter(
    (e) => "ไม่จบการศึกษา" !== e.jobStatus && "พ้นสภาพ" !== e.jobStatus,
  );
  const i = a.filter((e) => "ทำงาน" === e.jobStatus);
  const r = a.filter(
    (e) => "ศึกษาต่อ" === e.jobStatus || "ศึกษาต่อในประเทศ" === e.jobStatus,
  );
  const o = a.filter((e) => "ศึกษาต่อต่างประเทศ" === e.jobStatus);
  const s = r.length + o.length;
  const l = a.filter(
    (e) => "ว่างงาน" === e.jobStatus || "กำลังหางาน" === e.jobStatus,
  );
  const d = i.filter((e) => e.jobSalary > 0).map((e) => Number(e.jobSalary));
  const c = d.length ? Math.round(d.reduce((e, t) => e + t, 0) / d.length) : 0;
  const p = a.length ? Math.round((i.length / a.length) * 100) : 0;
  const s_percent = a.length ? Math.round((s / a.length) * 100) : 0;
  const l_percent = a.length ? Math.round((l.length / a.length) * 100) : 0;
  let u = 0,
    m = 0;
  i.forEach((e) => {
    if (
      e.gradDate &&
      e.jobStartDate &&
      "-" !== e.gradDate &&
      "-" !== e.jobStartDate
    ) {
      const t = new Date(e.gradDate),
        n = new Date(e.jobStartDate);
      if (!isNaN(t) && !isNaN(n) && n >= t) {
        const e = Math.abs(n - t);
        u += e / 2630016e3;
        m++;
      }
    }
  });
  const g = m > 0 ? (u / m).toFixed(1) : 0;
  const h = [...new Set(a.map((e) => e.gradYear))]
    .filter(Boolean)
    .sort()
    .slice(-7);
  const f = h.map(
    (e) => a.filter((t) => String(t.gradYear) === String(e)).length,
  );
  const b = h.map(
    (e) => i.filter((t) => String(t.gradYear) === String(e)).length,
  );
  const v = {};
  a.forEach((e) => {
    if (e.branch && "-" !== e.branch) {
      const t = e.branch + (e.branchCode ? ` (${e.branchCode})` : "");
      v[t] = (v[t] || 0) + 1;
    }
  });
  const y = Object.entries(v).sort((e, t) => t[1] - e[1]);
  let x = [],
    S = [],
    D = 0;
  y.forEach((e, t) => {
    t < 5 ? (x.push(e[0]), S.push(e[1])) : (D += e[1]);
  });
  D > 0 && (x.push("เทคโนโลยีดิจิทัลและสารสนเทศ (DIT)"), S.push(D));
  0 === x.length && (x.push("ไม่มีข้อมูลระบุสาขา"), S.push(1));
  const E = {};
  a.forEach((e) => {
    const t =
      e.branch && "-" !== e.branch
        ? e.branch + (e.branchCode ? ` (${e.branchCode})` : "")
        : "ไม่ระบุสาขา";
    E[t] || (E[t] = { total: 0, emp: 0 });
    E[t].total++;
    "ทำงาน" === e.jobStatus && E[t].emp++;
  });
  const w = Object.entries(E)
    .sort((e, t) => t[1].total - e[1].total)
    .map((e) => {
      const t = e[0],
        n = e[1],
        a = n.total ? Math.round((n.emp / n.total) * 100) : 0;
      return `
      <div class="clickable-item branch-stat-item" onclick="viewBranch('${esc(t)}')" style="position:relative;">
        <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; margin-bottom:12px; color:var(--text); align-items:baseline; flex-wrap:wrap;">
          <span style="flex:1; word-break:break-word; min-width:150px;">${esc(t)}</span>
          <span class="click-hint" style="margin-left:12px; white-space:nowrap;"><i data-lucide="mouse-pointer-click" style="width:10px;"></i> คลิก</span>
        </div>
        <div style="display:flex; gap:16px; margin-bottom:12px; font-size:13px; flex-wrap:wrap;">
          <div style="flex:1; min-width:120px;">
            <div style="color:var(--text-muted); font-size:12px; font-weight:600; margin-bottom:4px;">จำนวนบัณฑิต</div>
            <div style="font-size:16px; font-weight:800; color:var(--primary);">${n.total} <span style="font-size:12px; color:var(--text-muted); font-weight:600;">คน</span></div>
          </div>
          <div style="flex:1; min-width:120px;">
            <div style="color:var(--text-muted); font-size:12px; font-weight:600; margin-bottom:4px;">ได้งานทำ</div>
            <div style="font-size:16px; font-weight:800; color:var(--success);">${n.emp} <span style="font-size:12px; color:var(--text-muted); font-weight:600;">คน</span></div>
          </div>
          <div style="flex:1; min-width:120px; text-align:center; padding:0 12px; background:var(--accent-soft); border-radius:8px; display:flex; flex-direction:column; justify-content:center;">
            <div style="color:var(--accent); font-size:11px; font-weight:600; margin-bottom:4px;">อัตราการได้งาน</div>
            <div style="font-size:20px; font-weight:800; color:var(--accent);">${a}%</div>
          </div>
        </div>
        <div style="height:8px; background:var(--bg); border-radius:99px; overflow:hidden; margin-top:8px;">
          <div style="width:${a}%; height:100%; background:var(--success); border-radius:99px; transition:width 0.3s cubic-bezier(0.16, 1, 0.3, 1);"></div>
        </div>
      </div>`;
    })
    .join("");
  const j = new Date().toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
  let C = [];
  if (i.length > 0) {
    const e = {};
    i.forEach((t) => {
      t.jobCompany &&
        "-" !== t.jobCompany &&
        (e[t.jobCompany] = (e[t.jobCompany] || []).concat(t));
    });
    C = Object.entries(e)
      .sort((e, t) => t[1].length - e[1].length)
      .slice(0, 7);
  }
  const _ = [
    "#fffbeb|#d97706",
    "#eff6ff|#1d4ed8",
    "#ecfdf5|#059669",
    "#f5f3ff|#6d28d9",
    "#fdf2f8|#be185d",
    "#fff7ed|#c2410c",
    "#f0f9ff|#0369a1",
  ];
  e.innerHTML = `
  <div class="exec-summary fade-in">
    <div class="exec-summary-icon"><i data-lucide="bar-chart-4" style="width:36px;height:36px;"></i></div>
    <div class="exec-summary-text">
      <h3>สรุปข้อมูลรายเดือนสำหรับผู้บริหาร (ประจำเดือน ${j})</h3>
      <p>ระบบมีข้อมูลศิษย์เก่าทั้งหมด <strong>${t} คน</strong> (ผู้สำเร็จการศึกษา ${a.length} คน) แบ่งเป็นสัดส่วนดังนี้:<br>
      <span style="display:inline-block; margin-top:8px; background:rgba(0,0,0,0.2); padding:8px 16px; border-radius:12px;">
        <span style="color:#4ade80;">● ได้งานทำ <strong>${p}%</strong></span> <span style="opacity:0.5; margin:0 8px;">|</span> 
        <span style="color:#facc15;">● ว่างงาน <strong>${l_percent}%</strong></span> <span style="opacity:0.5; margin:0 8px;">|</span> 
        <span style="color:#60a5fa;">● ศึกษาต่อ <strong>${s_percent}%</strong></span>
      </span>
      <br><span style="font-size:13px; opacity:0.8; margin-top:8px; display:inline-block;">(ผู้ที่ได้งานทำ ใช้เวลาเฉลี่ยในการหางานหลังจบการศึกษา <strong>${g} เดือน</strong>)</span></p>
    </div>
  </div>

  <div class="stats-grid fade-in">
    ${[
      [
        "check-circle-2",
        "อัตราการรับเข้าทำงาน",
        p + "%",
        `ทำงาน ${i.length} จาก ${a.length} คน`,
        "var(--success)",
        "var(--success-soft)",
      ],
      [
        "clock",
        "ระยะเวลาเฉลี่ยได้งาน",
        g,
        "เดือน (หลังจบการศึกษา)",
        "var(--warning)",
        "var(--warning-soft)",
      ],
      [
        "graduation-cap",
        "สถานะการเรียน",
        `${a.length} / ${n.length}`,
        "คน (จบสำเร็จ / พ้นสภาพ)",
        "#8b5cf6",
        "#f5f3ff",
      ],
      [
        "plane",
        "การศึกษาต่อ (ในไทย/ตปท.)",
        `${r.length} / ${o.length}`,
        "คน",
        "var(--accent)",
        "var(--accent-soft)",
      ],
      [
        "trending-up",
        "อัตราเงินเดือนเฉลี่ย",
        fmtMoney(c),
        "บาท/เดือน",
        "#3b82f6",
        "#eff6ff",
      ],
      [
        "users",
        "จำนวนศิษย์เก่าทั้งหมด",
        t,
        "คน (ในระบบฐานข้อมูล)",
        "#0ea5e9",
        "#e0f2fe",
      ],
    ]
      .map(
        ([e, t, n, a, i, r]) => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${r}; color:${i};"><i data-lucide="${e}"></i></div>
        <div>
          <div class="stat-label">${t}</div>
          <div class="stat-value" style="color:${i}">${n}</div>
          <div class="stat-sub">${a}</div>
        </div>
      </div>`,
      )
      .join("")}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px" class="fade-in">
    <div class="card">
      <div class="card-header">สัดส่วนสถานะการทำงาน <span style="font-size:13px;font-weight:600;color:var(--text-muted);">คลิกดูรายชื่อได้</span></div>
      <div class="card-body" style="display:flex; flex-direction:column; gap:24px;">
        ${[
          {
            l: "ทำงานแล้ว",
            n: i.length,
            c: "var(--success)",
            fn: "viewStatus('ทำงาน')",
          },
          {
            l: "ศึกษาต่อ (รวมต่างประเทศ)",
            n: s,
            c: "var(--accent)",
            fn: "viewStatus('ศึกษาต่อ')",
          },
          {
            l: "อยู่ระหว่างหางาน",
            n: l.length,
            c: "var(--warning)",
            fn: "viewStatus('ว่างงาน')",
          },
        ]
          .map((e) => {
            const d = a.length ? Math.round((e.n / a.length) * 100) : 0;
            return `
        <div class="clickable-item branch-stat-item" onclick="${e.fn}" style="position:relative;">
          <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; margin-bottom:12px; color:var(--text); align-items:baseline; flex-wrap:wrap;">
            <span style="flex:1; word-break:break-word; min-width:150px;">${e.l}</span>
            <span class="click-hint" style="margin-left:12px; white-space:nowrap;"><i data-lucide="mouse-pointer-click" style="width:10px;"></i> คลิก</span>
          </div>
          <div style="display:flex; gap:16px; margin-bottom:12px; font-size:13px; flex-wrap:wrap;">
            <div style="flex:1; min-width:120px;">
              <div style="color:var(--text-muted); font-size:12px; font-weight:600; margin-bottom:4px;">จำนวน</div>
              <div style="font-size:16px; font-weight:800; color:var(--text);">${e.n} <span style="font-size:12px; color:var(--text-muted); font-weight:600;">คน</span></div>
            </div>
            <div style="flex:1; min-width:120px; text-align:center; padding:0 12px; background:${e.c}15; border-radius:8px; display:flex; flex-direction:column; justify-content:center;">
              <div style="color:${e.c}; font-size:11px; font-weight:600; margin-bottom:4px;">สัดส่วน</div>
              <div style="font-size:20px; font-weight:800; color:${e.c};">${d}%</div>
            </div>
          </div>
          <div style="height:8px; background:var(--bg); border-radius:99px; overflow:hidden; margin-top:8px;">
            <div style="width:${d}%; height:100%; background:${e.c}; border-radius:99px; transition:width 0.3s cubic-bezier(0.16, 1, 0.3, 1);"></div>
          </div>
        </div>`;
          })
          .join("")}
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">อัตราการได้งานทำแยกตามสาขา</div>
      <div class="card-body" style="height:360px;overflow:auto;padding-top:20px; display:flex; flex-direction:column; gap:16px;">
        ${w || '<div class="empty-state" style="padding:40px;">ไม่มีข้อมูล</div>'}
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px" class="fade-in">
    <div class="card">
      <div class="card-header">ท็อปบริษัทที่รับเข้าทำงาน <span style="font-size:13px;color:var(--accent);font-weight:600;padding:6px 12px;background:var(--accent-soft);border-radius:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><i data-lucide="mouse-pointer-click" style="width:14px;height:14px;"></i> ดูรายชื่อบริษัทที่รับเข้าทำงาน</span></div>
      <div class="card-body" style="height:320px;overflow:auto;padding-top:16px;">
        ${
          C.length
            ? C.map(([e, t], n) => {
                const [a, i] = _[n % 7].split("|");
                return `
        <div class="person-item" onclick="openCompany('${esc(e)}')">
          <div class="flex flex-center gap-12">
            <div class="co-rank" style="background:${a};color:${i}; width:36px; height:36px; border-radius:10px; font-size:14px; display:flex; align-items:center; justify-content:center;">${n + 1}</div>
            <span style="font-size:15px; font-weight:700; color:var(--text);">${esc(e)}</span>
          </div>
          <div class="flex flex-center gap-10">
            <span style="font-size:14.5px; font-weight:800; color:var(--primary);">${t.length} คน</span>
            <span style="color:var(--text-muted);"><i data-lucide="chevron-right" style="width:18px;height:18px;"></i></span>
          </div>
        </div>`;
              }).join("")
            : '<div style="text-align:center;padding:40px;color:#94a3b8;">ไม่มีข้อมูล</div>'
        }
      </div>
    </div>

    <div class="card">
      <div class="card-header">สัดส่วนผู้สำเร็จการศึกษาแยกตามสาขา <span style="font-size:13px;color:var(--text-muted);font-weight:600;">(คลิกที่กราฟได้)</span></div>
      <div class="card-body">
        <div class="chart-wrapper">
          <canvas id="branchChart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <div class="chart-grid fade-in" style="grid-template-columns: 1fr;">
    <div class="card">
      <div class="card-header">กราฟเส้นแสดงแนวโน้มการรับเข้าทำงานย้อนหลัง ${h.length > 0 ? h.length : 0} ปี</div>
      <div class="card-body">
        <div class="chart-wrapper" style="height:380px;">
          <canvas id="trendChart"></canvas>
        </div>
      </div>
    </div>
  </div>
  `;
  lucide.createIcons();
  if (window.Chart) {
    window.trendChartInst && window.trendChartInst.destroy();
    window.branchChartInst && window.branchChartInst.destroy();
    const e = document.getElementById("trendChart");
    if (e && h.length > 0) {
      window.trendChartInst = new Chart(e, {
        type: "line",
        data: {
          labels: h.map((e) => `ปี พ.ศ. ${e}`),
          datasets: [
            {
              label: "ผู้สำเร็จการศึกษาทั้งหมด",
              data: f,
              borderColor: "#94a3b8",
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              fill: !1,
              tension: 0.3,
            },
            {
              label: "ผู้ได้งานทำ",
              data: b,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              borderWidth: 3,
              fill: !0,
              tension: 0.3,
              pointBackgroundColor: "#fff",
              pointBorderColor: "#2563eb",
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: !0,
          maintainAspectRatio: !1,
          plugins: { legend: { position: "bottom" } },
          scales: { y: { beginAtZero: !0 } },
        },
      });
    }
    const t = document.getElementById("branchChart");
    if (t && x.length > 0) {
      window.branchChartInst = new Chart(t, {
        type: "doughnut",
        data: {
          labels: x,
          datasets: [
            {
              data: S,
              backgroundColor: [
                "#2563eb",
                "#10b981",
                "#f59e0b",
                "#8b5cf6",
                "#ec4899",
                "#cbd5e1",
              ],
              borderWidth: 3,
              borderColor: "#ffffff",
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: !0,
          maintainAspectRatio: !1,
          cutout: "70%",
          plugins: { legend: { position: "right" } },
          onClick: (_e, t) => {
            if (t.length > 0) viewBranch(x[t[0].index]);
          },
        },
      });
    }
  }
}

function openGroupModal(e, t, n, a = null) {
  document.getElementById("listModalTitleText").innerHTML =
    `<i data-lucide="${t}" style="width:28px;height:28px;"></i> ${e}`;
  document.getElementById("listModalSub").textContent =
    `ค้นพบทั้งหมด ${n.length} คน`;
  const i = {};
  n.forEach((e) => {
    const t = e.gradYear || "ไม่ระบุปี";
    i[t] || (i[t] = []);
    i[t].push(e);
  });
  const r = Object.keys(i).sort((e, t) => t - e);
  let o = "";
  if (0 === n.length) {
    o =
      '<div class="empty-state" style="padding:40px;"><i data-lucide="folder-search" style="width:64px;height:64px;color:#cbd5e1;margin-bottom:16px;"></i><div style="font-size:16px;">ไม่พบข้อมูลศิษย์เก่าในหมวดหมู่นี้</div></div>';
  } else {
    r.forEach((e) => {
      o += `<div class="list-group-header"><i data-lucide="calendar" style="width:20px;margin-right:8px;"></i> รุ่นปี พ.ศ. ${esc(e)} <span style="font-size:14px; opacity:0.8; font-weight:normal; margin-left:12px;">(รวม ${i[e].length} คน)</span></div>`;
      const t = {};
      i[e].forEach((e) => {
        const n =
          (e.branch || "ไม่ระบุสาขา") +
          (e.branchCode ? ` (${e.branchCode})` : "");
        t[n] || (t[n] = []);
        t[n].push(e);
      });
      Object.keys(t)
        .sort()
        .forEach((e) => {
          o += `<div class="list-branch-header"><i data-lucide="graduation-cap" style="width:16px;"></i> สาขา: ${esc(e)} <span style="color:var(--text-muted);font-size:13px;">(${t[e].length} คน)</span></div>`;
          t[e].forEach((e) => {
            let t = a ? a(e) : "",
              n =
                "ทำงาน" === e.jobStatus
                  ? `ตำแหน่ง: ${esc(e.jobPosition)} @ ${esc(e.jobCompany)}`
                  : `อีเมล: ${esc(e.email)}`;
            o += `
            <div class="person-item" onclick="closeAllModals(); openDetail('${esc(e.idCard)}')">
              <div>
                <div style="font-weight:800;font-size:15.5px;color:var(--text);display:flex;align-items:center;gap:8px;">
                  ${esc(e.prefix + e.nameTH + " " + e.surnameTH)} ${t}
                </div>
                <div style="font-size:13.5px;color:var(--text-muted);margin-top:4px;">${n}</div>
              </div>
              <div style="text-align:right">
                ${e.jobSalary > 0
                  ? `<div style="font-size:15px;font-weight:800;color:var(--success)">${fmtMoney(e.jobSalary)}</div>`
                  : "ศึกษาต่อต่างประเทศ" === e.jobStatus
                    ? '<span class="study-tag tag-abroad" style="font-size:12.5px;padding:4px 12px;"><i data-lucide="globe" style="width:13px;height:13px;"></i> 🌍 ต่างประเทศ</span>'
                    : ("ศึกษาต่อ" === e.jobStatus || "ศึกษาต่อในประเทศ" === e.jobStatus)
                      ? '<span class="study-tag tag-local" style="font-size:12.5px;padding:4px 12px;"><i data-lucide="book-open" style="width:13px;height:13px;"></i> 🇹🇭 ในประเทศ</span>'
                      : ("ว่างงาน" === e.jobStatus || "กำลังหางาน" === e.jobStatus)
                        ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:var(--warning);background:var(--warning-soft);border:1px solid rgba(245,158,11,0.2);padding:4px 12px;border-radius:20px;"><i data-lucide="search" style="width:13px;height:13px;"></i> ⏳ ว่างงาน</span>'
                        : `<div style="font-size:13px;color:var(--text-muted);font-weight:700; background:var(--bg); padding:4px 10px; border-radius:12px;">${esc(e.jobStatus)}</div>`}
              </div>
            </div>`;
          });
        });
    });
  }
  document.getElementById("listModalBody").innerHTML = o;
  lucide.createIcons();
  openModal("modalGenericList");
}
function renderTable() {
  const e = document.getElementById("searchInput"),
    t = e ? e.value.toLowerCase().trim() : "",
    n = t ? t.split(/\s+/) : [],
    a = document.getElementById("yearFilter"),
    i = a ? a.value : "",
    r = (e) =>
      String(e || "")
        .toLowerCase()
        .replace(/\s+/g, "");
  const o = STUDENTS.filter((e) => {
    const t = [
      e.nameTH,
      e.surnameTH,
      e.nameEN,
      e.idCard,
      e.jobCompany,
      e.jobPosition,
      e.phone,
      e.email,
      e.faculty,
      e.branchCode,
      e.branch,
    ]
      .join(" ")
      .toLowerCase();
    const a = 0 === n.length || n.every((e) => t.includes(e));
    const o =
      "ทั้งหมด" === filterStatus ||
      e.jobStatus === filterStatus ||
      ("ศึกษาต่อ" === filterStatus && "ศึกษาต่อต่างประเทศ" === e.jobStatus) ||
      ("ไม่จบการศึกษา" === filterStatus && "พ้นสภาพ" === e.jobStatus);
    const s = !i || String(e.gradYear) === i;
    const p = r(e.branch),
      u = r(e.branchCode),
      m = r(filterBr),
      g = r(filterBrId),
      h =
        "ทั้งหมด" === filterBr ||
        p.includes(m) ||
        u.includes(g) ||
        p.includes(g) ||
        m.includes(p);
    return a && o && s && h;
  });
  const s = document.getElementById("rowCount");
  s && (s.textContent = `พบ ${o.length} จาก ${STUDENTS.length} รายการ`);
  const l = currentUser && "admin" === currentUser.role;
  const d = document.getElementById("studentTbody");
  const c = document.getElementById("emptyState");
  const p = document.querySelector(".table-wrap table");
  if (!o.length) {
    d.innerHTML = "";
    c.classList.remove("hidden");
    p.classList.add("hidden");
    return;
  }
  c.classList.add("hidden");
  p.classList.remove("hidden");
  d.innerHTML = o
    .map((e, t) => {
      let n = "-";
      if (e.durationToGetJob && e.durationToGetJob !== "-") {
        if ("ทำงาน" === e.jobStatus) {
          n = `<div style="font-size:12px;font-weight:700;color:var(--success);background:var(--success-soft);padding:4px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> ${esc(e.durationToGetJob)}</div>`;
        } else if (["ว่างงาน", "กำลังหางาน"].includes(e.jobStatus)) {
          n = `<div style="font-size:12px;font-weight:700;color:var(--danger);background:var(--danger-soft);padding:4px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> ว่างงานมาแล้ว ${esc(e.durationToGetJob)}</div>`;
        }
      }
      let a =
        "ทำงาน" === e.jobStatus
          ? "check-circle-2"
          : "ศึกษาต่อต่างประเทศ" === e.jobStatus
            ? "globe"
            : "ศึกษาต่อ" === e.jobStatus || "ศึกษาต่อในประเทศ" === e.jobStatus
              ? "book-open"
              : "ไม่จบการศึกษา" === e.jobStatus || "พ้นสภาพ" === e.jobStatus
                ? "x-circle"
                : "search";
      const studyLabel =
        "ศึกษาต่อต่างประเทศ" === e.jobStatus
          ? '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;"><span class="badge ' +
            jcBadge(e.jobStatus) +
            '"><i data-lucide="globe" style="width:14px;height:14px;"></i> ศึกษาต่อ</span><span style="font-size:11px;font-weight:700;color:#7c3aed;background:#f3e8ff;padding:2px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:4px;">🌍 ต่างประเทศ</span></div>'
          : "ศึกษาต่อ" === e.jobStatus || "ศึกษาต่อในประเทศ" === e.jobStatus
            ? '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;"><span class="badge ' +
              jcBadge(e.jobStatus) +
              '"><i data-lucide="book-open" style="width:14px;height:14px;"></i> ศึกษาต่อ</span><span style="font-size:11px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:10px;display:inline-flex;align-items:center;gap:4px;">🇹🇭 ในประเทศ</span></div>'
            : null;
      return `
    <tr class="fade-in">
      <td style="color:var(--text-muted);font-size:14px;text-align:center;font-weight:700;">${t + 1}</td>
      <td>
        <div style="display:flex;flex-direction:column;gap:1px;">
          <div style="font-weight:700;font-size:14.5px;color:var(--text);line-height:1.5;white-space:nowrap;">${esc(e.prefix)}${esc(e.nameTH)} ${esc(e.surnameTH)}${e.nickname ? ' <span style="font-weight:600;font-size:12.5px;color:var(--accent);opacity:0.85;">(' + esc(e.nickname) + ")</span>" : ""}</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.4;font-style:italic;letter-spacing:0.2px;">${esc(e.nameEN)} ${esc(e.surnameEN)}</div>
        </div>
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div style="font-size:12.5px;font-weight:600;color:var(--text-muted);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">${esc(e.faculty || "-")}</div>
          <div style="display:inline-flex;align-items:center;gap:5px;flex-wrap:nowrap;">${e.branchCode ? '<span style="display:inline-flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;color:#fff;background:var(--accent);padding:2px 7px;border-radius:5px;letter-spacing:0.3px;line-height:1.4;flex-shrink:0;">' + esc(e.branchCode) + "</span>" : ""}<span style="font-size:13px;font-weight:700;color:var(--text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(e.branch || "")}</span></div>
        </div>
      </td>
      <td>
        <div style="font-size:14.5px;font-weight:800;color:var(--accent);">พ.ศ. ${esc(e.gradYear)}</div>
        <div style="font-size:13px;color:${"ชาย" === e.gender ? "#0284c7" : "#db2777"};font-weight:700; margin-top:2px;">${esc(e.gender)}</div>
      </td>
      <td style="color:var(--text-muted);font-size:14px;">
        <div style="font-weight:600;display:flex;align-items:center;gap:6px; margin-bottom:4px;"><i data-lucide="phone" style="width:14px;height:14px;"></i> ${esc(e.phone)}</div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;"><i data-lucide="mail" style="width:14px;height:14px;"></i> ${esc(e.email)}</div>
      </td>
      <td>${studyLabel ? studyLabel : '<span class="badge ' + jcBadge(e.jobStatus) + '"><i data-lucide="' + a + '" style="width:14px;height:14px;"></i> ' + esc(e.jobStatus) + "</span>"}</td>
      <td style="max-width:200px">
        <div style="font-size:14px;font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.jobCompany || "-")}</div>
        <div style="font-size:13px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; margin-top:2px;">${esc(e.jobPosition || "")}</div>
      </td>
      <td style="font-weight:800;color:var(--text);white-space:nowrap;font-size:15px;">${fmtMoney(e.jobSalary)}</td>
      <td>${n}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="openDetail('${esc(e.idCard)}')"><i data-lucide="eye" style="width:16px;height:16px;"></i> ข้อมูล</button>
          ${
            l
              ? `<button class="btn btn-success btn-sm" onclick="openEdit('${esc(e.idCard)}')"><i data-lucide="edit-2" style="width:16px;height:16px;"></i> แก้ไข</button>
          <button class="btn btn-danger btn-sm" onclick="openConfirmDel('${esc(e.idCard)}')"><i data-lucide="trash-2" style="width:16px;height:16px;"></i> ลบ</button>`
              : ""
          }
        </div>
      </td>
    </tr>`;
    })
    .join("");
  lucide.createIcons();
}

function openModal(e) {
  document.getElementById("modalBackdrop").classList.remove("hidden");
  document.getElementById(e).classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeAllModals() {
  document.getElementById("modalBackdrop").classList.add("hidden");
  document
    .querySelectorAll(".modal-box")
    .forEach((e) => e.classList.add("hidden"));
  document.body.classList.remove("modal-open");
}

function openDetail(e) {
  const t = STUDENTS.find((t) => String(t.idCard) === String(e));
  if (!t) return;
  const n =
    "ทำงาน" === t.jobStatus
      ? { bg: "var(--success)", tx: "#fff" }
      : "ศึกษาต่อ" === t.jobStatus || "ศึกษาต่อต่างประเทศ" === t.jobStatus
        ? { bg: "var(--accent)", tx: "#fff" }
        : "ไม่จบการศึกษา" === t.jobStatus || "พ้นสภาพ" === t.jobStatus
          ? { bg: "var(--danger)", tx: "#fff" }
          : { bg: "var(--warning)", tx: "#fff" };
  const a = currentUser && "admin" === currentUser.role;
  document.getElementById("detailHeader").innerHTML = `
    <div>
      <h2>${esc(t.prefix + t.nameTH + " " + t.surnameTH)}</h2>
      <div class="sub">${esc(t.nameEN + " " + t.surnameEN)} · ศิษย์เก่ารุ่นปี พ.ศ. ${t.gradYear}</div>
    </div>
    <div class="flex flex-center gap-10">
      <span class="badge" style="background:${n.bg};color:${n.tx};font-size:14.5px;padding:8px 18px;border-radius:12px;">${esc(t.jobStatus)}</span>
      <button class="close-btn" onclick="closeAllModals()"><i data-lucide="x" style="width:24px;height:24px;"></i></button>
    </div>`;
  const i = (e, t, n = !1) =>
    `<div class="detail-field${n ? " span-2" : ""}"><label>${e}</label><p>${esc(t || "-")}</p></div>`;
  const r = (e, n, i, r) => `
    <div class="detail-section">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="detail-section-title" style="margin-bottom:0;"><i data-lucide="${n}" style="width:18px;height:18px;"></i> ${e}</div>
        ${a ? `<button class="btn btn-outline btn-sm" style="padding:6px 12px; font-size:12.5px; border-radius:8px;" onclick="closeAllModals(); openEdit('${t.idCard}', '${i}')"><i data-lucide="edit" style="width:14px;height:14px;"></i> แก้ไขส่วนนี้</button>` : ""}
      </div>
      <div class="detail-grid">${r}</div>
    </div>`;
  const l = t.durationToGetJob || "-";
  document.getElementById("detailBody").innerHTML = `
    ${r("ข้อมูลส่วนบุคคลและการศึกษา", "user", "sec-personal", i("เลขบัตรประชาชน", t.idCard, !0) + i("คณะ", t.faculty) + i("รหัสสาขา", t.branchCode) + i("สาขา", t.branch, !0) + i("ชื่อเล่น", t.nickname) + i("เพศ", t.gender) + i("วันเกิด", formatThaiDateShort(t.birthDate)) + i("อายุ", t.age ? t.age + " ปี" : "-") + i("โรคประจำตัว", t.disease, !0))}
    
    ${r("ข้อมูลติดต่อ", "contact", "sec-personal", i("โทรศัพท์", t.phone) + i("อีเมล", t.email) + i("ที่อยู่ปัจจุบัน", t.currentAddress, !0) + i("ที่อยู่ทะเบียนบ้าน", t.homeAddress, !0))}
    
    ${r("ข้อมูลผู้ปกครอง", "users", "sec-parents", i("ชื่อผู้ปกครอง", t.parentName) + i("ความสัมพันธ์", t.parentRelation) + i("โทรศัพท์", t.parentPhone))}
    
    ${r("ประวัติการฝึกงาน / สหกิจศึกษา", "building-2", "sec-intern", i("ปี1 สาขา 7-Eleven", t.internY1_711Branch) + i("ปี1 พื้นที่", t.internY1_711Area) + i("ปี1 รหัสพนง.", t.internY1_711EmpID) + i("ปี2 บริษัท", t.internY2_Company) + i("ปี2 ตำแหน่ง", t.internY2_Position) + i("ปี2 แผนก", t.internY2_Dept) + i("ปี3 บริษัท", t.internY3_Company) + i("ปี3 ตำแหน่ง", t.internY3_Position) + i("ปี3 แผนก", t.internY3_Dept) + i("ปี4 บริษัท", t.internY4_Company) + i("ปี4 ตำแหน่ง", t.internY4_Position) + i("ปี4 แผนก", t.internY4_Dept))}
    
    ${r("การทำงานหลังจบการศึกษา", "briefcase", "sec-job", i("วันที่จบการศึกษา", formatThaiDateShort(t.gradDate)) + i("วันที่เริ่มงาน / บรรจุ", formatThaiDateShort(t.jobStartDate)) + i("บริษัท / องค์กร", t.jobCompany) + i("ตำแหน่ง", t.jobPosition) + i("แผนก / ส่วนงาน", t.jobDept) + i("อัตราเงินเดือน", fmtMoney(t.jobSalary)) + i("สถานะปัจจุบัน", t.jobCurrentStatus) + i("ระยะเวลา", l || "-", !0))}`;
  document.getElementById("detailFooter").innerHTML = a
    ? `
    <button class="btn btn-danger" style="padding:12px 20px;" onclick="closeAllModals();openConfirmDel('${esc(t.idCard)}')"><i data-lucide="trash-2"></i> ลบข้อมูลทั้งหมด</button>
    <button class="btn btn-warning" style="padding:12px 20px;" onclick="closeAllModals();openEdit('${esc(t.idCard)}')"><i data-lucide="edit-2"></i> แก้ไขข้อมูลทั้งหมด</button>`
    : '<button class="btn btn-outline" style="padding:12px 20px;" onclick="closeAllModals()">ปิดหน้าต่าง</button>';
  lucide.createIcons();
  openModal("modalDetail");
}

function openCompany(e) {
  const t = STUDENTS.filter((t) => t.jobCompany === e);
  const n = {};
  t.forEach((e) => {
    const t = e.gradYear || "ไม่ระบุปี";
    n[t] || (n[t] = []);
    n[t].push(e);
  });
  const a = Object.keys(n).sort((e, t) => t - e);
  document.getElementById("coHeader").innerHTML = `
    <div style="color:#fff;">
      <h2 style="display:flex;align-items:center;gap:12px;font-size:24px;"><i data-lucide="building-2" style="width:28px;height:28px;"></i> ${esc(e)}</h2>
      <div style="font-size:14.5px;opacity:0.9; margin-top:4px;">รับศิษย์เก่าเข้าทำงานทั้งหมด ${t.length} คน</div>
    </div>
    <button class="modal-close-fancy" onclick="closeAllModals()"><i data-lucide="x" style="width:24px;height:24px;"></i></button>`;
  let i = "";
  a.forEach((e) => {
    i += `<div class="list-group-header"><i data-lucide="calendar" style="width:20px;margin-right:8px;"></i> รุ่นปี พ.ศ. ${esc(e)} <span style="font-size:14px; opacity:0.8; font-weight:normal; margin-left:12px;">(รวม ${n[e].length} คน)</span></div>`;
    const t = {};
    n[e].forEach((e) => {
      const n =
        (e.branch || "ไม่ระบุสาขา") +
        (e.branchCode ? ` (${e.branchCode})` : "");
      t[n] || (t[n] = []);
      t[n].push(e);
    });
    Object.keys(t)
      .sort()
      .forEach((e) => {
        i += `<div class="list-branch-header"><i data-lucide="graduation-cap" style="width:16px;"></i> สาขา: ${esc(e)} <span style="color:var(--text-muted);font-size:13px;">(${t[e].length} คน)</span></div>`;
        t[e].forEach((e) => {
          i += `
          <div class="person-item" onclick="closeAllModals();openDetail('${esc(e.idCard)}')">
            <div>
              <div style="font-weight:800;font-size:15.5px;color:var(--text);">${esc(e.prefix + e.nameTH + " " + e.surnameTH)}</div>
              <div style="font-size:13.5px;color:var(--text-muted); margin-top:4px;">ตำแหน่ง: ${esc(e.jobPosition)}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:15px;font-weight:800;color:var(--success)">${fmtMoney(e.jobSalary)}</div>
            </div>
          </div>`;
        });
      });
  });
  document.getElementById("coBody").innerHTML = i;
  lucide.createIcons();
  openModal("modalCompany");
}

function getFormHTML() {
  return `
  <!-- CATEGORY 1 -->
  <div class="form-category-card" id="sec-personal">
    <div class="cat-header bg-blue"><i data-lucide="user" style="width:20px;height:20px;"></i> 1. ข้อมูลการศึกษา และข้อมูลส่วนตัว</div>
    <div class="cat-body form-grid">
      <div class="form-sub-header"><i data-lucide="graduation-cap" style="width:16px;"></i> ข้อมูลการศึกษา</div>
      <div class="form-group"><label>รุ่นที่จบการศึกษา (พ.ศ.) <span class="required-indicator">*</span></label><input type="text" id="f_gradYear" placeholder="เช่น 67 หรือ 2567" maxlength="4"></div>
      <div class="form-group"><label>เลขบัตรประชาชน <span class="required-indicator">*</span></label><input type="text" id="f_idCard" placeholder="13 หลัก" maxlength="13">
        <div id="idCardNote" style="font-size:12px; color:var(--danger); margin-top:6px; display:none; font-weight:600;">* ระบบไม่อนุญาตให้แก้ไขเลขบัตรฯ (หากผิดให้ลบทิ้งแล้วเพิ่มใหม่)</div>
      </div>
      <div class="form-group span-2" style="background:var(--bg);padding:24px;border-radius:16px;border:1px solid var(--border);margin-bottom:0;">
        <input type="hidden" id="f_faculty" value="คณะวิศวกรรมศาสตร์และเทคโนโลยี">
        <div id="form-branch-container">
          <label>สาขาวิชา <span class="required-indicator">*</span></label>
          <div id="form-branch-btns" style="display:flex;flex-wrap:wrap;gap:10px;"></div>
          <input type="hidden" id="f_branch">
        </div>
      </div>
      <div class="form-group span-2"><label>รหัสสาขา</label><input type="text" id="f_branchCode" readonly placeholder="เลือกระบุสาขาด้านบนเพื่อเติมรหัสอัตโนมัติ"></div>
      
      <div class="form-sub-header" style="margin-top:16px;"><i data-lucide="user-circle" style="width:16px;"></i> ข้อมูลส่วนบุคคล</div>
      <div class="form-group"><label>คำนำหน้า <span class="required-indicator">*</span></label><select id="f_prefix"><option value="">เลือก</option><option>นาย</option><option>นางสาว</option></select></div>
      <div class="form-group"><label>เพศ <span class="required-indicator">*</span></label><select id="f_gender"><option value="">เลือก</option><option>ชาย</option><option>หญิง</option></select></div>
      <div class="form-group"><label>ชื่อ (ไทย) <span class="required-indicator">*</span></label><input type="text" id="f_nameTH"></div>
      <div class="form-group"><label>นามสกุล (ไทย) <span class="required-indicator">*</span></label><input type="text" id="f_surnameTH"></div>
      <div class="form-group"><label>ชื่อ (อังกฤษ) <span class="required-indicator">*</span></label><input type="text" id="f_nameEN"></div>
      <div class="form-group"><label>นามสกุล (อังกฤษ) <span class="required-indicator">*</span></label><input type="text" id="f_surnameEN"></div>
      <div class="form-group"><label>ชื่อเล่น <span class="required-indicator">*</span></label><input type="text" id="f_nickname"></div>
      <div class="form-group"><label>วันเกิด <span class="required-indicator">*</span></label><input type="text" class="thai-date-mask" id="f_birthDate" placeholder="วว/ดด/ปปปป (พ.ศ.)" maxlength="10"></div>
      <div class="form-group span-2"><label>โรคประจำตัว <span class="required-indicator">*</span></label><input type="text" id="f_disease" placeholder="หากไม่มีให้ใส่ -"></div>

      <div class="form-sub-header" style="margin-top:16px;"><i data-lucide="map-pin" style="width:16px;"></i> ข้อมูลติดต่อ</div>
      <div class="form-group"><label>เบอร์โทรศัพท์ <span class="required-indicator">*</span></label><input type="tel" id="f_phone" placeholder="08x-xxx-xxxx"></div>
      <div class="form-group"><label>อีเมล <span class="required-indicator">*</span></label><input type="email" id="f_email" placeholder="email@example.com"></div>
      <div class="form-group span-2"><label>ที่อยู่ปัจจุบัน <span class="required-indicator">*</span></label><input type="text" id="f_currentAddress" placeholder="บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์"></div>
      <div class="form-group span-2"><label>ที่อยู่ทะเบียนบ้าน <span class="required-indicator">*</span></label><input type="text" id="f_homeAddress" placeholder="บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์"></div>
    </div>
  </div>

  <!-- CATEGORY 2 -->
  <div class="form-category-card" id="sec-parents">
    <div class="cat-header bg-purple"><i data-lucide="users" style="width:20px;height:20px;"></i> 2. ข้อมูลผู้ปกครอง</div>
    <div class="cat-body form-grid">
      <div class="form-group span-2"><label>ชื่อ-สกุลผู้ปกครอง <span class="required-indicator">*</span></label><input id="f_parentName" placeholder="ระบุ ชื่อ-นามสกุล"></div>
      <div class="form-group"><label>โทรศัพท์ผู้ปกครอง <span class="required-indicator">*</span></label><input type="tel" id="f_parentPhone" placeholder="08x-xxx-xxxx"></div>
      <div class="form-group"><label>ความสัมพันธ์ <span class="required-indicator">*</span></label><select id="f_parentRelation"><option value="">เลือกความสัมพันธ์</option><option>บิดา</option><option>มารดา</option><option>พี่ชาย</option><option>น้องชาย</option><option>พี่สาว</option><option>น้องสาว</option><option>ปู่/ย่า/ตา/ยาย</option><option>อื่นๆ</option></select></div>
    </div>
  </div>

  <!-- CATEGORY 3 -->
  <div class="form-category-card" id="sec-intern">
    <div class="cat-header bg-orange"><i data-lucide="building-2" style="width:20px;height:20px;"></i> 3. ประวัติการฝึกงาน / สหกิจศึกษา</div>
    <div class="cat-body form-grid">
      <div class="form-note note-yellow span-2" style="justify-content:center; padding:16px; font-size:15px;"><i data-lucide="pin" style="width:20px;height:20px;"></i> ปี 1 : ฝึกงาน 7-Eleven (บังคับทุกคน)</div>
      <div class="form-group"><label>สาขา 7-Eleven <span class="required-indicator">*</span></label><input id="f_internY1_711Branch" placeholder="สาขา..."></div>
      <div class="form-group"><label>พื้นที่ / ภาค <span class="required-indicator">*</span></label><input id="f_internY1_711Area" placeholder="กทม. / ภาคเหนือ..."></div>
      <div class="form-group span-2"><label>รหัสพนักงานประจำร้าน <span class="required-indicator">*</span></label><input id="f_internY1_711EmpID" placeholder="EMP-XXXXX"></div>
      
      <div class="divider"></div>
      
      <div class="form-sub-header"><i data-lucide="briefcase" style="width:16px;"></i> ปี 2 : ฝึกงานวิชาชีพ</div>
      <div class="form-group"><label>ชื่อบริษัท <span class="required-indicator">*</span></label><input id="f_internY2_Company" placeholder="บริษัท..."></div>
      <div class="form-group"><label>ตำแหน่ง <span class="required-indicator">*</span></label><input id="f_internY2_Position" placeholder="ตำแหน่ง..."></div>
      <div class="form-group span-2"><label>แผนก <span class="required-indicator">*</span></label><input id="f_internY2_Dept" placeholder="แผนก..."></div>
      
      <div class="divider"></div>
      
      <div class="form-sub-header"><i data-lucide="briefcase" style="width:16px;"></i> ปี 3 : ฝึกงานวิชาชีพต่อเนื่อง</div>
      <div class="form-group"><label>ชื่อบริษัท <span class="required-indicator">*</span></label><input id="f_internY3_Company" placeholder="บริษัท..."></div>
      <div class="form-group"><label>ตำแหน่ง <span class="required-indicator">*</span></label><input id="f_internY3_Position" placeholder="ตำแหน่ง..."></div>
      <div class="form-group span-2"><label>แผนก <span class="required-indicator">*</span></label><input id="f_internY3_Dept" placeholder="แผนก..."></div>
      
      <div class="divider"></div>
      
      <div class="form-note note-blue span-2" style="justify-content:center; padding:16px; font-size:15px;"><i data-lucide="graduation-cap" style="width:20px;height:20px;"></i> ปี 4 : สหกิจศึกษา (Co-op)</div>
      <div class="form-group"><label>ชื่อบริษัท <span class="required-indicator">*</span></label><input id="f_internY4_Company" placeholder="บริษัท..."></div>
      <div class="form-group"><label>ตำแหน่ง <span class="required-indicator">*</span></label><input id="f_internY4_Position" placeholder="ตำแหน่ง..."></div>
      <div class="form-group span-2"><label>แผนก <span class="required-indicator">*</span></label><input id="f_internY4_Dept" placeholder="แผนก..."></div>
    </div>
  </div>

  <!-- CATEGORY 4 -->
  <div class="form-category-card" id="sec-job">
    <div class="cat-header bg-green"><i data-lucide="briefcase" style="width:20px;height:20px;"></i> 4. สถานะการทำงานหลังจบการศึกษา</div>
    <div class="cat-body form-grid">
      <div class="form-group span-2"><label>วันที่จบการศึกษา <span style="font-weight:500;color:var(--text-muted);font-size:13px;">(ใช้อ้างอิงระยะเวลาหางาน)</span> <span class="required-indicator">*</span></label><input type="text" class="thai-date-mask" id="f_gradDate" placeholder="วว/ดด/ปปปป (พ.ศ.)" maxlength="10"></div>
      
      <div class="form-group span-2" style="background:var(--accent-soft); padding:24px; border-radius:16px; border:1px solid var(--border-hi);">
        <label style="font-size:15px; color:var(--accent);">สถานะหลังจบการศึกษา <span class="required-indicator">*</span></label>
        <select id="f_jobStatus" onchange="toggleJobFields()" style="font-weight:700;border-color:var(--border-hi); font-size:16px; padding:16px;">
          <option value="">-- กรุณาเลือกสถานะปัจจุบัน --</option>
          <option value="ทำงาน">ทำงาน / ธุรกิจส่วนตัว</option>
          <option value="ศึกษาต่อ">ศึกษาต่อในประเทศ</option>
          <option value="ศึกษาต่อต่างประเทศ">ศึกษาต่อต่างประเทศ</option>
          <option value="ว่างงาน">ว่างงาน / กำลังหางาน</option>
          <option value="ไม่จบการศึกษา">ไม่จบการศึกษา / พ้นสภาพ</option>
        </select>
      </div>

      <div id="jobFieldsWrapper" class="span-2" style="display:none;background:var(--bg);padding:24px;border-radius:16px;border:1px solid var(--border);">
        <div class="form-note note-green" style="margin-bottom:20px; font-size:15px;"><i data-lucide="briefcase" style="width:20px;height:20px;"></i> ข้อมูลรายละเอียดการทำงาน</div>
        <div class="form-grid">
          <div class="form-group"><label>วันที่เริ่มทำงาน / บรรจุ <span class="required-indicator req-job">*</span></label><input type="text" class="thai-date-mask" id="f_jobStartDate" placeholder="วว/ดด/ปปปป (พ.ศ.)"></div>
          <div class="form-group">
            <label>สถานะการทำงานปัจจุบัน <span class="required-indicator req-job">*</span></label>
            <select id="f_jobCurrentStatus">
              <option value="">-- เลือกสถานะ --</option>
              <option value="ยังทำงานอยู่">ยังทำงานอยู่</option>
              <option value="ลาออกแล้ว">ลาออกแล้ว</option>
              <option value="ประกอบธุรกิจส่วนตัว">ประกอบธุรกิจส่วนตัว</option>
              <option value="ได้งานแล้ว รอเริ่มงาน">ได้งานแล้ว รอเริ่มงาน</option>
              <option value="ไม่มีข้อมูล">ไม่มีข้อมูล</option>
            </select>
          </div>
          <div class="form-group span-2"><label>ชื่อบริษัท / องค์กรที่ทำงาน <span class="required-indicator req-job">*</span></label><input id="f_jobCompany" placeholder="ระบุชื่อบริษัทอย่างชัดเจน"></div>
          <div class="form-group"><label>ตำแหน่งงาน <span class="required-indicator req-job">*</span></label><input id="f_jobPosition" placeholder="เช่น วิศวกร, โปรแกรมเมอร์"></div>
          <div class="form-group"><label>แผนกที่สังกัด <span class="required-indicator req-job">*</span></label><input id="f_jobDept" placeholder="แผนก..."></div>
          <div class="form-group span-2"><label>เงินเดือนเริ่มต้น (บาท) <span class="required-indicator req-job">*</span></label><input type="number" id="f_jobSalary" placeholder="ตัวอย่าง: 30000"></div>
        </div>
      </div>
      
      <div id="otherFieldsWrapper" class="span-2" style="display:none;">
        <div class="divider"></div>
        <div class="form-grid">
          <div class="form-group span-2">
            <label>รายละเอียดเพิ่มเติม (สถานะปัจจุบัน) <span class="required-indicator">*</span></label>
            <select id="f_jobCurrentStatus_other" onchange="document.getElementById('f_jobCurrentStatus').value = this.value;" style="padding:16px; font-size:15px; font-weight:600;">
              <option value="">-- เลือกรายละเอียด --</option>
              <option value="กำลังหางาน">กำลังหางาน</option>
              <option value="เตรียมสอบราชการ">เตรียมสอบราชการ</option>
              <option value="กำลังศึกษาต่อ">กำลังศึกษาต่อ</option>
              <option value="รอเกณฑ์ทหาร">รอเกณฑ์ทหาร</option>
              <option value="ไม่มีข้อมูล">ไม่มีข้อมูล</option>
            </select>
            <!-- Hidden real input -->
            <input type="hidden" id="f_jobCurrentStatus">
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

function openAddForm() {
  editingIdCard = null;
  hasAttemptedSave = false;
  const e = localStorage.getItem("alumni_draft");
  if (e) {
    try {
      formData = JSON.parse(e);
    } catch (e) {
      formData = {};
    }
  } else {
    formData = {};
  }
  renderForm("เพิ่มข้อมูลนักศึกษาใหม่");
  openModal("modalForm");
}

function openEdit(e, t = null) {
  editingIdCard = e;
  hasAttemptedSave = false;
  const n = STUDENTS.find((t) => String(t.idCard) === String(e));
  if (n) {
    formData = { ...n };
    formData.birthDate = gregorianToThaiStr(formData.birthDate);
    formData.gradDate = gregorianToThaiStr(formData.gradDate);
    formData.jobStartDate = gregorianToThaiStr(formData.jobStartDate);
    if ("ทำงาน" === formData.jobStatus) {
      formData.jobStatus = "ทำงาน";
    }
    renderForm("แก้ไขข้อมูลศิษย์เก่า");
    openModal("modalForm");
    if (t) {
      setTimeout(() => {
        const e = document.getElementById(t);
        if (e) e.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }
}

function renderForm(e) {
  document.getElementById("formTitle").innerHTML =
    `<i data-lucide="edit" style="width:24px;height:24px;"></i> ${e}`;
  document.getElementById("formBody").innerHTML = getFormHTML();
  [
    "gradYear",
    "faculty",
    "branchCode",
    "branch",
    "idCard",
    "prefix",
    "nameTH",
    "surnameTH",
    "nameEN",
    "surnameEN",
    "nickname",
    "gender",
    "birthDate",
    "phone",
    "email",
    "disease",
    "currentAddress",
    "homeAddress",
    "parentName",
    "parentPhone",
    "parentRelation",
    "internY1_711Branch",
    "internY1_711Area",
    "internY1_711EmpID",
    "internY2_Company",
    "internY2_Position",
    "internY2_Dept",
    "internY3_Company",
    "internY3_Position",
    "internY3_Dept",
    "internY4_Company",
    "internY4_Position",
    "internY4_Dept",
    "gradDate",
    "jobStatus",
    "jobStartDate",
    "jobCurrentStatus",
    "jobCurrentStatus_other",
    "jobCompany",
    "jobPosition",
    "jobDept",
    "jobSalary",
  ].forEach((e) => {
    const t = document.getElementById("f_" + e);
    if (t && void 0 !== formData[e]) {
      if (
        "SELECT" === t.tagName &&
        "f_jobStatus" === t.id &&
        "ทำงาน" === formData[e]
      ) {
        t.value = "ทำงาน";
      } else {
        t.value = formData[e];
      }
    }
  });

  if (editingIdCard) {
    const e = document.getElementById("f_idCard"),
      t = document.getElementById("idCardNote");
    if (e) e.readOnly = true;
    if (t) t.style.display = "block";
  }
  renderFormFacultyButtons();
  applyThaiDateMask();
  lucide.createIcons();
  toggleJobFields();
  if (hasAttemptedSave) {
    setTimeout(() => {
      const e = validateForm();
      document
        .querySelectorAll(".form-field-error")
        .forEach((e) => e.classList.remove("form-field-error"));
      document.querySelectorAll(".field-error-msg").forEach((e) => e.remove());
      e.forEach((e) => {
        const t = document.getElementById("f_" + e.key);
        const n =
          "branch" === e.key
            ? document.getElementById("form-branch-btns").parentElement
            : t;
        if (
          n &&
          (n.classList.add("form-field-error"),
          !n.parentElement.querySelector(".field-error-msg"))
        ) {
          let t = document.createElement("div");
          t.className = "field-error-msg show";
          t.innerHTML = `<i data-lucide="alert-circle" style="width:16px;height:16px;margin-bottom:-2px;"></i> กรุณาระบุ${e.label}`;
          "branch" === e.key
            ? n.appendChild(t)
            : n.parentElement && n.parentElement.appendChild(t);
        }
      });
      lucide.createIcons();
    }, 50);
  }
}

function renderFormFacultyButtons() {
  formData.faculty = "คณะวิศวกรรมศาสตร์และเทคโนโลยี"; // บังคับเป็นคณะวิศวะฯ
  const fFac = document.getElementById("f_faculty");
  if (fFac) fFac.value = formData.faculty;
  renderFormBranchButtons(formData.faculty);
}

function renderFormBranchButtons(e) {
  const t = document.getElementById("form-branch-container"),
    n = document.getElementById("form-branch-btns");
  if (t && n) {
    t.classList.remove("hidden");
    n.innerHTML = FACULTY_DATA[e]
      .map(
        (e) =>
          `<button type="button" class="choice-btn ${formData.branch === e.name ? "selected" : ""}" onclick="selectFormBranch('${e.name}', '${e.id}')">${e.id} ${e.name}</button>`,
      )
      .join("");
  }
}

function selectFormBranch(e, t) {
  formData.branch = e;
  formData.branchCode = t;
  const n = document.getElementById("f_branch");
  if (n) n.value = e;
  const a = document.getElementById("f_branchCode");
  if (a) a.value = t;
  renderFormBranchButtons(formData.faculty);
  if (!editingIdCard)
    localStorage.setItem("alumni_draft", JSON.stringify(formData));
}

function collectFormData() {
  [
    "gradYear",
    "faculty",
    "branchCode",
    "branch",
    "idCard",
    "prefix",
    "nameTH",
    "surnameTH",
    "nameEN",
    "surnameEN",
    "nickname",
    "gender",
    "birthDate",
    "phone",
    "email",
    "disease",
    "currentAddress",
    "homeAddress",
    "parentName",
    "parentPhone",
    "parentRelation",
    "internY1_711Branch",
    "internY1_711Area",
    "internY1_711EmpID",
    "internY2_Company",
    "internY2_Position",
    "internY2_Dept",
    "internY3_Company",
    "internY3_Position",
    "internY3_Dept",
    "internY4_Company",
    "internY4_Position",
    "internY4_Dept",
    "gradDate",
    "jobStatus",
    "jobStartDate",
    "jobCurrentStatus",
    "jobCurrentStatus_other",
    "jobCompany",
    "jobPosition",
    "jobDept",
    "jobSalary",
  ].forEach((e) => {
    const t = document.getElementById("f_" + e);
    if (t) formData[e] = t.value;
  });
}

function validateForm() {
  let e = [];
  const t = [
    { key: "gradYear", label: "รุ่นที่จบการศึกษา" },
    { key: "idCard", label: "เลขบัตรประชาชน" },
    { key: "faculty", label: "คณะ" },
    { key: "branch", label: "สาขา" },
    { key: "prefix", label: "คำนำหน้า" },
    { key: "gender", label: "เพศ" },
    { key: "nameTH", label: "ชื่อ (ไทย)" },
    { key: "surnameTH", label: "นามสกุล (ไทย)" },
    { key: "nameEN", label: "ชื่อ (อังกฤษ)" },
    { key: "surnameEN", label: "นามสกุล (อังกฤษ)" },
    { key: "nickname", label: "ชื่อเล่น" },
    { key: "birthDate", label: "วันเกิด" },
    { key: "phone", label: "โทรศัพท์" },
    { key: "email", label: "อีเมล" },
    { key: "disease", label: "โรคประจำตัว" },
    { key: "currentAddress", label: "ที่อยู่ปัจจุบัน" },
    { key: "homeAddress", label: "ที่อยู่ทะเบียนบ้าน" },
    { key: "parentName", label: "ชื่อ-สกุลผู้ปกครอง" },
    { key: "parentPhone", label: "โทรศัพท์ผู้ปกครอง" },
    { key: "parentRelation", label: "ความสัมพันธ์" },
    { key: "internY1_711Branch", label: "ปี 1 : สาขา 7-Eleven" },
    { key: "internY1_711Area", label: "ปี 1 : พื้นที่/ภาค" },
    { key: "internY1_711EmpID", label: "ปี 1 : รหัสพนักงาน" },
    { key: "internY2_Company", label: "ปี 2 : ชื่อบริษัท" },
    { key: "internY2_Position", label: "ปี 2 : ตำแหน่ง" },
    { key: "internY2_Dept", label: "ปี 2 : แผนก" },
    { key: "internY3_Company", label: "ปี 3 : ชื่อบริษัท" },
    { key: "internY3_Position", label: "ปี 3 : ตำแหน่ง" },
    { key: "internY3_Dept", label: "ปี 3 : แผนก" },
    { key: "internY4_Company", label: "ปี 4 : ชื่อบริษัท" },
    { key: "internY4_Position", label: "ปี 4 : ตำแหน่ง" },
    { key: "internY4_Dept", label: "ปี 4 : แผนก" },
    { key: "gradDate", label: "วันที่จบการศึกษา" },
    { key: "jobStatus", label: "สถานะหลังจบการศึกษา" },
  ];

  if ("ทำงาน" === formData.jobStatus) {
    t.push({ key: "jobStartDate", label: "วันที่เริ่มทำงาน" });
    t.push({
      key: "jobCurrentStatus",
      label: "สถานะปัจจุบัน",
      valKey: "jobCurrentStatus",
    });
    t.push({ key: "jobCompany", label: "ชื่อบริษัท" });
    t.push({ key: "jobPosition", label: "ตำแหน่งงาน" });
    t.push({ key: "jobDept", label: "แผนกที่สังกัด" });
    t.push({ key: "jobSalary", label: "เงินเดือน" });
  } else if (
    "ศึกษาต่อ" === formData.jobStatus ||
    "ศึกษาต่อต่างประเทศ" === formData.jobStatus ||
    "ว่างงาน" === formData.jobStatus
  ) {
    t.push({
      key: "jobCurrentStatus_other",
      label: "รายละเอียดเพิ่มเติม",
      valKey: "jobCurrentStatus",
    });
  }

  t.forEach((t) => {
    const n = formData[t.valKey || t.key];
    if (!n || "" === String(n).trim()) {
      e.push(t);
    }
  });
  return e;
}

async function saveStudent() {
  collectFormData();
  hasAttemptedSave = true;
  if (formData.gradYear) {
    let e = String(formData.gradYear).replace(/\D/g, "");
    if (2 === e.length) {
      formData.gradYear = "25" + e;
    } else if (4 === e.length && parseInt(e) > 1900 && parseInt(e) < 2500) {
      formData.gradYear = String(parseInt(e) + 543);
    }
  }
  if ("ทำงาน" !== formData.jobStatus) {
    formData.jobCompany = "-";
    formData.jobPosition = "-";
    formData.jobSalary = 0;
    formData.jobStartDate = "";
    formData.jobDept = "-";
  }

  if (validateForm().length > 0) {
    showToast("กรุณากรอกข้อมูลที่มีดอกจันสีแดง (*) ให้ครบถ้วน", true);
    renderForm(document.getElementById("formTitle").textContent);
    setTimeout(() => {
      const e = document.querySelector(".form-field-error");
      if (e) {
        e.focus();
        e.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return;
  }

  let e = { ...formData };
  e.birthDate = thaiStrToGregorian(e.birthDate);
  e.gradDate = thaiStrToGregorian(e.gradDate);
  e.jobStartDate = thaiStrToGregorian(e.jobStartDate);
  e.jobSalary = Number(e.jobSalary) || 0;

  // Auto-calculate duration if employment-related
  if (
    ("ทำงาน" === e.jobStatus ||
      "ว่างงาน" === e.jobStatus ||
      "กำลังหางาน" === e.jobStatus) &&
    e.gradDate
  ) {
    if ("ทำงาน" === e.jobStatus && e.jobStartDate) {
      e.durationToGetJob = calcYMD(e.gradDate, e.jobStartDate);
    } else if ("ว่างงาน" === e.jobStatus || "กำลังหางาน" === e.jobStatus) {
      const today = new Date().toISOString().split("T")[0];
      e.durationToGetJob = calcYMD(e.gradDate, today);
    } else {
      e.durationToGetJob = "-";
    }
  } else {
    e.durationToGetJob = "-";
  }

  const t = editingIdCard ? "edit" : "add_data";

  showLoading(true, "กำลังบันทึกข้อมูล...");
  const n = await callAPI({ action: t, data: e });
  showLoading(false);
  if (n && "success" === n.status) {
    showToast("บันทึกข้อมูลเรียบร้อยแล้ว", false);
    if (!editingIdCard) localStorage.removeItem("alumni_draft");
    closeAllModals();
    await fetchData(false);
  } else {
    showToast(
      "เกิดข้อผิดพลาด: " + (n?.message || "ไม่สามารถเชื่อมต่อได้"),
      true,
    );
  }
}

function openConfirmDel(e) {
  deleteId = e;
  const t = STUDENTS.find((t) => String(t.idCard) === String(e));
  if (t) {
    document.getElementById("confirmDesc").innerHTML =
      `คุณต้องการลบข้อมูลของ <strong style="color:var(--danger);">${esc(t.prefix + t.nameTH + " " + t.surnameTH)}</strong> ใช่หรือไม่?<br>ข้อมูลนี้จะถูกลบออกจากระบบทันที ไม่สามารถกู้คืนได้`;
    openModal("modalConfirm");
  }
}

async function confirmDelete() {
  showLoading(true, "กำลังลบข้อมูล...");
  const e = await callAPI({ action: "delete", idCard: deleteId });
  showLoading(false);
  if (e && "success" === e.status) {
    showToast("ลบข้อมูลเรียบร้อยแล้ว", false);
    closeAllModals();
    await fetchData(false);
  } else {
    showToast("ลบล้มเหลว: " + (e?.message || "ไม่สามารถเชื่อมต่อได้"), true);
  }
}

function editDuration(idCard, currentDuration) {
  const student = STUDENTS.find((s) => String(s.idCard) === String(idCard));
  if (!student) return;

  document.getElementById("modalBackdrop").classList.remove("hidden");

  const durationModal = document.createElement("div");
  durationModal.className = "modal-box modal-sm";
  durationModal.style.cssText =
    "max-width: 500px; border-radius: 12px; padding: 0;";
  durationModal.id = "modalDurationEdit";
  durationModal.onclick = (e) => e.stopPropagation();

  let years = 0,
    months = 0,
    days = 0;
  if (currentDuration && currentDuration !== "-" && currentDuration !== "") {
    const match = currentDuration.match(
      /(\d+)\s*ปี|(\d+)\s*เดือน|(\d+)\s*วัน/g,
    );
    if (match) {
      match.forEach((m) => {
        if (m.includes("ปี")) years = parseInt(m);
        else if (m.includes("เดือน")) months = parseInt(m);
        else if (m.includes("วัน")) days = parseInt(m);
      });
    }
  }

  // Calculate auto duration from dates
  const autoDuration = calcYMD(student.gradDate, student.jobStartDate);
  const autoNote =
    autoDuration && autoDuration !== "-"
      ? `ระบบคำนวณอัตโนมัติจากวันที่: ${autoDuration}`
      : "ไม่สามารถคำนวณได้ (ข้อมูลวันที่ไม่สมบูรณ์)";

  durationModal.innerHTML = `
    <div class="modal-header" style="background: linear-gradient(135deg, var(--primary) 0%, #1e293b 100%); color: #fff; padding: 24px 32px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="display: flex; align-items: center; gap: 10px; font-size: 18px; margin: 0; color: #fff;">
        <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
        แก้ไขระยะเวลาได้งาน
      </h3>
      <button class="modal-close" style="background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.4); color: #fff; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer;" onclick="document.getElementById('modalDurationEdit').remove(); document.getElementById('modalBackdrop').classList.add('hidden');">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>
    <div class="modal-body" style="padding: 32px; background: var(--bg);">
      <div style="background: var(--success-soft); padding: 16px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid var(--success);">
        <div style="font-size: 12px; font-weight: 600; color: var(--success); margin-bottom: 6px;"><i data-lucide="calculator" style="width: 14px; height: 14px; display: inline; margin-right: 4px;"></i> คำนวณอัตโนมัติ</div>
        <div style="font-size: 14px; font-weight: 700; color: var(--text);">${autoNote}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
          <span style="display: inline-block;">📅 จบการศึกษา: ${student.gradDate ? new Date(student.gradDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-"}</span>
          <span style="display: inline-block; margin-left: 12px;">💼 เริ่มงาน: ${student.jobStartDate ? new Date(student.jobStartDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-"}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 12px;">ระบุระยะเวลา (ถ้าต้องแก้ไขเอง):</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">ปี</label>
            <input type="number" id="durationYears" value="${years}" min="0" max="99" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center;" placeholder="0">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">เดือน</label>
            <input type="number" id="durationMonths" value="${months}" min="0" max="11" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center;" placeholder="0">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">วัน</label>
            <input type="number" id="durationDays" value="${days}" min="0" max="31" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: 700; text-align: center;" placeholder="0">
          </div>
        </div>
        
        <div style="background: var(--accent-soft); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">ตัวอย่างผลลัพธ์:</div>
          <div id="previewDuration" style="font-size: 15px; font-weight: 700; color: var(--accent);">0 ปี 0 เดือน 0 วัน</div>
        </div>
      </div>
    </div>
    <div class="modal-footer" style="padding: 20px 32px; display: flex; gap: 12px; justify-content: flex-end; background: #fff; border-top: 1px solid var(--border); border-radius: 0 0 12px 12px;">
      <button class="btn btn-outline" style="padding: 10px 20px;" onclick="document.getElementById('modalDurationEdit').remove(); document.getElementById('modalBackdrop').classList.add('hidden');">ยกเลิก</button>
      <button class="btn btn-success" style="padding: 10px 20px;" onclick="saveDuration('${esc(idCard)}');">
        <i data-lucide="save" style="width: 16px; height: 16px;"></i> บันทึก
      </button>
    </div>
  `;

  document.getElementById("modalBackdrop").appendChild(durationModal);

  function updatePreview() {
    const y = parseInt(document.getElementById("durationYears").value) || 0;
    const m = parseInt(document.getElementById("durationMonths").value) || 0;
    const d = parseInt(document.getElementById("durationDays").value) || 0;

    let preview = [];
    if (y > 0) preview.push(`${y} ปี`);
    if (m > 0) preview.push(`${m} เดือน`);
    if (d > 0) preview.push(`${d} วัน`);

    const previewText =
      preview.length > 0 ? preview.join(" ") : "0 ปี 0 เดือน 0 วัน";
    document.getElementById("previewDuration").textContent = previewText;
  }

  document
    .getElementById("durationYears")
    .addEventListener("input", updatePreview);
  document
    .getElementById("durationMonths")
    .addEventListener("input", updatePreview);
  document
    .getElementById("durationDays")
    .addEventListener("input", updatePreview);

  lucide.createIcons();
}

function saveDuration(idCard) {
  const student = STUDENTS.find((s) => String(s.idCard) === String(idCard));
  if (!student) return;

  const y = parseInt(document.getElementById("durationYears").value) || 0;
  const m = parseInt(document.getElementById("durationMonths").value) || 0;
  const d = parseInt(document.getElementById("durationDays").value) || 0;

  let durationText = [];
  if (y > 0) durationText.push(`${y} ปี`);
  if (m > 0) durationText.push(`${m} เดือน`);
  if (d > 0) durationText.push(`${d} วัน`);

  const newDuration = durationText.length > 0 ? durationText.join(" ") : "-";

  showLoading(true, "กำลังบันทึกข้อมูล...");

  // Update local STUDENTS array
  student.durationToGetJob = newDuration;

  callAPI({
    action: "update_duration",
    idCard: idCard,
    durationToGetJob: newDuration,
  })
    .then((result) => {
      showLoading(false);
      if (result && "success" === result.status) {
        showToast("บันทึกระยะเวลาเรียบร้อยแล้ว", false);
        document.getElementById("modalDurationEdit").remove();
        document.getElementById("modalBackdrop").classList.add("hidden");
        localStorage.setItem("alumni_data", JSON.stringify(STUDENTS));
        renderTable();
      } else {
        showToast(
          "เกิดข้อผิดพลาด: " + (result?.message || "ไม่สามารถเชื่อมต่อได้"),
          true,
        );
      }
    })
    .catch((error) => {
      showLoading(false);
      showToast("เกิดข้อผิดพลาด: " + error.message, true);
    });
}

// Missing Google Drive Tab Functions
function switchGTab(tab) {
  const views = ["gViewDrive", "gViewShared", "gViewRecent", "gViewUpload"];
  const tabs = ["tabDrive", "tabShared", "tabRecent", "tabUpload"];

  views.forEach((v, i) => {
    const elem = document.getElementById(v);
    if (elem)
      elem.classList.toggle(
        "hidden",
        tabs[i] !== "tab" + tab.charAt(0).toUpperCase() + tab.slice(1),
      );
  });

  tabs.forEach((t, i) => {
    const elem = document.getElementById(t);
    if (elem)
      elem.classList.toggle(
        "active",
        t === "tab" + tab.charAt(0).toUpperCase() + tab.slice(1),
      );
  });
}

function simulateDriveFileSelect(fileName) {
  selectedExcelFile = { name: fileName, isDrive: true, data: [] };
  const nameElem = document.getElementById("selectedFileName");
  if (nameElem) nameElem.textContent = fileName;
  closeAllModals();
  openModal("modalImportSettings");
}

function openImportPreviewModal(data) {
  selectedExcelFile = {
    name: "imported_data",
    isDrive: false,
    data: data,
  };
  const nameElem = document.getElementById("selectedFileName");
  if (nameElem) nameElem.textContent = "imported_data.csv";
  closeAllModals();
  openModal("modalImportSettings");
}

function applyThaiDateMask() {
  document.querySelectorAll(".thai-date-mask").forEach((e) => {
    e.addEventListener("input", function (event) {
      let t = this.value.replace(/\D/g, "");
      if (t.length >= 2 && t.length < 4) {
        t = t.slice(0, 2) + "/" + t.slice(2);
      } else if (t.length >= 4) {
        t = t.slice(0, 2) + "/" + t.slice(2, 4) + "/" + t.slice(4, 8);
      }
      this.value = t;
    });
    e.addEventListener("blur", function (event) {
      let t = this.value.split("/");
      if (3 === t.length) {
        let year = parseInt(t[2]);
        if (year < 100) {
          year += 2500;
        } else if (year < 2500 && year > 1900) {
          year += 543;
        }
        this.value = `${t[0].padStart(2, "0")}/${t[1].padStart(2, "0")}/${year}`;
      }
    });
  });

  const e = document.getElementById("f_gradYear");
  if (e) {
    e.addEventListener("blur", function (event) {
      let t = this.value.replace(/\D/g, "");
      if (2 === t.length) {
        this.value = "25" + t;
      } else if (4 === t.length && parseInt(t) > 1900 && parseInt(t) < 2500) {
        this.value = String(parseInt(t) + 543);
      }
    });
  }
}

function toggleJobFields() {
  const e = document.getElementById("f_jobStatus")?.value;
  const t = document.getElementById("jobFieldsWrapper");
  const n = document.getElementById("otherFieldsWrapper");
  if (!t || !n) return;

  if ("ทำงาน" === e) {
    t.style.display = "block";
    n.style.display = "none";
    const statusElem = document.getElementById("f_jobCurrentStatus");
    if (
      formData.jobCurrentStatus &&
      [
        "ยังทำงานอยู่",
        "ลาออกแล้ว",
        "ประกอบธุรกิจส่วนตัว",
        "ไม่มีข้อมูล",
        "ได้งานแล้ว รอเริ่มงาน",
      ].includes(formData.jobCurrentStatus)
    ) {
      statusElem.value = formData.jobCurrentStatus;
    } else {
      statusElem.value = "ยังทำงานอยู่";
    }
  } else if (
    "ว่างงาน" === e ||
    "ศึกษาต่อ" === e ||
    "ศึกษาต่อต่างประเทศ" === e
  ) {
    t.style.display = "none";
    n.style.display = "block";
    const otherElem = document.getElementById("f_jobCurrentStatus_other");
    if (
      formData.jobCurrentStatus &&
      ![
        "ยังทำงานอยู่",
        "ลาออกแล้ว",
        "ประกอบธุรกิจส่วนตัว",
        "ได้งานแล้ว รอเริ่มงาน",
      ].includes(formData.jobCurrentStatus)
    ) {
      otherElem.value = formData.jobCurrentStatus;
    } else {
      otherElem.value =
        "ศึกษาต่อ" === e || "ศึกษาต่อต่างประเทศ" === e
          ? "กำลังศึกษาต่อ"
          : "กำลังหางาน";
    }
    document.getElementById("f_jobCurrentStatus").value = otherElem.value;
    [
      "f_jobStartDate",
      "f_jobCompany",
      "f_jobPosition",
      "f_jobDept",
      "f_jobSalary",
    ].forEach((e) => {
      const elem = document.getElementById(e);
      if (elem) elem.value = "";
    });
  } else if ("ไม่จบการศึกษา" === e) {
    t.style.display = "none";
    n.style.display = "none";
    document.getElementById("f_jobCurrentStatus").value =
      "พ้นสภาพ / ไม่จบการศึกษา";
    [
      "f_jobStartDate",
      "f_jobCompany",
      "f_jobPosition",
      "f_jobDept",
      "f_jobSalary",
    ].forEach((e) => {
      const elem = document.getElementById(e);
      if (elem) elem.value = "";
    });
  } else {
    t.style.display = "none";
    n.style.display = "none";
  }
}

document.addEventListener("input", (e) => {
  if (e.target.closest("#formBody") && !editingIdCard) {
    collectFormData();
    localStorage.setItem("alumni_draft", JSON.stringify(formData));
  }
});

document.addEventListener("change", (e) => {
  if (e.target.closest("#formBody") && !editingIdCard) {
    collectFormData();
    localStorage.setItem("alumni_draft", JSON.stringify(formData));
  }
});

// Handle Refresh Button
function handleRefresh() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (!refreshBtn) return;

  refreshBtn.classList.add("btn-refresh-loading");
  refreshBtn.disabled = true;

  const refreshText = document.getElementById("refreshText");
  if (refreshText) refreshText.textContent = "กำลังโหลด...";

  fetchData(true)
    .then(() => {
      refreshBtn.classList.remove("btn-refresh-loading");
      refreshBtn.disabled = false;
      if (refreshText) refreshText.textContent = "รีเฟรช";
    })
    .catch((error) => {
      console.error("Refresh error:", error);
      showToast("เกิดข้อผิดพลาดในการรีเฟรช", true);
      refreshBtn.classList.remove("btn-refresh-loading");
      refreshBtn.disabled = false;
      if (refreshText) refreshText.textContent = "รีเฟรช";
    });
}

let filterFac = "ทั้งหมด";

function setFilterFac(e, t) {
  filterFac = e;
  filterBr = "ทั้งหมด";
  filterBrId = "ทั้งหมด";
  document
    .getElementById("filter-fac-btns")
    .querySelectorAll(".choice-btn")
    .forEach((e) => e.classList.remove("selected"));
  if (t) t.classList.add("selected");

  const n = document.getElementById("filter-br-container");
  const a = document.getElementById("filter-br-btns");
  if ("ทั้งหมด" === e) {
    n.classList.add("hidden");
    a.innerHTML = "";
  } else {
    n.classList.remove("hidden");
    let html =
      "<button class=\"choice-btn choice-btn-sm selected\" onclick=\"setFilterBr('ทั้งหมด', 'ทั้งหมด', this)\">สาขาทั้งหมด</button>";
    if (FACULTY_DATA[e]) {
      FACULTY_DATA[e].forEach((e) => {
        html += `<button class="choice-btn choice-btn-sm" onclick="setFilterBr('${e.id}', '${e.name}', this)">${e.id} ${e.name}</button>`;
      });
    }
    a.innerHTML = html;
  }
  renderTable();
}

function calcYMD(gradDate, jobDate) {
  if (!gradDate || !jobDate || "-" === gradDate || "-" === jobDate) return "-";

  // Parse dates in YYYY-MM-DD format
  const gradParts = String(gradDate).split("-").map(Number);
  const jobParts = String(jobDate).split("-").map(Number);

  if (gradParts.length !== 3 || jobParts.length !== 3) return "-";
  if (!gradParts[0] || !jobParts[0]) return "-";

  const gradDateObj = new Date(gradParts[0], gradParts[1] - 1, gradParts[2]);
  const jobDateObj = new Date(jobParts[0], jobParts[1] - 1, jobParts[2]);

  if (isNaN(gradDateObj) || isNaN(jobDateObj)) return "-";
  if (jobDateObj < gradDateObj) return "-";

  // Calculate years, months, days
  let years = jobDateObj.getFullYear() - gradDateObj.getFullYear();
  let months = jobDateObj.getMonth() - gradDateObj.getMonth();
  let days = jobDateObj.getDate() - gradDateObj.getDate();

  // Adjust for negative days
  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(
      jobDateObj.getFullYear(),
      jobDateObj.getMonth(),
      0,
    ).getDate();
    days += prevMonthLastDay;
  }

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  // Build result string
  let result = [];
  if (years > 0) result.push(`${years} ปี`);
  if (months > 0) result.push(`${months} เดือน`);
  if (days > 0) result.push(`${days} วัน`);

  return result.length > 0 ? result.join(" ") : "-";
}

// ฟังก์ชันเพิ่มเติม
function viewStatus(e) {
  let t = [],
    n = "",
    a = "",
    i = null;
  if ("ทำงาน" === e) {
    t = STUDENTS.filter((e) => "ทำงาน" === e.jobStatus);
    n = "ศิษย์เก่าที่ทำงานแล้ว";
    a = "briefcase";
  } else if ("ศึกษาต่อ" === e) {
    t = STUDENTS.filter(
      (e) =>
        "ศึกษาต่อ" === e.jobStatus ||
        "ศึกษาต่อในประเทศ" === e.jobStatus ||
        "ศึกษาต่อต่างประเทศ" === e.jobStatus,
    );
    n = "ศิษย์เก่าที่กำลังศึกษาต่อ";
    a = "book-open";
    i = (e) =>
      "ศึกษาต่อต่างประเทศ" === e.jobStatus
        ? '<span class="study-tag tag-abroad"><i data-lucide="globe" style="width:13px;height:13px;"></i> 🌍 ต่างประเทศ</span>'
        : '<span class="study-tag tag-local"><i data-lucide="book-open" style="width:13px;height:13px;"></i> 🇹🇭 ในประเทศ</span>';
  } else if ("ว่างงาน" === e) {
    t = STUDENTS.filter(
      (e) => "ว่างงาน" === e.jobStatus || "กำลังหางาน" === e.jobStatus,
    );
    n = "ศิษย์เก่าที่อยู่ระหว่างหางาน";
    a = "search";
  }
  openGroupModal(n, a, t, i);
}

function viewBranch(e) {
  const t = STUDENTS.filter(
    (t) =>
      (t.branch && "-" !== t.branch
        ? t.branch + (t.branchCode ? ` (${t.branchCode})` : "")
        : "ไม่ระบุสาขา") === e || t.branch === e,
  );
  openGroupModal(`สาขา: ${e}`, "graduation-cap", t);
}
