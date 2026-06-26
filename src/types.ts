/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
}

export interface ChitGroup {
  id: string;
  name: string;
  totalValue: number;         // e.g. 100,000
  memberCount: number;        // e.g. 10
  durationMonths: number;     // e.g. 10 months
  currentInstallment: number; // e.g. 1 (representing current active auction month)
  monthlyContribution: number; // totalValue / memberCount (e.g. 10,000 base)
  startDate: string;          // YYYY-MM-DD
  status: 'active' | 'completed';
  memberIds: string[];        // list of member IDs enrolled in this chit
  minBidDiscountPercent: number; // e.g. 5 (5% minimum discount bid)
  maxBidDiscountPercent: number; // e.g. 40 (40% maximum discount bid)
}

export interface Bid {
  memberId: string;
  bidAmount: number; // The discount amount they are willing to take (e.g. 25,000)
  timestamp: string;
}

export interface BiddingDraw {
  id: string;
  groupId: string;
  installmentNumber: number;
  drawDate: string;
  winningMemberId: string;
  winningBidAmount: number;     // The discount conceded (e.g. 20,000)
  prizeAmount: number;          // totalValue - winningBidAmount (e.g. 80,000 goes to winner)
  dividendPerMember: number;     // winningBidAmount / memberCount (e.g. 2,000 dividend to each member)
  actualContributionPerMember: number; // monthlyContribution - dividendPerMember (e.g. 8,000 due from members)
  bids: Bid[];                  // All bids entered for this draw
}

export interface Installment {
  id: string;
  groupId: string;
  installmentNumber: number;
  memberId: string;
  amountDue: number;            // Based on actual contribution calculated in the draw, or base monthly contribution if draw pending
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
}
