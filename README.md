# **BudgetWise — Group Expense Management System (CS-480 Project)**

BudgetWise is a database-driven group expense management system designed to help users **track shared spending, split costs fairly, and settle balances** with individuals across the groups you share as roommates, friends, travel companions, or event participants.

Users can create or join groups, log expenses, automatically divide costs among members, view balances (“who owes whom”), and maintain a history of all the group activity.  
By leveraging a relational database, BudgetWise ensures **accuracy, reliability, and fairness** in shared expense management.

---

## **Table of Contents**

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [ER Diagram](#-er-diagram)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)

---

## **Features**

### User Registration & Authentication

- Create an account with name, email, and password
- Secure login to access groups, expenses, and settlements

### Group Creation & Management

- Create groups for trips, households, events, etc.
- Add and manage group members

### Record Shared Expenses

- Add expenses with amount, category, payer, date under group
- Full detail stored for transparency

### Automatic Expense Splitting

- Split costs **equally**, by **amount** or by **percentage** among members
- System handles all calculations automatically

### Spending Insights

- Category-wise and monthly spending analytics at the individual level
- User can see how much one has spent and how much is the person's total share

### Balance Tracking (“Who Owes Whom”)

- View detailed balances for each user across groups.
- Shows who owes whom and how much based on all recorded data.

### Settlement Recording

- You can settle the balances with individuals (payer → payee)
- Balances update immediately across both payer and payee.

### Group Activity Timeline

- Chronological history of expenses in the group
- Helps users verify financial transactions

### Profile Management

- Update name, and password securely

---

## **Tech Stack**

- **Frontend:** React.js
- **Backend Runtime:** Node.js
- **Backend Framework:** Express.js
- **Database:** MySQL (relational schema)

---

## **ER Diagram**

![BudgetWise ER Diagram](images/ER%20Diagram.png)

---

## **Getting Started**

### **Prerequisites**

Make sure the following are installed:

- Node.js (v18+ recommended)
- MySQL Server
- npm or yarn

### **Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/imandeol/budgetWise
   cd budgetWise
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **_Database configurations_**

- Create a MySQL database named budgetwise
- Rename .env.example to .env and update with your database credentials
- Then run schema.sql file to create the required tables in budgetwise database.

4. **_Start backend server_**
   ```bash
   cd budget-wise-backend
   npm run dev
   ```
5. **_Start frontend server_**

- Open new tab in bash

  ```bash
  cd ../budget-wise-frontend
  npm run dev
  ```

---
