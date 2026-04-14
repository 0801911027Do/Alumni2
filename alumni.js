function gregorianToThaiStr(isoString) {
  if (!isoString || isoString === "-") return "";
  const parts = isoString.split("T")[0].split("-");
  if (parts.length !== 3) return isoString;
  const y = parseInt(parts[0]) + 543;
  return `${parts[2]}/${parts[1]}/${y}`;
}

function thaiStrToGregorian(thaiStr) {
  if (!thaiStr) return "";
  const parts = thaiStr.split("/");
  if (parts.length === 3) {
    let y = parseInt(parts[2]);
    if (y < 2500 && y > 1900) {
      y = y;
    } else if (y >= 2500) {
      y -= 543;
    }

    return `${y}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return thaiStr;
}

function formatThaiDateShort(isoString) {
  if (!isoString || isoString === "-") return "-";
  const parts = isoString.split("T")[0].split("-");
  if (parts.length !== 3) return isoString;
  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const m = parseInt(parts[1]) - 1;
  const y = parseInt(parts[0]) + 543;
  return `${parseInt(parts[2])} ${months[m]} ${y}`;
}

const API_URL =
  "https://script.google.com/macros/s/AKfycbwcPXx1vNxGrbSUTOEL8kERkGrx4e8rSSwcApYtQow7awF9NSxxFGkUCTCo3bBp26Sw/exec";

const FACULTY_DATA = {
  คณะวิศวกรรมศาสตร์และเทคโนโลยี: [
    { id: "CAI", name: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์" },
    { id: "CYB", name: "การรักษาความมั่นคงปลอดภัยไซเบอร์" },
    { id: "RAE", name: "วิศวกรรมหุ่นยนต์และระบบอัตโนมัติ" },
    { id: "AME", name: "วิศวกรรมการผลิตยานยนต์" },
    { id: "DIT", name: "เทคโนโลยีดิจิทัลและสารสนเทศ" },
  ],
};

let STUDENTS = [];

let currentUser = null;
let currentPage = "dash";
let filterStatus = "ทั้งหมด";
let filterFac = "ทั้งหมด";
let filterBr = "ทั้งหมด";
let filterBrId = "ทั้งหมด";
let editingIdCard = null;
let formData = {};
let deleteId = null;
let isFetching = false;
let hasAttemptedSave = false;

const ALL_PANELS = ["notifWrap", "profileWrap"];

function closeAllPanels(except) {
  ALL_PANELS.forEach((id) => {
    if (id === except) return;
    const w = document.getElementById(id);
    if (w) {
      w.querySelector(".panel").classList.remove("open");
      w.querySelector("button").classList.remove("active");
    }
  });
}

function bindPanel(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const btn = wrap.querySelector("button");
  const panel = wrap.querySelector(".panel");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.contains("open");
    closeAllPanels(wrapId);
    if (!isOpen) {
      panel.classList.add("open");
      btn.classList.add("active");
    } else {
      panel.classList.remove("open");
      btn.classList.remove("active");
    }
  });
}

document.addEventListener("click", () => closeAllPanels(null));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllPanels(null);
});

const fmtMoney = (v) =>
  v && Number(v) > 0 ? "฿" + Number(v).toLocaleString("th-TH") : "-";
const jcBadge = (s) => {
  if (s === "ทำงาน") return "badge-work";
  if (s === "ศึกษาต่อ" || s === "ศึกษาต่อต่างประเทศ") return "badge-study";
  if (s === "ไม่จบการศึกษา" || s === "พ้นสภาพ") return "badge-danger";
  return "badge-seek";
};
const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
const cleanDate = (d) => {
  let str = String(d || "").trim();
  if (str.length >= 10 && str.charAt(10) === "T") return str.substring(0, 10);
  return str;
};

const calcYMD = (start, end) => {
  if (!start || !end || start === "-" || end === "-") return "";
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);
  if (!y1 || !y2) return "";
  let date1 = new Date(y1, m1 - 1, d1);
  let date2 = new Date(y2, m2 - 1, d2);
  if (date1 > date2) return "เริ่มงานก่อนจบ";
  let years = date2.getFullYear() - date1.getFullYear();
  let months = date2.getMonth() - date1.getMonth();
  let days = date2.getDate() - date1.getDate();
  if (days < 0) {
    months--;
    days += new Date(date2.getFullYear(), date2.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  let res = [];
  if (years > 0) res.push(`${years} ปี`);
  if (months > 0) res.push(`${months} เดือน`);
  if (days > 0) res.push(`${days} วัน`);
  return res.length > 0 ? res.join(" ") : "0 วัน";
};

function showToast(msg, err = false) {
  const t = document.getElementById("toast");
  const icon = err
    ? '<i data-lucide="x-circle" style="width:20px;height:20px;"></i>'
    : '<i data-lucide="check-circle" style="width:20px;height:20px;"></i>';
  t.innerHTML = icon + " " + msg;
  t.style.background = err ? "var(--danger)" : "var(--success)";
  t.classList.add("show");
  lucide.createIcons();
  setTimeout(() => t.classList.remove("show"), 3500);
}

function showLoading(show, text = "กำลังซิงค์ข้อมูล...") {
  const l = document.getElementById("global-loader");
  document.getElementById("loader-text").innerText = text;
  if (show) {
    l.classList.remove("hidden");
  } else {
    l.classList.add("hidden");
  }
}

function checkSetup() {
  if (!API_URL || API_URL.includes("YOUR_DEPLOYMENT_ID")) {
    const err = document.getElementById("loginError");
    err.innerHTML = `<i data-lucide="alert-triangle" style="width:18px;height:18px;"></i> <strong style="color:var(--danger)">ยังไม่ได้ตั้งค่า API_URL</strong>`;
    err.classList.remove("hidden");
    lucide.createIcons();
  }
}

async function callAPI(payload = null) {
  if (!API_URL || API_URL.includes("YOUR_DEPLOYMENT_ID")) {
    return { status: "error", message: "กรุณาตั้งค่า API_URL" };
  }
  try {
    let reqOptions = payload
      ? {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          mode: "cors"
        }
      : { 
          method: "GET",
          mode: "cors"
        };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(API_URL, {
      ...reqOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    if (error.name === 'AbortError') {
      return { status: "error", message: "API request timeout" };
    }
    return { status: "error", message: error.message || "Connection failed" };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkSetup();
  lucide.createIcons();

  bindPanel("notifWrap");
  bindPanel("profileWrap");
  document.getElementById("markAllRead")?.addEventListener("click", () => {
    document
      .querySelectorAll(".notif-item.unread")
      .forEach((el) => el.classList.remove("unread"));
    document.getElementById("notifDot").style.display = "none";
  });

  const savedUser = localStorage.getItem("alumni_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      const savedData = localStorage.getItem("alumni_data");
      if (savedData) {
        STUDENTS = JSON.parse(savedData);
      }
      document.getElementById("loginPage").classList.add("hidden");
      initApp();
      fetchData(false);
    } catch (e) {
      document.getElementById("loginPage").classList.remove("hidden");
    }
  } else {
    document.getElementById("loginPage").classList.remove("hidden");
  }

  const inpPass = document.getElementById("inpPass");
  const inpUser = document.getElementById("inpUser");
  if (inpPass)
    inpPass.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
  if (inpUser)
    inpUser.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
});

async function doLogin() {
  const u = document.getElementById("inpUser").value.trim();
  const p = document.getElementById("inpPass").value.trim();
  const err = document.getElementById("loginError");
  if (!u || !p) return;

  showLoading(true, "กำลังตรวจสอบสิทธิ์เข้าถึง...");
  let res = await callAPI({ action: "login", username: u, password: p });
  showLoading(false);

  if (res && res.status === "success") {
    err.classList.add("hidden");
    currentUser = { username: u, role: res.role, name: res.name };
    localStorage.setItem("alumni_user", JSON.stringify(currentUser));

    document.getElementById("loginPage").classList.add("hidden");
    initApp();
    fetchData(true);
  } else {
    err.innerHTML = `<i data-lucide="x-circle" style="width:18px;height:18px;"></i> รหัสผ่านไม่ถูกต้อง หรือเชื่อมต่อไม่สำเร็จ`;
    err.classList.remove("hidden");
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

async function fetchData(showUIIndicator = false) {
  if (isFetching) return;
  isFetching = true;

  if (showUIIndicator) showLoading(true, "กำลังอัปเดตข้อมูลล่าสุด...");
  const res = await callAPI();
  if (showUIIndicator) showLoading(false);
  isFetching = false;

  if (res && res.status === "success") {
    STUDENTS = res.data.map((row) => ({
      idCard: String(row["เลขประจำตัวประชาชน"] || "").trim(),
      prefix: String(row["คำนำหน้า"] || "").trim(),
      nameTH: String(row["ชื่อ (ไทย)"] || "").trim(),
      surnameTH: String(row["นามสกุล (ไทย)"] || "").trim(),
      nameEN: String(row["ชื่อ (อังกฤษ)"] || "").trim(),
      surnameEN: String(row["นามสกุล (อังกฤษ)"] || "").trim(),
      nickname: String(row["ชื่อเล่น"] || "").trim(),
      gender: String(row["เพศ"] || "").trim(),
      birthDate: cleanDate(row["วัน/เดือน/ปีเกิด"]),
      branchCode: String(row["รหัสสาขา"] || "").trim(),
      branch: String(row["สาขา"] || "").trim(),
      faculty: String(row["คณะ"] || "").trim(),
      age: String(row["อายุ"] || "").trim(),
      phone: String(row["เบอร์โทรศัพท์"] || "").trim(),
      email: String(row["อีเมล"] || "").trim(),
      disease: String(row["โรคประจำตัว"] || "").trim(),
      currentAddress: String(row["ที่อยู่ปัจจุบัน"] || "").trim(),
      homeAddress: String(row["ที่อยู่ตามทะเบียนบ้าน"] || "").trim(),
      parentName: String(row["ชื่อ-สกุล ผู้ปกครอง"] || "").trim(),
      parentPhone: String(row["เบอร์โทร ผู้ปกครอง"] || "").trim(),
      parentRelation: String(row["ความสัมพันธ์"] || "").trim(),
      internY1_711Branch: String(row["ปี1 สาขา 7-Eleven"] || "").trim(),
      internY1_711Area: String(row["ปี1 พื้นที่/ภาค"] || "").trim(),
      internY1_711EmpID: String(row["ปี1 รหัสพนักงาน"] || "").trim(),
      internY2_Company: String(row["ปี2 บริษัท"] || "").trim(),
      internY2_Position: String(row["ปี2 ตำแหน่ง"] || "").trim(),
      internY2_Dept: String(row["ปี2 แผนก"] || "").trim(),
      internY3_Company: String(row["ปี3 บริษัท"] || "").trim(),
      internY3_Position: String(row["ปี3 ตำแหน่ง"] || "").trim(),
      internY3_Dept: String(row["ปี3 แผนก"] || "").trim(),
      internY4_Company: String(row["ปี4 บริษัท"] || "").trim(),
      internY4_Position: String(row["ปี4 ตำแหน่ง"] || "").trim(),
      internY4_Dept: String(row["ปี4 แผนก"] || "").trim(),
      gradDate: cleanDate(row["วันจบการศึกษา"]),

      gradYear: (() => {
        let y = String(
          row["รุ่นปี (ปีที่จบ)"] ||
            row["รุ่น"] ||
            (row["วันจบการศึกษา"]
              ? String(row["วันจบการศึกษา"]).substring(0, 4)
              : ""),
        ).trim();
        y = y.replace(/\D/g, "");
        if (y.length === 2) {
          return "25" + y;
        } else if (y.length === 4 && parseInt(y) > 1900 && parseInt(y) < 2500) {
          return String(parseInt(y) + 543);
        }
        return y;
      })(),

      jobStatus: String(row["สถานะการทำงาน"] || "").trim(),
      jobStartDate: cleanDate(row["วันที่ได้รับการบรรจุ"]),
      jobCompany: String(row["ชื่อบริษัทที่ทำงาน"] || "").trim(),
      jobPosition: String(row["ตำแหน่งที่ทำงาน"] || "").trim(),
      jobDept: String(row["แผนกที่ทำงาน"] || "").trim(),
      jobSalary: row["เงินเดือน (บาท)"] || 0,
      jobCurrentStatus: String(row["สถานะปัจจุบัน"] || "").trim(),
      durationToGetJob: String(row["ระยะเวลาได้งานทำ"] || "").trim(),
    }));

    localStorage.setItem("alumni_data", JSON.stringify(STUDENTS));
    updateDashboardAndTable();

    if (showUIIndicator) showToast("อัปเดตข้อมูลล่าสุดแล้ว", false);
  } else if (showUIIndicator) {
    showToast("เชื่อมต่อข้อมูลล้มเหลว", true);
  }
}

function updateDashboardAndTable() {
  const years = [...new Set(STUDENTS.map((s) => s.gradYear))]
    .filter((y) => y)
    .sort()
    .reverse();
  const yf = document.getElementById("yearFilter");
  if (yf)
    yf.innerHTML =
      '<option value="">ทุกรุ่นที่จบ (พ.ศ.)</option>' +
      years.map((y) => `<option>${y}</option>`).join("");
  if (currentPage === "dash") renderDash();
  if (currentPage === "students") renderTable();
}

function initApp() {
  document.getElementById("app").classList.remove("hidden");

  const uName = currentUser.name || currentUser.username;
  const uRole =
    currentUser.role === "admin" ? "👑 ผู้ดูแลระบบ" : "👁 ผู้บริหาร";
  document.getElementById("topUserName").textContent = uName;
  document.getElementById("dropUserName").textContent = uName;
  document.getElementById("dropUserRole").textContent = uRole;

  const nav = document.getElementById("sideNav");
  const navItems = [
    { id: "dash", icon: "layout-dashboard", label: "ภาพรวมระบบ" },
    { id: "students", icon: "users", label: "ฐานข้อมูลศิษย์เก่า" },
  ];
  nav.innerHTML = navItems
    .map(
      (n) => `
    <a class="nav-item${n.id === currentPage ? " active" : ""}" onclick="navTo('${n.id}')">
      <div class="nav-icon"><i data-lucide="${n.icon}"></i></div>
      <span class="nav-label">${n.label}</span>
    </a>`,
    )
    .join("");

  lucide.createIcons();
  initFacultyFilters();

  updateDashboardAndTable();
  navTo("dash");
}

function navTo(page) {
  currentPage = page;
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle(
      "active",
      el.getAttribute("onclick") === `navTo('${page}')`,
    );
  });
  ["dash", "students"].forEach((p) => {
    const el = document.getElementById(
      "page" + p.charAt(0).toUpperCase() + p.slice(1),
    );
    if (el) el.classList.toggle("hidden", p !== page);
  });
  const titles = {
    dash: "ภาพรวมระบบสำหรับผู้บริหาร",
    students: "ฐานข้อมูลศิษย์เก่า",
  };
  document.getElementById("topbarTitle").textContent = titles[page];
  document.getElementById("topbarSub").textContent =
    `ข้อมูลปรับปรุงล่าสุด: ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}`;
  document
    .getElementById("topAddBtn")
    .classList.toggle(
      "hidden",
      !(page === "students" && currentUser && currentUser.role === "admin"),
    );
  if (page === "dash") renderDash();
  if (page === "students") renderTable();
}

function initFacultyFilters() {
  const facCont = document.getElementById("filter-fac-btns");
  if (!facCont) return;
  let html = `<button class="choice-btn choice-btn-sm selected" onclick="setFilterFac('ทั้งหมด', this)">คณะทั้งหมด</button>`;
  Object.keys(FACULTY_DATA).forEach((fac) => {
    html += `<button class="choice-btn choice-btn-sm" onclick="setFilterFac('${fac}', this)">${fac}</button>`;
  });
  facCont.innerHTML = html;
}

function setFilterFac(fac, btn) {
  filterFac = fac;
  filterBr = "ทั้งหมด";
  filterBrId = "ทั้งหมด";
  document
    .getElementById("filter-fac-btns")
    .querySelectorAll(".choice-btn")
    .forEach((b) => b.classList.remove("selected"));
  if (btn) btn.classList.add("selected");
  const brCont = document.getElementById("filter-br-container");
  const brBtns = document.getElementById("filter-br-btns");
  if (fac === "ทั้งหมด") {
    brCont.classList.add("hidden");
    brBtns.innerHTML = "";
  } else {
    brCont.classList.remove("hidden");
    let bHtml = `<button class="choice-btn choice-btn-sm selected" onclick="setFilterBr('ทั้งหมด', 'ทั้งหมด', this)">สาขาทั้งหมด</button>`;
    FACULTY_DATA[fac].forEach((b) => {
      bHtml += `<button class="choice-btn choice-btn-sm" onclick="setFilterBr('${b.id}', '${b.name}', this)">${b.id} ${b.name}</button>`;
    });
    brBtns.innerHTML = bHtml;
  }
  renderTable();
}

function setFilterBr(id, name, btn) {
  filterBrId = id;
  filterBr = name;
  document
    .getElementById("filter-br-btns")
    .querySelectorAll(".choice-btn")
    .forEach((b) => b.classList.remove("selected"));
  if (btn) btn.classList.add("selected");
  renderTable();
}

function setFilterStatus(s, btn) {
  filterStatus = s;
  const grp = document.getElementById("filter-status-group");
  if (grp) {
    grp.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
  }
  renderTable();
}

function renderDash() {
  const el = document.getElementById("pageDash");
  const total = STUDENTS.length;
  if (total === 0) {
    el.innerHTML = `<div class="empty-state" style="margin-top:60px;"><i data-lucide="bar-chart-3" class="empty-icon" style="width:64px;height:64px;"></i><div>ยังไม่มีข้อมูลศิษย์เก่าในระบบ</div></div>`;
    lucide.createIcons();
    return;
  }

  const dropouts = STUDENTS.filter(
    (s) => s.jobStatus === "ไม่จบการศึกษา" || s.jobStatus === "พ้นสภาพ",
  );
  const grads = STUDENTS.filter(
    (s) => s.jobStatus !== "ไม่จบการศึกษา" && s.jobStatus !== "พ้นสภาพ",
  );

  const emp = grads.filter((s) => s.jobStatus === "ทำงาน");
  const stdLocal = grads.filter(
    (s) => s.jobStatus === "ศึกษาต่อ" || s.jobStatus === "ศึกษาต่อในประเทศ",
  );
  const stdAbroad = grads.filter((s) => s.jobStatus === "ศึกษาต่อต่างประเทศ");
  const stdTotal = stdLocal.length + stdAbroad.length;
  const sk = grads.filter(
    (s) => s.jobStatus === "ว่างงาน" || s.jobStatus === "กำลังหางาน",
  );

  const sals = emp
    .filter((s) => s.jobSalary > 0)
    .map((s) => Number(s.jobSalary));
  const avgS = sals.length
    ? Math.round(sals.reduce((a, b) => a + b, 0) / sals.length)
    : 0;

  const empRate = grads.length
    ? Math.round((emp.length / grads.length) * 100)
    : 0;

  let totalMonths = 0;
  let validTimeCount = 0;
  emp.forEach((s) => {
    if (
      s.gradDate &&
      s.jobStartDate &&
      s.gradDate !== "-" &&
      s.jobStartDate !== "-"
    ) {
      const g = new Date(s.gradDate);
      const j = new Date(s.jobStartDate);
      if (!isNaN(g) && !isNaN(j) && j >= g) {
        const diffTime = Math.abs(j - g);
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
        totalMonths += diffMonths;
        validTimeCount++;
      }
    }
  });
  const avgTimeToJob =
    validTimeCount > 0 ? (totalMonths / validTimeCount).toFixed(1) : 0;

  const allYears = [...new Set(grads.map((s) => s.gradYear))]
    .filter(Boolean)
    .sort();
  const recentYears = allYears.slice(-7);
  const trendDataTotal = recentYears.map(
    (y) => grads.filter((s) => String(s.gradYear) === String(y)).length,
  );
  const trendDataEmp = recentYears.map(
    (y) => emp.filter((s) => String(s.gradYear) === String(y)).length,
  );

  const branchCounts = {};
  grads.forEach((s) => {
    if (s.branch && s.branch !== "-") {
      const brKey = s.branch + (s.branchCode ? ` (${s.branchCode})` : "");
      branchCounts[brKey] = (branchCounts[brKey] || 0) + 1;
    }
  });

  const sortedBranches = Object.entries(branchCounts).sort(
    (a, b) => b[1] - a[1],
  );
  let pieLabels = [];
  let pieData = [];
  let otherCount = 0;
  sortedBranches.forEach((item, index) => {
    if (index < 5) {
      pieLabels.push(item[0]);
      pieData.push(item[1]);
    } else {
      otherCount += item[1];
    }
  });
  if (otherCount > 0) {
    pieLabels.push("อื่นๆ");
    pieData.push(otherCount);
  }

  if (pieLabels.length === 0) {
    pieLabels.push("ไม่มีข้อมูลระบุสาขา");
    pieData.push(1);
  }

  const branchStats = {};
  grads.forEach((s) => {
    const br =
      s.branch && s.branch !== "-"
        ? s.branch + (s.branchCode ? ` (${s.branchCode})` : "")
        : "ไม่ระบุสาขา";
    if (!branchStats[br]) branchStats[br] = { total: 0, emp: 0 };
    branchStats[br].total++;
    if (s.jobStatus === "ทำงาน") branchStats[br].emp++;
  });
  const sortedBranchStats = Object.entries(branchStats).sort(
    (a, b) => b[1].total - a[1].total,
  );

  const branchStatsHtml = sortedBranchStats
    .map((br) => {
      const branchName = br[0];
      const data = br[1];
      const rate = data.total ? Math.round((data.emp / data.total) * 100) : 0;
      return `
      <div class="clickable-item" onclick="viewBranch('${esc(branchName)}')">
        <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; margin-bottom:8px; color:var(--text);">
          <span>${esc(branchName)} <span class="click-hint"><i data-lucide="mouse-pointer-click" style="width:10px;"></i> คลิก</span></span>
          <span style="color:var(--success);">${rate}% <span style="font-size:12px;color:var(--text-muted);font-weight:600;">(งาน ${data.emp}/${data.total})</span></span>
        </div>
        <div style="height:8px; background:var(--bg); border-radius:99px; overflow:hidden;">
          <div style="width:${rate}%; height:100%; background:var(--success); border-radius:99px;"></div>
        </div>
      </div>`;
    })
    .join("");

  const currentMonthName = new Date().toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
  const pct = (n) => (grads.length ? Math.round((n / grads.length) * 100) : 0);

  let topCo = [];
  if (emp.length > 0) {
    const coMap = {};
    emp.forEach((s) => {
      if (s.jobCompany && s.jobCompany !== "-")
        coMap[s.jobCompany] = (coMap[s.jobCompany] || []).concat(s);
    });
    topCo = Object.entries(coMap)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 7);
  }
  const coColors = [
    "#fffbeb|#d97706",
    "#eff6ff|#1d4ed8",
    "#ecfdf5|#059669",
    "#f5f3ff|#6d28d9",
    "#fdf2f8|#be185d",
    "#fff7ed|#c2410c",
    "#f0f9ff|#0369a1",
  ];

  el.innerHTML = `
  <!-- Executive Summary -->
  <div class="exec-summary fade-in">
    <div class="exec-summary-icon"><i data-lucide="bar-chart-4" style="width:36px;height:36px;"></i></div>
    <div class="exec-summary-text">
      <h3>สรุปข้อมูลรายเดือนสำหรับผู้บริหาร (ประจำเดือน ${currentMonthName})</h3>
      <p>ระบบมีข้อมูลศิษย์เก่าทั้งหมด <strong>${total} คน</strong> (ผู้สำเร็จการศึกษา ${grads.length} คน / ไม่จบการศึกษา ${dropouts.length} คน) คิดเป็นอัตราการรับเข้าทำงาน <strong>${empRate}%</strong> (ได้งานทำ ${emp.length} คน / ไม่ได้งานทำ ${sk.length} คน) โดยใช้ระยะเวลาเฉลี่ยในการได้งานหลังจบการศึกษา <strong>${avgTimeToJob} เดือน</strong> สัดส่วนที่เหลือคือศึกษาต่อ <strong>${stdTotal} คน</strong> (ในประเทศ ${stdLocal.length} / ต่างประเทศ ${stdAbroad.length} คน)</p>
    </div>
  </div>

  <!-- KPIs สุดสมบูรณ์แบบ 6 ช่อง (3x2) -->
  <div class="stats-grid fade-in">
    ${[
      [
        "check-circle-2",
        "อัตราการรับเข้าทำงาน",
        empRate + "%",
        `ทำงาน ${emp.length} จาก ${grads.length} คน`,
        "var(--success)",
        "var(--success-soft)",
      ],
      [
        "clock",
        "ระยะเวลาเฉลี่ยได้งาน",
        avgTimeToJob,
        "เดือน (หลังจบการศึกษา)",
        "var(--warning)",
        "var(--warning-soft)",
      ],
      [
        "graduation-cap",
        "สถานะการเรียน",
        `${grads.length} / ${dropouts.length}`,
        "คน (จบสำเร็จ / พ้นสภาพ)",
        "#8b5cf6",
        "#f5f3ff",
      ],
      [
        "plane",
        "การศึกษาต่อ (ในไทย/ตปท.)",
        `${stdLocal.length} / ${stdAbroad.length}`,
        "คน",
        "var(--accent)",
        "var(--accent-soft)",
      ],
      [
        "trending-up",
        "อัตราเงินเดือนเฉลี่ย",
        fmtMoney(avgS),
        "บาท/เดือน",
        "#3b82f6",
        "#eff6ff",
      ],
      [
        "users",
        "จำนวนศิษย์เก่าทั้งหมด",
        total,
        "คน (ในระบบฐานข้อมูล)",
        "#0ea5e9",
        "#e0f2fe",
      ],
    ]
      .map(
        ([ic, lb, vl, sb, col, bg]) => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${bg}; color:${col};"><i data-lucide="${ic}"></i></div>
        <div>
          <div class="stat-label">${lb}</div>
          <div class="stat-value" style="color:${col}">${vl}</div>
          <div class="stat-sub">${sb}</div>
        </div>
      </div>`,
      )
      .join("")}
  </div>

  <!-- สัดส่วนการทำงาน & อัตราการได้งานทำแยกตามสาขา -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px" class="fade-in">
    <div class="card">
      <div class="card-header">สัดส่วนสถานะการทำงาน <span style="font-size:13px;font-weight:600;color:var(--text-muted);">คลิกดูรายชื่อได้</span></div>
      <div class="card-body" style="display:flex; flex-direction:column; gap:24px;">
        <!-- ✨ แถบสถานะแบบคลิกเจาะลึกได้ -->
        ${[
          {
            l: "ทำงานแล้ว",
            n: emp.length,
            c: "var(--success)",
            ic: "briefcase",
            fn: "viewStatus('ทำงาน')",
          },
          {
            l: "ศึกษาต่อ (รวมต่างประเทศ)",
            n: stdTotal,
            c: "var(--accent)",
            ic: "book-open",
            fn: "viewStatus('ศึกษาต่อ')",
          },
          {
            l: "อยู่ระหว่างหางาน",
            n: sk.length,
            c: "var(--warning)",
            ic: "search",
            fn: "viewStatus('ว่างงาน')",
          },
        ]
          .map(
            (r) => `
        <div class="clickable-item" onclick="${r.fn}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: ${r.c}15; color: ${r.c}; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="${r.ic}"></i>
              </div>
              <span style="font-size: 16px; font-weight: 700; color: var(--text);">${r.l} <span class="click-hint"><i data-lucide="mouse-pointer-click" style="width:12px;"></i> คลิก</span></span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 20px; font-weight: 800; color: var(--text);">${r.n} <span style="font-size: 14px; font-weight: 600; color: var(--text-muted);">คน</span></span>
              <span style="font-size: 14px; font-weight: 700; color: ${r.c}; background: ${r.c}15; padding: 4px 12px; border-radius: 20px;">${pct(r.n)}%</span>
            </div>
          </div>
          <div style="height: 10px; background: var(--bg); border-radius: 99px; overflow: hidden;">
            <div style="width: ${pct(r.n)}%; height: 100%; background: ${r.c}; border-radius: 99px; transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);"></div>
          </div>
        </div>`,
          )
          .join("")}
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">อัตราการได้งานทำแยกตามสาขา</div>
      <div class="card-body" style="height:360px;overflow:auto;padding-top:20px; display:flex; flex-direction:column; gap:16px;">
        ${branchStatsHtml || '<div class="empty-state" style="padding:40px;">ไม่มีข้อมูล</div>'}
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px" class="fade-in">
    <div class="card">
      <div class="card-header">ท็อปบริษัทที่รับเข้าทำงาน <span style="font-size:13px;color:var(--accent);font-weight:600;padding:6px 12px;background:var(--accent-soft);border-radius:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><i data-lucide="mouse-pointer-click" style="width:14px;height:14px;"></i> คลิกดูรายชื่อแยกรุ่น</span></div>
      <div class="card-body" style="height:320px;overflow:auto;padding-top:16px;">
        ${
          topCo.length
            ? topCo
                .map(([co, list], i) => {
                  const [bg, tx] = coColors[i % 7].split("|");
                  return `
        <div class="person-item" onclick="openCompany('${esc(co)}')">
          <div class="flex flex-center gap-12">
            <div class="co-rank" style="background:${bg};color:${tx}; width:36px; height:36px; border-radius:10px; font-size:14px;">${i + 1}</div>
            <span style="font-size:15px; font-weight:700; color:var(--text);">${esc(co)}</span>
          </div>
          <div class="flex flex-center gap-10">
            <span style="font-size:14.5px; font-weight:800; color:var(--primary);">${list.length} คน</span>
            <span style="color:var(--text-muted);"><i data-lucide="chevron-right" style="width:18px;height:18px;"></i></span>
          </div>
        </div>`;
                })
                .join("")
            : '<div style="text-align:center;padding:40px;color:#94a3b8;">ไม่มีข้อมูล</div>'
        }
      </div>
    </div>

    <!-- Doughnut Chart: Branch Breakdown -->
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
    <!-- Line Chart: Trends -->
    <div class="card">
      <div class="card-header">กราฟเส้นแสดงแนวโน้มการรับเข้าทำงานย้อนหลัง ${recentYears.length > 0 ? recentYears.length : 0} ปี</div>
      <div class="card-body">
        <div class="chart-wrapper" style="height:380px;">
          <canvas id="trendChart"></canvas>
        </div>
      </div>
    </div>
  </div>
  `;

  lucide.createIcons();

  setTimeout(() => {
    if (window.trendChartInst) window.trendChartInst.destroy();
    if (window.branchChartInst) window.branchChartInst.destroy();

    const trendCtx = document.getElementById("trendChart");
    if (trendCtx && recentYears.length > 0) {
      window.trendChartInst = new Chart(trendCtx, {
        type: "line",
        data: {
          labels: recentYears.map((y) => `ปี พ.ศ. ${y}`),
          datasets: [
            {
              label: "ผู้สำเร็จการศึกษาทั้งหมด",
              data: trendDataTotal,
              borderColor: "#94a3b8",
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
            },
            {
              label: "ผู้ได้งานทำ",
              data: trendDataEmp,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              borderWidth: 3,
              fill: true,
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
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
                padding: 20,
                font: { family: "Sarabun", size: 14 },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { borderDash: [4, 4], color: "#e2e8f0" },
              ticks: { font: { family: "Sarabun", stepSize: 1 } },
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: "Sarabun", size: 13 } },
            },
          },
          interaction: { mode: "index", intersect: false },
        },
      });
    }

    const branchCtx = document.getElementById("branchChart");
    if (branchCtx && pieLabels.length > 0) {
      window.branchChartInst = new Chart(branchCtx, {
        type: "doughnut",
        data: {
          labels: pieLabels,
          datasets: [
            {
              data: pieData,
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
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "right",
              labels: {
                usePointStyle: true,
                padding: 20,
                font: { family: "Sarabun", size: 13.5 },
              },
            },
          },
          onClick: (e, elements) => {
            if (elements.length > 0) {
              const idx = elements[0].index;
              const branchName = pieLabels[idx];
              if (
                branchName !== "ไม่มีข้อมูลระบุสาขา" &&
                branchName !== "อื่นๆ"
              ) {
                viewBranch(branchName);
              }
            }
          },
        },
      });
    }
  }, 100);
}

