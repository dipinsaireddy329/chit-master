/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Coins, 
  Calendar, 
  Plus, 
  Search, 
  ArrowRight, 
  Clock, 
  Percent, 
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { ChitGroup, Member, BiddingDraw } from '../types';

interface GroupsManagerProps {
  groups: ChitGroup[];
  members: Member[];
  draws: BiddingDraw[];
  onCreateGroup: (groupData: Omit<ChitGroup, 'id' | 'currentInstallment' | 'monthlyContribution' | 'status'>) => void;
  onEnrollMembers: (groupId: string, memberIds: string[]) => void;
  initialDenomFilter?: number | null;
  onClearDenomFilter?: () => void;
}

export default function GroupsManager({
  groups,
  members,
  draws,
  onCreateGroup,
  onEnrollMembers,
  initialDenomFilter,
  onClearDenomFilter
}: GroupsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id || null);

  // Form states
  const [name, setName] = useState('');
  const [totalValue, setTotalValue] = useState<number>(100000);
  const [memberCount, setMemberCount] = useState<number>(10);
  const [durationMonths, setDurationMonths] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [minBidDiscountPercent, setMinBidDiscountPercent] = useState<number>(5);
  const [maxBidDiscountPercent, setMaxBidDiscountPercent] = useState<number>(40);
  const [selectedEnrollIds, setSelectedEnrollIds] = useState<string[]>([]);

  // Search & Denomination filter
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDenom = initialDenomFilter ? g.totalValue === initialDenomFilter : true;
    return matchesSearch && matchesDenom;
  });

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate) return;

    onCreateGroup({
      name,
      totalValue,
      memberCount,
      durationMonths,
      startDate,
      memberIds: selectedEnrollIds,
      minBidDiscountPercent,
      maxBidDiscountPercent
    });

    // Reset
    setName('');
    setTotalValue(100000);
    setMemberCount(10);
    setDurationMonths(10);
    setStartDate('');
    setMinBidDiscountPercent(5);
    setMaxBidDiscountPercent(40);
    setSelectedEnrollIds([]);
    setIsCreating(false);
  };

  const toggleEnrollMember = (mId: string) => {
    if (selectedEnrollIds.includes(mId)) {
      setSelectedEnrollIds(selectedEnrollIds.filter(id => id !== mId));
    } else {
      if (selectedEnrollIds.length >= memberCount) {
        alert(`Cannot exceed member limit of ${memberCount} for this group.`);
        return;
      }
      setSelectedEnrollIds([...selectedEnrollIds, mId]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="groups-manager-container">
      {/* Left Sidebar: Groups List */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-4 lg:col-span-1" id="groups-sidebar">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Chit Groups ({filteredGroups.length})</h3>
          <button 
            id="add-group-toggle"
            onClick={() => setIsCreating(true)}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-white rounded-lg cursor-pointer"
            title="Create New Group"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search groups..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-100 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-sans"
          />
        </div>

        {initialDenomFilter && onClearDenomFilter && (
          <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs text-indigo-700 font-medium animate-fade-in">
            <span className="flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              Filtered: {formatCurrency(initialDenomFilter)} Chits
            </span>
            <button 
              onClick={onClearDenomFilter}
              className="p-1 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 rounded-lg cursor-pointer transition-colors"
              title="Clear Denomination Filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-2 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
          {filteredGroups.map(g => {
            const groupDraws = draws.filter(d => d.groupId === g.id);
            const isSelected = g.id === selectedGroupId;
            return (
              <div 
                key={g.id}
                id={`group-card-${g.id}`}
                onClick={() => setSelectedGroupId(g.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-3 ${
                  isSelected 
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{g.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {g.id}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    g.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {g.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-semibold">{formatCurrency(g.totalValue)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{g.memberIds.length}/{g.memberCount} Members</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-slate-100/50 pt-2 text-slate-400">
                  <span>Start: {g.startDate}</span>
                  <span className="font-semibold text-indigo-600">Draw {groupDraws.length + 1}/{g.durationMonths}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel: Group Detail or Creation Form */}
      <div className="lg:col-span-2 space-y-6" id="groups-main-panel">
        {isCreating ? (
          /* CREATE GROUP FORM */
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in" id="add-group-form-card">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Launch New Chit Fund Group</h3>
                <p className="text-xs text-slate-500">Establish term, contribution values, and bid ranges</p>
              </div>
              <button 
                onClick={() => setIsCreating(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Group Display Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Premium Executive Chit #4" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Total Value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Total Chit Value (Pot Size)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">₹</span>
                    <input 
                      type="number" 
                      value={totalValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTotalValue(val);
                        // Default duration/members to standard chit formats
                      }}
                      required
                      className="w-full pl-7 pr-3 py-2 border border-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Total prize value distributed over group lifespan</p>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Start / Auction Launch Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Member Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Member Limit</label>
                  <input 
                    type="number" 
                    value={memberCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMemberCount(val);
                      setDurationMonths(val); // Standard chit funds usually have months = memberCount
                    }}
                    required
                    className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Determines standard term duration</p>
                </div>

                {/* Duration Months */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Term Duration (Months)</label>
                  <input 
                    type="number" 
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Min Discount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Minimum Bid Discount (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={minBidDiscountPercent}
                      onChange={(e) => setMinBidDiscountPercent(Number(e.target.value))}
                      required
                      className="w-full pr-7 pl-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                    <Percent className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">Min discount offered by members (usually 5%)</p>
                </div>

                {/* Max Discount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Maximum Bid Discount (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={maxBidDiscountPercent}
                      onChange={(e) => setMaxBidDiscountPercent(Number(e.target.value))}
                      required
                      className="w-full pr-7 pl-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                    <Percent className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">Prevents risky auctions (capped at 30-40%)</p>
                </div>
              </div>

              {/* Multi-Select Enroll Members */}
              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Enroll Founding Members ({selectedEnrollIds.length} / {memberCount})</label>
                  <span className="text-[10px] text-slate-400">Limit to {memberCount} maximum</span>
                </div>
                
                {members.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    No registered members found. Create members in the Members tab first to enroll them!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-100/50 scrollbar-thin">
                    {members.map(m => {
                      const isEnrolled = selectedEnrollIds.includes(m.id);
                      return (
                        <div 
                          key={m.id}
                          onClick={() => toggleEnrollMember(m.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isEnrolled 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' 
                              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                            isEnrolled ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                          }`}>
                            {isEnrolled && <span className="text-[8px]">✓</span>}
                          </div>
                          <span className="truncate">{m.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-50 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 transition-all text-white text-xs font-medium rounded-xl shadow-md shadow-indigo-900/10 cursor-pointer"
                >
                  Initialize Group
                </button>
              </div>
            </form>
          </div>
        ) : selectedGroup ? (
          /* GROUP DETAIL VIEW */
          <div className="space-y-6" id={`group-detail-${selectedGroup.id}`}>
            {/* Header info */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedGroup.name}</h3>
                  <p className="text-xs text-slate-500">Launch Date: {selectedGroup.startDate} • Term: {selectedGroup.durationMonths} Months</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold">
                    Pot Size: {formatCurrency(selectedGroup.totalValue)}
                  </span>
                  <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold">
                    Est. Contribution: {formatCurrency(selectedGroup.monthlyContribution)}/mo
                  </span>
                </div>
              </div>

              {/* Mini detail parameters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50/80 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-semibold text-[10px]">CURRENT STAGE</span>
                  <p className="font-bold text-slate-800">Month {draws.filter(d => d.groupId === selectedGroup.id).length + 1} / {selectedGroup.durationMonths}</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-semibold text-[10px]">MIN/MAX MARGINS</span>
                  <p className="font-bold text-slate-800">{selectedGroup.minBidDiscountPercent}% - {selectedGroup.maxBidDiscountPercent}%</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-semibold text-[10px]">MIN/MAX BID VALUE</span>
                  <p className="font-bold text-slate-800 font-mono">
                    {formatCurrency((selectedGroup.totalValue * selectedGroup.minBidDiscountPercent) / 100)} - {formatCurrency((selectedGroup.totalValue * selectedGroup.maxBidDiscountPercent) / 100)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-semibold text-[10px]">ENROLLED RATIO</span>
                  <p className="font-bold text-slate-800">{selectedGroup.memberIds.length} of {selectedGroup.memberCount} members</p>
                </div>
              </div>
            </div>

            {/* Enrolled Members & Group Ledger Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Enrolled Members list */}
              <div className="md:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-50 pb-2">Enrolled Members</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {selectedGroup.memberIds.map(mId => {
                    const memberObj = members.find(m => m.id === mId);
                    const hasWonDraw = draws.some(d => d.groupId === selectedGroup.id && d.winningMemberId === mId);
                    
                    return (
                      <div key={mId} className="flex justify-between items-center p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-800 truncate max-w-[120px]">{memberObj?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{mId}</span>
                        </div>
                        {hasWonDraw ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-0.5" title="Chit winner of a bidding cycle">
                            ★ Awarded
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Active Bidder
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {selectedGroup.memberIds.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No members enrolled.</p>
                  )}
                </div>
              </div>

              {/* Group Completed Draws Summary / Ledger */}
              <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-50 pb-2">Bidding Cycles History (Ledger)</h4>
                
                {draws.filter(d => d.groupId === selectedGroup.id).length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                    {draws.filter(d => d.groupId === selectedGroup.id).map(draw => {
                      const winner = members.find(m => m.id === draw.winningMemberId);
                      return (
                        <div key={draw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50 text-xs">
                          <div className="text-left space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-indigo-700">Month {draw.installmentNumber} Bidding</span>
                              <span className="text-[10px] text-slate-400 font-mono">{draw.drawDate}</span>
                            </div>
                            <p className="text-slate-600 text-[11px]">
                              Winner: <strong className="text-slate-800 font-bold">{winner?.name || 'Unknown'}</strong> won a payout of <strong className="text-slate-800 font-semibold">{formatCurrency(draw.prizeAmount)}</strong>
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-mono" title="Dividend distributed back per member">
                              +{formatCurrency(draw.dividendPerMember)} Dividend
                            </span>
                            <p className="text-[10px] text-slate-400">Conceded bid: {formatCurrency(draw.winningBidAmount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                    <Clock className="w-8 h-8 text-slate-300" />
                    <p className="text-xs text-slate-600 font-semibold">No bidding draws executed yet</p>
                    <p className="text-[10px] text-slate-400 text-center max-w-sm px-6">
                      The group has been initialized but no monthly auctions have been completed. Go to the Bidding Draws tab to start Month 1.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-2xl p-12 space-y-2">
            <Users className="w-12 h-12 text-slate-300 animate-pulse" />
            <h3 className="font-bold text-slate-800 text-base">No Group Selected</h3>
            <p className="text-xs text-slate-500 max-w-md text-center">
              Choose a chit fund group from the left pane to analyze its membership, financial records, and complete transaction log, or click the Add Group button to design a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
