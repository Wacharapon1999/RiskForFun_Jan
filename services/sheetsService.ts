
import { GameRecord } from '../types';
import { GOOGLE_SHEETS_WEBAPP_URL } from '../constants';

/**
 * วิธีแก้ปัญหา "Failed to fetch" สำหรับ Google Apps Script:
 * 1. ตรวจสอบสิทธิ์ใน Apps Script: Deploy -> Manage Deployments -> Who has access: "Anyone"
 * 2. ห้ามเพิ่ม Custom Headers (เช่น Authorization หรือ X-Requested-With) ในการเรียก GET 
 *    เพราะจะทำให้เกิด Preflight OPTIONS request ซึ่ง Google ไม่รองรับ
 */

const cleanUrl = GOOGLE_SHEETS_WEBAPP_URL.trim();

export const fetchRecords = async (): Promise<GameRecord[]> => {
  if (!cleanUrl || cleanUrl.includes('YOUR_DEPLOYMENT_ID') || !cleanUrl.startsWith('https://')) {
    console.error("Invalid URL configuration.");
    return [];
  }
  
  try {
    // ใช้รูปแบบการ Fetch ที่เรียบง่ายที่สุด เพื่อหลีกเลี่ยง CORS Preflight
    const response = await fetch(cleanUrl, {
      method: 'GET',
      redirect: 'follow', // จำเป็นมากเพราะ Google จะ Redirect ไปยังหน้าไฟล์ JSON
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Critical error in fetchRecords:", error);
    // แจ้งเตือนสาเหตุที่เป็นไปได้มากที่สุด
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (โปรดตรวจสอบการตั้งค่า 'Anyone' ใน Apps Script หรือลองปิด AdBlocker)");
    }
    throw error;
  }
};

export const saveRecord = async (record: GameRecord): Promise<boolean> => {
  if (!cleanUrl || cleanUrl.includes('YOUR_DEPLOYMENT_ID')) {
    return false;
  }

  try {
    // ใช้โหมด no-cors สำหรับการ POST เพราะ Apps Script มักไม่ส่ง CORS headers กลับมาใน POST
    // แม้เราจะไม่เห็น response body แต่ข้อมูลจะถูกบันทึกสำเร็จ
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      body: JSON.stringify(record),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
    
    return true;
  } catch (error) {
    console.error("Error saving record:", error);
    return false;
  }
};