function openGroupModal(title, icon, dataList, badgeLogicFunc = null) {
  document.getElementById("listModalTitleText").innerHTML =
    `<i data-lucide="${icon}" style="width:28px;height:28px;"></i> ${title}`;
  document.getElementById("listModalSub").textContent =
    `ค้นพบทั้งหมด ${dataList.length} คน`;

  const byYear = {};
  dataList.forEach((s) => {
    const y = s.gradYear || "ไม่ระบุปี";
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(s);
  });

  const sortedYears = Object.keys(byYear).sort((a, b) => b - a);

  let html = "";
  if (dataList.length === 0) {
    html = `<div class="empty-state" style="padding:40px;"><i data-lucide="folder-search" style="width:64px;height:64px;color:#cbd5e1;margin-bottom:16px;"></i><div style="font-size:16px;">ไม่พบข้อมูลศิษย์เก่าในหมวดหมู่นี้</div></div>`;
  } else {
    sortedYears.forEach((y) => {
      html += `<div class="list-group-header"><i data-lucide="calendar" style="width:20px;margin-right:8px;"></i> รุ่นปี พ.ศ. ${esc(y)} <span style="font-size:14px; opacity:0.8; font-weight:normal; margin-left:12px;">(รวม ${byYear[y].length} คน)</span></div>`;

      const byBranch = {};
      byYear[y].forEach((s) => {
        const brName = s.branch || "ไม่ระบุสาขา";
        const brCode = s.branchCode ? ` (${s.branchCode})` : "";
        const brKey = brName + brCode;

        if (!byBranch[brKey]) byBranch[brKey] = [];
        byBranch[brKey].push(s);
      });

      const sortedBranches = Object.keys(byBranch).sort();
      sortedBranches.forEach((brKey) => {
        html += `<div class="list-branch-header"><i data-lucide="graduation-cap" style="width:16px;"></i> สาขา: ${esc(brKey)} <span style="color:var(--text-muted);font-size:13px;">(${byBranch[brKey].length} คน)</span></div>`;

        byBranch[brKey].forEach((s) => {
          let extraBadge = badgeLogicFunc ? badgeLogicFunc(s) : "";
          let desc =
            s.jobStatus === "ทำงาน"
              ? `ตำแหน่ง: ${esc(s.jobPosition)} @ ${esc(s.jobCompany)}`
              : `อีเมล: ${esc(s.email)}`;

          html += `
                  <div class="person-item" onclick="closeAllModals(); openDetail('${esc(s.idCard)}')">
                    <div>
                      <div style="font-weight:800;font-size:15.5px;color:var(--text);display:flex;align-items:center;gap:8px;">
                        ${esc(s.prefix + s.nameTH + " " + s.surnameTH)} ${extraBadge}
                      </div>
                      <div style="font-size:13.5px;color:var(--text-muted);margin-top:4px;">${desc}</div>
                    </div>
                    <div style="text-align:right">
                      ${s.jobSalary > 0 ? `<div style="font-size:15px;font-weight:800;color:var(--success)">${fmtMoney(s.jobSalary)}</div>` : `<div style="font-size:13px;color:var(--text-muted);font-weight:700; background:var(--bg); padding:4px 10px; border-radius:12px;">${esc(s.jobStatus)}</div>`}
                    </div>
                  </div>`;
        });
      });
    });
  }

  document.getElementById("listModalBody").innerHTML = html;
  lucide.createIcons();
  openModal("modalGenericList");
}

