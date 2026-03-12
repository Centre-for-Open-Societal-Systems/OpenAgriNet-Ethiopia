# Software Requirement Document (SRS): OpenAgriNet (OAN) Platform
## Crop Registry Module Specification

---

## 1. Introduction
The **Crop Registry Module** serves as the national crop production, traceability, and plant health aggregation layer within **OpenAgriNet (OAN)**. It centralizes data from various regional and research systems to provide a unified view of Ethiopia's agricultural output.

---

## 2. Functional Requirement Categories
The module covers the following primary areas:
1.  Crop Production Profile Management
2.  Plot-Level Crop Registration
3.  External System Data Pull & Integration
4.  Certification & Traceability Management
5.  Research & Soil Data Integration
6.  Production Reporting & Aggregation
7.  Duplication & Plot Matching
8.  Bulk Data Import (Non-API Systems)
9.  Offline Reporting & Synchronization
10. Role-Based Access Control
11. Audit & Traceability

---

## 3. Detailed Functional Requirements

### 3.1 Crop Production Profile Management
*   **CR-01 (Create):** Allows creation of production records per season and plot. Records link Farmer ID, Plot ID, Crop Type, and Season/Year.
*   **CR-02 (Update):** Supports authorized updates to yield, input usage, and harvest status. Seasonal data is locked after closure.

### 3.2 Plot-Level Crop Registration
*   **CR-03 (Plot-to-Crop Linking):** Links crop records to verified land parcels. Area planted cannot exceed the verified parcel size.

### 3.3 External System Data Pull & Integration
*   **CR-04 (ePhyto):** Pulls digital plant health certification data via API.
*   **CR-05 (ECTMS):** Synchronizes traceability data for coffee and tea exports.
*   **CR-06 (EIAR):** Pulls research-grade soil, seed, and crop data from multiple research registries (BMS, DST, LSC, EGS).
*   **CR-07 (CPR):** Ingests legacy crop production data via standardized CSV templates.
*   **CR-08 (Excel Ingestion):** Supports structured Excel-based progress reports including area planned vs. harvested and yield estimates.

### 3.4 Certification & Traceability
*   **CR-09 (Certification Linking):** Tracks certificate IDs, validity periods, and export traceability chains.

---

## 4. Operational & System Requirements

### 4.7 Duplication & Plot Matching
*   **CR-12:** Enforces uniqueness for Plot + Crop + Season to prevent double reporting. Manual overrides require justification and Federal Admin authority.

### 4.9 Offline Reporting & Sync
*   **CR-14:** Field officers can capture planting and harvest data without connectivity. System manages a sync queue and handles conflicts during reconnection.

---

## 5. Role-Based Access Control (CR-15)
The system enforces specific permissions for the following roles:
*   **Federal Admin:** Global oversight and override authority.
*   **Regional Admin:** File submissions and regional data management.
*   **Woreda Officer:** Manual data entry and plot registration.
*   **Research Officer:** Access to research and soil data.
*   **Auditor:** Read-only access to immutable audit logs.

---

## 6. Audit & Traceability (CR-16)
*   **Requirement:** Immutable logging of all production, ingestion, and certification events.
*   **Storage:** Before-and-after snapshots of all modified records are maintained for full transparency.
