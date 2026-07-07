/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Dashboard from './components/Dashboard';
import QuotationPaper from './components/QuotationPaper';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import { Quotation, BusinessProfile, Customer } from './types';
import { Monitor, Phone, Download, Sparkles, CheckCircle2 } from 'lucide-react';

// Firebase & Google Auth/Docs Exports
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout as firebaseLogout, 
  getAccessToken 
} from './lib/firebase';
import { 
  fetchAllUserDataFromFirestore, 
  saveProfileToFirestore, 
  saveCustomerToFirestore, 
  saveQuotationToFirestore, 
  deleteQuotationFromFirestore,
  deleteProfileFromFirestore,
  deleteCustomerFromFirestore
} from './lib/firestoreSync';
import { exportToGoogleDocs } from './lib/googleDocsExport';

const LOCAL_STORAGE_KEY = 'day_neramit_quotation_builder_state_v1';

// --- HELPER TO CONVERT OKLCH TO sRGB FOR HTML2CANVAS COMPATIBILITY ---
function oklchToRgb(l_val: number, c_val: number, h_val: number): [number, number, number] {
  const h_rad = (h_val * Math.PI) / 180;
  const a_oklab = c_val * Math.cos(h_rad);
  const b_oklab = c_val * Math.sin(h_rad);

  const L_lms = l_val + 0.3963377774 * a_oklab + 0.2158037573 * b_oklab;
  const M_lms = l_val - 0.1055613458 * a_oklab - 0.0638541728 * b_oklab;
  const S_lms = l_val - 0.0894841775 * a_oklab - 1.291485548 * b_oklab;

  const l_cube = L_lms * L_lms * L_lms;
  const m_cube = M_lms * M_lms * M_lms;
  const s_cube = S_lms * S_lms * S_lms;

  const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

  const toSRGB = (c: number) => {
    if (c <= 0.0031308) {
      return 12.92 * c;
    }
    return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const r = Math.max(0, Math.min(255, Math.round(toSRGB(r_lin) * 255)));
  const g = Math.max(0, Math.min(255, Math.round(toSRGB(g_lin) * 255)));
  const b = Math.max(0, Math.min(255, Math.round(toSRGB(b_lin) * 255)));

  return [r, g, b];
}

function convertOklchStringToRgb(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklch')) {
    return str;
  }

  // Matches oklch(...) including anything inside the parentheses to handle custom alpha formats (like variables)
  const oklchRegex = /oklch\(([^)]+)\)/gi;

  return str.replace(oklchRegex, (match, inner) => {
    try {
      const parts = inner.trim().split('/');
      const colorPart = parts[0].trim();
      const alphaPart = parts[1] ? parts[1].trim() : null;

      // Split by spaces, commas, or multiple delimiters to be exceptionally resilient
      const colorValues = colorPart.split(/[\s,]+/).filter(Boolean);
      if (colorValues.length < 3) {
        return 'rgb(100, 116, 139)'; // Safe fallback color
      }

      const lStr = colorValues[0];
      const cStr = colorValues[1];
      const hStr = colorValues[2];

      let l = parseFloat(lStr);
      if (lStr.includes('%')) {
        l = l / 100;
      }

      let c = parseFloat(cStr);
      if (cStr.includes('%')) {
        c = c / 100;
      }

      let h = parseFloat(hStr);
      if (hStr.includes('deg')) {
        h = parseFloat(hStr.replace('deg', ''));
      } else if (hStr.includes('rad')) {
        h = (parseFloat(hStr.replace('rad', '')) * 180) / Math.PI;
      } else if (hStr.includes('turn')) {
        h = parseFloat(hStr.replace('turn', '')) * 360;
      }

      let a = 1;
      if (alphaPart) {
        const alphaMatch = alphaPart.match(/[0-9.]+/);
        if (alphaMatch) {
          a = parseFloat(alphaMatch[0]);
          if (alphaPart.includes('%')) {
            a = a / 100;
          }
        }
      }

      if (isNaN(l) || isNaN(c) || isNaN(h)) {
        return 'rgb(100, 116, 139)'; // Safe fallback
      }

      const [r, g, b] = oklchToRgb(l, c, h);
      if (alphaPart) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      } else {
        return `rgb(${r}, ${g}, ${b})`;
      }
    } catch (e) {
      console.warn('Failed to parse oklch color:', match, e);
      return 'rgb(100, 116, 139)'; // Safe fallback to completely prevent html2canvas crash
    }
  });
}