window.viewStatus = function (type) {
  let filtered = [];
  let title = "";
  let icon = "";
  let badgeLogic = null;

  if (type === "ทำงาน") {
    filtered = STUDENTS.filter((s) => s.jobStatus === "ทำงาน");
    title = "ศิษย์เก่าที่ทำงานแล้ว";
    icon = "briefcase";
  } else if (type === "ศึกษาต่อ") {
    filtered = STUDENTS.filter(
      (s) =>
        s.jobStatus === "ศึกษาต่อ" ||
        s.jobStatus === "ศึกษาต่อในประเทศ" ||
        s.jobStatus === "ศึกษาต่อต่างประเทศ",
    );
    title = "ศิษย์เก่าที่กำลังศึกษาต่อ";
    icon = "book-open";
    badgeLogic = (s) => {
      if (s.jobStatus === "ศึกษาต่อต่างประเทศ")
        return `<span class="study-tag tag-abroad"><i data-lucide="plane" style="width:12px;height:12px;display:inline-block;margin-right:4px;"></i>ต่างประเทศ</span>`;
      return `<span class="study-tag tag-local"><i data-lucide="map-pin" style="width:12px;height:12px;display:inline-block;margin-right:4px;"></i>ในประเทศ</span>`;
    };
  } else if (type === "ว่างงาน") {
    filtered = STUDENTS.filter(
      (s) => s.jobStatus === "ว่างงาน" || s.jobStatus === "กำลังหางาน",
    );
    title = "ศิษย์เก่าที่อยู่ระหว่างหางาน";
    icon = "search";
  }

  openGroupModal(title, icon, filtered, badgeLogic);
};

