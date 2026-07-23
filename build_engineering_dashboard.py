import os
import re
import glob

def find_dashboard_file():
    # Search paths: current folder, parent, Downloads, Desktop
    search_paths = [
        ".",
        "..",
        os.path.expanduser("~/Downloads"),
        os.path.expanduser("~/Desktop"),
        "C:/Users/USER/Downloads/Alumni2-Anidesk/Alumni2-Anidesk"
    ]
    
    for path in search_paths:
        if not os.path.exists(path):
            continue
        # Find all .html files
        html_files = glob.glob(os.path.join(path, "*.html"))
        for file_path in html_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read(5000) # Read start of file
                    if "Dashboard นักศึกษา PIM" in content:
                        return file_path
            except:
                continue
    return None

def main():
    print("==========================================================")
    print("🛠️  ระบบปรับปรุงแดชบอร์ดนักศึกษา PIM (เฉพาะคณะวิศวกรรมศาสตร์)")
    print("==========================================================")
    
    file_path = find_dashboard_file()
    if not file_path:
        print("❌ ไม่พบไฟล์แดชบอร์ดต้นฉบับ (ไฟล์ที่มีคำว่า 'Dashboard นักศึกษา PIM')")
        print("กรุณาวางไฟล์แดชบอร์ด (.html) ไว้ในโฟลเดอร์นี้ แล้วรันสคริปต์อีกครั้ง")
        return
        
    print(f"พบไฟล์ต้นฉบับ: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # 1. Inject CSS for Collapsible Sidebar
    css_to_inject = """
/* --- CSS สำหรับระบบยืดหดแถบเมนูข้าง (Collapsible Sidebar) --- */
.sidebar {
  transition: transform 0.3s ease, margin-left 0.3s ease, width 0.3s ease, padding 0.3s ease !important;
}
@media(min-width: 769px) {
  .sidebar.collapsed {
    width: 0 !important;
    padding: 0 !important;
    border-right: none !important;
    margin-left: -250px !important;
  }
}
.hamburger {
  display: flex !important; /* แสดงปุ่มแฮมเบอร์เกอร์บนทุกหน้าจอเพื่อใช้ยืดหดเมนู */
}
"""
    # Insert before </style>
    if "</style>" in content:
        content = content.replace("</style>", css_to_inject + "\n</style>", 1)
        
    # 2. Inject JavaScript Dynamic Filtering & Collapse logic
    js_to_inject = """
  /* ─────── กรองเฉพาะคณะวิศวกรรมศาสตร์และเทคโนโลยี (วิศวะ) ─────── */
  (function() {
    const targetFac = "วิศวกรรมศาสตร์และเทคโนโลยี";
    const targetFacIndex = FAC.indexOf(targetFac);
    if (targetFacIndex === -1) {
      console.warn("ไม่พบคณะวิศวกรรมศาสตร์และเทคโนโลยีในระบบ");
      return;
    }

    // 1. กรองรายการคณะเหลือเพียงคณะวิศวะ
    const originalFac = [...FAC];
    FAC.length = 0;
    FAC.push(originalFac[targetFacIndex]);

    // 2. กรองสาขาวิชาเฉพาะคณะวิศวะ (f = targetFacIndex) และแมป f ใหม่เป็น 0 (index แรกของ FAC)
    const filteredProgs = PROG.filter(p => p.f === targetFacIndex);
    filteredProgs.forEach(p => p.f = 0);
    PROG.length = 0;
    PROG.push(...filteredProgs);

    // 3. ค้นหาและกรองตัวแปรที่เก็บข้อมูลนักศึกษา (เช่น DATA หรือ STUDENTS)
    let dataVarName = ['DATA', 'STUDENTS', 'raw_data', 'students', 'data'].find(v => typeof window[v] !== 'undefined' && Array.isArray(window[v]));
    if (dataVarName) {
      const rawData = window[dataVarName];
      if (rawData.length > 0) {
        const isArray = Array.isArray(rawData[0]);
        let filtered = [];
        if (isArray) {
          // ในโครงสร้าง Array: row[1] คือดัชนีคณะ
          filtered = rawData.filter(row => row[1] === targetFacIndex);
          filtered.forEach(row => row[1] = 0);
        } else {
          // ในโครงสร้าง Object
          filtered = rawData.filter(row => row.f === targetFacIndex || row.faculty === targetFacIndex || row.faculty === targetFac);
          filtered.forEach(row => {
            if ('f' in row) row.f = 0;
            if ('faculty' in row) row.faculty = (typeof row.faculty === 'number') ? 0 : targetFac;
          });
        }
        rawData.length = 0;
        rawData.push(...filtered);
        console.log(`กรองข้อมูลสำเร็จ: เหลือเฉพาะคณะวิศวะ จำนวน ${filtered.length} คน`);
      }
    }

    // 4. อัปเดตหัวข้อและ Badge อัตโนมัติเมื่อเว็บโหลดเสร็จ
    document.addEventListener("DOMContentLoaded", () => {
      // อัปเดต Title
      document.title = "Dashboard นักศึกษา PIM คณะวิศวกรรมศาสตร์และเทคโนโลยี · 2565–2569";
      
      // อัปเดตหัวข้อหน้าเว็บ
      const h1 = document.querySelector("header h1");
      if (h1) h1.textContent = "Dashboard นักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยี (PIM)";
      
      const sub = document.querySelector("header .sub");
      if (sub) sub.textContent = "คณะวิศวกรรมศาสตร์และเทคโนโลยี · ปีการศึกษา 2565–2569 · เลือกสาขาได้";
      
      // อัปเดตตัวเลขรวมด้านบนขวา (Date Badge)
      const dateBadge = document.querySelector(".date-badge");
      if (dateBadge) {
        const totalCount = dataVarName ? window[dataVarName].length : 0;
        dateBadge.innerHTML = `
          <div style="font-weight:700">ข้อมูล ณ ปีการศึกษา 2569</div>
          <div style="opacity:.85">1 คณะ · ${filteredProgs.length} สาขา · ${totalCount.toLocaleString('th-TH')} คน</div>
        `;
      }
      
      // ซ่อนชิปเลือกคณะในแถบด้านซ้าย เพราะมีแค่คณะเดียวแล้ว
      const fFacGroup = document.getElementById("fFac")?.closest(".fg");
      if (fFacGroup) {
        fFacGroup.style.display = "none";
      }
      
      // ฟื้นฟูสถานะการปิด-เปิด Sidebar จาก localStorage
      const sidebar = document.getElementById("sidebar");
      if (sidebar && localStorage.getItem("dashboard_sidebar_collapsed") === "true" && window.innerWidth > 768) {
        sidebar.classList.add("collapsed");
      }
    });
  })();
"""
    # Insert JS at the beginning of script block
    if "<script>" in content:
        content = content.replace("<script>", "<script>\n" + js_to_inject, 1)
        
    # 3. Update toggleSidebar function to support desktop collapse
    new_toggle_sidebar_js = """
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open");
    if (overlay) overlay.classList.toggle("show");
  } else {
    sidebar.classList.toggle("collapsed");
    // บันทึกสถานะเพื่อเปิดใหม่แล้วยังจำได้
    localStorage.setItem("dashboard_sidebar_collapsed", sidebar.classList.contains("collapsed") ? "true" : "false");
  }
}
"""
    # Replace old toggleSidebar
    content = re.sub(r'function\s+toggleSidebar\(\)\s*\{.*?\}', new_toggle_sidebar_js, content, flags=re.DOTALL)
    
    # 4. Write output file
    dir_name = os.path.dirname(file_path)
    output_filename = "dashboard_engineering.html"
    output_path = os.path.join(dir_name, output_filename)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    # Also write to workspace for easy viewing
    workspace_path = os.path.join(".", output_filename)
    with open(workspace_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"✨ ปรับปรุงแดชบอร์ดสำเร็จ!")
    print(f"👉 ไฟล์ผลลัพธ์ถูกบันทึกไว้ที่: {output_path}")
    print(f"👉 และคัดลอกมายังโฟลเดอร์โครงการนี้: {workspace_path}")
    print("คุณสามารถดับเบิ้ลคลิกเปิดไฟล์นี้ในเบราว์เซอร์เพื่อใช้งานได้ทันที!")

if __name__ == "__main__":
    main()
