# ChickERP - Poultry Breeding & Genetics Management System

## Executive Summary

ChickERP is a web-based breeding and genetics management system designed for small-to-medium poultry breeding operations. The system enables **individual bird tracking** with lineage, breed composition, egg production, and health records. Built with accessibility in mind for workers with varying computer literacy levels, featuring bilingual support (English/Tagalog) and a friendly, simple interface.

---

## 1. Product Overview

### 1.1 Vision
Provide poultry breeders with an intuitive tool to track individual birds, manage genetic lines, record production data, and make informed breeding decisions - replacing error-prone spreadsheets with a reliable, searchable system.

### 1.2 Target Users

| Role | Access Level | Primary Tasks |
|------|--------------|---------------|
| **Owner** | Full access | All features, reports, settings, user management |
| **Worker** | Limited view | Record daily data (eggs, weights, notes), basic lookups |

### 1.3 User Accessibility Requirements
- **Simple vocabulary**: Avoid jargon, use common words
- **Bilingual**: English and Tagalog language support
- **Large touch targets**: Easy to use on phones
- **Visual cues**: Icons alongside text for clarity

### 1.4 Scale & Scope
- **Current**: Under 1,000 birds
- **Growth**: System should scale to 5,000+ birds over time
- **Data retention**: Archive deceased bird records (don't delete)

---

## 2. Core Modules

### 2.1 Individual Bird Management (PRIMARY FEATURE)

#### 2.1.1 Bird Record Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Bird ID | Auto-generated | Yes | System unique identifier |
| Custom IDs | Multiple | No | User-defined identifiers (see below) |
| Name/Nickname | Text | No | Optional friendly name |
| Sex | Enum | Yes | Male, Female, Unknown |
| Hatch Date | Date | Yes | When bird was hatched |
| Status | Enum | Yes | Active, Sold, Deceased, Archived |
| Sire (Father) | Bird Reference | No | Link to male parent |
| Dam (Mother) | Bird Reference | No | Link to female parent |
| Breed Composition | JSON | No | Percentage breakdown (see 2.2) |
| Coop/Location | Reference | No | Current housing |
| Photos | File[] | No | Multiple photos per bird |
| Notes | Text[] | No | Timestamped notes/comments |
| Created Date | Timestamp | Auto | When record was created |

#### 2.1.2 Custom Identification System
Users can define multiple ID types per bird:
- **Leg Band (Color)**: Color name or code
- **Leg Band (Number)**: Alphanumeric band number
- **Wing Band**: Wing tag number
- **RFID**: Electronic tag ID
- **Custom**: User-defined ID types

Example: Bird might have `Leg Color: Blue`, `Leg Number: A-2024-001`, `Wing: W55`

#### 2.1.3 Bird Lookup (TOP PRIORITY)
Fast search by:
- Any ID type (band number, wing tag, etc.)
- Name
- Parent ID (find all offspring)
- Hatch date range
- Breed
- Status

### 2.2 Breed & Genetics Tracking

#### 2.2.1 Breed Composition
Track percentage of breeds in each bird:
```
Example: 50% Rhode Island Red, 25% Leghorn, 25% Plymouth Rock
```

**Calculation Rules:**
- When parents are set, auto-calculate from parent compositions
- Manual override available
- Display as visual breakdown (pie chart or bar)

#### 2.2.2 Breed Registry
Maintain list of breeds:
- Breed name
- Breed code (abbreviation)
- Description
- Color varieties

#### 2.2.3 Simple Genetic Analysis
- **Inbreeding Coefficient (COI)**: Basic Wright's formula calculation
- **Common Ancestor Detection**: Identify shared ancestors
- **Relationship Warning**: Alert when potential parents are closely related

### 2.3 Egg Production Tracking

#### 2.3.1 Daily Egg Records
| Field | Type | Notes |
|-------|------|-------|
| Bird ID | Reference | Which hen laid the egg |
| Date | Date | Collection date |
| Egg ID/Mark | Text | Physical marking on egg |
| Weight | Number | Grams (optional) |
| Shell Quality | Enum | Good, Fair, Poor, Soft |
| Notes | Text | Observations |

#### 2.3.2 Egg-to-Chick Tracking
When eggs are set for incubation:
| Field | Type | Notes |
|-------|------|-------|
| Egg Record | Reference | Link to egg record |
| Set Date | Date | When placed in incubator |
| Expected Hatch | Date | Calculated from set date |
| Actual Hatch | Date | When hatched |
| Resulted Chick | Bird Reference | Link to new bird record |
| Outcome | Enum | Hatched, Infertile, Dead-in-Shell, Broken |

#### 2.3.3 Production Metrics
- Eggs per bird (daily/weekly/monthly/total)
- Fertility rate per bird
- Hatch rate per bird
- Laying patterns (visual calendar)

### 2.4 Weight & Growth Tracking

#### 2.4.1 Weight Records
| Field | Type | Notes |
|-------|------|-------|
| Bird ID | Reference | Which bird |
| Date | Date | Weigh date |
| Weight | Number | Grams |
| Milestone | Enum | Optional: 6-week, 12-week, Adult, etc. |
| Notes | Text | Observations |

#### 2.4.2 Growth Analysis
- Weight history chart per bird
- Comparison to breed standards
- Growth rate calculations

### 2.5 Health Records

#### 2.5.1 Vaccination Records
| Field | Type | Notes |
|-------|------|-------|
| Bird(s) | Reference[] | One or multiple birds |
| Vaccine | Text | Vaccine name |
| Date Given | Date | Administration date |
| Dosage | Text | Amount given |
| Method | Text | How administered |
| Next Due | Date | Booster date if applicable |
| Given By | User Reference | Who administered |

#### 2.5.2 Health Incidents
| Field | Type | Notes |
|-------|------|-------|
| Bird(s) | Reference[] | Affected birds |
| Date Noticed | Date | When issue observed |
| Symptoms | Text | What was observed |
| Diagnosis | Text | Identified condition |
| Treatment | Text | Actions taken |
| Outcome | Enum | Recovered, Ongoing, Deceased |
| Notes | Text | Additional info |

#### 2.5.3 Medication Log
| Field | Type | Notes |
|-------|------|-------|
| Bird(s) | Reference[] | Treated birds |
| Medication | Text | Medicine name |
| Start Date | Date | Treatment start |
| End Date | Date | Treatment end |
| Dosage | Text | Amount/frequency |
| Withdrawal Days | Number | Days before eggs/meat safe |

### 2.6 Feed Management

#### 2.6.1 Feed Inventory
| Field | Type | Notes |
|-------|------|-------|
| Feed Type | Enum | Starter, Grower, Layer, Breeder, etc. |
| Brand | Text | Optional brand name |
| Quantity (kg) | Number | Current stock |
| Low Stock Level | Number | Alert threshold |
| Cost per kg | Number | Optional for tracking |

#### 2.6.2 Feed Consumption
| Field | Type | Notes |
|-------|------|-------|
| Date | Date | Feeding date |
| Coop/Group | Reference | Which group fed |
| Feed Type | Reference | Type of feed |
| Quantity (kg) | Number | Amount given |
| Recorded By | User Reference | Who recorded |

### 2.7 Housing/Coop Management

#### 2.7.1 Coop Records
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Coop identifier |
| Type | Enum | Breeding Pen, Grow-out, Layer, etc. |
| Capacity | Number | Max birds |
| Status | Enum | Active, Maintenance, Inactive |

#### 2.7.2 Bird Assignments
- Track which birds are in which coop
- History of moves between coops

### 2.8 Feed Age Stages

#### 2.8.1 Stage Configuration
Define feed types correlated with bird age:
| Stage | Feed Type | Age Range | Notes |
|-------|-----------|-----------|-------|
| Starter | Starter | 0-4 weeks | High protein for chicks |
| Grower | Grower | 5-12 weeks | Growth phase |
| Finisher | Finisher | 13-20 weeks | Pre-adult phase |
| Breeder | Breeder | 21+ weeks | Breeding adults |

#### 2.8.2 Stage Features
- User can define custom age ranges
- System suggests appropriate feed based on bird age
- Optional brand notes per stage
- Tagalog translations supported

### 2.9 Conditioning & Exercise (Sabong)

#### 2.9.1 Exercise Types (User-Defined)
Users can create their own exercise categories:
- Sparring
- Running/Cardio
- Cord work
- Flying exercises
- Scratch box
- Pointing
- Rest days
- Custom exercises

#### 2.9.2 Exercise Records
| Field | Type | Notes |
|-------|------|-------|
| Bird | Reference | Which rooster |
| Exercise Type | Reference | User-defined type |
| Date | Date | When performed |
| Duration | Minutes | How long |
| Intensity | Enum | Light, Medium, Hard |
| Notes | Text | Observations |

#### 2.9.3 Conditioning Schedule
- Track daily conditioning per bird
- View exercise history
- Plan conditioning programs

### 2.10 Fight Records (Sabong)

#### 2.10.1 Fight Record Fields
| Field | Type | Notes |
|-------|------|-------|
| Bird | Reference | Which rooster |
| Date | Date | Fight date |
| Outcome | Enum | Win, Loss, Draw |
| Location | Text | Derby/event name (optional) |
| Notes | Text | Additional details |

#### 2.10.2 Fight Statistics
- Win/Loss/Draw record per bird
- Win percentage calculation
- Fight history timeline

### 2.11 Egg Size Categories

#### 2.11.1 Size Configuration
Users can define their own egg size categories:
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | e.g., Small, Medium, Large |
| Min Weight | Grams | Lower bound (optional) |
| Max Weight | Grams | Upper bound (optional) |
| Description | Text | Optional details |

#### 2.11.2 Size Assignment
- When recording eggs, select size category
- Auto-suggest based on weight if ranges defined

### 2.12 Offspring Statistics

#### 2.12.1 Offspring Count Display
Per bird (parent), show:
- Total offspring count
- Male offspring count
- Female offspring count
- Unknown sex count

#### 2.12.2 Count Sources
- **Auto-calculated**: Count from linked bird records
- **Manual override**: User can set counts when not all chicks are registered
- Display both if override exists

---

## 3. Data Import

### 3.1 CSV Import from Excel
Support importing existing data:
- **Bird records**: ID, sex, hatch date, parent IDs, breed
- **Egg records**: Date, bird ID, quantity
- **Weight records**: Date, bird ID, weight

### 3.2 Import Validation
- Check for duplicate IDs
- Validate parent references exist
- Flag missing required fields
- Preview before committing

---

## 4. User Interface

### 4.1 Design Principles
- **Friendly & Colorful**: Warm, approachable aesthetic
- **Light Mode Only**: Clean, bright interface
- **Simple Language**: Avoid technical jargon
- **Accessibility First**: Large buttons, clear icons

### 4.2 Language Support
- **Primary**: English
- **Secondary**: Tagalog (Filipino)
- **Switching**: User can toggle language in settings

### 4.3 Navigation Structure

```
/ (Home/Dashboard)
├── /birds                    → Bird list & search
│   ├── /birds/new           → Add new bird
│   ├── /birds/[id]          → Bird profile/details
│   ├── /birds/[id]/edit     → Edit bird
│   ├── /birds/[id]/conditioning → Conditioning records
│   ├── /birds/[id]/fights   → Fight records
│   └── /birds/import        → CSV import
├── /eggs                     → Egg production
│   ├── /eggs/record         → Record daily eggs
│   └── /eggs/incubation     → Incubation tracking
├── /health                   → Health records
│   ├── /health/vaccinations → Vaccination records
│   └── /health/incidents    → Health incidents
├── /feed                     → Feed management
│   └── /feed/stages         → Feed stage configuration
├── /coops                    → Coop management
├── /conditioning             → Conditioning/Exercise
│   ├── /conditioning/types  → Manage exercise types
│   └── /conditioning/record → Record exercise session
├── /reports                  → Reports & analytics
└── /settings                 → User settings
    ├── /settings/egg-sizes  → Egg size categories
    └── /settings/exercises  → Exercise types
```

### 4.4 Mobile Navigation
- Bottom tab bar with 5 main sections
- Bird lookup as prominent/first option
- Large touch targets (min 44x44px)

### 4.5 Key Screens

#### Dashboard
- Quick bird search bar (prominent)
- Recent activity feed
- Alerts (vaccinations due, low feed, etc.)
- Quick action buttons (Add Egg, Record Weight, etc.)

#### Bird Profile
- Photo gallery
- Basic info (ID, sex, age, status)
- Breed composition (visual)
- Lineage (parents, grandparents)
- Production summary (eggs, fertility)
- Weight history chart
- Health history
- Notes timeline

#### Bird Search
- Search bar (searches all ID types)
- Filter chips (status, sex, breed, date range)
- List view with photo thumbnails
- Quick actions from list

---

## 5. Technical Architecture

### 5.1 Technology Stack
| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js |
| UI Framework | Tailwind CSS + shadcn/ui |
| File Storage | Local (development) / Cloud (production) |
| Internationalization | next-intl |
| Deployment | Vercel |

### 5.2 Database Schema Overview

```
users
  └── audit trail (who created/modified records)

birds ←──────────────────────────────────┐
  ├── sire_id (self-reference)           │
  ├── dam_id (self-reference)            │
  ├── bird_identifiers (custom IDs)      │
  ├── bird_photos                        │
  ├── bird_notes                         │
  ├── egg_records                        │
  ├── weight_records                     │
  ├── vaccinations                       │
  ├── health_incidents                   │
  └── coop_assignments                   │
                                         │
breeds                                   │
  └── bird_breed_composition ────────────┘

coops
  └── coop_assignments

feed_inventory
  └── feed_consumption
```

### 5.3 Performance Requirements
- Bird search: < 200ms response
- Page load: < 2 seconds
- Support 1,000 birds initially, scale to 10,000+
- Efficient lineage queries (recursive)

---

## 6. Security & Access Control

### 6.1 Authentication
- Email/password login
- Secure password hashing (bcrypt)
- Session-based authentication
- 24-hour session expiry

### 6.2 Role Permissions

| Feature | Owner | Worker |
|---------|-------|--------|
| View all birds | ✓ | ✓ (limited) |
| Add/edit birds | ✓ | ✗ |
| Record eggs | ✓ | ✓ |
| Record weights | ✓ | ✓ |
| View genetics/lineage | ✓ | ✗ |
| Health records | ✓ | ✓ (record only) |
| Reports | ✓ | ✗ |
| Settings/Users | ✓ | ✗ |
| Import data | ✓ | ✗ |

### 6.3 Data Protection
- Input validation on all forms
- SQL injection prevention (Prisma ORM)
- XSS prevention
- HTTPS in production

---

## 7. Future Considerations (Out of Scope v1)

- Offline mode with sync
- Sales tracking and buyer management
- Financial reports
- Automated backup system
- DNA test result import
- Advanced genetic analysis (EBVs, genomic selection)
- IoT integration (automatic weighing scales, RFID readers)
- Native mobile apps

---

## 8. Terminology Glossary

Simple terms used throughout the app:

| Technical Term | Simple Term Used |
|----------------|------------------|
| Sire | Father |
| Dam | Mother |
| Progeny | Offspring / Babies |
| Lineage | Family Tree |
| COI | Inbreeding % |
| Mortality | Deaths |
| Fecundity | Egg Production |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Bird lookup time | < 3 seconds to find any bird |
| Daily data entry | < 5 minutes for routine recording |
| Data accuracy | Reduce entry errors by 80% vs Excel |
| User adoption | All staff using within 2 weeks |
| Uptime | 99% availability |

---

---

## 10. Implementation Tasks

### Phase 1: Core Setup (Completed)
- [x] Initialize Next.js project with TypeScript
- [x] Configure Prisma with PostgreSQL schema
- [x] Set up NextAuth.js authentication
- [x] Create translation system (English/Tagalog)
- [x] Build responsive sidebar and navigation
- [x] Create dashboard with quick actions

### Phase 2: Bird Management (Completed)
- [x] Birds list page with fast search
- [x] Bird detail page with full profile
- [x] Add new bird form with parent search
- [x] Edit bird form
- [x] Bird search API with 200ms response

### Phase 3: Production Tracking (Partially Complete)
- [x] Eggs list page with filters
- [x] Record egg form with hen search
- [x] Weight recording page - Create /weights/record page with bird search, weight input, milestone selection
- [x] Incubation tracking page - Create /eggs/incubation page to track eggs through hatching

### Phase 4: Health Management
- [x] Health dashboard page - Create /health page showing vaccinations due, active incidents
- [x] Vaccination recording page - Create /health/vaccinations/new to record vaccines for single or multiple birds
- [x] Vaccination list page - Create /health/vaccinations showing vaccination history
- [ ] Health incident form - Create /health/incidents/new to record symptoms, diagnosis, treatment
- [ ] Health incident list - Create /health/incidents showing incident history

### Phase 5: Feed & Coop Management
- [ ] Feed inventory page - Create /feed page showing stock levels, low stock alerts
- [ ] Feed consumption recording - Create /feed/record to log daily feed usage
- [ ] Coops list page - Create /coops page showing all housing units
- [ ] Coop detail page - Create /coops/[id] showing birds in coop
- [ ] Add/edit coop forms

### Phase 6: Data Import & Export
- [ ] CSV import page - Create /birds/import with file upload, column mapping, validation preview
- [ ] Import validation logic - Check duplicates, validate parent references, flag errors
- [ ] Data export feature - Add CSV/Excel export for birds, eggs, weights

### Phase 7: Reports & Analytics
- [ ] Reports dashboard - Create /reports page with report type selection
- [ ] Production report - Egg production stats by bird, time period
- [ ] Breed composition chart - Visual breakdown per bird
- [ ] Family tree visualization - Interactive lineage display
- [ ] Weight growth charts - Per-bird weight history graph

### Phase 8: Settings & Utilities
- [ ] Settings page - Create /settings with language toggle, account management
- [ ] Breed registry management - Add/edit breed definitions
- [ ] Breed percentage auto-calculation - Calculate composition from parents when setting lineage

### Phase 9: Conditioning & Exercise (Sabong)
- [ ] Exercise type management - Create /settings/exercises to add/edit user-defined exercise types
- [ ] Exercise record form - Create /conditioning/record to log conditioning session with bird search, exercise type, duration, intensity
- [ ] Bird conditioning history - Add conditioning tab to bird profile showing exercise timeline
- [ ] Conditioning dashboard - Create /conditioning page showing recent activity and scheduled exercises

### Phase 10: Fight Records (Sabong)
- [ ] Fight record form - Create /birds/[id]/fights/new to record Win/Loss/Draw with date
- [ ] Fight history list - Add fights tab to bird profile showing all fight records
- [ ] Fight statistics - Display win/loss record and win percentage on bird profile
- [ ] API routes for fight records - Create /api/fights endpoints for CRUD operations

### Phase 11: Egg Size Categories
- [ ] Egg size management - Create /settings/egg-sizes to add/edit user-defined size categories
- [ ] Update egg recording - Add egg size dropdown to /eggs/record form
- [ ] Auto-suggest size - Suggest size category based on weight if ranges defined

### Phase 12: Feed Age Stages
- [ ] Feed stage configuration - Create /settings/feed-stages to define age ranges for Starter/Grower/Finisher/Breeder
- [ ] Feed recommendation - Show suggested feed type on bird profile based on age
- [ ] Update feed management - Link feed inventory to stages

### Phase 13: Offspring Statistics
- [ ] Offspring count display - Show male/female/unknown offspring counts on bird profile
- [ ] Auto-calculate from records - Count offspring by sex from linked bird records
- [ ] Manual override form - Allow user to set manual counts when not all chicks are registered
- [ ] Offspring gender breakdown - Add visual chart of offspring by sex

### Phase 14: Polish & Testing
- [ ] Run database migrations in production
- [ ] Test all CRUD operations
- [ ] Test responsive design on mobile
- [ ] Test bilingual support (English/Tagalog)
- [ ] Performance test bird search with sample data
- [ ] Test conditioning and fight record features
- [ ] Test egg size and feed stage configuration

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-21 | Initial PRD (Operations ERP) |
| 2.0 | 2026-01-21 | Complete rewrite for Breeding/Genetics focus |
| 2.1 | 2026-01-21 | Added implementation tasks section for Ralphy |
| 2.2 | 2026-01-21 | Added sabong features: conditioning, fights, egg sizes, feed stages, offspring stats |