window.viewBranch = function (branchName) {
  const filtered = STUDENTS.filter((s) => {
    const fullBr =
      s.branch && s.branch !== "-"
        ? s.branch + (s.branchCode ? ` (${s.branchCode})` : "")
        : "ไม่ระบุสาขา";
    return fullBr === branchName || s.branch === branchName;
  });
  openGroupModal(`สาขา: ${branchName}`, "graduation-cap", filtered);
};

function renderTable() {
  const searchEl = document.getElementById("searchInput");
  const q = searchEl ? searchEl.value.toLowerCase().trim() : "";
  const qWords = q ? q.split(/\s+/) : [];
  const yrEl = document.getElementById("yearFilter");
  const yr = yrEl ? yrEl.value : "";
  const cleanText = (text) =>
    String(text || "")
      .toLowerCase()
      .replace(/\s+/g, "");

  const rows = STUDENTS.filter((s) => {
    const searchStr = [
      s.nameTH,
      s.surnameTH,
      s.nameEN,
      s.idCard,
      s.jobCompany,
      s.jobPosition,
      s.phone,
      s.email,
      s.faculty,
      s.branchCode,
      s.branch,
    ]
      .join(" ")
      .toLowerCase();
    const mq =
      qWords.length === 0 || qWords.every((w) => searchStr.includes(w));
    const ms =
      filterStatus === "ทั้งหมด" ||
      s.jobStatus === filterStatus ||
      (filterStatus === "ศึกษาต่อ" && s.jobStatus === "ศึกษาต่อต่างประเทศ") ||
      (filterStatus === "ไม่จบการศึกษา" && s.jobStatus === "พ้นสภาพ");
    const my = !yr || String(s.gradYear) === yr;
    const facData = cleanText(s.faculty);
    const facFilter = cleanText(filterFac);
    const mFac =
      filterFac === "ทั้งหมด" ||
      facData.includes(facFilter) ||
      facFilter.includes(facData);
    const brNameData = cleanText(s.branch);
    const brCodeData = cleanText(s.branchCode);
    const brFilterName = cleanText(filterBr);
    const brFilterId = cleanText(filterBrId);
    const mBr =
      filterBr === "ทั้งหมด" ||
      brNameData.includes(brFilterName) ||
      brCodeData.includes(brFilterId) ||
      brNameData.includes(brFilterId) ||
      brFilterName.includes(brNameData);
    return mq && ms && my && mFac && mBr;
  });

  const rowCountEl = document.getElementById("rowCount");
  if (rowCountEl)
    rowCountEl.textContent = `พบ ${rows.length} จาก ${STUDENTS.length} รายการ`;

  const isAdmin = currentUser && currentUser.role === "admin";
  const tbody = document.getElementById("studentTbody");
  const empty = document.getElementById("emptyState");
  const tableWrap = document.querySelector(".table-wrap table");

  if (!rows.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    tableWrap.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  tableWrap.classList.remove("hidden");

  tbody.innerHTML = rows
    .map((s, i) => {
      let timeBadge = "";
      if (s.jobStatus === "ทำงาน") {
        const timeVal = calcYMD(s.gradDate, s.jobStartDate);
        if (timeVal)
          timeBadge = `<div style="font-size:12px;font-weight:700;color:var(--success);background:var(--success-soft);padding:4px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> ${esc(timeVal)}</div>`;
      } else if (s.jobStatus === "ว่างงาน") {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const timeVal = calcYMD(s.gradDate, todayStr);
        if (timeVal)
          timeBadge = `<div style="font-size:12px;font-weight:700;color:var(--danger);background:var(--danger-soft);padding:4px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:6px;"><i data-lucide="clock" style="width:14px;height:14px;"></i> ว่างงาน ${esc(timeVal)}</div>`;
      }

      let jobIcon =
        s.jobStatus === "ทำงาน"
          ? "check-circle-2"
          : s.jobStatus === "ศึกษาต่อ" || s.jobStatus === "ศึกษาต่อต่างประเทศ"
            ? "book-open"
            : s.jobStatus === "ไม่จบการศึกษา" || s.jobStatus === "พ้นสภาพ"
              ? "x-circle"
              : "search";

      return `
    <tr class="fade-in">
      <td style="color:var(--text-muted);font-size:14px;text-align:center;font-weight:700;">${i + 1}</td>
      <td>
        <div style="font-weight:800;font-size:15px;color:var(--text)">${esc(s.prefix + s.nameTH + " " + s.surnameTH)}</div>
        <div style="font-size:13px;color:var(--text-muted); margin-top:2px;">${esc(s.nameEN + " " + s.surnameEN)} ${s.nickname ? "· " + esc(s.nickname) : ""}</div>
      </td>
      <td>
        <div style="font-size:14px;font-weight:700;color:var(--text)">${esc(s.faculty || "-")}</div>
        <div style="font-size:12.5px;color:var(--text-muted); margin-top:2px;">${esc(s.branchCode || "")} ${esc(s.branch || "")}</div>
      </td>
      <td>
        <div style="font-size:14.5px;font-weight:800;color:var(--accent);">พ.ศ. ${esc(s.gradYear)}</div>
        <div style="font-size:13px;color:${s.gender === "ชาย" ? "#0284c7" : "#db2777"};font-weight:700; margin-top:2px;">${esc(s.gender)}</div>
      </td>
      <td style="color:var(--text-muted);font-size:14px;">
        <div style="font-weight:600;display:flex;align-items:center;gap:6px; margin-bottom:4px;"><i data-lucide="phone" style="width:14px;height:14px;"></i> ${esc(s.phone)}</div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;"><i data-lucide="mail" style="width:14px;height:14px;"></i> ${esc(s.email)}</div>
      </td>
      <td><span class="badge ${jcBadge(s.jobStatus)}"><i data-lucide="${jobIcon}" style="width:14px;height:14px;"></i> ${esc(s.jobStatus)}</span></td>
      <td style="max-width:200px">
        <div style="font-size:14px;font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.jobCompany || "-")}</div>
        <div style="font-size:13px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; margin-top:2px;">${esc(s.jobPosition || "")}</div>
      </td>
      <td style="font-weight:800;color:var(--text);white-space:nowrap;font-size:15px;">${fmtMoney(s.jobSalary)}</td>
      <td>${timeBadge}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="openDetail('${esc(s.idCard)}')"><i data-lucide="eye" style="width:16px;height:16px;"></i> ข้อมูล</button>
          ${
            isAdmin
              ? `<button class="btn btn-warning btn-sm" style="padding:10px;" onclick="openEdit('${esc(s.idCard)}')"><i data-lucide="edit-2" style="width:16px;height:16px;"></i></button>
          <button class="btn btn-danger btn-sm" style="padding:10px;" onclick="openConfirmDel('${esc(s.idCard)}')"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>`
              : ""
          }
        </div>
      </td>
    </tr>`;
    })
    .join("");

  lucide.createIcons();
}

function setFilterStatus(s, btn) {
  filterStatus = s;
  document
    .querySelectorAll("#filter-status-group button")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderTable();
}

function openModal(id) {
  document.getElementById("modalBackdrop").classList.remove("hidden");
  document.getElementById(id).classList.remove("hidden");
}
function closeAllModals() {
  document.getElementById("modalBackdrop").classList.add("hidden");
  document
    .querySelectorAll(".modal-box")
    .forEach((el) => el.classList.add("hidden"));
}

function openDetail(idCard) {
  const s = STUDENTS.find((x) => String(x.idCard) === String(idCard));
  if (!s) return;
  const jc =
    s.jobStatus === "ทำงาน"
      ? { bg: "var(--success)", tx: "#fff" }
      : s.jobStatus === "ศึกษาต่อ" || s.jobStatus === "ศึกษาต่อต่างประเทศ"
        ? { bg: "var(--accent)", tx: "#fff" }
        : s.jobStatus === "ไม่จบการศึกษา" || s.jobStatus === "พ้นสภาพ"
          ? { bg: "var(--danger)", tx: "#fff" }
          : { bg: "var(--warning)", tx: "#fff" };
  const isAdmin = currentUser && currentUser.role === "admin";

  document.getElementById("detailHeader").innerHTML = `
    <div>
      <h2>${esc(s.prefix + s.nameTH + " " + s.surnameTH)}</h2>
      <div class="sub">${esc(s.nameEN + " " + s.surnameEN)} · ศิษย์เก่ารุ่นปี พ.ศ. ${s.gradYear}</div>
    </div>
    <div class="flex flex-center gap-10">
      <span class="badge" style="background:${jc.bg};color:${jc.tx};font-size:14.5px;padding:8px 18px;border-radius:12px;">${esc(s.jobStatus)}</span>
      <button class="close-btn" onclick="closeAllModals()"><i data-lucide="x" style="width:24px;height:24px;"></i></button>
    </div>`;

  const F = (l, v, full = false) =>
    `<div class="detail-field${full ? " span-2" : ""}"><label>${l}</label><p>${esc(v || "-")}</p></div>`;
  const S = (t, ic, secId, kids) => `
    <div class="detail-section">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="detail-section-title" style="margin-bottom:0;"><i data-lucide="${ic}" style="width:18px;height:18px;"></i> ${t}</div>
        ${isAdmin ? `<button class="btn btn-outline btn-sm" style="padding:6px 12px; font-size:12.5px; border-radius:8px;" onclick="closeAllModals(); openEdit('${s.idCard}', '${secId}')"><i data-lucide="edit" style="width:14px;height:14px;"></i> แก้ไขส่วนนี้</button>` : ""}
      </div>
      <div class="detail-grid">${kids}</div>
    </div>`;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const durationTxt =
    s.jobStatus === "ทำงาน"
      ? calcYMD(s.gradDate, s.jobStartDate)
      : s.jobStatus === "ว่างงาน" || s.jobStatus === "กำลังหางาน"
        ? calcYMD(s.gradDate, todayStr)
        : "-";

  document.getElementById("detailBody").innerHTML = `
    ${S(
      "ข้อมูลส่วนบุคคลและการศึกษา",
      "user",
      "sec-personal",
      F("เลขบัตรประชาชน", s.idCard, true) +
        F("คณะ", s.faculty) +
        F("รหัสสาขา", s.branchCode) +
        F("สาขา", s.branch, true) +
        F("ชื่อเล่น", s.nickname) +
        F("เพศ", s.gender) +
        F("วันเกิด", formatThaiDateShort(s.birthDate)) +
        F("อายุ", s.age ? s.age + " ปี" : "-") +
        F("โรคประจำตัว", s.disease, true),
    )}
    
    ${S(
      "ข้อมูลติดต่อ",
      "contact",
      "sec-personal",
      F("โทรศัพท์", s.phone) +
        F("อีเมล", s.email) +
        F("ที่อยู่ปัจจุบัน", s.currentAddress, true) +
        F("ที่อยู่ทะเบียนบ้าน", s.homeAddress, true),
    )}
    
    ${S("ข้อมูลผู้ปกครอง", "users", "sec-parents", F("ชื่อผู้ปกครอง", s.parentName) + F("ความสัมพันธ์", s.parentRelation) + F("โทรศัพท์", s.parentPhone))}
    
    ${S(
      "ประวัติการฝึกงาน / สหกิจศึกษา",
      "building-2",
      "sec-intern",
      F("ปี1 สาขา 7-Eleven", s.internY1_711Branch) +
        F("ปี1 พื้นที่", s.internY1_711Area) +
        F("ปี1 รหัสพนง.", s.internY1_711EmpID) +
        F("ปี2 บริษัท", s.internY2_Company) +
        F("ปี2 ตำแหน่ง", s.internY2_Position) +
        F("ปี2 แผนก", s.internY2_Dept) +
        F("ปี3 บริษัท", s.internY3_Company) +
        F("ปี3 ตำแหน่ง", s.internY3_Position) +
        F("ปี3 แผนก", s.internY3_Dept) +
        F("ปี4 บริษัท", s.internY4_Company) +
        F("ปี4 ตำแหน่ง", s.internY4_Position) +
        F("ปี4 แผนก", s.internY4_Dept),
    )}
    
    ${S(
      "การทำงานหลังจบการศึกษา",
      "briefcase",
      "sec-job",
      F("วันที่จบการศึกษา", formatThaiDateShort(s.gradDate)) +
        F("วันที่เริ่มงาน / บรรจุ", formatThaiDateShort(s.jobStartDate)) +
        F("บริษัท / องค์กร", s.jobCompany) +
        F("ตำแหน่ง", s.jobPosition) +
        F("แผนก / ส่วนงาน", s.jobDept) +
        F("อัตราเงินเดือน", fmtMoney(s.jobSalary)) +
        F("สถานะปัจจุบัน", s.jobCurrentStatus) +
        F("ระยะเวลา", durationTxt || "-", true),
    )}`;

  document.getElementById("detailFooter").innerHTML = isAdmin
    ? `
    <button class="btn btn-danger" style="padding:12px 20px;" onclick="closeAllModals();openConfirmDel('${esc(s.idCard)}')"><i data-lucide="trash-2"></i> ลบข้อมูลทั้งหมด</button>
    <button class="btn btn-warning" style="padding:12px 20px;" onclick="closeAllModals();openEdit('${esc(s.idCard)}')"><i data-lucide="edit-2"></i> แก้ไขข้อมูลทั้งหมด</button>`
    : `<button class="btn btn-outline" style="padding:12px 20px;" onclick="closeAllModals()">ปิดหน้าต่าง</button>`;

  lucide.createIcons();
  openModal("modalDetail");
}

function openCompany(coName) {
  const list = STUDENTS.filter((s) => s.jobCompany === coName);

  const byYear = {};
  list.forEach((s) => {
    const y = s.gradYear || "ไม่ระบุปี";
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(s);
  });

  const sortedYears = Object.keys(byYear).sort((a, b) => b - a);

  document.getElementById("coHeader").innerHTML = `
    <div style="color:#fff;">
      <h2 style="display:flex;align-items:center;gap:12px;font-size:24px;"><i data-lucide="building-2" style="width:28px;height:28px;"></i> ${esc(coName)}</h2>
      <div style="font-size:14.5px;opacity:0.9; margin-top:4px;">รับศิษย์เก่าเข้าทำงานทั้งหมด ${list.length} คน</div>
    </div>
    <button class="modal-close-fancy" onclick="closeAllModals()"><i data-lucide="x" style="width:24px;height:24px;"></i></button>`;

  let bodyHtml = "";
  sortedYears.forEach((y) => {
    bodyHtml += `<div class="list-group-header"><i data-lucide="calendar" style="width:20px;margin-right:8px;"></i> รุ่นปี พ.ศ. ${esc(y)} <span style="font-size:14px; opacity:0.8; font-weight:normal; margin-left:12px;">(รวม ${byYear[y].length} คน)</span></div>`;

    const byBranch = {};
    byYear[y].forEach((s) => {
      const brName = s.branch || "ไม่ระบุสาขา";
      const brCode = s.branchCode ? ` (${s.branchCode})` : "";
      const brKey = brName + brCode;

      if (!byBranch[brKey]) byBranch[brKey] = [];
      byBranch[brKey].push(s);
    });

    const sortedBranches = Object.keys(byBranch).sort();
    sortedBranches.forEach((brKey) => {
      bodyHtml += `<div class="list-branch-header"><i data-lucide="graduation-cap" style="width:16px;"></i> สาขา: ${esc(brKey)} <span style="color:var(--text-muted);font-size:13px;">(${byBranch[brKey].length} คน)</span></div>`;

      byBranch[brKey].forEach((s) => {
        bodyHtml += `
              <div class="person-item" onclick="closeAllModals();openDetail('${esc(s.idCard)}')">
                <div>
                  <div style="font-weight:800;font-size:15.5px;color:var(--text);">${esc(s.prefix + s.nameTH + " " + s.surnameTH)}</div>
                  <div style="font-size:13.5px;color:var(--text-muted); margin-top:4px;">ตำแหน่ง: ${esc(s.jobPosition)}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:15px;font-weight:800;color:var(--success)">${fmtMoney(s.jobSalary)}</div>
                </div>
              </div>`;
      });
    });
  });

  document.getElementById("coBody").innerHTML = bodyHtml;
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
        <label>คณะ <span class="required-indicator">*</span></label>
        <div id="form-faculty-btns" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;"></div>
        <input type="hidden" id="f_faculty">
        <div id="form-branch-container" class="hidden">
          <label>สาขา <span class="required-indicator">*</span></label>
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

window.applyThaiDateMask = function () {
  document.querySelectorAll(".thai-date-mask").forEach((inp) => {
    inp.addEventListener("input", function (e) {
      let v = this.value.replace(/\D/g, "");
      if (v.length >= 2 && v.length < 4) v = v.slice(0, 2) + "/" + v.slice(2);
      else if (v.length >= 4)
        v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4, 8);
      this.value = v;
    });
    inp.addEventListener("blur", function (e) {
      let parts = this.value.split("/");
      if (parts.length === 3) {
        let y = parseInt(parts[2]);
        if (y < 100) y += 2500;
        else if (y < 2500 && y > 1900) y += 543;
        this.value = `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${y}`;
      }
    });
  });

  const gradYearInp = document.getElementById("f_gradYear");
  if (gradYearInp) {
    gradYearInp.addEventListener("blur", function (e) {
      let v = this.value.replace(/\D/g, "");
      if (v.length === 2) {
        this.value = "25" + v;
      } else if (v.length === 4 && parseInt(v) > 1900 && parseInt(v) < 2500) {
        this.value = String(parseInt(v) + 543);
      }
    });
  }
};

window.toggleJobFields = function () {
  const status = document.getElementById("f_jobStatus")?.value;
  const jobWrap = document.getElementById("jobFieldsWrapper");
  const otherWrap = document.getElementById("otherFieldsWrapper");

  if (!jobWrap || !otherWrap) return;

  if (status === "ทำงาน") {
    jobWrap.style.display = "block";
    otherWrap.style.display = "none";
    const cStatus = document.getElementById("f_jobCurrentStatus");
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
      cStatus.value = formData.jobCurrentStatus;
    } else {
      cStatus.value = "ยังทำงานอยู่";
    }
  } else if (
    status === "ว่างงาน" ||
    status === "ศึกษาต่อ" ||
    status === "ศึกษาต่อต่างประเทศ"
  ) {
    jobWrap.style.display = "none";
    otherWrap.style.display = "block";
    const cStatusOther = document.getElementById("f_jobCurrentStatus_other");
    if (
      formData.jobCurrentStatus &&
      ![
        "ยังทำงานอยู่",
        "ลาออกแล้ว",
        "ประกอบธุรกิจส่วนตัว",
        "ได้งานแล้ว รอเริ่มงาน",
      ].includes(formData.jobCurrentStatus)
    ) {
      cStatusOther.value = formData.jobCurrentStatus;
    } else {
      cStatusOther.value =
        status === "ศึกษาต่อ" || status === "ศึกษาต่อต่างประเทศ"
          ? "กำลังศึกษาต่อ"
          : "กำลังหางาน";
    }
    document.getElementById("f_jobCurrentStatus").value = cStatusOther.value;

    [
      "f_jobStartDate",
      "f_jobCompany",
      "f_jobPosition",
      "f_jobDept",
      "f_jobSalary",
    ].forEach((id) => {
      if (document.getElementById(id)) document.getElementById(id).value = "";
    });
  } else if (status === "ไม่จบการศึกษา") {
    jobWrap.style.display = "none";
    otherWrap.style.display = "none";
    document.getElementById("f_jobCurrentStatus").value =
      "พ้นสภาพ / ไม่จบการศึกษา";
    [
      "f_jobStartDate",
      "f_jobCompany",
      "f_jobPosition",
      "f_jobDept",
      "f_jobSalary",
    ].forEach((id) => {
      if (document.getElementById(id)) document.getElementById(id).value = "";
    });
  } else {
    jobWrap.style.display = "none";
    otherWrap.style.display = "none";
  }
};

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

