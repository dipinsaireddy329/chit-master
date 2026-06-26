/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  CheckCircle, 
  Calendar,
  AlertCircle,
  Layers,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Briefcase,
  PiggyBank,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from 'recharts';
import { Member, ChitGroup, BiddingDraw, Installment } from '../types';

interface DashboardOverviewProps {
  groups: ChitGroup[];
  members: Member[];
  draws: BiddingDraw[];
  installments: Installment[];
  onNavigate: (tab: string, filterDenom?: number) => void;
  onOpenQuickPay: () => void;
  onOpenQuickGroup: () => void;
  onOpenQuickDraw: () => void;
}

export default function DashboardOverview({
  groups,
  members,
  draws,
  installments,
  onNavigate,
  onOpenQuickPay,
  onOpenQuickGroup,
  onOpenQuickDraw
}: DashboardOverviewProps) {
  
  const [selectedPoolDenom, setSelectedPoolDenom] = useState<number | null>(null);

  // Predefined values requested by the user
  const denominations = [100000, 200000, 500000, 1000000, 2000000];

  // Helper to pre-calculate details of each denomination pool
  const getDenominationStats = (denom: number) => {
    const denomGroups = groups.filter(g => g.totalValue === denom);
    const activeDGroups = denomGroups.filter(g => g.status === 'active');
    const completedDGroups = denomGroups.filter(g => g.status === 'completed');
    
    // Total members across these groups
    const totalDMembers = denomGroups.reduce((acc, g) => acc + g.memberIds.length, 0);
    
    // Monthly Collection
    const monthlyCollection = activeDGroups.reduce((acc, g) => acc + g.monthlyContribution, 0);
    
    const denomGroupIds = denomGroups.map(g => g.id);
    const denomInstallments = installments.filter(i => denomGroupIds.includes(i.groupId));
    
    // Amount Collected Today
    const todayStr = new Date().toISOString().split('T')[0];
    const amountCollectedToday = denomInstallments
      .filter(i => i.status === 'paid' && i.paymentDate === todayStr)
      .reduce((acc, i) => acc + i.amountDue, 0);
      
    // Pending Amount
    const pendingAmount = denomInstallments
      .filter(i => i.status === 'pending')
      .reduce((acc, i) => acc + i.amountDue, 0);
      
    // Outstanding Balance
    const outstandingBalance = denomInstallments
      .filter(i => i.status === 'overdue')
      .reduce((acc, i) => acc + i.amountDue, 0);
      
    // Upcoming Draw Date
    const pendingDInstallments = denomInstallments.filter(i => i.status === 'pending');
    const upcomingDrawDate = pendingDInstallments.length > 0
      ? pendingDInstallments.map(i => i.dueDate).sort()[0]
      : 'No Draw Active';
      
    // Collection Percentage
    const paidCount = denomInstallments.filter(i => i.status === 'paid').length;
    const totalCount = denomInstallments.length;
    const collectionPercentage = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    
    // Profit Earned (5% organizer fee on completed auctions in these groups)
    const completedAuctionsCount = draws.filter(d => denomGroupIds.includes(d.groupId)).length;
    const profitEarned = completedAuctionsCount * (denom * 0.05);
    
    return {
      activeCount: activeDGroups.length,
      completedCount: completedDGroups.length,
      totalMembers: totalDMembers,
      monthlyCollection,
      amountCollectedToday,
      pendingAmount,
      outstandingBalance,
      upcomingDrawDate,
      collectionPercentage,
      profitEarned,
      groups: denomGroups
    };
  };

  // Theme accents for each denomination
  const poolThemes: Record<number, { bg: string; text: string; ring: string; accent: string; iconBg: string }> = {
    100000: { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500/25', accent: 'bg-emerald-50', iconBg: 'bg-emerald-600' },
    200000: { bg: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-500/25', accent: 'bg-teal-50', iconBg: 'bg-teal-600' },
    500000: { bg: 'bg-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-500/25', accent: 'bg-indigo-50', iconBg: 'bg-indigo-600' },
    1000000: { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-500/25', accent: 'bg-amber-50', iconBg: 'bg-amber-600' },
    2000000: { bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-500/25', accent: 'bg-rose-50', iconBg: 'bg-rose-600' },
  };

  // Calculate general stats
  const activeGroups = groups.filter(g => g.status === 'active');
  const totalChitValue = activeGroups.reduce((acc, g) => acc + g.totalValue, 0);
  
  // Total Dividends Distributed
  const totalDividends = draws.reduce((acc, d) => acc + d.winningBidAmount, 0);
  
  // Payment Collection stats
  const totalPaidAmount = installments
    .filter(i => i.status === 'paid')
    .reduce((acc, i) => acc + i.amountDue, 0);
  
  const totalPendingAmount = installments
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((acc, i) => acc + i.amountDue, 0);
  
  const collectionRate = installments.length > 0
    ? Math.round((installments.filter(i => i.status === 'paid').length / installments.length) * 100)
    : 0;

  // Formatting currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Chart data: Dividend Distribution per Completed Draw
  const chartData = draws.map(d => {
    const groupName = groups.find(g => g.id === d.groupId)?.name || 'Chit Group';
    return {
      name: `G1 - Draw ${d.installmentNumber}`,
      'Total Discount': d.winningBidAmount,
      'Prize Distributed': d.prizeAmount,
      'Dividend Per Member': d.dividendPerMember,
    };
  });

  // Recent Activities
  const recentActivities = [
    ...draws.map(d => ({
      type: 'draw',
      date: d.drawDate,
      title: 'Bidding Draw Finalized',
      desc: `${members.find(m => m.id === d.winningMemberId)?.name || 'A Member'} won the draw with a bid of ${formatCurrency(d.winningBidAmount)}`,
      groupId: d.groupId,
      tag: 'Draw'
    })),
    ...installments.filter(i => i.status === 'paid' && i.paymentDate).slice(0, 5).map(i => ({
      type: 'payment',
      date: i.paymentDate!,
      title: 'Contribution Payment Logged',
      desc: `${members.find(m => m.id === i.memberId)?.name || 'Member'} paid ${formatCurrency(i.amountDue)} for installment #${i.installmentNumber}`,
      groupId: i.groupId,
      tag: 'Payment'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in text-left" id="dashboard-container">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="dashboard-hero">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Offline-First Sandbox Active
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-sans">Chit Fund Administration</h1>
          <p className="text-slate-300 max-w-xl text-sm font-sans">
            Secure, private, and zero-server local ledger for coordinating chits, bidding auctions, dividend payouts, and payment schedules. Designed with love.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            id="quick-pay-btn"
            onClick={onOpenQuickPay}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition-all text-white font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/10 cursor-pointer text-xs"
          >
            <Coins className="w-4 h-4" />
            Quick Payment
          </button>
          <button 
            id="quick-draw-btn"
            onClick={onOpenQuickDraw}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 transition-all text-white font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer text-xs"
          >
            <Clock className="w-4 h-4" />
            Run Auction Draw
          </button>
        </div>
      </div>

      {/* 5 BEAUTIFUL DENOMINATION CARDS GRID */}
      <div className="space-y-4" id="predefined-denominations">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Predefined Chit Denominations</h2>
          <p className="text-xs text-slate-500">Tap a pool card to open the complete operational ledger, real-time pending amounts, and profit statistics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {denominations.map((denom) => {
            const stats = getDenominationStats(denom);
            const theme = poolThemes[denom];
            const isSelected = selectedPoolDenom === denom;

            return (
              <motion.div
                key={denom}
                id={`pool-card-${denom}`}
                whileHover={{ scale: 1.03, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPoolDenom(isSelected ? null : denom)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                  isSelected 
                    ? `bg-white border-indigo-600 ring-4 ${theme.ring} shadow-md` 
                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
                }`}
              >
                {/* Visual top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.bg}`}></div>

                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">DENOMINATION</span>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">
                      {formatCurrency(denom)}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-xl ${theme.accent} ${theme.text}`}>
                    {denom <= 200000 ? <Coins className="w-4 h-4" /> : denom <= 500000 ? <Layers className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                    <div>
                      <span className="font-bold text-slate-700">{stats.activeCount}</span> Active
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">{stats.totalMembers}</span> Members
                    </div>
                  </div>

                  {/* Tiny progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                      <span>Collection Rate</span>
                      <span className="font-mono text-slate-600">{stats.collectionPercentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${theme.bg} rounded-full transition-all duration-500`}
                        style={{ width: `${stats.collectionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[10px] font-semibold text-indigo-600">
                  <span>{isSelected ? 'Tap to Collapse' : 'View Ledger Stats'}</span>
                  {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* EXPANDABLE LEDGER DETAILS PANEL */}
        <AnimatePresence>
          {selectedPoolDenom && (() => {
            const stats = getDenominationStats(selectedPoolDenom);
            const theme = poolThemes[selectedPoolDenom];

            return (
              <motion.div
                key={selectedPoolDenom}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl space-y-6 mt-2 relative">
                  
                  {/* Decorative ambient background light */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${theme.bg}/10 blur-2xl pointer-events-none`}></div>

                  <div className="flex justify-between items-start border-b border-slate-800 pb-4 relative z-10">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">DETAILED BUSINESS BREAKDOWN</span>
                      <h3 className="text-xl font-bold font-sans flex items-center gap-2">
                        {formatCurrency(selectedPoolDenom)} Chits Circle Stats
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${theme.bg}/25 ${theme.text} bg-white/5 border border-white/5`}>
                          Active Chits
                        </span>
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedPoolDenom(null)}
                      className="text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Close Panel
                    </button>
                  </div>

                  {/* 10 Deep business statistics requested in requirements */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                    
                    {/* Item 1 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Active Groups
                      </div>
                      <p className="text-lg font-bold font-mono">{stats.activeCount} Groups</p>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Completed
                      </div>
                      <p className="text-lg font-bold font-mono">{stats.completedCount} Groups</p>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        Total Members
                      </div>
                      <p className="text-lg font-bold font-mono">{stats.totalMembers} Enrolled</p>
                    </div>

                    {/* Item 4 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <Coins className="w-3.5 h-3.5 text-teal-400" />
                        Monthly Collection
                      </div>
                      <p className="text-base font-bold font-mono truncate">{formatCurrency(stats.monthlyCollection)}</p>
                    </div>

                    {/* Item 5 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Collected Today
                      </div>
                      <p className={`text-base font-bold font-mono truncate ${stats.amountCollectedToday > 0 ? 'text-emerald-400' : ''}`}>
                        {formatCurrency(stats.amountCollectedToday)}
                      </p>
                    </div>

                    {/* Item 6 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Pending Current
                      </div>
                      <p className="text-base font-bold font-mono text-amber-400 truncate">{formatCurrency(stats.pendingAmount)}</p>
                    </div>

                    {/* Item 7 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        Overdue Balance
                      </div>
                      <p className={`text-base font-bold font-mono truncate ${stats.outstandingBalance > 0 ? 'text-rose-400' : ''}`}>
                        {formatCurrency(stats.outstandingBalance)}
                      </p>
                    </div>

                    {/* Item 8 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                        Next Draw Date
                      </div>
                      <p className="text-xs font-bold truncate py-1 text-slate-300 font-mono">{stats.upcomingDrawDate}</p>
                    </div>

                    {/* Item 9 */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Collection Rate
                      </div>
                      <p className="text-lg font-bold font-mono">{stats.collectionPercentage}%</p>
                    </div>

                    {/* Item 10 */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-1 relative">
                      <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold tracking-wider uppercase">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                        Organizer Commission
                      </div>
                      <p className="text-base font-bold font-mono text-emerald-400 truncate" title="5% administrator fee earned on finished cycles">
                        {formatCurrency(stats.profitEarned)}
                      </p>
                    </div>

                  </div>

                  {/* Actions inside the detail block */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800 pt-5 relative z-10">
                    <p className="text-xs text-slate-400">
                      * Organizer profits are generated dynamically as a standard 5% commission of the pot size per completed monthly biddings.
                    </p>
                    <button
                      onClick={() => onNavigate('groups', selectedPoolDenom)}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-indigo-600/15"
                    >
                      Open {formatCurrency(selectedPoolDenom)} Groups Drawer
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi-grid">
        {/* KPI 1: Active Value */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="kpi-active-value">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Chit Pot</span>
              <h3 className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(totalChitValue)}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-indigo-600 mr-1.5">{activeGroups.length}</span> active chit fund groups
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>

        {/* KPI 2: Dividends */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="kpi-dividends">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dividends Generated</span>
              <h3 className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(totalDividends)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-emerald-600 mr-1.5">{draws.length}</span> bidding cycles completed
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* KPI 3: Collection Rate */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="kpi-collection-rate">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Rate</span>
              <h3 className="text-2xl font-bold text-slate-900 font-mono">{collectionRate}%</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-amber-600 mr-1.5">{formatCurrency(totalPaidAmount)}</span> collected successfully
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* KPI 4: Members */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="kpi-members">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
              <h3 className="text-2xl font-bold text-slate-900 font-mono">{members.length} Members</h3>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            Across <span className="font-semibold text-slate-700 mx-1">{groups.length}</span> total configurations
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500"></div>
        </div>
      </div>

      {/* Analytics and Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-grid">
        {/* Dividend Chart Card */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col space-y-4" id="dividend-chart-card">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Auction Dividend Savings Analysis</h3>
              <p className="text-xs text-slate-500">Track discounts conceded vs dividends earned per member over auctions</p>
            </div>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-mono">
              Completed Draws ({draws.length})
            </span>
          </div>

          <div className="h-64 pt-2">
            {draws.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Total Discount" name="Total Dividend Pool" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Prize Distributed" name="Winning Bid Pot" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl space-y-2 border border-dashed border-slate-200">
                <TrendingUp className="w-8 h-8 text-slate-300" />
                <p className="text-sm">No bidding draws completed yet</p>
                <button 
                  onClick={() => onNavigate('draws')} 
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Go run your first draw
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collection & Recent Activity Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col space-y-6" id="collection-activity-card">
          {/* Collection breakdown progress */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Installments Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 font-mono">
                <span>Paid ({formatCurrency(totalPaidAmount)})</span>
                <span>{collectionRate}% Collected</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }}></div>
              </div>
              <p className="text-xs text-slate-500">
                Pending / Overdue installments sum up to <strong className="text-amber-600 font-semibold">{formatCurrency(totalPendingAmount)}</strong> yet to be ledgered.
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Activity Feed */}
          <div className="flex flex-col space-y-3 flex-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Transaction Activity Logs</h4>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((act, index) => (
                  <div key={index} className="flex gap-3 text-xs items-start" id={`recent-activity-${index}`}>
                    <div className={`p-1.5 rounded-lg mt-0.5 ${
                      act.type === 'draw' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {act.type === 'draw' ? <Calendar className="w-3.5 h-3.5" /> : <Coins className="w-3.5 h-3.5" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{act.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                          act.type === 'draw' ? 'bg-indigo-50/70 text-indigo-700' : 'bg-emerald-50/70 text-emerald-700'
                        }`}>
                          {act.tag}
                        </span>
                      </div>
                      <p className="text-slate-500 leading-normal">{act.desc}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.date).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-6 space-y-1">
                <Clock className="w-6 h-6 text-slate-300" />
                <p className="text-xs text-slate-400">No activity registered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid 2: Mini summary columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="quick-lists">
        {/* Active Groups Overview */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs" id="quick-groups-summary">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Active Chit Groups ({activeGroups.length})</h3>
            <button 
              onClick={() => onNavigate('groups')} 
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Manage Groups <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3 font-sans">
            {activeGroups.map(g => {
              const completedDrawsInGroup = draws.filter(d => d.groupId === g.id).length;
              const remainingMonths = g.durationMonths - completedDrawsInGroup;
              const progressPercent = Math.round((completedDrawsInGroup / g.durationMonths) * 100);
              
              return (
                <div key={g.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 text-xs">{g.name}</span>
                    <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                      {formatCurrency(g.totalValue)} Val
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Installment {completedDrawsInGroup + 1} of {g.durationMonths}</span>
                    <span>{remainingMonths} months left</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High outstanding members */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs" id="quick-outstanding-summary">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Outstanding Overdue Payments</h3>
            <button 
              onClick={() => onNavigate('schedules')} 
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              View Schedules <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {installments.filter(i => i.status === 'overdue').length > 0 ? (
            <div className="space-y-3">
              {installments.filter(i => i.status === 'overdue').slice(0, 3).map(inst => {
                const member = members.find(m => m.id === inst.memberId);
                const groupName = groups.find(g => g.id === inst.groupId)?.name || 'Chit Group';
                return (
                  <div key={inst.id} className="flex justify-between items-center p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <div className="space-y-0.5 text-left">
                      <span className="font-semibold text-slate-800 text-xs">{member?.name || 'Unknown Member'}</span>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{groupName} — Installment {inst.installmentNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-red-600">{formatCurrency(inst.amountDue)}</span>
                      <p className="text-[9px] text-red-400 font-medium">Overdue Since {inst.dueDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-10 space-y-2">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600 font-medium">All clear! No overdue installments detected.</p>
              <p className="text-[10px] text-slate-400 text-center px-6">Every pending installment is current with due dates ahead.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
