/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Plus, 
  Search, 
  User, 
  Clock, 
  Coins, 
  Award,
  CheckCircle2,
  X,
  Calendar,
  Printer,
  Share2,
  FileText,
  Check
} from 'lucide-react';
import { Member, ChitGroup, BiddingDraw, Installment } from '../types';

interface MembersManagerProps {
  members: Member[];
  groups: ChitGroup[];
  draws: BiddingDraw[];
  installments: Installment[];
  onAddMember: (memberData: Omit<Member, 'id' | 'joinedDate'>) => void;
  onPayInstallment: (installmentId: string) => void;
}

export default function MembersManager({
  members,
  groups,
  draws,
  installments,
  onAddMember,
  onPayInstallment
}: MembersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(members[0]?.id || null);
  const [selectedReceipt, setSelectedReceipt] = useState<Installment | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>('UPI Transfer');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Search filter
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    onAddMember({ name, email, phone });

    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setIsAdding(false);
  };

  // Derived member facts
  const memberGroups = selectedMember 
    ? groups.filter(g => g.memberIds.includes(selectedMember.id)) 
    : [];

  const memberWonDraws = selectedMember 
    ? draws.filter(d => d.winningMemberId === selectedMember.id) 
    : [];

  const memberInstallments = selectedMember 
    ? installments.filter(i => i.memberId === selectedMember.id) 
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="members-manager-container">
      {/* Left Sidebar: Members Directory */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-4 lg:col-span-1" id="members-sidebar">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">Members Directory ({filteredMembers.length})</h3>
          <button 
            id="add-member-toggle"
            onClick={() => setIsAdding(true)}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-white rounded-lg cursor-pointer"
            title="Register Member"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-100 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-sans"
          />
        </div>

        {/* List */}
        <div className="space-y-2 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
          {filteredMembers.map(m => {
            const isSelected = m.id === selectedMemberId;
            const enrolledCount = groups.filter(g => g.memberIds.includes(m.id)).length;
            const outstandingCount = installments.filter(i => i.memberId === m.id && i.status === 'overdue').length;

            return (
              <div 
                key={m.id}
                id={`member-item-${m.id}`}
                onClick={() => setSelectedMemberId(m.id)}
                className={`flex justify-between items-center p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected 
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex gap-3 items-center min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{m.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[130px] font-mono">{m.email}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">{enrolledCount} {enrolledCount === 1 ? 'Chit' : 'Chits'}</span>
                  {outstandingCount > 0 && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded-full mt-0.5 inline-block">
                      {outstandingCount} Dues
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel: Member Profile / Registration Form */}
      <div className="lg:col-span-2 space-y-6" id="members-main-panel">
        {isAdding ? (
          /* ADD MEMBER FORM */
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in" id="add-member-form-card">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Register New Member</h3>
                <p className="text-xs text-slate-500">Add personal contact details to enroll members in upcoming groups</p>
              </div>
              <button 
                onClick={() => setIsAdding(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Chandra" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="e.g. ramesh.c@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. +91 99887 76655" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 border border-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-50 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 transition-all text-white text-xs font-medium rounded-xl shadow-md cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        ) : selectedMember ? (
          /* DETAILED MEMBER PROFILE */
          <div className="space-y-6 animate-fade-in" id={`member-profile-${selectedMember.id}`}>
            {/* Header info card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-lg">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">{selectedMember.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Member ID: {selectedMember.id} • Registered {selectedMember.joinedDate}</p>
                  </div>
                </div>
                
                {/* Contact grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 text-left">
                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedMember.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial summaries & enrollments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Groups Enrolled & Prize Wins */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-4 text-left" id="member-groups-prizes">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-50 pb-2">Active Enrollments & Wins</h4>
                
                {/* Group list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chit Groups Enrolled ({memberGroups.length})</span>
                  {memberGroups.length > 0 ? (
                    <div className="space-y-2">
                      {memberGroups.map(g => {
                        const hasWonThisChit = draws.some(d => d.groupId === g.id && d.winningMemberId === selectedMember.id);
                        return (
                          <div key={g.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                            <span className="font-semibold text-slate-800">{g.name}</span>
                            {hasWonThisChit ? (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Award className="w-3 h-3" /> Won Prize
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                Ongoing Bidder
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 italic">Not enrolled in any chit fund groups yet.</p>
                  )}
                </div>

                <hr className="border-slate-50" />

                {/* Wins List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auctions Won ({memberWonDraws.length})</span>
                  {memberWonDraws.length > 0 ? (
                    <div className="space-y-2">
                      {memberWonDraws.map(draw => {
                        const grp = groups.find(g => g.id === draw.groupId);
                        return (
                          <div key={draw.id} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-semibold">
                              <span className="text-emerald-800">{grp?.name || 'Chit Group'}</span>
                              <span className="text-slate-500 font-mono">Month {draw.installmentNumber}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Discount: {formatCurrency(draw.winningBidAmount)}</span>
                              <span>Payout Paid: <strong className="text-emerald-700 font-bold">{formatCurrency(draw.prizeAmount)}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 italic">No auction cycles won yet.</p>
                  )}
                </div>
              </div>

              {/* Installment payment ledger */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col space-y-4 text-left" id="member-dues-ledger">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-50 pb-2">Contribution Installments Ledger</h4>
                
                <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
                  {memberInstallments.map(inst => {
                    const grp = groups.find(g => g.id === inst.groupId);
                    return (
                      <div key={inst.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">{grp?.name || 'Group'}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>Installment {inst.installmentNumber}</span>
                            <span>Due: {inst.dueDate}</span>
                          </div>
                          {inst.status === 'paid' && inst.paymentDate && (
                            <span className="text-[9px] text-emerald-600 block font-mono">Paid on {inst.paymentDate}</span>
                          )}
                        </div>

                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(inst.amountDue)}</span>
                          
                          {inst.status === 'paid' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                ✓ Paid
                              </span>
                              <button 
                                onClick={() => setSelectedReceipt(inst)}
                                className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors"
                              >
                                Receipt
                              </button>
                            </div>
                          ) : inst.status === 'overdue' ? (
                            <div className="flex gap-1.5 items-center">
                              <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                ! Overdue
                              </span>
                              <button 
                                onClick={() => onPayInstallment(inst.id)}
                                className="text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded-lg cursor-pointer shadow-xs"
                              >
                                Pay
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 items-center">
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                Pending
                              </span>
                              <button 
                                onClick={() => onPayInstallment(inst.id)}
                                className="text-[10px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded-lg cursor-pointer shadow-xs"
                              >
                                Pay
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {memberInstallments.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No installments ledgered for this member.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-2xl p-12 space-y-2">
            <Users className="w-12 h-12 text-slate-300" />
            <h3 className="font-bold text-slate-800 text-base">No Member Selected</h3>
            <p className="text-xs text-slate-500 max-w-md text-center">
              Select a member from the directory list on the left to see their complete history of enrollments, details on bidding cycles won, and complete payment ledger, or add a new member.
            </p>
          </div>
        )}
      </div>

      {/* RENDER DYNAMIC RECEIPT OVERLAY */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
          id="receipt-dialog-overlay"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col space-y-6 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-100 pb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">CHITMASTER PRO RECEIPT</h3>
              <p className="text-[10px] text-slate-400 font-mono">Offline Safe Ledger Node Receipt</p>
            </div>

            {/* Receipt Ledger Form */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100/30">
                <span className="text-slate-400">Receipt ID:</span>
                <span className="font-mono font-bold text-slate-800 uppercase">CMP-{selectedReceipt.id.substring(0, 15)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100/30">
                <span className="text-slate-400">Member:</span>
                <span className="font-semibold text-slate-800">{selectedMember?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100/30">
                <span className="text-slate-400">Mobile No:</span>
                <span className="font-mono text-slate-600">{selectedMember?.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100/30">
                <span className="text-slate-400">Chit Group:</span>
                <span className="font-semibold text-slate-800">
                  {groups.find(g => g.id === selectedReceipt.groupId)?.name}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100/30">
                <span className="text-slate-400">Installment Month:</span>
                <span className="font-mono font-bold text-slate-800">#{selectedReceipt.installmentNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100/30">
                <span className="text-slate-400">Received Date:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.paymentDate || 'Today'}</span>
              </div>

              {/* Payment Mode Choice inside receipt */}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Payment Mode:</span>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-100 rounded-md font-sans text-[11px]"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI Transfer">UPI Transfer</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="border-t border-dashed border-slate-200 mt-4 pt-3 flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Amount Paid:</span>
                <span className="font-mono text-lg font-black text-indigo-700">
                  {formatCurrency(selectedReceipt.amountDue)}
                </span>
              </div>
            </div>

            {/* Signature & Stamps */}
            <div className="flex justify-between items-center bg-indigo-50/10 p-3 rounded-xl border border-indigo-100/50">
              <div className="text-left">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Authorized By</span>
                <span className="text-xs font-semibold text-indigo-900">Chit Organizer Stamp</span>
              </div>
              
              {/* Load real signature stamp or fallback */}
              {localStorage.getItem('chitmaster_signature') ? (
                <img 
                  src={localStorage.getItem('chitmaster_signature')!} 
                  alt="Authorized Stamp" 
                  className="h-10 object-contain border border-slate-100/50 bg-white rounded-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-[10px] tracking-widest uppercase rotate-[-2deg]">
                  ✓ PAID SECURE
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 rounded-xl text-xs cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => {
                  const grpName = groups.find(g => g.id === selectedReceipt.groupId)?.name || 'Chit Group';
                  const alertMsg = `Simulating SMS/WhatsApp invoice delivery:\n\n"Hi ${selectedMember?.name}, thank you for paying installment Month #${selectedReceipt.installmentNumber} of ${grpName}. Total received: ${formatCurrency(selectedReceipt.amountDue)} via ${paymentMode} on ${selectedReceipt.paymentDate || 'today'}."`;
                  alert(alertMsg);
                }}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
              >
                <Share2 className="w-4 h-4" /> Share Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
