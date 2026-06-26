/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar, 
  DollarSign, 
  Menu, 
  X, 
  ShieldCheck, 
  Layers,
  HelpCircle,
  Settings,
  Lock,
  Unlock,
  Sparkles
} from 'lucide-react';
import { Member, ChitGroup, BiddingDraw, Installment } from './types';
import { getStoredData, saveStoredData } from './initialData';

// Import sub-components
import DashboardOverview from './components/DashboardOverview';
import GroupsManager from './components/GroupsManager';
import MembersManager from './components/MembersManager';
import BiddingDrawsManager from './components/BiddingDrawsManager';
import SchedulesManager from './components/SchedulesManager';
import ReportsManager from './components/ReportsManager';
import SettingsManager from './components/SettingsManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedDenomFilter, setSelectedDenomFilter] = useState<number | null>(null);

  // Core records state
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<ChitGroup[]>([]);
  const [draws, setDraws] = useState<BiddingDraw[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);

  // Modals / Overlay states
  const [isQuickPayOpen, setIsQuickPayOpen] = useState<boolean>(false);
  const [quickPayMemberId, setQuickPayMemberId] = useState<string>('');

  // Local Settings & Security states
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('chitmaster_language') || 'en');
  const [securityPin, setSecurityPin] = useState<string>(() => localStorage.getItem('chitmaster_pin') || '');
  const [isLocked, setIsLocked] = useState<boolean>(() => !!localStorage.getItem('chitmaster_pin'));
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const data = getStoredData();
    setMembers(data.members);
    setGroups(data.groups);
    setDraws(data.draws);
    setInstallments(data.installments);
  }, []);

  // Sync to local storage on modification
  const syncToStorage = (updatedMembers: Member[], updatedGroups: ChitGroup[], updatedDraws: BiddingDraw[], updatedInstallments: Installment[]) => {
    setMembers(updatedMembers);
    setGroups(updatedGroups);
    setDraws(updatedDraws);
    setInstallments(updatedInstallments);
    saveStoredData({
      members: updatedMembers,
      groups: updatedGroups,
      draws: updatedDraws,
      installments: updatedInstallments
    });
  };

  // Helper: Auto-calculates payment due dates based on start date and cycle index
  const calculateDueDate = (startDateStr: string, installmentNumber: number): string => {
    const date = new Date(startDateStr);
    date.setMonth(date.getMonth() + (installmentNumber - 1));
    date.setDate(20); // standard monthly payment date
    return date.toISOString().split('T')[0];
  };

  // MUTATION 1: Create a new Chit Group
  const handleCreateGroup = (newGroupData: Omit<ChitGroup, 'id' | 'currentInstallment' | 'monthlyContribution' | 'status'>) => {
    const newId = `g-${Date.now()}`;
    const monthlyContribution = newGroupData.totalValue / newGroupData.memberCount;
    
    const newGroup: ChitGroup = {
      ...newGroupData,
      id: newId,
      currentInstallment: 1,
      monthlyContribution,
      status: 'active'
    };

    const updatedGroups = [...groups, newGroup];

    // Auto-generate Installment 1 schedules for enrolled members
    const newInstallments: Installment[] = [];
    newGroup.memberIds.forEach(mId => {
      newInstallments.push({
        id: `inst-${newId}-i1-${mId}`,
        groupId: newId,
        installmentNumber: 1,
        memberId: mId,
        amountDue: monthlyContribution, // base estimate before auction discount
        dueDate: calculateDueDate(newGroup.startDate, 1),
        status: 'pending'
      });
    });

    const updatedInstallments = [...installments, ...newInstallments];
    syncToStorage(members, updatedGroups, draws, updatedInstallments);
  };

  // MUTATION 2: Enroll members manually
  const handleEnrollMembers = (groupId: string, memberIds: string[]) => {
    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, memberIds };
      }
      return g;
    });
    syncToStorage(members, updatedGroups, draws, installments);
  };

  // MUTATION 3: Add new Member
  const handleAddMember = (newMemberData: Omit<Member, 'id' | 'joinedDate'>) => {
    const newId = `m-${Date.now()}`;
    const newMember: Member = {
      ...newMemberData,
      id: newId,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const updatedMembers = [...members, newMember];
    syncToStorage(updatedMembers, groups, draws, installments);
  };

  // MUTATION 4: Execute / Finalize a Monthly Bidding Draw
  const handleFinalizeDraw = (newDrawData: Omit<BiddingDraw, 'id'>) => {
    const newId = `d-${Date.now()}`;
    const newDraw: BiddingDraw = {
      ...newDrawData,
      id: newId
    };

    const updatedDraws = [...draws, newDraw];

    // Find the corresponding group
    const groupObj = groups.find(g => g.id === newDrawData.groupId);
    if (!groupObj) return;

    // 1. Update completed installments for this auction month (installmentNumber)
    // The amountDue gets recalculated to: monthlyContribution - dividendPerMember
    const updatedInstallments = installments.map(inst => {
      if (inst.groupId === newDrawData.groupId && inst.installmentNumber === newDrawData.installmentNumber) {
        return {
          ...inst,
          amountDue: newDrawData.actualContributionPerMember
        };
      }
      return inst;
    });

    // 2. Generate next month's (installmentNumber + 1) pending schedules if group is not fully completed
    const nextInstallmentNum = newDrawData.installmentNumber + 1;
    if (nextInstallmentNum <= groupObj.durationMonths) {
      groupObj.memberIds.forEach(mId => {
        updatedInstallments.push({
          id: `inst-${groupObj.id}-i${nextInstallmentNum}-${mId}`,
          groupId: groupObj.id,
          installmentNumber: nextInstallmentNum,
          memberId: mId,
          amountDue: groupObj.monthlyContribution, // initial base estimate
          dueDate: calculateDueDate(groupObj.startDate, nextInstallmentNum),
          status: 'pending'
        });
      });
    }

    // 3. Update group status / current installment count
    const updatedGroups = groups.map(g => {
      if (g.id === newDrawData.groupId) {
        const isCompleted = nextInstallmentNum > g.durationMonths;
        return {
          ...g,
          currentInstallment: isCompleted ? g.durationMonths : nextInstallmentNum,
          status: isCompleted ? 'completed' : 'active' as 'active' | 'completed'
        };
      }
      return g;
    });

    syncToStorage(members, updatedGroups, updatedDraws, updatedInstallments);
  };

  // MUTATION 5: Record an installment payment
  const handlePayInstallment = (installmentId: string) => {
    const updatedInstallments = installments.map(inst => {
      if (inst.id === installmentId) {
        return {
          ...inst,
          status: 'paid' as 'paid',
          paymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return inst;
    });

    syncToStorage(members, groups, draws, updatedInstallments);
  };

  // MUTATION 6: Manually adjust installment status
  const handleUpdateInstallmentStatus = (installmentId: string, status: 'pending' | 'overdue' | 'paid') => {
    const updatedInstallments = installments.map(inst => {
      if (inst.id === installmentId) {
        return {
          ...inst,
          status,
          paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return inst;
    });

    syncToStorage(members, groups, draws, updatedInstallments);
  };

  // Save settings handlers
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('chitmaster_language', lang);
  };

  const handleSecurityPinChange = (pin: string) => {
    setSecurityPin(pin);
    if (pin) {
      localStorage.setItem('chitmaster_pin', pin);
    } else {
      localStorage.removeItem('chitmaster_pin');
      setIsLocked(false);
    }
  };

  const handleImportData = (newData: { members: Member[]; groups: ChitGroup[]; draws: BiddingDraw[]; installments: Installment[] }) => {
    syncToStorage(newData.members, newData.groups, newData.draws, newData.installments);
  };

  const handleUnlockApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === securityPin) {
      setIsLocked(false);
      setPinError(null);
    } else {
      setPinError('Incorrect PIN code. Please try again.');
      setEnteredPin('');
    }
  };

  // Select installments for Quick Pay member dropdown
  const memberQuickPayOutstanding = installments.filter(
    i => i.memberId === quickPayMemberId && i.status !== 'paid'
  );

  if (isLocked && securityPin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans antialiased text-white p-6 relative overflow-hidden" id="pin-lock-screen">
        {/* Decorative ambient elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm bg-slate-800/80 border border-slate-700/50 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-6 text-center"
        >
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">ChitMaster Pro Secure</h2>
            <p className="text-xs text-slate-400">Offline Ledger Node Is Locked</p>
          </div>

          <form onSubmit={handleUnlockApp} className="w-full space-y-4">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((idx) => {
                const char = enteredPin[idx];
                return (
                  <div 
                    key={idx} 
                    className={`w-12 h-14 rounded-2xl border flex items-center justify-center font-bold text-lg transition-all ${
                      char 
                        ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                        : 'border-slate-700 bg-slate-900/30 text-slate-600'
                    }`}
                  >
                    {char ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-medium animate-pulse">{pinError}</p>
            )}

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => {
                    if (enteredPin.length < 4) {
                      const newPin = enteredPin + num;
                      setEnteredPin(newPin);
                      setPinError(null);
                      // Auto trigger unlock if it reaches 4
                      if (newPin === securityPin) {
                        setIsLocked(false);
                      } else if (newPin.length === 4) {
                        setPinError('Incorrect PIN code.');
                        setEnteredPin('');
                      }
                    }
                  }}
                  className="py-3 bg-slate-900/40 hover:bg-slate-700/30 border border-slate-700/30 rounded-2xl text-base font-bold font-mono transition-colors cursor-pointer text-white"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEnteredPin('')}
                className="py-3 bg-slate-900/10 hover:bg-slate-800/10 rounded-2xl text-xs font-semibold text-slate-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (enteredPin.length < 4) {
                    const newPin = enteredPin + '0';
                    setEnteredPin(newPin);
                    setPinError(null);
                    if (newPin === securityPin) {
                      setIsLocked(false);
                    } else if (newPin.length === 4) {
                      setPinError('Incorrect PIN code.');
                      setEnteredPin('');
                    }
                  }
                }}
                className="py-3 bg-slate-900/40 hover:bg-slate-700/30 border border-slate-700/30 rounded-2xl text-base font-bold font-mono transition-colors cursor-pointer text-white"
              >
                0
              </button>
              <button
                type="submit"
                className="py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </form>

          <p className="text-[10px] text-slate-500 font-mono">Device: Safe sandboxed storage</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-xs" id="app-header">
        <div className="flex items-center gap-3">
          <button 
            id="mobile-menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-50 rounded-xl md:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 tracking-tight text-sm">ChitMaster Pro</span>
              <p className="text-[10px] text-slate-400 font-semibold font-mono">Offline Safe Ledger • Node v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Sync / Security status */}
        <div className="flex items-center gap-4 text-xs font-medium">
          {securityPin && (
            <button
              onClick={() => {
                setEnteredPin('');
                setIsLocked(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
              title="Lock Session Now"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600" /> Lock Session
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-sans">
            <ShieldCheck className="w-4 h-4" />
            Local Sandbox Protected
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            Local Time: {new Date().toLocaleDateString('en-IN', {
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      </header>

      {/* Main Body with Sidebar Layout */}
      <div className="flex-1 flex relative" id="layout-body">
        
        {/* Navigation Sidebar Panel */}
        <aside className={`bg-white border-r border-slate-100 w-64 p-5 shrink-0 flex flex-col space-y-6 absolute md:relative inset-y-0 left-0 z-30 transform md:transform-none transition-transform duration-200 shadow-xl md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`} id="app-sidebar">
          {/* Close trigger for mobile */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-1 hover:bg-slate-50 rounded-lg md:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1.5 flex-1" id="sidebar-navigation">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block text-left">Main Dashboard</span>
            
            <button 
              id="nav-dashboard"
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              General Overview
            </button>

            <button 
              id="nav-groups"
              onClick={() => { setActiveTab('groups'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'groups' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Chit Groups
            </button>

            <button 
              id="nav-members"
              onClick={() => { setActiveTab('members'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'members' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Members Directory
            </button>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2 block text-left">Operations</span>

            <button 
              id="nav-draws"
              onClick={() => { setActiveTab('draws'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'draws' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Bidding Draws
            </button>

            <button 
              id="nav-schedules"
              onClick={() => { setActiveTab('schedules'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'schedules' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Installment Schedules
            </button>

            <button 
              id="nav-reports"
              onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'reports' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Coins className="w-4 h-4" />
              Financial Reports
            </button>

            <button 
              id="nav-settings"
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'settings' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Fintech Settings
            </button>
          </nav>

          {/* Secure disclaimer */}
          <div className="p-4 bg-slate-50 rounded-xl text-[10px] text-slate-400 leading-relaxed border border-slate-100 text-left" id="disclaimer-widget">
            <p className="font-semibold text-slate-500 mb-1">Durable Client Cache</p>
            This applet uses sandboxed client database persistence. No transactions ever leave this browser node, giving absolute ledger security.
          </div>
        </aside>

        {/* Content canvas container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full" id="content-canvas">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardOverview 
                  groups={groups}
                  members={members}
                  draws={draws}
                  installments={installments}
                  onNavigate={(tab, filterDenom) => {
                    setActiveTab(tab);
                    if (filterDenom !== undefined) {
                      setSelectedDenomFilter(filterDenom);
                    }
                  }}
                  onOpenQuickPay={() => {
                    if (members.length > 0) setQuickPayMemberId(members[0].id);
                    setIsQuickPayOpen(true);
                  }}
                  onOpenQuickGroup={() => { setActiveTab('groups'); }}
                  onOpenQuickDraw={() => { setActiveTab('draws'); }}
                />
              )}

              {activeTab === 'groups' && (
                <GroupsManager 
                  groups={groups}
                  members={members}
                  draws={draws}
                  onCreateGroup={handleCreateGroup}
                  onEnrollMembers={handleEnrollMembers}
                  initialDenomFilter={selectedDenomFilter}
                  onClearDenomFilter={() => setSelectedDenomFilter(null)}
                />
              )}

              {activeTab === 'members' && (
                <MembersManager 
                  members={members}
                  groups={groups}
                  draws={draws}
                  installments={installments}
                  onAddMember={handleAddMember}
                  onPayInstallment={handlePayInstallment}
                />
              )}

              {activeTab === 'draws' && (
                <BiddingDrawsManager 
                  groups={groups}
                  members={members}
                  draws={draws}
                  onFinalizeDraw={handleFinalizeDraw}
                />
              )}

              {activeTab === 'schedules' && (
                <SchedulesManager 
                  installments={installments}
                  members={members}
                  groups={groups}
                  onPayInstallment={handlePayInstallment}
                  onUpdateStatus={handleUpdateInstallmentStatus}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsManager 
                  members={members}
                  groups={groups}
                  draws={draws}
                  installments={installments}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsManager 
                  members={members}
                  groups={groups}
                  draws={draws}
                  installments={installments}
                  onImportData={handleImportData}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                  securityPin={securityPin}
                  onSecurityPinChange={handleSecurityPinChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* QUICK PAYMENT DRAWER OVERLAY */}
      <AnimatePresence>
        {isQuickPayOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50" 
            id="quick-pay-modal"
            onClick={() => setIsQuickPayOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white h-full p-6 flex flex-col space-y-6 shadow-2xl relative"
            >
              {/* Close */}
              <button 
                onClick={() => setIsQuickPayOpen(false)}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
  
              <div className="text-left border-b border-slate-50 pb-4">
                <h3 className="font-bold text-slate-900 text-base">Quick Contributor Collection</h3>
                <p className="text-xs text-slate-500">Record physical cash or transfer installment collections instantly</p>
              </div>
  
              {/* Select Contributor */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700">Select Member</label>
                <select 
                  id="quick-pay-member-select"
                  value={quickPayMemberId}
                  onChange={(e) => setQuickPayMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-sans font-medium"
                >
                  <option value="" disabled>-- Select Contributor --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
  
              {/* List outstanding */}
              <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1 text-left scrollbar-thin">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Installments ({memberQuickPayOutstanding.length})</span>
                
                {quickPayMemberId ? (
                  memberQuickPayOutstanding.length > 0 ? (
                    <div className="space-y-3">
                      {memberQuickPayOutstanding.map(inst => {
                        const groupObj = groups.find(g => g.id === inst.groupId);
                        return (
                          <div key={inst.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div className="space-y-0.5 text-xs">
                              <span className="font-bold text-slate-800">{groupObj?.name || 'Chit Group'}</span>
                              <div className="text-slate-500 text-[10px]">
                                <span>Installment Month #{inst.installmentNumber}</span> • <span>Due {inst.dueDate}</span>
                              </div>
                            </div>
  
                            <div className="text-right flex flex-col items-end gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inst.amountDue)}
                              </span>
                              <button 
                                onClick={() => handlePayInstallment(inst.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                              >
                                Log Paid
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs italic bg-emerald-50/20 border border-dashed border-emerald-100 rounded-xl p-6">
                      All clear! This member has paid all installment bills.
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                    Choose a member above to inspect outstanding records.
                  </div>
                )}
              </div>
  
              <div className="border-t border-slate-50 pt-4 text-center">
                <button 
                  onClick={() => setIsQuickPayOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Close Collection Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
