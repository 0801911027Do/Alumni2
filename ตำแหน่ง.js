function generateMockPositionData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("ตำแหน่งงาน");
  if (!sheet) {
    sheet = ss.insertSheet("ตำแหน่งงาน");
  }
  sheet.clear();
  
  // 1. กำหนดหัวตารางตามรูปภาพที่ 2 เป๊ะๆ
  const headers = [
    "ชื่อตำแหน่ง", "แผนก/หน่วยงาน", "หน้าที่/ความรับผิดชอบ", "คุณสมบัติ", 
    "จำนวน", "วันทำงาน", "เวลา", "รูปแบบการปฏิบัติงาน (Onsite/Hybrid/WFH)", "เบี้ยเลี้ยง"
  ];

  // 2. คลังข้อมูลตำแหน่งงาน สอดคล้องตามสายงานต่างๆ
  const jobProfiles = [
    {
      title: "นักพัฒนาซอฟต์แวร์ (Software Developer)",
      dept: "ฝ่ายเทคโนโลยีสารสนเทศ (IT)",
      resp: "พัฒนาและดูแลระบบ Web/Mobile Application, เขียนและทดสอบโค้ด, แก้ไขข้อผิดพลาดของโปรแกรม",
      qual: "กำลังศึกษาชั้นปีที่ 3-4 สาขาคอมพิวเตอร์ หรือ IT, มีความรู้ภาษา Java, Python หรือ JavaScript, มีความกระตือรือร้น"
    },
    {
      title: "ผู้จัดการร้านฝึกหัด (Store Manager Trainee)",
      dept: "ฝ่ายปฏิบัติการและบริหารสาขา (Operations)",
      resp: "เรียนรู้ระบบการบริหารจัดการร้านสะดวกซื้อ, ดูแลสต็อกสินค้า, การบริการลูกค้า และการบริหารทีมงานหน้าร้าน",
      qual: "กำลังศึกษาในสาขาการจัดการธุรกิจค้าปลีก หรือที่เกี่ยวข้อง, มีใจรักงานบริการ, สามารถทำงานเป็นกะได้"
    },
    {
      title: "วิศวกรระบบเครือข่าย (Network Engineer)",
      dept: "ฝ่ายโครงสร้างพื้นฐานและเครือข่าย (Infrastructure)",
      resp: "ดูแลระบบ Network, Server, อุปกรณ์ Switch/Router และระบบความปลอดภัยทางไซเบอร์ขององค์กร",
      qual: "กำลังศึกษาในสาขาวิศวกรรมคอมพิวเตอร์ หรือ IT, มีความรู้พื้นฐานระบบ TCP/IP, Network Routing (เช่น Cisco)"
    },
    {
      title: "เจ้าหน้าที่สนับสนุนการตลาดดิจิทัล (Digital Marketing)",
      dept: "ฝ่ายการตลาดและสื่อสารองค์กร (Marketing)",
      resp: "วางแผนทำคอนเทนต์บนโซเชียลมีเดีย, วิเคราะห์ข้อมูลพฤติกรรมลูกค้า, ช่วยดูแลแคมเปญโฆษณาออนไลน์",
      qual: "มีความคิดสร้างสรรค์, ใช้เครื่องมือทำกราฟิกเบื้องต้นได้, สนใจเทรนด์การตลาดออนไลน์และโซเชียลมีเดีย"
    },
    {
      title: "เจ้าหน้าที่โลจิสติกส์และคลังสินค้า (Logistics Officer)",
      dept: "ฝ่ายจัดการคลังสินค้าและซัพพลายเชน (Logistics)",
      resp: "ช่วยวางแผนเส้นทางการจัดส่งสินค้า, วิเคราะห์และปรับปรุงรอบเวลาการจัดส่ง, ดูแลข้อมูลระบบคลังสินค้า",
      qual: "กำลังศึกษาในสาขาการจัดการโลจิสติกส์และโซ่อุปทาน หรือสาขาที่เกี่ยวข้อง, ใช้โปรแกรม Microsoft Excel ได้ดี"
    },
    {
      title: "นักวิเคราะห์ข้อมูลธุรกิจ (Business Data Analyst)",
      dept: "ฝ่ายวิเคราะห์ข้อมูลและยุทธศาสตร์ (Data Analytics)",
      resp: "รวบรวมและทำความสะอาดข้อมูล (Data Cleaning), สร้าง Dashboard แสดงผลข้อมูลเพื่อสนับสนุนการตัดสินใจของผู้บริหาร",
      qual: "มีความรู้พื้นฐาน SQL, Python หรือโปรแกรมทำ Data Visualization (เช่น Power BI, Tableau)"
    }
  ];

  const workDays = ["จันทร์ - ศุกร์", "จันทร์ - เสาร์ (เสาร์เว้นเสาร์)", "ทำงาน 5 วัน/สัปดาห์ (หมุนเวียนกะ)"];
  const workTimes = ["08:30 - 17:30 น.", "09:00 - 18:00 น.", "08:00 - 17:00 น.", "ทำงานเป็นกะ (Shift Work)"];
  const workTypes = ["Onsite", "Hybrid", "WFH", "Onsite", "Hybrid"]; // เน้น Onsite กับ Hybrid ให้สมจริง
  const allowances = ["300 บาท/วัน", "350 บาท/วัน", "5,000 บาท/เดือน", "7,500 บาท/เดือน", "10,000 บาท/เดือน", "ตามโครงสร้างบริษัท"];

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const dataRows = [];

  // 3. วนลูปสร้างข้อมูล 100 แถว
  for (let i = 1; i <= 100; i++) {
    const job = getRandom(jobProfiles);
    const count = Math.floor(Math.random() * 5) + 1; // จำนวนที่รับ 1 - 5 อัตรา

    const row = [
      job.title,                 // ชื่อตำแหน่ง
      job.dept,                  // แผนก/หน่วยงาน
      job.resp,                  // หน้าที่/ความรับผิดชอบ
      job.qual,                  // คุณสมบัติ
      `${count} อัตรา`,            // จำนวน
      getRandom(workDays),       // วันทำงาน
      getRandom(workTimes),      // เวลา
      getRandom(workTypes),      // รูปแบบการปฏิบัติงาน
      getRandom(allowances)      // เบี้ยเลี้ยง
    ];
    
    dataRows.push(row);
  }

  // 4. เขียนข้อมูลลงชีต
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
  
  // จัดรูปแบบตาราง
  sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#DDEBF7"); // สีฟ้าอ่อน
  sheet.setFrozenRows(1);
  
  SpreadsheetApp.getUi().alert("สร้างข้อมูล Mockup 'ตำแหน่งงาน' เรียบร้อยแล้วค่ะ!");
}