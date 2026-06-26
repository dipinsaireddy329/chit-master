/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Coins, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Users,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Member, ChitGroup, BiddingDraw, Installment } from '../types';

interface ReportsManagerProps {
  members: Member[];
  groups: ChitGroup[];
  draws: BiddingDraw[];
  installments: Installment[];
}

export default function ReportsManager({
  members,
  groups,
  draws,
  installments
}: ReportsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Compile member financial statistics
  const memberStats = members.map(m => {
    // 1. Groups enrolled in
    const enrolledGroups = groups.filter(g => g.memberIds.includes(m.id));
    const groupsCount = enrolledGroups.length;

    // 2. Dividends saved
    // For each completed draw in their groups, they receive the dividend
    let totalDividendsSaved = 0;
    draws.forEach(draw => {
      const belongsToGroup = enrolledGroups.some(g => g.id === draw.groupId);
      if (belongsToGroup) {
        totalDividendsSaved += draw.dividendPerMember;
      }
    });

    // 3. Paid installments
    const paidAmount = installments
      .filter(inst => inst.memberId === m.id && inst.status === 'paid')
      .reduce((acc, i) => acc + i.amountDue, 0);

    // 4. Dues outstanding
    const outstandingAmount = installments
      .filter(inst => inst.memberId === m.id && (inst.status === 'pending' || inst.status === 'overdue'))
      .reduce((acc, i) => acc + i.amountDue, 0);

    return {
      id: m.id,
      name: m.name,
      groupsCount,
      totalDividendsSaved,
      paidAmount,
      outstandingAmount,
      totalValueCoordinated: enrolledGroups.reduce((acc, g) => acc + g.totalValue, 0)
    };
  });

  const filteredStats = memberStats.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recharts: Member savings comparison data
  const chartData = memberStats.map(s => ({
    name: s.name.split(' ')[0], // first name for chart label
    'Paid Contributions': s.paidAmount,
    'Dividend Savings': s.totalDividendsSaved,
    'Dues Outstanding': s.outstandingAmount,
  }));

  // Pie chart data: Group breakdown by outstanding dues
  const groupDuesData = groups.map(g => {
    const outstanding = installments
      .filter(i => i.groupId === g.id && i.status !== 'paid')
      .reduce((acc, i) => acc + i.amountDue, 0);
    return {
      name: g.name.substring(0, 15) + '...',
      value: outstanding
    };
  }).filter(g => g.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-8 animate-fade-in" id="reports-container">
      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="reports-charts-grid">
        {/* Member Balances Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Member Cash-Flow Comparison</h3>
              <p className="text-xs text-slate-500 font-sans">Audit paid contributions against dividend rebates earned per member</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Real-Time Sync</span>
          </div>

          <div className="h-64 pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Paid Contributions" name="Contributions Paid" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Dividend Savings" name="Dividend Rebates" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Dues Outstanding" name="Dues Outstanding" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No financial logs to display yet.
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col space-y-6" id="outstanding-by-group-card">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-50 pb-3 text-left">Outstanding Dues by Group</h3>
          
          <div className="h-44 flex items-center justify-center">
            {groupDuesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupDuesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {groupDuesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 py-10">
                No outstanding dues currently recorded!
              </div>
            )}
          </div>

          {/* List breakdown */}
          <div className="space-y-2 text-xs flex-1 overflow-y-auto max-h-[150px] scrollbar-thin text-left">
            {groupDuesData.map((d, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="font-medium text-slate-700 truncate max-w-[120px]">{d.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Audit Ledger Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4" id="audit-ledger-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50 pb-4">
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">Comprehensive Member Ledger</h3>
            <p className="text-xs text-slate-500">Consolidated balance sheets, savings rates, and unpaid liabilities</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ledger..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="audit-ledger-table">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4 text-center">Groups Enrolled</th>
                <th className="py-3 px-4 text-right">Dividend rebates Saved</th>
                <th className="py-3 px-4 text-right">Contributions Paid</th>
                <th className="py-3 px-4 text-right">Outstanding Balances</th>
                <th className="py-3 px-4 text-right">Coordinated Funds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredStats.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/25 transition-colors" id={`ledger-row-${s.id}`}>
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-left">
                    {s.name}
                    <span className="text-[10px] text-slate-400 font-mono block">ID: {s.id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 font-semibold font-mono">
                    {s.groupsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">
                    +{formatCurrency(s.totalDividendsSaved)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                    {formatCurrency(s.paidAmount)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                    s.outstandingAmount > 0 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {formatCurrency(s.outstandingAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-indigo-600 font-semibold">
                    {formatCurrency(s.totalValueCoordinated)}
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No matching ledger accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