function openAddForm() {
  editingIdCard = null;
  hasAttemptedSave = false;
  const draft = localStorage.getItem("alumni_draft");
  if (draft) {
    try {
      formData = JSON.parse(draft);
    } catch (e) {
      formData = {};
    }
  } else {
    formData = {};
  }
  renderForm("เพิ่มข้อมูลนักศึกษาใหม่");
  openModal("modalForm");
}

function openEdit(idCard, scrollToSection = null) {
  editingIdCard = idCard;
  hasAttemptedSave = false;
  const s = STUDENTS.find((x) => String(x.idCard) === String(idCard));
  if (!s) return;
  formData = { ...s };

  formData.birthDate = gregorianToThaiStr(formData.birthDate);
  formData.gradDate = gregorianToThaiStr(formData.gradDate);
  formData.jobStartDate = gregorianToThaiStr(formData.jobStartDate);

  if (formData.jobStatus === "ทำงาน") formData.jobStatus = "ทำงาน";

  renderForm("แก้ไขข้อมูลศิษย์เก่า");
  openModal("modalForm");

  if (scrollToSection) {
    setTimeout(() => {
      const el = document.getElementById(scrollToSection);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }
}

function renderForm(title) {
  document.getElementById("formTitle").innerHTML =
    `<i data-lucide="edit" style="width:24px;height:24px;"></i> ${title}`;
  document.getElementById("formBody").innerHTML = getFormHTML();

  const FORM_FIELDS = [
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
  ];
  FORM_FIELDS.forEach((k) => {
    const el = document.getElementById("f_" + k);
    if (el && formData[k] !== undefined) {
      if (
        el.tagName === "SELECT" &&
        el.id === "f_jobStatus" &&
        formData[k] === "ทำงาน"
      ) {
        el.value = "ทำงาน";
      } else {
        el.value = formData[k];
      }
    }
  });

  if (editingIdCard) {
    const idInp = document.getElementById("f_idCard");
    const idNote = document.getElementById("idCardNote");
    if (idInp) {
      idInp.readOnly = true;
    }
    if (idNote) {
      idNote.style.display = "block";
    }
  }

  renderFormFacultyButtons();
  applyThaiDateMask();
  lucide.createIcons();
  window.toggleJobFields();

  if (hasAttemptedSave) {
    setTimeout(() => {
      const errors = validateForm();
      document
        .querySelectorAll(".form-field-error")
        .forEach((el) => el.classList.remove("form-field-error"));
      document
        .querySelectorAll(".field-error-msg")
        .forEach((el) => el.remove());

      errors.forEach((err) => {
        const el = document.getElementById("f_" + err.key);
        const targetEl =
          err.key === "faculty" || err.key === "branch"
            ? document.getElementById("form-faculty-btns").parentElement
            : el;

        if (targetEl) {
          targetEl.classList.add("form-field-error");
          if (!targetEl.parentElement.querySelector(".field-error-msg")) {
            let errorMsg = document.createElement("div");
            errorMsg.className = "field-error-msg show";
            errorMsg.innerHTML = `<i data-lucide="alert-circle" style="width:16px;height:16px;margin-bottom:-2px;"></i> กรุณาระบุ${err.label}`;
            if (err.key === "faculty" || err.key === "branch") {
              targetEl.appendChild(errorMsg);
            } else if (targetEl.parentElement) {
              targetEl.parentElement.appendChild(errorMsg);
            }
          }
        }
      });
      lucide.createIcons();
    }, 50);
  }
}

function renderFormFacultyButtons() {
  const facCont = document.getElementById("form-faculty-btns");
  if (!facCont) return;
  facCont.innerHTML = Object.keys(FACULTY_DATA)
    .map(
      (fac) =>
        `<button type="button" class="choice-btn ${formData.faculty === fac ? "selected" : ""}" onclick="selectFormFaculty('${fac}')">${fac}</button>`,
    )
    .join("");
  if (formData.faculty && FACULTY_DATA[formData.faculty])
    renderFormBranchButtons(formData.faculty);
  else {
    const bc = document.getElementById("form-branch-container");
    if (bc) bc.classList.add("hidden");
  }
}

function selectFormFaculty(fac) {
  formData.faculty = fac;
  formData.branch = "";
  formData.branchCode = "";
  const ff = document.getElementById("f_faculty");
  if (ff) ff.value = fac;
  const fb = document.getElementById("f_branch");
  if (fb) fb.value = "";
  const fc = document.getElementById("f_branchCode");
  if (fc) fc.value = "";
  renderFormFacultyButtons();
  if (!editingIdCard)
    localStorage.setItem("alumni_draft", JSON.stringify(formData));
}

function renderFormBranchButtons(fac) {
  const brCont = document.getElementById("form-branch-container");
  const brBtns = document.getElementById("form-branch-btns");
  if (!brCont || !brBtns) return;
  brCont.classList.remove("hidden");
  brBtns.innerHTML = FACULTY_DATA[fac]
    .map(
      (b) =>
        `<button type="button" class="choice-btn ${formData.branch === b.name ? "selected" : ""}" onclick="selectFormBranch('${b.name}', '${b.id}')">${b.id} ${b.name}</button>`,
    )
    .join("");
}

function selectFormBranch(name, code) {
  formData.branch = name;
  formData.branchCode = code;
  const fb = document.getElementById("f_branch");
  if (fb) fb.value = name;
  const fc = document.getElementById("f_branchCode");
  if (fc) fc.value = code;
  renderFormBranchButtons(formData.faculty);
  if (!editingIdCard)
    localStorage.setItem("alumni_draft", JSON.stringify(formData));
}

function collectFormData() {
  const FORM_FIELDS = [
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
  ];
  FORM_FIELDS.forEach((k) => {
    const el = document.getElementById("f_" + k);
    if (el) {
      formData[k] = el.value;
    }
  });
}

function validateForm() {
  let errors = [];
  const req = [
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

  if (formData.jobStatus === "ทำงาน") {
    req.push({ key: "jobStartDate", label: "วันที่เริ่มทำงาน" });
    req.push({
      key: "jobCurrentStatus",
      label: "สถานะปัจจุบัน",
      valKey: "jobCurrentStatus",
    });
    req.push({ key: "jobCompany", label: "ชื่อบริษัท" });
    req.push({ key: "jobPosition", label: "ตำแหน่งงาน" });
    req.push({ key: "jobDept", label: "แผนกที่สังกัด" });
    req.push({ key: "jobSalary", label: "เงินเดือน" });
  } else if (
    formData.jobStatus === "ศึกษาต่อ" ||
    formData.jobStatus === "ศึกษาต่อต่างประเทศ" ||
    formData.jobStatus === "ว่างงาน"
  ) {
    req.push({
      key: "jobCurrentStatus_other",
      label: "รายละเอียดเพิ่มเติม",
      valKey: "jobCurrentStatus",
    });
  }

  req.forEach((f) => {
    const val = formData[f.valKey || f.key];
    if (!val || String(val).trim() === "") {
      errors.push(f);
    }
  });

  return errors;
}

async function saveStudent() {
  collectFormData();
  hasAttemptedSave = true;

  if (formData.gradYear) {
    let gy = String(formData.gradYear).replace(/\D/g, "");
    if (gy.length === 2) {
      formData.gradYear = "25" + gy;
    } else if (gy.length === 4 && parseInt(gy) > 1900 && parseInt(gy) < 2500) {
      formData.gradYear = String(parseInt(gy) + 543);
    }
  }

  if (formData.jobStatus !== "ทำงาน") {
    formData.jobCompany = "-";
    formData.jobPosition = "-";
    formData.jobSalary = 0;
    formData.jobStartDate = "";
    formData.jobDept = "-";
  }

  let errors = validateForm();

  if (errors.length > 0) {
    showToast("กรุณากรอกข้อมูลที่มีดอกจันสีแดง (*) ให้ครบถ้วน", true);

    renderForm(document.getElementById("formTitle").textContent);

    setTimeout(() => {
      const firstElOnPage = document.querySelector(".form-field-error");
      if (firstElOnPage) {
        firstElOnPage.focus();
        firstElOnPage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    return;
  }

  let savingData = { ...formData };
  savingData.birthDate = thaiStrToGregorian(savingData.birthDate);
  savingData.gradDate = thaiStrToGregorian(savingData.gradDate);
  savingData.jobStartDate = thaiStrToGregorian(savingData.jobStartDate);
  savingData.jobSalary = Number(savingData.jobSalary) || 0;

  const actionType = editingIdCard ? "edit" : "add_data";

  showLoading(true, "กำลังบันทึกข้อมูล...");
  const res = await callAPI({ action: actionType, data: savingData });
  showLoading(false);

  if (res && res.status === "success") {
    showToast("บันทึกข้อมูลเรียบร้อยแล้ว", false);
    if (!editingIdCard) localStorage.removeItem("alumni_draft");
    closeAllModals();
    await fetchData(false);
  } else {
    showToast(
      "เกิดข้อผิดพลาด: " + (res?.message || "ไม่สามารถเชื่อมต่อได้"),
      true,
    );
  }
}

function openConfirmDel(idCard) {
  deleteId = idCard;
  const s = STUDENTS.find((x) => String(x.idCard) === String(idCard));
  if (!s) return;
  document.getElementById("confirmDesc").innerHTML =
    `คุณต้องการลบข้อมูลของ <strong style="color:var(--danger);">${esc(s.prefix + s.nameTH + " " + s.surnameTH)}</strong> ใช่หรือไม่?<br>ข้อมูลนี้จะถูกลบออกจากระบบทันที ไม่สามารถกู้คืนได้`;
  openModal("modalConfirm");
}

async function confirmDelete() {
  showLoading(true, "กำลังลบข้อมูล...");
  const res = await callAPI({ action: "delete", idCard: deleteId });
  showLoading(false);

  if (res && res.status === "success") {
    showToast("ลบข้อมูลเรียบร้อยแล้ว", false);
    closeAllModals();
    await fetchData(false);
  } else {
    showToast("ลบล้มเหลว: " + (res?.message || "ไม่สามารถเชื่อมต่อได้"), true);
  }
}
