# Software Requirement Document (SRS): OpenAgriNet (OAN) Platform
## Livestock Registry Module Specification

---

## 1. Introduction
The **Livestock Registry Module** serves as the national livestock identity, traceability, and health information aggregation layer within **OpenAgriNet (OAN)**. It provides a centralized platform for managing individual livestock profiles, tracking health and vaccination status, and recording vital events across Ethiopia.

This module supports:
*   Field Officers
*   Veterinary Professionals
*   Regional and Federal Administrators

---

## 2. Functional Requirement Categories
The module encompasses the following functional categories:
1.  Livestock Profile Lifecycle Management
2.  Livestock Identification & Tagging
3.  Animal Registration & Inventory Management
4.  Health Status Management
5.  Vaccination Tracking
6.  Vital Events Recording (Birth, Mortality, Disease)
7.  Breeding & Artificial Insemination Tracking
8.  Herd/Flock Dashboard & Analytics
9.  External System Data Pull & Integration
10. Bulk Data Import & Operations
11. Offline Registration & Synchronization
12. Deduplication & Animal Matching
13. Role-Based Access Control
14. Audit & Traceability

---

## 3. User Interface & Navigation

### LR-UI-01: Navigation Structure
*   **Requirement:** Intuitive navigation with breadcrumbs: **Home > Livestock Registry**.
*   **Main Tabs:** **Inventory List** (tabular view), **New Registration** (form), and **Herd/Flock Dashboard** (analytics).

### LR-UI-02: Search & Filtering
*   **Global Search:** Supports Animal Tag ID, Owner Name, and OAN-generated Animal ID.
*   **Filters:** Species (Goat, Cattle, etc.), Health Status, Vaccination Status, Region, and Woreda.

### LR-UI-03: Livestock Inventory Table
*   **Columns:** Tag ID, Species, Breed, Owner, Woreda, Health Status (color-coded), Vaccination Status, and Age.
*   **Features:** Column sorting, pagination, row selection for bulk operations, and data export.

---

## 4. Detailed Functional Requirements

### 4.1 Livestock Profile Lifecycle Management
*   **LR-01 (Create):** Profiles created manually, via API, or bulk import. Mandatory fields include Tag ID, Species, Breed, and Farmer ID.
*   **LR-02 (Update):** Authorized updates to ownership, location, and health status. Critical identifiers (Tag ID, Species) require Federal Admin authorization for changes to verified records.

### 4.2 Livestock Identification & Tagging
*   **LR-03:** Ear tags serve as the primary unique identifier. The system enforces uniqueness per species per farm during all entry methods.

### 4.4 - 4.6 Health, Vaccination, and Vital Events
*   **LR-05/06:** Tracks health status (Healthy, Sick, Quarantined) and records specific disease events/treatments.
*   **LR-07/08:** Manages vaccination status (Up-to-date, Overdue, None) and records batch/lot details.
*   **LR-09/10/11:** Records births (linking to Dam/Sire), mortality (updating status to "Deceased"), and disease outbreaks.

### 4.11 Offline Registration & Synchronization
*   **LR-22/23:** Mobile support for offline data capture with local storage. Supports bidirectional delta sync (only changes) when connectivity is restored.

---

## 5. Integration Requirements


| System | Integration Type | Data Exchange | Frequency |
| :--- | :--- | :--- | :--- |
| **DOVAR** | File Import (CSV/Excel) | AI events, Milk data | Weekly/Monthly |
| **LITS** | API / File Import | Traceability data | Daily/Weekly |
| **Case Book** | File Import (Excel) | Vital events, Breeding | Monthly |
| **ALIVE/AgMIS** | File Import (CSV/Excel) | Livestock census data | Quarterly |
| **Farmer Registry**| Database FK | Farmer validation | Real-time |

*(Source:)*

---

## 6. Non-Functional Requirements

### 7.2 Security
*   **Encryption:** AES-256 at rest and TLS 1.2+ in transit.
*   **RBAC:** Role-based access enforced at API and UI levels.

### 7.6 Data Retention
*   **Active Records:** Retained indefinitely.
*   **Audit Logs:** Minimum retention of 7 years.
