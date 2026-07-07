/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

const DEFAULT_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="%230f172a" stroke="%23fbbf24" stroke-width="4"/><text x="50" y="58" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="%23fbbf24">DN</text></svg>`;
import {
  LineItem,
  Customer,
  BusinessProfile,
  BankAccount,
  Quotation,
} from '../types';
import {
  FileText,
  User,
  Users,
  Plus,
  Trash,
  DollarSign,
  Briefcase,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Cloud,
  LogOut,
} from 'lucide-react';

interface DashboardProps {
  currentQuotation: Quotation;
  profiles: BusinessProfile[];
  customers: Customer[];
  savedQuotations: Quotation[];
  onUpdateQuotation: (updater: (prev: Quotation) => Quotation) => void;
  onSaveQuotation: () => void;
  onLoadQuotation: (id: string) => void;
  onDuplicateQuotation: (id: string) => void;
  onDeleteQuotation: (id: string) => void;
  onCreateProfile: (profile: BusinessProfile) => void;
  onUpdateProfile: (profile: BusinessProfile) => void;
  onCreateCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onResetToDefault: () => void;
  onTriggerPrint: () => void;
  onGeneratePdf: () => void;
  isGeneratingPdf: boolean;
  activeView: 'edit' | 'preview';
  onSetActiveView: (view: 'edit' | 'preview') => void;

  // Google Integration additions
  user: any;
  accessToken: string;
  isSyncing: boolean;
  isExportingToDocs: boolean;
  exportedDocUrl: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onExportToDocs: () => void;
  onSyncWithCloud: () => void;
}

type TabType = 'doc' | 'profile' | 'customer' | 'items' | 'payment' | 'drafts';

export default function Dashboard({
  currentQuotation,
  profiles,
  customers,
  savedQuotations,
  onUpdateQuotation,
  onSaveQuotation,
  onLoadQuotation,
  onDuplicateQuotation,
  onDeleteQuotation,
  onCreateProfile,
  onUpdateProfile,
  onCreateCustomer,
  onUpdateCustomer,
  onResetToDefault,
  onTriggerPrint,
  onGeneratePdf,
  isGeneratingPdf,
  activeView,
  onSetActiveView,
  user,
  accessToken,
  isSyncing,
  isExportingToDocs,
  exportedDocUrl,
  onLogin,
  onLogout,
  onExportToDocs,
  onSyncWithCloud,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('doc');

  // Helpers for editing nested states in our single quotation
  const setDoc = (field: keyof Quotation | string, value: any) => {
    onUpdateQuotation((prev) => ({ ...prev, [field]: value }));
  };

  const updateBank = (field: keyof BankAccount, value: any) => {
    onUpdateQuotation((prev) => ({
      ...prev,
      bank: { ...prev.bank, [field]: value },
    }));
  };

  // Profile management helpers
  const handleProfileChange = (profileId: string) => {
    const selected = profiles.find((p) => p.id === profileId);
    if (!selected) return;
    onUpdateQuotation((prev) => ({
      ...prev,
      profileId: selected.id,
      vatEnabled: selected.senderType === 'corporate',
      signeeName: selected.id === 'default-corporate' ? 'ช่างเดย์ เนรมิต' : prev.signeeName,
      signeePosition: selected.id === 'default-corporate' ? 'ผู้เสนอราคา' : prev.signeePosition,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      alert('รองรับเฉพาะ PNG, JPG, WEBP หรือ SVG เท่านั้น');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('ไฟล์ภาพต้องไม่เกิน 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Update currently active profile's logo
      const currentProfile = profiles.find((p) => p.id === currentQuotation.profileId);
      if (currentProfile) {
        onUpdateProfile({ ...currentProfile, customLogo: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const resetCurrentProfileLogo = () => {
    const currentProfile = profiles.find((p) => p.id === currentQuotation.profileId);
    if (currentProfile) {
      onUpdateProfile({ ...currentProfile, customLogo: null });
    }
  };

  // Customer autofill
  const handleCustomerChange = (customerId: string) => {
    const selected = customers.find((c) => c.id === customerId);
    if (!selected) return;
    setDoc('customerId', selected.id);
  };

  // Line Items handlers
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      desc: 'รายการบริการช่างใหม่',
      detail: 'รายละเอียดบริการชุดมาตรฐาน',
      qty: 1,
      unit: 'ชุด',
      price: 0,
    };
    onUpdateQuotation((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateItem = (itemId: string, field: keyof LineItem, value: any) => {
    onUpdateQuotation((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== itemId) return it;
        const val = (field === 'qty' || field === 'price') ? (Number(value) || 0) : value;
        return { ...it, [field]: val };
      }),
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    onUpdateQuotation((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== itemId),
    }));
  };

  const handleCreateNewCustomer = () => {
    const name = prompt('กรุณากรอกชื่อลูกค้าใหม่:');
    if (!name) return;
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name,
      address: 'กรุงเทพมหานคร ประเทศไทย',
      taxId: '',
      phone: '',
      email: '',
    };
    onCreateCustomer(newCustomer);
    setDoc('customerId', newCustomer.id);
  };

  const handleCreateNewProfile = () => {
    const name = prompt('กรุณากรอกชื่อบริษัท/ช่างใหม่:');
    if (!name) return;
    const newProfile: BusinessProfile = {
      id: crypto.randomUUID(),
      name,
      slogan: 'SMART REPAIR & RENOVATION – คุณภาพเยี่ยม ราคามิตรภาพ',
      taxId: '',
      address: 'กรุงเทพมหานคร ประเทศไทย',
      phone: '',
      email: '',
      website: '',
      line: '',
      customLogo: null,
      senderType: 'individual',
    };
    onCreateProfile(newProfile);
    setDoc('profileId', newProfile.id);
  };

  // Active Profile details reference for inputs
  const activeProfile = profiles.find((p) => p.id === currentQuotation.profileId) || profiles[0];
  const activeCustomer = customers.find((c) => c.id === currentQuotation.customerId) || customers[0];

  return (
    <div className="w-full md:w-[420px] bg-slate-900 border-r border-slate-800 h-screen flex flex-col no-print shrink-0">
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold font-title text-amber-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> DAY NERAMIT
          </h1>
          <p className="text-[10px] text-slate-400">ระบบคำนวณและสร้างใบเสนอราคาพรีเมียม</p>
        </div>
        <button
          onClick={() => onSetActiveView(activeView === 'edit' ? 'preview' : 'edit')}
          className="md:hidden flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 px-3 py-2 rounded-xl"
        >
          {activeView === 'edit' ? '👁️ ดูพรีวิว A4' : '✏️ กลับไปแก้ไข'}
        </button>
      </div>

      {/* Workspace Tabs Navigator */}
      <div className="grid grid-cols-6 border-b border-slate-800 bg-slate-950/40 text-slate-400">
        <button
          onClick={() => setActiveTab('doc')}
          className={`py-2 text-center flex flex-col items-center gap-1 border-b-2 transition-all ${
            activeTab === 'doc' ? 'border-amber-500 text-amber-400 bg-slate-800/30' : 'border-transparent hover:text-slate-200'
          }`}
          title="เอกสาร"
        >
          <FileText className="w-4 h-4" />
          <span className="text-[8px] font-bold">เอกสาร</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 text-center flex flex-col items-center gap-1 border-b-2 transition-all ${
            activeTab === 'profile' ? 'border-amber-500 text-amber-400 bg-slate-800/30' : 'border-transparent hover:text-slate-200'
          }`}
          title="ผู้เสนอราคา"
        >
          <Briefcase className="w-4 h-4" />
          <span className="text-[8px] font-bold">ผู้เสนอ</span>
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`py-2 text-center flex flex-col items-center gap-1 border-b-2 transition-all ${
            activeTab === 'customer' ? 'border-amber-500 text-amber-400 bg-slate-800/30' : 'border-transparent hover:text-slate-200'
          }`}
          title="ลูกค้า"
        >
          <Users className="w-4 h-4" />
          <span className="text-[8px] font-bold">ลูกค้า</span>
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`py-2 text-center flex flex-col items-center gap-1 border-b-2 transition-all ${
            activeTab === 'items' ? 'border-amber-500 text-amber-400 bg-slate-800/30' : 'border-transparent hover:text-slate-200'
          }`}
          title="รายการ"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[8px] font-bold">รายการ</span>
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`py-2 text-center flex flex-col items-center gap-1 border-b-2 transition-all ${
            activeTab === 'payment' ? 'border-amber-500 text-amber-400 bg-slate-800/30' : 'border-transparent hover:text-slate-200'
          }`}
          title="การเงิน"
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-[8px] font-bold">การเงิน</span>
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`py-2 text-center flex flex-col items-center gap-1 border-b-2 transition-all ${
            activeTab === 'drafts' ? 'border-amber-500 text-amber-400 bg-slate-800/30' : 'border-transparent hover:text-slate-200'
          }`}
          title="ร่างที่เซฟ"
        >
          <Copy className="w-4 h-4" />
          <span className="text-[8px] font-bold">เซฟไว้</span>
        </button>
      </div>

      {/* Tab Contents Frame */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200">
        {/* ================= TAB 1: DOCUMENT INFO ================= */}
        {activeTab === 'doc' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-title text-amber-400 uppercase tracking-widest">⚙️ ตั้งค่าเอกสาร</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">เลย์เอาต์เทมเพลต (Template Design)</label>
              <select
                value={currentQuotation.template}
                onChange={(e) => setDoc('template', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
              >
                <option value="classic">1. Classic White (สไตล์โมเดิร์นคลีน)</option>
                <option value="luxury">2. Luxury Gold (สไตล์หรูหราพรีเมียมสีทอง)</option>
                <option value="dark">3. Dark Gold Minimal (สไตล์โมเดิร์นมืดหรูหรา)</option>
                <option value="elegant">4. Elegant Cream Accent (สไตล์คลาสสิกบูทีค)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">เลขที่ใบเสนอราคา</label>
                <input
                  type="text"
                  value={currentQuotation.docNo}
                  onChange={(e) => setDoc('docNo', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">อ้างอิงโปรเจกต์ (Ref.)</label>
                <input
                  type="text"
                  value={currentQuotation.refNo}
                  onChange={(e) => setDoc('refNo', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  placeholder="เช่น โครงการคอนโดทองดี"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">วันที่เสนอราคา</label>
                <input
                  type="text"
                  value={currentQuotation.docDate}
                  onChange={(e) => setDoc('docDate', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">ยืนราคาถึงวันที่</label>
                <input
                  type="text"
                  value={currentQuotation.validUntil}
                  onChange={(e) => setDoc('validUntil', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h4 className="text-[11px] font-bold text-amber-500 font-title">💰 ภาษีและส่วนลดหลัก</h4>
              <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold block">คิดภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                  <span className="text-[9px] text-slate-500 block">เปิดหรือปิดการคิด VAT 7% สำหรับนิติบุคคล</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentQuotation.vatEnabled}
                  onChange={(e) => setDoc('vatEnabled', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BUSINESS PROFILE ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-title text-amber-400 uppercase tracking-widest">🏢 ข้อมูลผู้เสนอราคา</h3>
              <button
                onClick={handleCreateNewProfile}
                className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-300"
              >
                <Plus className="w-3.5 h-3.5" /> สร้างใหม่
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">เลือกบริษัท/ผู้เสนอราคา</label>
              <select
                value={currentQuotation.profileId}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Selected Profile details */}
            <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">ชื่อบริษัท/ผู้เสนอราคา</label>
                <input
                  type="text"
                  value={activeProfile.name}
                  onChange={(e) => onUpdateProfile({ ...activeProfile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">คำขวัญ / สโลแกนหลัก</label>
                <input
                  type="text"
                  value={activeProfile.slogan}
                  onChange={(e) => onUpdateProfile({ ...activeProfile, slogan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={activeProfile.phone}
                  onChange={(e) => onUpdateProfile({ ...activeProfile, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">ที่อยู่บริษัท/สำนักงาน</label>
                <textarea
                  value={activeProfile.address}
                  onChange={(e) => onUpdateProfile({ ...activeProfile, address: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block font-semibold">อีเมลติดต่อ</label>
                  <input
                    type="text"
                    value={activeProfile.email}
                    onChange={(e) => onUpdateProfile({ ...activeProfile, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 block font-semibold">ไลน์ไอดี (LINE ID)</label>
                  <input
                    type="text"
                    value={activeProfile.line}
                    onChange={(e) => onUpdateProfile({ ...activeProfile, line: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">เว็บไซต์ (Website)</label>
                <input
                  type="text"
                  value={activeProfile.website}
                  onChange={(e) => onUpdateProfile({ ...activeProfile, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Logo upload wrapper */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <span className="text-[10px] text-slate-400 block font-semibold">อัปโหลดโลโก้ผู้เสนอราคา</span>
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <div className="w-12 h-12 shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src={activeProfile.customLogo || DEFAULT_LOGO} className="w-full h-full object-contain" alt="Logo preview" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block">
                    <span className="inline-block text-center w-full cursor-pointer text-[10px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-lg font-title">
                      📤 อัปโหลดโลโก้
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {activeProfile.customLogo && (
                    <button
                      onClick={resetCurrentProfileLogo}
                      className="w-full text-[9px] font-semibold text-rose-400 hover:text-rose-300 block text-center"
                    >
                      ↺ คืนค่าโลโก้เดิม
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CUSTOMER INFO ================= */}
        {activeTab === 'customer' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-title text-amber-400 uppercase tracking-widest">👥 ข้อมูลลูกค้าผู้รับเสนอราคา</h3>
              <button
                onClick={handleCreateNewCustomer}
                className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-300"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มลูกค้า
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">เลือกรายชื่อจากสมุดบัญชีลูกค้า</label>
              <select
                value={currentQuotation.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">ชื่อลูกค้า / บริษัทผู้รับงาน</label>
                <input
                  type="text"
                  value={activeCustomer.name}
                  onChange={(e) => onUpdateCustomer({ ...activeCustomer, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">เบอร์โทรศัพท์ลูกค้า</label>
                <input
                  type="text"
                  value={activeCustomer.phone}
                  onChange={(e) => onUpdateCustomer({ ...activeCustomer, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">ที่อยู่ส่งเอกสาร (ลูกค้า)</label>
                <textarea
                  value={activeCustomer.address}
                  onChange={(e) => onUpdateCustomer({ ...activeCustomer, address: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 block font-semibold">อีเมลลูกค้า (Email)</label>
                <input
                  type="text"
                  value={activeCustomer.email}
                  onChange={(e) => onUpdateCustomer({ ...activeCustomer, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LINE ITEMS ================= */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-title text-amber-400 uppercase tracking-widest">🛒 รายการบริการ (Line Items)</h3>
              <button
                onClick={handleAddItem}
                className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-amber-300"
              >
                <Plus className="w-3.5 h-3.5" /> + เพิ่มรายการใหม่
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {currentQuotation.items.map((it, idx) => (
                <div
                  key={it.id}
                  className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-2 relative group hover:border-amber-500/30 transition-all"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] text-amber-400 font-bold font-title">รายการที่ #{idx + 1}</span>
                    <button
                      onClick={() => handleRemoveItem(it.id)}
                      className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-0.5"
                    >
                      <Trash className="w-3 h-3" /> ลบออก
                    </button>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={it.desc}
                      placeholder="เช่น บริการรีโนเวทห้องน้ำ"
                      onChange={(e) => handleUpdateItem(it.id, 'desc', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/60 rounded-lg px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={it.detail}
                      placeholder="คำอธิบายเพิ่มเติม เช่น รวมทาสีแบรนด์สีกัปตัน"
                      onChange={(e) => handleUpdateItem(it.id, 'detail', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/60 rounded-lg px-2 py-1 text-[10px] text-slate-400 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-semibold">จำนวน</span>
                      <input
                        type="number"
                        value={it.qty || ''}
                        onChange={(e) => handleUpdateItem(it.id, 'qty', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/60 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none text-center focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-semibold">หน่วย</span>
                      <input
                        type="text"
                        value={it.unit}
                        onChange={(e) => handleUpdateItem(it.id, 'unit', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/60 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none text-center focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-semibold">ราคาต่อหน่วย</span>
                      <input
                        type="number"
                        value={it.price || ''}
                        onChange={(e) => handleUpdateItem(it.id, 'price', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/60 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none text-right focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {currentQuotation.items.length === 0 && (
                <div className="text-center p-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 italic">กดที่ปุ่ม "+ เพิ่มรายการใหม่" ด้านบนเพื่อเขียนตารางบริการของคุณ</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: FINANCIALS & BILLING ================= */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-title text-amber-400 uppercase tracking-widest">💰 สรุปการเงินและเงื่อนไข</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">หักส่วนลด (บาท)</label>
                <input
                  type="number"
                  value={currentQuotation.discount || ''}
                  onChange={(e) => setDoc('discount', Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500 text-right"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">ประเภทส่วนลด</label>
                <select
                  value={currentQuotation.discountType}
                  onChange={(e) => setDoc('discountType', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                >
                  <option value="flat">หักเงินบาทตรงๆ (Flat THB)</option>
                  <option value="percent">คิดเป็นเปอร์เซ็นต์ (% Percent)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h4 className="text-[11px] font-bold text-amber-500 font-title">🏦 บัญชีธนาคารรับโอนและ QR Code</h4>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">ชื่อธนาคาร / สาขา</label>
                <input
                  type="text"
                  value={currentQuotation.bank.name}
                  onChange={(e) => updateBank('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">ชื่อบัญชีผู้รับโอน</label>
                <input
                  type="text"
                  value={currentQuotation.bank.owner}
                  onChange={(e) => updateBank('owner', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-3">
                <h4 className="text-[11px] font-bold text-amber-500 font-title uppercase tracking-wide">🖼️ QR PAY</h4>
                <div className="flex flex-col gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">อัปโหลดคิวอาร์โค้ดรับโอนเงิน (QR Code Image)</span>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 shrink-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                      {currentQuotation.bank.customQr ? (
                        <img src={currentQuotation.bank.customQr} className="w-full h-full object-contain" alt="QR Preview" />
                      ) : (
                        <span className="text-[9px] text-slate-600 font-bold uppercase">No QR</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <label className="block">
                        <span className="inline-block text-center w-full cursor-pointer text-[10px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-lg font-title transition-colors">
                          📤 อัปโหลดคิวอาร์ (QR PAY)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                updateBank('customQr', base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {currentQuotation.bank.customQr && (
                        <button
                          type="button"
                          onClick={() => updateBank('customQr', null)}
                          className="w-full text-[9px] font-semibold text-rose-400 hover:text-rose-300 block text-center"
                        >
                          🗑️ ลบคิวอาร์โค้ด
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h4 className="text-[11px] font-bold text-amber-500 font-title">✍️ หมายเหตุ และเงื่อนไขและผู้ลงชื่อ</h4>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">เงื่อนไขการชำระเงิน</label>
                <textarea
                  value={currentQuotation.paymentTerms}
                  onChange={(e) => setDoc('paymentTerms', e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-semibold">หมายเหตุ / ประกันงาน (แต่ละบรรทัดคือ 1 ข้อ)</label>
                <textarea
                  value={currentQuotation.notes.join('\n')}
                  onChange={(e) => setDoc('notes', e.target.value.split('\n'))}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  placeholder="รับประกันการติดตั้ง 180 วัน"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block font-semibold">ชื่อผู้เสนอราคา</label>
                  <input
                    type="text"
                    value={currentQuotation.signeeName}
                    onChange={(e) => setDoc('signeeName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block font-semibold">ตำแหน่งงาน</label>
                  <input
                    type="text"
                    value={currentQuotation.signeePosition}
                    onChange={(e) => setDoc('signeePosition', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: DRAFTS LIST ================= */}
        {activeTab === 'drafts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-title text-amber-400 uppercase tracking-widest">💾 สรุปร่างเอกสารและประวัติคิวท์</h3>
              <button
                onClick={onSaveQuotation}
                className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-400"
              >
                <Plus className="w-3.5 h-3.5" /> เซฟเอกสารนี้
              </button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
              {savedQuotations.map((q) => {
                const qProfile = profiles.find((p) => p.id === q.profileId) || profiles[0];
                const qCustomer = customers.find((c) => c.id === q.customerId) || customers[0];
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                      q.id === currentQuotation.id
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-amber-400">{q.docNo}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{q.updatedAt}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-100 mt-1 truncate">{qCustomer?.name || 'ลูกค้าเก่า'}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{qProfile?.name || 'เดย์เนรมิต'}</div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-800/60 pt-2 text-[10px] font-title justify-end">
                      <button
                        onClick={() => onLoadQuotation(q.id)}
                        className="text-amber-400 hover:text-amber-300 font-bold px-2 py-1 rounded border border-amber-500/20"
                      >
                        📂 โหลด
                      </button>
                      <button
                        onClick={() => onDuplicateQuotation(q.id)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded border border-indigo-500/20"
                      >
                        📂 โคลน
                      </button>
                      <button
                        onClick={() => onDeleteQuotation(q.id)}
                        className="text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded border border-rose-500/20"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </div>
                );
              })}

              {savedQuotations.length === 0 && (
                <div className="text-center p-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 italic">ยังไม่มีเอกสารสำรองในระบบ กด 'เซฟเอกสารนี้' ด้านบนได้เลย</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <span className="text-[10px] text-slate-400 block font-semibold">กู้คืนระบบเริ่มต้น</span>
              <button
                onClick={onResetToDefault}
                className="w-full text-xs font-bold text-slate-300 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:text-slate-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> รีเซ็ตข้อมูลทั้งหมดกลับค่าโรงงาน
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Command Center Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3 flex flex-col shrink-0">
        
        {/* Google Integration Section */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
          {!user ? (
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-slate-100 font-bold rounded-lg border border-slate-800 hover:border-slate-750 transition-all text-xs cursor-pointer shadow-sm"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.77 14.93 1 12 1 7.35 1 3.37 3.66 1.39 7.55l3.87 3C6.18 7.57 8.85 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.44h6.44c-.28 1.48-1.12 2.74-2.37 3.58l3.69 2.87c2.16-1.99 3.42-4.93 3.42-8.54z" />
                <path fill="#FBBC05" d="M5.26 14.54a7.18 7.18 0 010-4.44l-3.87-3a11.97 11.97 0 000 10.44l3.87-3z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.15 0-5.82-2.53-6.77-5.51l-3.87 3C3.37 20.34 7.35 23 12 23z" />
              </svg>
              เชื่อมต่อบัญชีกูเกิล (Docs & Sync)
            </button>
          ) : (
            <div className="space-y-2.5">
              {/* Profile Card */}
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-300 truncate leading-none">
                      {user.displayName || 'Google User'}
                    </span>
                    <span className="text-[8px] text-slate-500 truncate mt-0.5 leading-none">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="text-[9px] font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-950 transition-colors cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3 h-3" /> ออก
                </button>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onSyncWithCloud}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-850 disabled:opacity-40 text-slate-300 hover:text-slate-100 font-bold rounded-lg border border-slate-800/80 transition-all text-[10px] cursor-pointer"
                >
                  {isSyncing ? (
                    <>
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-slate-300 border-t-transparent"></span>
                      กำลังซิงค์...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-blue-400" /> ซิงค์คลาวด์
                    </>
                  )}
                </button>

                <button
                  onClick={onExportToDocs}
                  disabled={isExportingToDocs}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-850 disabled:opacity-40 text-slate-300 hover:text-slate-100 font-bold rounded-lg border border-slate-800/80 transition-all text-[10px] cursor-pointer"
                >
                  {isExportingToDocs ? (
                    <>
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-slate-300 border-t-transparent"></span>
                      กำลังส่งออก...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> ส่งออก Docs
                    </>
                  )}
                </button>
              </div>

              {/* View Document link */}
              {exportedDocUrl && (
                <a
                  href={exportedDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-bold text-[10px] rounded-lg border border-blue-500/20 transition-all text-center leading-none mt-1"
                >
                  📄 เปิดเอกสาร Google Docs ↗
                </a>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onGeneratePdf}
          disabled={isGeneratingPdf}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 disabled:from-amber-700 disabled:to-amber-800 text-slate-950 disabled:text-slate-500 font-bold py-3 px-4 rounded-xl font-title flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-500 transition-all text-sm shadow-lg shadow-amber-500/10 cursor-pointer disabled:cursor-not-allowed"
        >
          {isGeneratingPdf ? (
            <>
              <span className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent"></span>
              กำลังสร้างไฟล์ PDF สำหรับดาวน์โหลด...
            </>
          ) : (
            <>
              <Download className="w-4.5 h-4.5" /> ดาวน์โหลด PDF โดยตรง (แนะนำ)
            </>
          )}
        </button>
        <button
          onClick={onTriggerPrint}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl font-title flex items-center justify-center gap-2 transition-all text-xs"
        >
          🖨️ พิมพ์เอกสาร / ดาวน์โหลดสำรอง
        </button>
      </div>
    </div>
  );
}
