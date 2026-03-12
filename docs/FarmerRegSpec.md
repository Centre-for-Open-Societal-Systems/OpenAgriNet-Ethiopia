# Software Requirement Document (SRS): OpenAgriNet (OAN) Platform
## Farmer Registry Module Specification

---

## 1. Introduction
The **Farmer Registry Module** serves as the national identity harmonization and validation layer for farmer profiling across Ethiopia within **OpenAgriNet (OAN)**. It provides a centralized platform for managing farmer identities, integrating with external registries, verifying against the national **Fayda ID** system, and maintaining accurate records for agricultural programs, benefits distribution, and traceability.

This module supports:
*   Woreda Officers
*   Regional Administrators
*   Federal Administrators
*   Field Officers

---

## 2. Functional Requirement Categories
The module encompasses the following functional categories:
1.  Farmer Profile Lifecycle Management
2.  Fayda (National ID) Verification
3.  Farmer Registration & List View
4.  Status Management
5.  External Registry Data Ingestion (Data Pull Model)
6.  Data Normalization & Harmonization
7.  Conflict Detection & Resolution
8.  Deduplication & Identity Matching
9.  Bulk Data Import & Operations
10. Offline Registration & Synchronization
11. Role-Based Access Control
12. Audit & Traceability

---

## 3. User Interface & Navigation

### FR-UI-01: Navigation Structure
*   **Requirement:** Intuitive navigation with breadcrumbs: **Home > Farmer Registry**.
*   **Main Tabs:** **Farmer List** (tabular view) and **New Registration** (form).

### FR-UI-02: Search & Filtering
*   **Global Search:** Supports Farmer ID and Full Name (English/Local).
*   **Filters:** Region, Woreda, and Status (Active, Inactive, Pending, Verified, Flagged Conflict).

### FR-UI-03: Farmer List Display
*   **Columns:** Selection checkbox, Farmer ID, Full Name (English/Local), Kebele, Woreda, Region, Gender, Age, Registration Date, and Status.
*   **Status Indicators:** 
    *   **Active:** Green label
    *   **Inactive:** Red label
    *   **Pending:** Orange/Yellow label
    *   **Verified:** Blue label (with checkmark)
    *   **Flagged Conflict:** Purple/Orange label.

---

## 4. Detailed Functional Requirements

### 4.1 Farmer Profile Lifecycle Management
*   **FR-01 (Create):** System generates a unique Farmer ID (UUID format). Mandatory fields include Full Name, Gender, Age/DOB, and Location (Kebele, Woreda, Region).
*   **FR-02 (Update):** Demographic and contact info modification under strict access control. Verified profiles require elevated permissions (Regional/Federal Admin) for critical field changes.

### 4.2 Fayda (National ID) Verification
*   **FR-04:** Integration with Fayda API for real-time identity verification. Successful response is required for **Verified** status.

### 4.5 External Registry Data Ingestion
*   **FR-09 (ATI Registry):** Scheduled data pull (~1.2M records) via API using OAuth2/token-based authentication.
*   **FR-10 (Commercial Registry):** Standardized file-based import (CSV/Excel) for systems with no API.

### 4.10 Offline Registration & Synchronization
*   **FR-17:** Support for offline registration via mobile apps in low-connectivity areas, capturing GPS coordinates and temporary local IDs.
*   **FR-18:** Reliable bidirectional sync using data compression and encryption (TLS).

---

## 5. Data Requirements

### 5.1 Farmer Profile Data Model (Key Fields)


| Field | Data Type | Required | Description/Validation |
| :--- | :--- | :--- | :--- |
| `farmer_id` | String | Yes | Unique ID (UUID format) |
| `fayda_id` | String | No | National ID number |
| `full_name_en` | String | Yes | Full name in English |
| `gender` | Enum | Yes | Male, Female, Other |
| `region` | String | Yes | From region master data |
| `registration_date`| Date | Yes | Defaults to current date |
| `status` | Enum | Yes | Draft, Pending, Verified, Active, etc. |

---

## 6. Non-Functional Requirements

### 7.1 Performance
*   Farmer list table loads within **3 seconds** for up to 10,000 records.
*   Bulk import of 10,000 records completes within **5 minutes**.

### 7.2 Security
*   All data encrypted at rest (**AES-256**) and in transit (**TLS 1.2+**).
*   Immutable audit logs for all profile lifecycle events.

### 7.6 Data Retention
*   Audit logs and inactive records retained for a minimum of **7 years**.
*   Active records retained indefinitely.

### 7.7 Compliance
*   Compliance with **Ethiopian data protection regulations** and Ministry of Agriculture data standards.
