# Olive Branch

Olive Branch is a **case-management tool** designed for insolvency and compliance workflows. It streamlines case tracking, compliance management, task assignments, document handling, and stakeholder visibility through a read-only portal, while enforcing strict workflow rules.

---

## Functional Overview

The core functionality of Olive Branch includes:

- **Case Management:** Staff users create Cases specifying the type and jurisdiction.
- **Compliance Pack Automation:** Each Case automatically receives a default Compliance Pack containing required statements and filings.
- **Task Tracking & SLAs:** Team members can track tasks, deadlines, and service-level agreements associated with each Case.
- **Document Evidence Upload:** Staff can upload evidence files with versioning and approval workflows.
- **Creditor Portal:** A read-only portal allows external stakeholders (creditors) to view relevant case information.
- **Closure Gate Enforcement:** The system prevents closing a Case until all mandatory compliance items are completed and any financial obligations are cleared.

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:**  MySQL (via Prisma ORM)
- **Validation:** Zod
- **Storage:** Firebase
- **Authentication:** JWT
- **Testing:** Jest & Supertest
- **Version Control:** Git

---

src/
├─ config/          # Express env
├─ routes/          # Express routes
├─ services/        # Business logic for cases, compliance, tasks
├─ middleware/      # Authentication and validation
├─ prisma/          # Prisma schema and seed data
└─ tests/           # Jest test suites

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/?????/olive_branch_backend.git
cd olive_branch_backend


2. **Install dependencies:**

```bash
npm install

3. **setup environment variables:**


Create a .env file with:

DATABASE_URL="mysql://root:wzhwzh122333@localhost:3306/olive_branch"
PORT=3000
FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'
JWT_SECRET="74mNKVAKj1grDRCi6gysiuqaEow/tlrusWw9gWp6Bl8="

4. **Run database migrations and seed data:**


```bash
npx prisma migrate dev --name init
npm run seed



5. **Running the App:**

```bash

npm run dev





6. **testing:**

```bash

npm run test