# Software Requirements Specification (SRS) 2.0

**Project:** CIMARA Inventory Management System  
**Organization:** CIMARA  
**Revision Date:** February 24, 2026  
**Version:** 2.0

---

## 1. Executive Summary

The CIMARA Inventory Management System is a specialized ERP solution designed to handle the complex logistics of equipment distribution from a central warehouse to diverse administrative sites. Built on the philosophy of "Quality brings reliability," the system ensures that every piece of hardware is tracked from entry to end-user withdrawal, maintaining accountability and operational efficiency across multiple sites.

---

## 2. System Overview

### 2.1 Purpose
To provide a centralized platform for managing equipment inventory across multiple administrative locations (ENAM, MINFOPRA, SUPPTIC, ISMP) with role-based access control and real-time reporting capabilities.

### 2.2 Scope
- **In Scope:**
  - Equipment inventory management from warehouse to sites
  - User authentication and authorization
  - Real-time inventory tracking and reporting
  - Equipment withdrawal and allocation
  - Low stock alerts and monitoring
  
- **Out of Scope:**
  - Physical asset tagging/barcode generation
  - Third-party supplier integration
  - Predictive analytics

### 2.3 Key Characteristics
- Multi-site deployment with site-specific access control
- Role-based user permissions
- Real-time inventory calculations
- MongoDB-based distributed database architecture
- Cloud-hosted on Vercel with serverless scalability

---

## 3. User Roles and Permissions

### 3.1 System Administrator (Admin)
**Access Level:** Full CRUD permissions over WAREHOUSE database

**Responsibilities:**
- Inventory Ingestion: Adding new stock with categories, units, and conditions
- Site Management: Overseeing equipment levels across all sites
- Audit Control: Reviewing global withdrawal history for accountability
- Report Generation: Creating comprehensive inventory and withdrawal reports
- User Management: Viewing all registered engineers across sites
- Low Stock Monitoring: Setting thresholds and receiving alerts

**Database Access:** `inventory_warehouse_main`

### 3.2 Site Engineer
**Access Level:** Restricted to site-specific databases

**Responsibilities:**
- Self-Registration: Register profile and select assigned site
- Site Dashboard: View stock availability at their specific location
- Withdrawal Requests: Record equipment withdrawals for field operations
- Local Reporting: Access site-specific inventory reports
- Equipment Request: Request equipment transfers between departments

**Database Access:** Site-specific (e.g., `inventory_enam`, `inventory_ismp`, `inventory_minfopra`, `inventory_supptic`)

---

## 4. Core Functional Workflows

### 4.1 Advanced Login Mechanism

**Process Flow:**
1. **Site Selection:** User selects site from CIMARA_SITES constant
2. **Credential Entry:** Username and password submission
3. **Dynamic Database Routing:** Backend connects to site-specific MongoDB database
4. **Session Management:** Valid credentials create HTTP-only session cookie
5. **Dashboard Redirect:** Successful login redirects to role-appropriate dashboard

**Error Handling:**
| Error Code | Trigger | Resolution |
|-----------|---------|-----------|
| 404 | Missing `/api/auth/login` route | Verify API folder structure |
| 500 | Invalid MONGODB_URI in .env.local | Check credentials and IP whitelist |
| 401 | Invalid credentials | Verify username/password/site combination |
| 403 | Insufficient permissions | Verify user role assignment |

### 4.2 Equipment Registration Workflow

**Admin Flow:**
1. Navigate to "Add Equipment" form
2. Enter equipment details (name, category, quantity, condition)
3. Submit to `/api/equipment` endpoint
4. Equipment stored in WAREHOUSE database
5. Confirmation toast displayed

**Engineer Flow:**
1. Navigate to site-specific "Add Equipment" form
2. Enter equipment details with location field
3. Submit to `/api/site/equipment` endpoint
4. Equipment stored in site database
5. Stock instantly updated on dashboard

### 4.3 Withdrawal Request Workflow

**Process:**
1. Engineer selects equipment from available inventory
2. Specifies withdrawal quantity and destination
3. Enters receiver name and notes
4. System validates available stock
5. Creates withdrawal record in database
6. Updates available stock calculation
7. Generates withdrawal receipt

**Formula:** `Available Stock = Initial Quantity - Total Withdrawn`

### 4.4 Report Generation Logic

