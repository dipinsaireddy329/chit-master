/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Coins, 
  TrendingUp, 
  Clock, 
  Plus, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  CheckCircle,
  UserCheck,
  Calendar
} from 'lucide-react';
import { ChitGroup, Member, BiddingDraw, Bid } from '../types';

interface BiddingDrawsManagerProps {
  groups: ChitGroup[];
  members: Member[];
  draws: BiddingDraw[];
  onFinalizeDraw: (drawData: Omit<BiddingDraw, 'id'>) => void;
}

export default function BiddingDrawsManager({
  groups,
  members,
  draws,
  onFinalizeDraw
}: BiddingDrawsManagerProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  
  // New Bid Form states
  const [bidMemberId, setBidMemberId] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  
  // Current active auction bids list (temp state before finalizing)
  const [liveBids, setLiveBids] = useState<Bid[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const activeGroup = groups.find(g => g.id === selectedGroupId);

  // Filter completed draws for selected group
  const groupCompletedDraws = draws.filter(d => d.groupId === selectedGroupId);
  const currentInstallmentNum = activeGroup 
    ? groupCompletedDraws.length + 1 
    : 1;

  // Check if group is completed (all months have been drawn)
  const isGroupCompleted = activeGroup 
    ? groupCompletedDraws.length >= activeGroup.durationMonths 
    : false;

  // Determine eligible bidders (members who HAVE NOT won a draw in this group yet)
  const winnerIds = groupCompletedDraws.map(d => d.winningMemberId);
  const eligibleBidders = activeGroup
    ? members.filter(m => activeGroup.memberIds.includes(m.id) && !winnerIds.includes(m.id))
    : [];

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Min and Max bid values in INR
  const minBidVal = activeGroup 
    ? (activeGroup.totalValue * activeGroup.minBidDiscountPercent) / 100 
    : 0;
  const maxBidVal = activeGroup 
    ? (activeGroup.totalValue * activeGroup.maxBidDiscountPercent) / 100 
    : 0;

  // Pre-populate first eligible bidder
  React.useEffect(() => {
    if (eligibleBidders.length > 0 && !bidMemberId) {
      setBidMemberId(eligibleBidders[0].id);
    }
  }, [eligibleBidders, bidMemberId]);

  // Handle setting group
  const handleGroupChange = (gId: string) => {
    setSelectedGroupId(gId);
    setLiveBids([]);
    setBidMemberId('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Add a bid to live auction
  const handleAddBid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!bidMemberId) {
      setErrorMsg('Please select a member first.');
      return;
    }

    if (bidAmount < minBidVal || bidAmount > maxBidVal) {
      setErrorMsg(`Bid discount must be between ${formatCurrency(minBidVal)} (${activeGroup?.minBidDiscountPercent}%) and ${formatCurrency(maxBidVal)} (${activeGroup?.maxBidDiscountPercent}%).`);
      return;
    }

    // Check if member already placed a bid in this live auction
    const existingIndex = liveBids.findIndex(b => b.memberId === bidMemberId);
    if (existingIndex > -1) {
      // Update bid
      const updated = [...liveBids];
      updated[existingIndex].bidAmount = bidAmount;
      updated[existingIndex].timestamp = new Date().toISOString();
      setLiveBids(updated);
      setSuccessMsg('Member bid updated successfully.');
    } else {
      // Add new
      setLiveBids([
        ...liveBids,
        {
          memberId: bidMemberId,
          bidAmount,
          timestamp: new Date().toISOString()
        }
      ]);
      setSuccessMsg('Bid registered successfully.');
    }
  };

  const handleDeleteLiveBid = (mId: string) => {
    setLiveBids(liveBids.filter(b => b.memberId !== mId));
  };

  // Finalize Draw
  const handleFinalizeDraw = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (liveBids.length === 0) {
      setErrorMsg('You must enter at least one bid to finalize the auction.');
      return;
    }

    if (!activeGroup) return;

    // Find winning bid (highest discount bid wins)
    const winningBid = [...liveBids].sort((a, b) => b.bidAmount - a.bidAmount)[0];
    const winnerMember = members.find(m => m.id === winningBid.memberId);

    if (!winnerMember) return;

    const winningBidAmount = winningBid.bidAmount;
    const prizeAmount = activeGroup.totalValue - winningBidAmount;
    const dividendPerMember = winningBidAmount / activeGroup.memberCount;
    const actualContributionPerMember = activeGroup.monthlyContribution - dividendPerMember;

    onFinalizeDraw({
      groupId: activeGroup.id,
      installmentNumber: currentInstallmentNum,
      drawDate: new Date().toISOString().split('T')[0],
      winningMemberId: winningBid.memberId,
      winningBidAmount,
      prizeAmount,
      dividendPerMember,
      actualContributionPerMember,
      bids: liveBids
    });

    // Reset
    setLiveBids([]);
    setSuccessMsg(`Congratulations! ${winnerMember.name} won Month ${currentInstallmentNum} with a bid discount of ${formatCurrency(winningBidAmount)}.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="bidding-draws-container">
      {/* Left Selection & Live Bid Form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-5 lg:col-span-1 text-left" id="bidding-form-panel">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-50 pb-2">Live Auction Terminal</h3>
        
        {/* Select Group */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Select Chit Group</label>
          <select 
            id="draw-group-select"
            value={selectedGroupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-sans"
          >
            <option value="" disabled>-- Select Group --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {activeGroup && (
          <>
            {isGroupCompleted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-xs flex gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold">Group Fully Completed!</span>
                  <p>All {activeGroup.durationMonths} installment auctions have been successfully executed and resolved.</p>
                </div>
              </div>
            ) : eligibleBidders.length === 0 ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 text-xs flex gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold">No Eligible Bidders</span>
                  <p>Enroll more members or make sure there are participants configured for this group.</p>
                </div>
              </div>
            ) : (
              /* BIDDING CONSOLE */
              <div className="space-y-4" id="live-bid-console">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">ACTIVE CYCLE</span>
                    <span className="font-bold text-indigo-700">Installment Month #{currentInstallmentNum}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Allowed Discount Range:</span>
                    <span className="font-semibold text-slate-800">
                      {activeGroup.minBidDiscountPercent}% - {activeGroup.maxBidDiscountPercent}%
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>INR Discount range:</span>
                    <span>{formatCurrency(minBidVal)} - {formatCurrency(maxBidVal)}</span>
                  </div>
                </div>

                {/* Live bid input form */}
                <form onSubmit={handleAddBid} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Select Member Bidder</label>
                    <select 
                      id="bidder-member-select"
                      value={bidMemberId}
                      onChange={(e) => setBidMemberId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-sans"
                    >
                      {eligibleBidders.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Bid Discount Offered (₹)</label>
                    <input 
                      type="number" 
                      id="bid-discount-input"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(Number(e.target.value))}
                      placeholder={`Between ${minBidVal} and ${maxBidVal}`}
                      className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <button 
                    type="submit" 
                    id="submit-bid-btn"
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-semibold py-2 rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Place/Update Bid
                  </button>
                </form>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex gap-1.5" id="bid-error">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 flex gap-1.5" id="bid-success">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Middle Leaderboard / Auction Room */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-1 text-left flex flex-col" id="leaderboard-panel">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-50 pb-2 flex items-center gap-1.5">
          <Award className="w-4.5 h-4.5 text-indigo-600 animate-bounce" /> Live Leaderboard
        </h3>
        
        {liveBids.length > 0 ? (
          <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {[...liveBids]
                  .sort((a, b) => b.bidAmount - a.bidAmount)
                  .map((bid, rank) => {
                    const m = members.find(mem => mem.id === bid.memberId);
                    const isLeader = rank === 0;
                    return (
                      <motion.div 
                        key={bid.memberId} 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ type: "spring", damping: 20, stiffness: 180 }}
                        className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                          isLeader 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-medium' 
                            : 'bg-slate-50/50 border-slate-100 text-slate-600'
                        }`}
                      >
                        <div className="flex gap-2 items-center">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isLeader ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {rank + 1}
                          </span>
                          <div className="text-left">
                            <p className="text-xs font-bold">{m?.name || 'Unknown'}</p>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(bid.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{formatCurrency(bid.bidAmount)}</span>
                          <button 
                            onClick={() => handleDeleteLiveBid(bid.memberId)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-50 pt-4 space-y-3">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-indigo-800">Calculation Preview:</p>
                <div className="flex justify-between font-mono">
                  <span>Conceded Bid (Savings Pot):</span>
                  <span>{formatCurrency(Math.max(...liveBids.map(b => b.bidAmount)))}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Dividend per Member ({activeGroup?.memberCount}):</span>
                  <span>{formatCurrency(Math.max(...liveBids.map(b => b.bidAmount)) / (activeGroup?.memberCount || 1))}</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-slate-800 border-t border-indigo-100/50 mt-1 pt-1">
                  <span>Final Payout to Winner:</span>
                  <span>{formatCurrency((activeGroup?.totalValue || 0) - Math.max(...liveBids.map(b => b.bidAmount)))}</span>
                </div>
              </div>

              <button 
                id="finalize-auction-btn"
                onClick={handleFinalizeDraw}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-emerald-900/10"
              >
                Finalize Auction & Log Dividend
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 space-y-2 border border-dashed border-slate-100 rounded-xl bg-slate-50/50 mt-3">
            <UserCheck className="w-8 h-8 text-slate-300" />
            <p className="text-xs text-slate-600 font-semibold">Leaderboard Empty</p>
            <p className="text-[10px] text-slate-400 text-center px-4">
              Place bid entries on the left panel to simulate live auction rounds.
            </p>
          </div>
        )}
      </div>

      {/* Right Drawer: Past Drawings list */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs lg:col-span-1 text-left flex flex-col" id="history-panel">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-50 pb-2">Completed Auctions Log</h3>
        
        <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin mt-3">
          {draws.filter(d => d.groupId === selectedGroupId).length > 0 ? (
            draws
              .filter(d => d.groupId === selectedGroupId)
              .sort((a, b) => b.installmentNumber - a.installmentNumber)
              .map(draw => {
                const w = members.find(m => m.id === draw.winningMemberId);
                return (
                  <div key={draw.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Month {draw.installmentNumber} Bidding</span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md font-bold">
                        {draw.drawDate}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span>Winner:</span>
                        <span className="font-semibold text-slate-800 font-sans">{w?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bid Discount (Conceded):</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(draw.winningBidAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prize Pool Disbursed:</span>
                        <span className="font-semibold text-emerald-600 font-bold">{formatCurrency(draw.prizeAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1 font-sans">
                        <span>Dividend per member:</span>
                        <span className="font-bold text-indigo-600">+{formatCurrency(draw.dividendPerMember)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center text-slate-400 py-12 text-xs">
              No completed auctions logged for this group.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