// Luxury Base Models (Factory Defaults)
const DEFAULT_PROFILES: BusinessProfile[] = [
  {
    id: 'default-corporate',
    name: 'บริษัท เดย์ เนรมิต จำกัด',
    slogan: 'SMART REPAIR & RENOVATION – ครบ จบ เรื่องบ้าน ไว้ใจมืออาชีพ',
    taxId: '',
    address: '',
    phone: '0924367468',
    email: 'contact@dayneramit.com',
    website: 'www.dayneramit.com',
    line: '0924367468',
    customLogo: null,
    senderType: 'corporate',
  },
  {
    id: 'default-individual',
    name: 'เดย์ เนรมิต (ช่างรับเหมาและรีโนเวททั่วไป)',
    slogan: 'บริการงานช่าง ต่อเติม ตกแต่ง รวดเร็ว ใส่ใจงานฝีมือประณีต',
    taxId: '',
    address: '',
    phone: '0924367468',
    email: 'day.renovate@gmail.com',
    website: '',
    line: '0924367468',
    customLogo: null,
    senderType: 'individual',
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'default-customer',
    name: 'บริษัท สมาร์ทโฮม ดีเวลลอปเม้นท์ จำกัด',
    address: '',
    taxId: '',
    phone: '02-543-2109',
    email: 'purchasing@smarthome.co.th',
  },
];

const DEFAULT_QUOTATION: Quotation = {
  id: 'default-quote-id',
  docNo: 'QT-2569-0001',
  docDate: '15 ตุลาคม 2569',
  validUntil: '22 ตุลาคม 2569',
  refNo: 'โครงการต่อเติมลานจอดรถและสระว่ายน้ำ',
  profileId: 'default-corporate',
  customerId: 'default-customer',
  items: [
    {
      id: 'i-1',
      desc: '',
      detail: '',
      qty: 0,
      unit: 'ชุด',
      price: 0,
    },
  ],
  discount: 0,
  discountType: 'flat',
  vatEnabled: true,
  vatRate: 7,
  notes: [
    'ราคานี้รวมค่าแรง อุปกรณ์ และเครื่องมือติดตั้งมาตรฐานวิศวกรรมแล้ว',
    'รับประกันคุณภาพงานโครงสร้างและระบบน้ำซึมนาน 180 วัน นับจากวันส่งมอบงาน',
    'รับประกันคอมเพรสเซอร์เครื่องปรับอากาศ 5 ปี ตามเงื่อนไขการดูแลของผู้ผลิต',
  ],
  paymentTerms: "ชำระงวดแรก 50% มัดจำเพื่อเซ็นสัญญาเริ่มงาน\nชำระส่วนที่เหลือ 50% ภายใน 7 วัน หลังเสร็จสิ้นการส่งมอบงานประเมินขั้นสุดท้าย",
  bank: {
    name: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)',
    no: '',
    owner: 'นาย มาโนช เคนดี',
    qrValue: '0924367468',
    qrType: 'promptpay',
    customQr: null,
  },
  signeeName: 'ช่างเดย์ เนรมิต',
  signeePosition: 'ผู้เสนอราคา',
  template: 'luxury',
  updatedAt: '6 ก.ค. 2569',
};