**Real-Time Calculation:**
- Reports generated on-demand, not cached
- Prevents data discrepancies and stale information
- Dashboard displays:
  - Total equipment count per site
  - Total engineers registered
  - Withdrawal history with timestamps
  - Available vs. depleted inventory

**Low Stock Alert Threshold:**
- Triggers when equipment quantity < 5 units
- Displays in admin dashboard with priority highlighting
- Supports custom threshold configuration

### 4.5 Engineer Self-Registration

**Process:**
1. Unregistered user accesses registration page
2. Fills form with name, username, password, site selection
3. Password hashed with bcrypt (10 rounds)
4. Profile saved to site-specific database
5. Auto-login or redirect to login page
6. Confirmation email sent (if configured)

---

## 5. Architectural Design

### 5.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js | 16.0.10 |
| UI Library | shadcn/ui | Latest |
| Styling | Tailwind CSS | v4 |
| Database | MongoDB | Atlas (Cloud) |
| Authentication | Custom (bcrypt + Session) | - |
| Deployment | Vercel | - |
| Version Control | GitHub | - |

### 5.2 Database Architecture

**One-Cluster, Multi-Database Approach:**

```
CIMARA-ADMIN-CLUSTER
├── inventory_warehouse_main (WAREHOUSE DB)
│   ├── equipment (admin-managed stock)
│   ├── users (admin accounts)
│   └── receipts (historical records)
│
├── inventory_enam (SITE DB - ENAM)
│   ├── equipment (site-deployed stock)
│   ├── users (engineers at ENAM)
│   └── withdrawals (local withdrawal history)
│
├── inventory_ismp (SITE DB - ISMP)
│   ├── equipment
│   ├── users
│   └── withdrawals
│
├── inventory_minfopra (SITE DB - MINFOPRA)
│   ├── equipment
│   ├── users
│   └── withdrawals
│
└── inventory_supptic (SITE DB - SUPPTIC)
    ├── equipment
    ├── users
    └── withdrawals
```

**Collection Schemas:**

**Equipment Collection:**
```json
{
  "_id": ObjectId,
  "name": String,
  "category": String,
  "quantity": Number,
  "unit": String,
  "condition": String,
  "location": String,
  "serialNumber": String,
  "createdAt": Date,
  "updatedAt": Date
}
```

**Users Collection:**
```json
{
  "_id": ObjectId,
  "username": String (unique per site),
  "password": String (hashed),
  "name": String,
  "role": String (ENGINEER, ADMIN),
  "site": String,
  "createdAt": Date
}
```

**Withdrawals Collection:**
```json
{
  "_id": ObjectId,
  "equipmentId": ObjectId,
  "equipmentName": String,
  "quantity": Number,
  "receiverName": String,
  "destinationSiteName": String,
  "withdrawalDate": Date,
  "description": String,
  "createdAt": Date
}
```

### 5.3 Frontend Architecture

**Component Structure:**
- **Pages:** Dashboard, Login, Signup
- **Components:** Forms, Lists, Stats, Alerts, Modals
- **Hooks:** useAuth (session management), useFetch (data loading)
- **Utilities:** Session management, API communication

**State Management:**
- React hooks for component state
- SWR for server state and caching
- Session cookies for authentication persistence

### 5.4 API Architecture

**Base URL:** `/api`

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | No | User authentication |
| `/auth/logout` | POST | Yes | Session termination |
| `/auth/session` | GET | Yes | Session validation |
| `/equipment` | GET, POST | Yes | Warehouse inventory (admin) |
| `/site/equipment` | GET, POST | Yes | Site inventory (engineer) |
| `/engineers` | GET, POST | Yes | Engineer management |
| `/withdrawals` | GET, POST | Yes | Withdrawal records |
| `/reports` | GET | Yes | Report generation |

---

## 6. Deployment and Maintenance

### 6.1 Version Control Strategy

**Repository:** `egrtaa-spec/sec-cimara-inventory-mgt-system`

**Branching Strategy:**
- `main` - Production release branch
- `develop` - Integration branch
- `fix-*` - Hotfix branches

**Deployment Workflow:**
```bash
git add .
git commit -m "Feature/fix description"
git push origin main
```

**Reversion Procedure:**
```bash
git reset --hard origin/main  # Sync to last known working version
npm run build                   # Rebuild application
```

### 6.2 Environment Configuration

**Required Environment Variables (.env.local):**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
MONGODB_USERNAME=<db_user>
MONGODB_PASSWORD=<db_password>

