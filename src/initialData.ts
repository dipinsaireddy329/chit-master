/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, ChitGroup, BiddingDraw, Installment } from './types';

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Rajesh Kumar', email: 'rajesh.kumar@gmail.com', phone: '+91 98765 43210', joinedDate: '2026-01-10' },
  { id: 'm-2', name: 'Priya Sharma', email: 'priya.sharma@yahoo.com', phone: '+91 98765 43211', joinedDate: '2026-01-15' },
  { id: 'm-3', name: 'Amit Patel', email: 'amit.patel@outlook.com', phone: '+91 98765 43212', joinedDate: '2026-01-18' },
  { id: 'm-4', name: 'Sunita Rao', email: 'sunita.rao@gmail.com', phone: '+91 98765 43213', joinedDate: '2026-02-01' },
  { id: 'm-5', name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '+91 98765 43214', joinedDate: '2026-02-05' },
  { id: 'm-6', name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', phone: '+91 98765 43215', joinedDate: '2026-02-12' },
  { id: 'm-7', name: 'Vijay Reddy', email: 'vijay.reddy@gmail.com', phone: '+91 98765 43216', joinedDate: '2026-02-15' },
  { id: 'm-8', name: 'Meera Nair', email: 'meera.nair@hotmail.com', phone: '+91 98765 43217', joinedDate: '2026-02-20' },
  { id: 'm-9', name: 'Sanjay Gupta', email: 'sanjay.gupta@gmail.com', phone: '+91 98765 43218', joinedDate: '2026-03-01' },
  { id: 'm-10', name: 'Deepa Joshi', email: 'deepa.joshi@gmail.com', phone: '+91 98765 43219', joinedDate: '2026-03-05' }
];

export const INITIAL_GROUPS: ChitGroup[] = [
  {
    id: 'g-1',
    name: 'Premium Smart Chit (1 Lakh)',
    totalValue: 100000,
    memberCount: 10,
    durationMonths: 10,
    currentInstallment: 3,
    monthlyContribution: 10000,
    startDate: '2026-04-01',
    status: 'active',
    memberIds: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-7', 'm-8', 'm-9', 'm-10'],
    minBidDiscountPercent: 5,
    maxBidDiscountPercent: 40
  },
  {
    id: 'g-2',
    name: 'Elite Long Term Chit (5 Lakhs)',
    totalValue: 500000,
    memberCount: 10,
    durationMonths: 10,
    currentInstallment: 1,
    monthlyContribution: 50000,
    startDate: '2026-06-15',
    status: 'active',
    memberIds: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-7', 'm-8', 'm-9', 'm-10'],
    minBidDiscountPercent: 5,
    maxBidDiscountPercent: 35
  }
];

export const INITIAL_DRAWS: BiddingDraw[] = [
  {
    id: 'd-1',
    groupId: 'g-1',
    installmentNumber: 1,
    drawDate: '2026-04-10',
    winningMemberId: 'm-1',
    winningBidAmount: 30000,
    prizeAmount: 70000,
    dividendPerMember: 3000,
    actualContributionPerMember: 7000,
    bids: [
      { memberId: 'm-1', bidAmount: 30000, timestamp: '2026-04-10T18:05:00Z' },
      { memberId: 'm-3', bidAmount: 25000, timestamp: '2026-04-10T18:02:00Z' },
      { memberId: 'm-5', bidAmount: 18000, timestamp: '2026-04-10T18:01:00Z' }
    ]
  },
  {
    id: 'd-2',
    groupId: 'g-1',
    installmentNumber: 2,
    drawDate: '2026-05-10',
    winningMemberId: 'm-2',
    winningBidAmount: 25000,
    prizeAmount: 75000,
    dividendPerMember: 2500,
    actualContributionPerMember: 7500,
    bids: [
      { memberId: 'm-2', bidAmount: 25000, timestamp: '2026-05-10T18:06:00Z' },
      { memberId: 'm-4', bidAmount: 22000, timestamp: '2026-05-10T18:04:00Z' },
      { memberId: 'm-8', bidAmount: 15000, timestamp: '2026-05-10T18:01:00Z' }
    ]
  }
];