export default function App() {
  // Global React PWA State Machine
  const [profiles, setProfiles] = useState<BusinessProfile[]>(DEFAULT_PROFILES);
  const [customers, setCustomers] = useState<Customer[]>(DEFAULT_CUSTOMERS);
  const [savedQuotations, setSavedQuotations] = useState<Quotation[]>([DEFAULT_QUOTATION]);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation>(DEFAULT_QUOTATION);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Google Auth & Cloud Sync State Machine
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedDocUrl, setExportedDocUrl] = useState<string | null>(null);

  // Load session from Firebase on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken('');
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast(`🔑 เข้าสู่ระบบกูเกิลสำเร็จ ต้อนรับคุณ ${res.user.displayName || 'ผู้ใช้งาน'}`, 'success');
        // Automatically trigger sync upon login
        await triggerCloudSync(res.user.uid, res.accessToken);
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('❌ เข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setAccessToken('');
      setExportedDocUrl(null);
      showToast('🚪 ออกจากระบบกูเกิลสำเร็จแล้ว ข้อมูลจะคงอยู่บนเครื่องของคุณแบบออฟไลน์', 'success');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('❌ ไม่สามารถออกจากระบบได้', 'error');
    }
  };

  const handleExportToGoogleDocs = async () => {
    if (!accessToken) {
      showToast('⚠️ กรุณาเข้าสู่ระบบกูเกิลก่อนเชื่อมต่อออกเอกสาร Docs', 'error');
      return;
    }
    try {
      setIsExporting(true);
      showToast('⏳ กำลังแปลงข้อมูลและสร้างเอกสาร Google Docs รูปแบบตารางอันล้ำสมัย...', 'info');
      
      const activeProfile = profiles.find((p) => p.id === currentQuotation.profileId) || profiles[0];
      const activeCustomer = customers.find((c) => c.id === currentQuotation.customerId) || customers[0];
      
      const res = await exportToGoogleDocs(accessToken, currentQuotation, activeProfile, activeCustomer);
      setExportedDocUrl(res.docUrl);
      showToast('🎉 ส่งออกใบเสนอราคาสู่ Google Docs สำเร็จ! เปิดดูลิงก์ได้ทันที', 'success');
    } catch (err) {
      console.error('Google Docs export error:', err);
      showToast('❌ เกิดข้อผิดพลาดในการส่งออก Google Docs', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const triggerCloudSync = async (userId: string, token: string) => {
    try {
      setIsSyncing(true);
      showToast('🔄 กำลังเชื่อมต่อระบบคลาวด์และประสานข้อมูลสำรอง...', 'info');
      
      // 1. Fetch from firestore
      const cloudData = await fetchAllUserDataFromFirestore(userId);
      
      // 2. Perform safe merge
      let mergedProfiles = [...profiles];
      let mergedCustomers = [...customers];
      let mergedSaved = [...savedQuotations];
      
      if (cloudData.profiles.length > 0 || cloudData.customers.length > 0 || cloudData.savedQuotations.length > 0) {
        // Merge profiles
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        cloudData.profiles.forEach(p => { if (!profileMap.has(p.id)) profileMap.set(p.id, p); });
        mergedProfiles = Array.from(profileMap.values());

        // Merge customers
        const customerMap = new Map(customers.map(c => [c.id, c]));
        cloudData.customers.forEach(c => { if (!customerMap.has(c.id)) customerMap.set(c.id, c); });
        mergedCustomers = Array.from(customerMap.values());

        // Merge quotations
        const quoteMap = new Map(savedQuotations.map(q => [q.id, q]));
        cloudData.savedQuotations.forEach(q => { if (!quoteMap.has(q.id)) quoteMap.set(q.id, q); });
        mergedSaved = Array.from(quoteMap.values());
      }

      // 3. Upload all local data to Firestore to make sure cloud is perfectly backed up and synced
      for (const p of mergedProfiles) {
        await saveProfileToFirestore(userId, p);
      }
      for (const c of mergedCustomers) {
        await saveCustomerToFirestore(userId, c);
      }
      for (const q of mergedSaved) {
        await saveQuotationToFirestore(userId, q);
      }
      
      // Update local PWA state machine
      syncAndSave(mergedProfiles, mergedCustomers, mergedSaved, currentQuotation);
      
      showToast('☁️ ประสานข้อมูลคลาวด์สำรองและฐานข้อมูลออฟไลน์เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      console.error('Cloud sync error:', err);
      showToast('❌ ไม่สามารถประสานข้อมูลสำรองกับคลาวด์ได้', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Interactive Toast Frame State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA App installation captures
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Resize Listener Reference for perfect scale on A4 previews
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const showToast = (text: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial local storage mount loader
  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.savedQuotations) setSavedQuotations(parsed.savedQuotations);
        if (parsed.currentQuotation) setCurrentQuotation(parsed.currentQuotation);
      } catch (err) {
        console.error('Error parsing stored PWA data:', err);
      }
    }

    // Capture PWA browser install bindings
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      showToast('🎉 ติดตั้งแอป เดย์ เนรมิต สำเร็จแล้ว! ยินดีต้อนรับสู่ระบบออฟไลน์', 'success');
    });
  }, []);

  // Offline Sync State loop saver
  const syncAndSave = (
    updatedProfiles: BusinessProfile[],
    updatedCustomers: Customer[],
    updatedSaved: Quotation[],
    updatedCurrent: Quotation
  ) => {
    setProfiles(updatedProfiles);
    setCustomers(updatedCustomers);
    setSavedQuotations(updatedSaved);
    setCurrentQuotation(updatedCurrent);

    const data = {
      profiles: updatedProfiles,
      customers: updatedCustomers,
      savedQuotations: updatedSaved,
      currentQuotation: updatedCurrent,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  // Profile controllers
  const handleCreateProfile = (profile: BusinessProfile) => {
    const updated = [...profiles, profile];
    syncAndSave(updated, customers, savedQuotations, {
      ...currentQuotation,
      profileId: profile.id,
    });
    showToast(`🏢 สร้างโปรไฟล์ผู้เสนอราคา "${profile.name}" สำเร็จ`, 'success');
  };

  const handleUpdateProfile = (profile: BusinessProfile) => {
    const updated = profiles.map((p) => (p.id === profile.id ? profile : p));
    syncAndSave(updated, customers, savedQuotations, currentQuotation);
  };

  // Customer controllers
  const handleCreateCustomer = (customer: Customer) => {
    const updated = [...customers, customer];
    syncAndSave(profiles, updated, savedQuotations, {
      ...currentQuotation,
      customerId: customer.id,
    });
    showToast(`👥 เพิ่มรายชื่อลูกค้า "${customer.name}" ลงในสมุดบัญชีแล้ว`, 'success');
  };

  const handleUpdateCustomer = (customer: Customer) => {
    const updated = customers.map((c) => (c.id === customer.id ? customer : c));
    syncAndSave(profiles, updated, savedQuotations, currentQuotation);
  };

  // Quotation history controllers
  const handleSaveQuotation = () => {
    const now = new Date();
    const formattedDate = `${now.getDate()} ${
      [
        'ม.ค.',
        'ก.พ.',
        'มี.ค.',
        'เม.ย.',
        'พ.ค.',
        'มิ.ย.',
        'ก.ค.',
        'ส.ค.',
        'ก.ย.',
        'ต.ค.',
        'พ.ย.',
        'ธ.ค.',
      ][now.getMonth()]
    } ${now.getFullYear() + 543}`;

    const exists = savedQuotations.find((q) => q.id === currentQuotation.id);
    let updatedSaved: Quotation[];

    if (exists) {
      updatedSaved = savedQuotations.map((q) =>
        q.id === currentQuotation.id
          ? { ...currentQuotation, updatedAt: formattedDate }
          : q
      );
      showToast(`📝 บันทึกการเปลี่ยนแปลงใบเสนอราคา "${currentQuotation.docNo}" แล้ว`, 'success');
    } else {
      const newQuote = { ...currentQuotation, updatedAt: formattedDate };
      updatedSaved = [...savedQuotations, newQuote];
      showToast(`💾 บันทึกใบเสนอราคาใหม่ "${currentQuotation.docNo}" ลงคลังร่างสำเร็จ`, 'success');
    }

    syncAndSave(profiles, customers, updatedSaved, currentQuotation);
  };

  const handleLoadQuotation = (id: string) => {
    const target = savedQuotations.find((q) => q.id === id);
    if (!target) return;
    syncAndSave(profiles, customers, savedQuotations, target);
    showToast(`📂 ดึงใบเสนอราคาเลขที่ "${target.docNo}" ขึ้นมาพร้อมแก้ไข`, 'info');
    setActiveView('preview');
  };

  const handleDuplicateQuotation = (id: string) => {
    const target = savedQuotations.find((q) => q.id === id);
    if (!target) return;
    const duplicated: Quotation = {
      ...target,
      id: crypto.randomUUID(),
      docNo: `${target.docNo}-สำเนา`,
      updatedAt: 'ก๊อปปี้ร่าง',
    };
    const updatedSaved = [...savedQuotations, duplicated];
    syncAndSave(profiles, customers, updatedSaved, currentQuotation);
    showToast(`📂 คัดลอกเอกสาร "${target.docNo}" สำเร็จ`, 'success');
  };

  const handleDeleteQuotation = (id: string) => {
    if (savedQuotations.length <= 1) {
      showToast('⚠️ คุณจำเป็นต้องเหลือเอกสารร่างไว้ในคลังอย่างน้อย 1 รายการ', 'error');
      return;
    }
    const updatedSaved = savedQuotations.filter((q) => q.id !== id);
    let updatedCurrent = currentQuotation;
    if (currentQuotation.id === id) {
      updatedCurrent = updatedSaved[0];
    }
    syncAndSave(profiles, customers, updatedSaved, updatedCurrent);
    showToast('🗑️ ลบเอกสารออกจากประวัติแล้ว', 'success');
  };

  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตประวัติ ข้อมูลโปรไฟล์ และลูกค้าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setProfiles(DEFAULT_PROFILES);
      setCustomers(DEFAULT_CUSTOMERS);
      setSavedQuotations([DEFAULT_QUOTATION]);
      setCurrentQuotation(DEFAULT_QUOTATION);
      showToast('↺ รีเซ็ตโครงสร้างฐานข้อมูลผู้เสนอราคาสู่ค่าเริ่มต้นโรงงานแล้ว', 'info');
    }
  };

  // Perfect Scaler calculations
  useEffect(() => {
    const calculateScale = () => {
      const container = previewContainerRef.current;
      if (!container) return;
      const horizontalPadding = window.innerWidth < 768 ? 20 : 60;
      const availableWidth = container.clientWidth - horizontalPadding;
      const a4NaturalWidth = 794; // width in pixels at standard 96dpi (210mm)
      const calculatedScale = Math.min(1, availableWidth / a4NaturalWidth);
      setScale(Math.max(0.35, calculatedScale));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [activeView]);

  // Install PWA trigger
  const triggerPwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted standard PWA installations');
    }
    setDeferredPrompt(null);
  };

  const generatePdf = async () => {
    const element = document.getElementById('quotation-paper');
    if (!element) {
      showToast('❌ ไม่พบแบบฟอร์มเอกสารใบเสนอราคา', 'error');
      return;
    }

    // Capture the original getComputedStyle to restore later
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      setIsGeneratingPdf(true);
      showToast('⏳ กำลังจัดเตรียมหน้ากระดาษและดาวน์โหลด PDF ความละเอียดสูง...', 'info');

      // PREPROCESS: Convert all OKLCH colors in page styleSheets and style elements to sRGB.
      // This completely prevents html2canvas from crashing when parsing unsupported 'oklch' CSS color variables!
      try {
        // 1. Process all active stylesheets (including Tailwind v4 dynamic CSSOM rules)
        const processRules = (rules: CSSRuleList) => {
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule instanceof CSSStyleRule) {
              if (rule.cssText && rule.cssText.includes('oklch')) {
                const style = rule.style;
                for (let k = 0; k < style.length; k++) {
                  const prop = style[k];
                  const val = style.getPropertyValue(prop);
                  if (val && val.includes('oklch')) {
                    style.setProperty(prop, convertOklchStringToRgb(val), style.getPropertyPriority(prop));
                  }
                }
              }
            } else if (rule && 'cssRules' in rule) {
              try {
                const subRules = (rule as any).cssRules as CSSRuleList;
                if (subRules) {
                  processRules(subRules);
                }
              } catch (subErr) {
                // Ignore sub-rule access issues
              }
            }
          }
        };

        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              processRules(rules);
            }
          } catch (sheetErr) {
            // Safe fallback for cross-origin sheets
          }
        }

        // 2. Also fallback-convert textContent of any inline style tags
        const styleElements = document.getElementsByTagName('style');
        for (let i = 0; i < styleElements.length; i++) {
          const el = styleElements[i];
          if (el.textContent && el.textContent.includes('oklch')) {
            el.textContent = convertOklchStringToRgb(el.textContent);
          }
        }
      } catch (stylePreloadErr) {
        console.warn('Failed to pre-process stylesheets for html2canvas:', stylePreloadErr);
      }

      // MONKEY-PATCH window.getComputedStyle to intercept and replace any 'oklch' values.
      // This is the absolute ultimate guarantee that html2canvas will never process an oklch color string,
      // completely bypassing the internal color-parsing crash!
      window.getComputedStyle = function (el, pseudoElt) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (val && typeof val === 'string' && val.includes('oklch')) {
                  return convertOklchStringToRgb(val);
                }
                return val;
              };
            }
            const val = (target as any)[prop];
            if (val && typeof val === 'string' && val.includes('oklch')) {
              return convertOklchStringToRgb(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          },
        });
      };

      // Force canvas options for pixel-perfect rendering
      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2, // Double DPI/retina scale for crystal clear font vectors
          useCORS: true,
          logging: false,
          backgroundColor: currentQuotation.template === 'luxury' || currentQuotation.template === 'dark' ? '#09090b' : '#ffffff',
          onclone: (clonedDoc) => {
            const elements = clonedDoc.getElementsByTagName('*');
            const props = [
              'color',
              'background-color',
              'border-color',
              'border-top-color',
              'border-right-color',
              'border-bottom-color',
              'border-left-color',
              'fill',
              'stroke',
              'outline-color',
              'box-shadow',
            ];

            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              if (!el.style) continue;

              try {
                const style = window.getComputedStyle(el);
                props.forEach((prop) => {
                  const val = style.getPropertyValue(prop);
                  if (val && typeof val === 'string' && val.includes('oklch')) {
                    const converted = convertOklchStringToRgb(val);
                    el.style.setProperty(prop, converted, 'important');
                  }
                });
              } catch (styleErr) {
                // Safe fallback for detached elements
              }
            }
          }
        });
      } finally {
        // ALWAYS restore getComputedStyle immediately to prevent any potential runtime side effects!
        window.getComputedStyle = originalGetComputedStyle;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = 210; // A4 width in mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      const fileName = `Quotation_${currentQuotation.docNo || 'Draft'}.pdf`;
      pdf.save(fileName);

      showToast('🎉 ดาวน์โหลดใบเสนอราคา PDF สำเร็จ!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('❌ ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใช้ปุ่ม "พิมพ์/สำรอง" ด้านข้างแทน', 'error');
    } finally {
      setIsGeneratingPdf(false);
      // Guarantee restore as double protection
      window.getComputedStyle = originalGetComputedStyle;
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const activeProfile = profiles.find((p) => p.id === currentQuotation.profileId) || profiles[0];
  const activeCustomer = customers.find((c) => c.id === currentQuotation.customerId) || customers[0];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col md:flex-row antialiased select-none font-sans overflow-hidden">
      
      {/* Toast Overlay stack */}
      <Toast toasts={toasts} onClose={handleCloseToast} />

      {/* LEFT PANEL: Interactive Workspace console */}
      <div className={`${activeView === 'edit' ? 'block' : 'hidden md:block'} shrink-0`}>
        <Dashboard
          currentQuotation={currentQuotation}
          profiles={profiles}
          customers={customers}
          savedQuotations={savedQuotations}
          onUpdateQuotation={(updater) => syncAndSave(profiles, customers, savedQuotations, updater(currentQuotation))}
          onSaveQuotation={handleSaveQuotation}
          onLoadQuotation={handleLoadQuotation}
          onDuplicateQuotation={handleDuplicateQuotation}
          onDeleteQuotation={handleDeleteQuotation}
          onCreateProfile={handleCreateProfile}
          onUpdateProfile={handleUpdateProfile}
          onCreateCustomer={handleCreateCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onResetToDefault={handleResetToDefault}
          onTriggerPrint={triggerPrint}
          onGeneratePdf={generatePdf}
          isGeneratingPdf={isGeneratingPdf}
          activeView={activeView}
          onSetActiveView={setActiveView}
          user={user}
          accessToken={accessToken}
          isSyncing={isSyncing}
          isExportingToDocs={isExporting}
          exportedDocUrl={exportedDocUrl}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onExportToDocs={handleExportToGoogleDocs}
          onSyncWithCloud={() => user ? triggerCloudSync(user.uid, accessToken) : Promise.resolve()}
        />
      </div>

      {/* RIGHT PANEL: Live rendering virtual stage */}
      <div
        ref={previewContainerRef}
        className={`${activeView === 'preview' ? 'flex' : 'hidden md:flex'} flex-1 bg-slate-950 h-screen overflow-y-auto flex-col items-center p-4 relative border-l border-slate-900`}
      >
        {/* Responsive Mobile bar */}
        <div className="w-full max-w-[210mm] flex items-center justify-between py-2 mb-3 no-print z-10 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('edit')}
              className="md:hidden flex items-center gap-1 text-xs font-bold text-slate-100 bg-slate-900 border border-slate-800 hover:bg-slate-850 px-3 py-2 rounded-xl"
            >
              ← แก้ไขฟอร์ม
            </button>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800/40 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ทำงานแบบออฟไลน์สำเร็จ
            </span>
          </div>

          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button
                onClick={triggerPwaInstall}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-xl font-title"
              >
                📱 ติดตั้งแอป (PWA)
              </button>
            )}
            <button
              onClick={generatePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2.5 rounded-xl font-title shadow-md shadow-amber-500/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent"></span>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> ดาวน์โหลด PDF โดยตรง
                </>
              )}
            </button>
            <button
              onClick={triggerPrint}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3.5 py-2.5 rounded-xl font-title"
              title="พิมพ์เอกสาร / ดาวน์โหลดสำรอง"
            >
              🖨️ พิมพ์/สำรอง
            </button>
          </div>
        </div>

        {/* Live scaling layout canvas */}
        <div className="flex-1 flex items-start justify-center w-full relative select-text">
          <div
            className="origin-top transition-transform duration-200"
            style={{
              transform: `scale(${scale})`,
              width: '210mm',
              height: '297mm',
              marginBottom: `${Math.max(0, 1123 * (scale - 1))}px`, // offset container height during downscaling
            }}
          >
            <QuotationPaper
              profile={activeProfile}
              customer={activeCustomer}
              items={currentQuotation.items}
              docNo={currentQuotation.docNo}
              docDate={currentQuotation.docDate}
              validUntil={currentQuotation.validUntil}
              refNo={currentQuotation.refNo}
              discount={currentQuotation.discount}
              discountType={currentQuotation.discountType}
              vatEnabled={currentQuotation.vatEnabled}
              vatRate={currentQuotation.vatRate}
              notes={currentQuotation.notes}
              paymentTerms={currentQuotation.paymentTerms}
              bank={currentQuotation.bank}
              signeeName={currentQuotation.signeeName}
              signeePosition={currentQuotation.signeePosition}
              template={currentQuotation.template}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
