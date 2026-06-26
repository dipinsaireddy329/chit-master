/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Coins, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { Installment, Member, ChitGroup } from '../types';

interface SchedulesManagerProps {
  installments: Installment[];
  members: Member[];
  groups: ChitGroup[];
  onPayInstallment: (id: string) => void;
  onUpdateStatus: (id: string, status: 'pending' | 'overdue' | 'paid') => void;
}

export default function SchedulesManager({
  installments,
  members,
  groups,
  onPayInstallment,
  onUpdateStatus
}: SchedulesManagerProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter logic
  const filteredInstallments = installments.filter(inst => {
    // Group filter
    if (selectedGroupId !== 'all' && inst.groupId !== selectedGroupId) return false;
    
    // Status filter
    if (selectedStatus !== 'all' && inst.status !== selectedStatus) return false;
    
    // Member search
    if (searchQuery) {
      const memberObj = members.find(m => m.id === inst.memberId);
      if (!memberObj) return false;
      const term = searchQuery.toLowerCase();
      return memberObj.name.toLowerCase().includes(term) || memberObj.email.toLowerCase().includes(term);
    }
    
    return true;
  });

  // Count metrics for filtered/total
  const paidCount = filteredInstallments.filter(i => i.status === 'paid').length;
  const pendingCount = filteredInstallments.filter(i => i.status === 'pending').length;
  const overdueCount = filteredInstallments.filter(i => i.status === 'overdue').length;

  return (
    <div className="space-y-6 animate-fade-in" id="schedules-container">
      {/* Top filter dashboard banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="schedules-filter-banner">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Group Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Group</span>
            <select 
              id="filter-group-select"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-1.5 border border-slate-100 rounded-lg text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-sans"
            >
              <option value="all">All Chit Groups</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Status</span>
            <select 
              id="filter-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-100 rounded-lg text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-sans"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Search Member */}
          <div className="space-y-1 w-full sm:w-48">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Search Member</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ramesh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Dynamic status badges counts */}
        <div className="flex gap-2 text-[11px] font-semibold font-mono" id="filter-badges-container">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg">
            {paidCount} Paid
          </span>
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg">
            {pendingCount} Pending
          </span>
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg">
            {overdueCount} Overdue
          </span>
        </div>
      </div>

      {/* Main installment list table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden" id="schedules-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="schedules-table">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Member Details</th>
                <th className="py-4 px-6">Chit Group</th>
                <th className="py-4 px-6">Term Month</th>
                <th className="py-4 px-6">Due Date</th>
                <th className="py-4 px-6 text-right">Amount Due</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInstallments.map(inst => {
                const memberObj = members.find(m => m.id === inst.memberId);
                const groupObj = groups.find(g => g.id === inst.groupId);
                
                return (
                  <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors" id={`row-inst-${inst.id}`}>
                    {/* Member */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center">
                          {memberObj?.name.charAt(0) || '?'}
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-slate-900 block">{memberObj?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{memberObj?.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Group */}
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {groupObj?.name || 'Chit Group'}
                    </td>

                    {/* Term Month */}
                    <td className="py-4 px-6 text-slate-600 font-semibold">
                      Month {inst.installmentNumber}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-6 text-slate-600 font-mono">
                      {inst.dueDate}
                      {inst.status === 'paid' && inst.paymentDate && (
                        <span className="text-[10px] text-emerald-500 block">Paid {inst.paymentDate}</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inst.amountDue)}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        inst.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : inst.status === 'overdue'
                          ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {inst.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {inst.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                        {inst.status === 'pending' && <Clock className="w-3 h-3" />}
                        {inst.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions button list */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {inst.status !== 'paid' ? (
                          <>
                            <button 
                              onClick={() => onPayInstallment(inst.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-md text-[11px] cursor-pointer shadow-xs"
                            >
                              Pay
                            </button>
                            {inst.status === 'pending' ? (
                              <button 
                                onClick={() => onUpdateStatus(inst.id, 'overdue')}
                                className="bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 font-semibold px-2.5 py-1 rounded-md text-[11px] cursor-pointer"
                              >
                                Overdue
                              </button>
                            ) : (
                              <button 
                                onClick={() => onUpdateStatus(inst.id, 'pending')}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold px-2.5 py-1 rounded-md text-[11px] cursor-pointer"
                              >
                                Clear Alert
                              </button>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => onUpdateStatus(inst.id, 'pending')}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg cursor-pointer flex items-center gap-1"
                            title="Reset payment to pending state"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Undo</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInstallments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                    No installment records found matching criteria.
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