// Generate installments for the initial setup
export const generateInitialInstallments = (): Installment[] => {
  const installments: Installment[] = [];

  // Group 1: Month 1 (Completed, all paid)
  INITIAL_MEMBERS.forEach(m => {
    installments.push({
      id: `inst-g1-i1-${m.id}`,
      groupId: 'g-1',
      installmentNumber: 1,
      memberId: m.id,
      amountDue: 7000, // 10k - 3k dividend
      dueDate: '2026-04-20',
      status: 'paid',
      paymentDate: '2026-04-18'
    });
  });

  // Group 1: Month 2 (Completed, all paid)
  INITIAL_MEMBERS.forEach(m => {
    installments.push({
      id: `inst-g1-i2-${m.id}`,
      groupId: 'g-1',
      installmentNumber: 2,
      memberId: m.id,
      amountDue: 7500, // 10k - 2.5k dividend
      dueDate: '2026-05-20',
      status: 'paid',
      paymentDate: '2026-05-15'
    });
  });

  // Group 1: Month 3 (Active, pending draw / bids, so we use full monthly contribution as estimate until draw is finalized)
  INITIAL_MEMBERS.forEach(m => {
    installments.push({
      id: `inst-g1-i3-${m.id}`,
      groupId: 'g-1',
      installmentNumber: 3,
      memberId: m.id,
      amountDue: 10000, // standard pre-bidding due
      dueDate: '2026-06-20',
      status: 'pending'
    });
  });

  // Group 2: Month 1 (Active, pending draw)
  INITIAL_MEMBERS.forEach(m => {
    installments.push({
      id: `inst-g2-i1-${m.id}`,
      groupId: 'g-2',
      installmentNumber: 1,
      memberId: m.id,
      amountDue: 50000,
      dueDate: '2026-07-15',
      status: 'pending'
    });
  });

  return installments;
};

// Storage helper functions
export const getStoredData = () => {
  if (typeof window === 'undefined') {
    return {
      members: INITIAL_MEMBERS,
      groups: INITIAL_GROUPS,
      draws: INITIAL_DRAWS,
      installments: generateInitialInstallments()
    };
  }

  const membersStr = localStorage.getItem('chits_members');
  const groupsStr = localStorage.getItem('chits_groups');
  const drawsStr = localStorage.getItem('chits_draws');
  const installmentsStr = localStorage.getItem('chits_installments');

  let members = INITIAL_MEMBERS;
  let groups = INITIAL_GROUPS;
  let draws = INITIAL_DRAWS;
  let installments = generateInitialInstallments();

  if (membersStr) {
    try { members = JSON.parse(membersStr); } catch (e) { console.error(e); }
  } else {
    localStorage.setItem('chits_members', JSON.stringify(INITIAL_MEMBERS));
  }

  if (groupsStr) {
    try { groups = JSON.parse(groupsStr); } catch (e) { console.error(e); }
  } else {
    localStorage.setItem('chits_groups', JSON.stringify(INITIAL_GROUPS));
  }

  if (drawsStr) {
    try { draws = JSON.parse(drawsStr); } catch (e) { console.error(e); }
  } else {
    localStorage.setItem('chits_draws', JSON.stringify(INITIAL_DRAWS));
  }

  if (installmentsStr) {
    try { installments = JSON.parse(installmentsStr); } catch (e) { console.error(e); }
  } else {
    localStorage.setItem('chits_installments', JSON.stringify(installments));
  }

  return { members, groups, draws, installments };
};

export const saveStoredData = (data: {
  members: Member[];
  groups: ChitGroup[];
  draws: BiddingDraw[];
  installments: Installment[];
}) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('chits_members', JSON.stringify(data.members));
  localStorage.setItem('chits_groups', JSON.stringify(data.groups));
  localStorage.setItem('chits_draws', JSON.stringify(data.draws));
  localStorage.setItem('chits_installments', JSON.stringify(data.installments));
};