DB_ENAM=inventory_enam
DB_MINFOPRA=cimara_inventory
DB_SUPPTIC=inventory_supptic
DB_ISMP=inventory_ismp
DB_WAREHOUSE=inventory_warehouse_main

NODE_ENV=production
```

### 6.3 Scalability Roadmap

**Phase 1 (Current):**
- Single M5 MongoDB cluster
- Vercel serverless functions
- Up to 50 concurrent users

**Phase 2 (Growth):**
- MongoDB Atlas M10 tier ($57/month)
- Custom domain ($15/year)
- Up to 500 concurrent users
- CDN for static assets

**Phase 3 (Enterprise):**
- MongoDB serverless or M20 tier
- Dedicated Vercel Pro plan
- Advanced analytics and reporting
- API rate limiting and throttling

---

## 7. Security and Compliance

### 7.1 Authentication & Authorization

**Password Security:**
- Minimum 8 characters (enforced in UI)
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Session expires after 24 hours

**Session Management:**
- HTTP-only cookies (cannot be accessed via JavaScript)
- Secure flag enabled in production
- SameSite=Strict to prevent CSRF
- Server-side validation on every request

### 7.2 Data Protection

**Environment Variables:**
- Stored in `.env.local` (excluded from Git via .gitignore)
- Accessed server-side only
- Never exposed to browser/client

**Database Access:**
- IP whitelist on MongoDB Atlas
- Database user with minimal required permissions
- Read/write separation where applicable

### 7.3 Input Validation

**Client-Side:**
- Required field validation
- Data type checking
- Format validation (email, phone)

**Server-Side:**
- Schema validation on all inputs
- SQL injection prevention (MongoDB parameterized queries)
- XSS prevention via output encoding
- CSRF token validation on state-changing operations

### 7.4 Audit Trail

**Logged Events:**
- User login/logout with timestamp
- Equipment additions/modifications
- Withdrawals with requester identification
- Report generation and access

---

## 8. Performance Requirements

| Metric | Requirement |
|--------|-------------|
| Page Load Time | < 3 seconds |
| API Response Time | < 500ms (p95) |
| Database Query Time | < 100ms (p95) |
| Concurrent Users | 100+ |
| Uptime SLA | 99.5% |

---

## 9. Testing Requirements

### 9.1 Testing Scope

- **Unit Tests:** API endpoints, utility functions
- **Integration Tests:** API + Database operations
- **E2E Tests:** Full user workflows (login → equipment registration → withdrawal)
- **Performance Tests:** Load testing with 100+ concurrent users

### 9.2 Test Coverage

- Minimum 80% code coverage
- All critical paths tested
- Error scenarios covered

---

## 10. Non-Functional Requirements

| Requirement | Details |
|------------|---------|
| Availability | 99.5% uptime, auto-scaling |
| Response Time | < 500ms for 95% of requests |
| Data Backup | Daily automated backups |
| Disaster Recovery | RTO < 4 hours, RPO < 1 hour |
| Accessibility | WCAG 2.1 AA compliance |
| Internationalization | English (primary), extensible to other languages |

---

## 11. Future Enhancements

1. **Mobile Application:** iOS/Android native apps for engineers
2. **Advanced Analytics:** Predictive inventory management
3. **Barcode/QR Integration:** Automated equipment tracking
4. **Notification System:** Email/SMS alerts for low stock
5. **Multi-language Support:** Regional language interfaces
6. **API Gateway:** Third-party integrations
7. **Advanced Reporting:** Export to Excel/PDF with charts
8. **Audit Dashboard:** Complete compliance tracking

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **WAREHOUSE DB** | Central inventory repository managed by admins |
| **SITE DB** | Location-specific database for each office/site |
| **Engineer** | Site-level user with restricted database access |
| **Admin** | System-level user with full database access |
| **Withdrawal** | Record of equipment taken from inventory |
| **Low Stock Alert** | Warning when inventory drops below threshold |
| **Session Cookie** | Secure token maintaining user login state |

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | CIMARA Team | Initial SRS |
| 2.0 | 2026-02-24 | CIMARA Team | Enhanced security, architecture details, testing requirements |

---

## 14. Approval and Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | - | - | - |
| Technical Lead | - | - | - |
| QA Lead | - | - | - |
| Stakeholder | - | - | - |

---

**Document Owner:** CIMARA Development Team  
**Last Updated:** February 24, 2026  
**Next Review Date:** May 24, 2026
