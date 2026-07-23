import urllib.request
import os

files = {
    "lucide.min.js": "https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js",
    "chart.umd.js": "https://cdn.jsdelivr.net/npm/chart.js@latest/dist/chart.umd.js"
}

print("กำลังดาวน์โหลดไฟล์ไลบรารีเพื่อนำมาเก็บในเครื่องคอมพิวเตอร์ของคุณ (Local Hosting)...")

for filename, url in files.items():
    try:
        if os.path.exists(filename):
            os.remove(filename)  # Delete old file to prevent partial downloads
            
        print(f"กำลังดาวน์โหลด {filename} จาก {url} ...")
        urllib.request.urlretrieve(url, filename)
        
        size = os.path.getsize(filename)
        print(f"ดาวน์โหลด {filename} สำเร็จ! ขนาดไฟล์: {size:,} ไบต์")
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการดาวน์โหลด {filename}: {e}")

print("เสร็จสิ้นการดาวน์โหลด!")
