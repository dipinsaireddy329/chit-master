# 🪙 ChitMaster  — Offline Chit Fund Management

A production-ready, offline-first mobile application engineered in Flutter & Dart, using Riverpod, GoRouter, and Hive. Built as a premium, secure, and intuitive fintech tool designed specifically for local chit fund administrators to manage groups, automate installment schedules, and execute bidding auctions safely offline.

---

## 📖 Overview

**ChitMaster Pro** is designed to digitize, simplify, and secure traditional chit fund operations. Built with a robust offline-first architecture, it empowers independent administrators—like our families and local organizers—to run multiple high-value chit groups without depending on central cloud servers. Every byte of financial ledger data is encrypted and kept private on the administrator's physical device.

---

## ✨ Core Product Features

### 🏠 1. Premium Fintech-Inspired Dashboard
A clean, Material 3 interactive interface that displays high-contrast cards for five standard chit configurations:
- **₹1,00,000 Chits** (Green Accent)
- **₹2,00,000 Chits** (Teal Accent)
- **₹5,00,000 Chits** (Indigo Accent)
- **₹10,00,000 Chits** (Amber Accent)
- **₹20,00,000 Chits** (Rose Accent)

Each card aggregates real-time metrics dynamically:
* Active / Completed Groups counts
* Total enrolled members
* Expected monthly collections
* Total collected today vs. pending outstanding balances
* Auto-flagged overdue values
* Upcoming bidding draw dates
* Live collection progress bar (percentage rate)
* Accrued organizer profit metrics

---

### ➕ 2. Custom Group Designer
Create customized chit circles in seconds with minimalist data entry:
* **Custom & Predefined Pot Sizes**: ₹1L, ₹2L, ₹5L, ₹10L, ₹20L, or personalized custom inputs.
* **Duration Presets**: 10 months, 20 months, or bespoke terms.
* **Organizer Commission / Interest Rates**: Quick selection for 1.50%, 1.75%, or custom admin values.
* **Schedules**: Auto-calculated monthly due dates and auction calendar locks.

---

### 📊 3. Automatic Installment Generator
No more paper ledgers or calculator errors. The app features an algorithmic schedule engine that instantly generates complete monthly payment plans.
- **Example (₹1,00,000 Chit | 10 Months | 1.5% Commission)**:
  - *Month 1*: ₹16,450
  - *Month 2*: ₹20,000
  - *Month 3*: ₹17,150
  - *Month 4*: ₹17,500
  - *Month 5*: ₹17,850
  - *Month 6*: ₹18,200
  - *Month 7*: ₹18,550
  - *Month 8*: ₹18,900
  - *Month 9*: ₹19,250
  - *Month 10*: ₹19,600
- **Manual Overrides**: Administrators can edit individual due amounts to reconcile with custom physical agreements.

---

### 👥 4. Advanced Member Profiles & Ledgers
Track every member's compliance and financial standing through modular profile sheets:
* **Identification Details**: Avatar Photo, Full Name, Mobile, Address, aadhaar (optional), and Nominee details.
* **Visual Status Indicators**: 
  - 🟢 **Paid**: Installment successfully ledgered.
  - 🟡 **Due Today**: Payment window expires today.
  - 🟠 **Pending**: Standard outstanding contribution.
  - 🔴 **Overdue**: Critical missed installment timeline.
* **Historical Auditing**: Chronological list of payments including Date, Amount, Payment Method (Cash, UPI, Bank Transfer, Cheque), Receipt Number, and admin logs.

---

### 🎲 5. Live Bidding Draw Terminal & Dividend Engine
Run the monthly bidding auction inside a dedicated digital terminal:
* **Eligible Bidders Filter**: Automatically excludes past auction winners to enforce compliance.
* **Bidding Range Validation**: Enforces safety thresholds based on group min/max discount rules to prevent risky bidding behaviors.
* **Dividend Auto-Distribution**: Instantly calculates:
  - *Winning Bid & Discount conceded*
  - *Prize pool payout disbursed to the winner*
  - *Dividend rebates distributed evenly back to all active group members*
  - *Organizer commission (net income)*
  - *Recalculates subsequent contribution dues on the fly*

---

### 🔒 6. Military-Grade Offline Security & Backup
* **Zero-Server Exposure**: Keeps financial ledgers private.
* **Encrypted Storage**: Uses encrypted local databases (Hive) protecting records from on-device attacks.
* **Biometric Lock**: Built-in PIN protection and fingerprint unlock.
* **One-Click Local Backups**: Exports secure JSON files directly to local storage or external drives for seamless recovery.

---

## 🏗️ Technical Architecture & Tech Stack

```
lib/
├── domain/         # Pure business logic, entity declarations, and repository abstractions
├── data/           # Hive & SharedPreferences local data sources, models, and repository impls
└── presentation/   # Riverpod state controllers, Material 3 UI widgets, and GoRouter navigation
```

- **Framework**: Flutter (v3.x) & Dart
- **State Management**: Riverpod (Notifier and AsyncNotifier patterns)
- **Routing**: GoRouter
- **Local Persistence**: Hive (Nosql database) & SharedPreferences
- **UI & Animations**: Material 3 Design specifications with smooth physics, glassmorphic accents, and large touch targets for easy navigation.

---

## 🚀 Installation & Local Execution

### Prerequisites
- Flutter SDK (3.x or higher)
- Android Studio / VS Code with Flutter extensions installed

### Quick Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/dipinsaireddy329/Chits-Manage-.git
   cd Chits-Manage-
   ```
2. **Install all Flutter dependencies**:
   ```bash
   flutter pub get
   ```
3. **Execute the offline storage model generators**:
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```
4. **Boot the application**:
   ```bash
   flutter run
   ```

---

## 🔮 Future-Ready Roadmap
- [ ] Automated SMS & WhatsApp payment reminders.
- [ ] Digital Signature Capture on installment collections.
- [ ] Aadhaar verification with secure local document upload.
- [ ] AI-powered predictive cash-flow insights.
- [ ] Seamless optional Cloud-Sync (Supabase/Firebase integration).

---

## 📜 License & Contributions
Distributed under the MIT License. Contributions, bug reports, and UX optimization ideas are welcome to make this the friendliest chit manager in the world!
