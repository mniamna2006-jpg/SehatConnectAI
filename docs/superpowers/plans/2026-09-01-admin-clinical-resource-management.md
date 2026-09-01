# Admin Clinical Resource Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add source-backed admin management for departments, doctors, doctor schedules, and time-slot generation.

**Architecture:** Keep API contracts, Zod schemas, types, and changed-value mappers in each feature model; TanStack Query, React Hook Form, mutation state, confirmation, and navigation in ViewModels; and rendering only in Views. Department and doctor lists use the authenticated hospital ID. A doctor-specific schedule route owns both schedule creation and slot generation for that real doctor.

**Tech Stack:** Expo Router, React Native 0.86, React 19, TanStack Query 5, React Hook Form 7, Zod 4, RNTL 14, Jest 29, TypeScript 6.

**Spec:** User-approved Prompt 3 in this task.

## Global Constraints

- Backend source is authoritative and remains read-only.
- Do not modify Patient UI.
- No Doctor Availability toggle because no route exists.
- Views contain no API, Query, form, or navigation logic.
- Forms use React Hook Form and Zod with backend-supported fields only.
- English, Urdu, and Roman Urdu keys remain identical; Urdu stays RTL through the existing root provider.
- Run only focused tests, `npx tsc --noEmit`, and `git diff --check`.
- Produce one final commit: `feat(admin): add clinical resource management`.

---

### Task 1: Department behavior

**Files:**
- Modify: `frontend/src/features/admin/departments/model/types.ts`
- Modify: `frontend/src/features/admin/departments/model/schemas.ts`
- Create: `frontend/src/features/admin/departments/model/mappers.ts`
- Modify: `frontend/src/features/admin/departments/viewmodels/useDepartmentsViewModel.ts`
- Modify: `frontend/src/features/admin/departments/views/DepartmentsView.tsx`
- Modify: `frontend/src/features/admin/departments/viewmodels/__tests__/useDepartmentsViewModel.test.tsx`
- Create: `frontend/src/features/admin/departments/model/__tests__/mappers.test.ts`

**Interfaces:**
- Consumes: `GET /api/departments/hospital/:hospitalId`, `POST /api/departments`, `PATCH /api/departments/:department_id`, `PATCH /api/departments/:department_id/deactivate`.
- Produces: `buildDepartmentUpdate(department, values): DepartmentUpdateInput`, a ViewModel with loading/empty/error/success/form/deactivation state, and an accessible compact list/form View.

- [ ] Write failing tests proving create trims/normalizes the supported fields, edit sends only changed fields, no-op edit does not call PATCH, confirmation gates deactivation, and backend errors remain visible.
- [ ] Run only the department tests and confirm failures are caused by missing behavior.
- [ ] Implement the minimal model, ViewModel, and View behavior to pass those tests.
- [ ] Re-run the department tests and refactor only while green.

### Task 2: Doctor behavior

**Files:**
- Create: `frontend/src/features/admin/doctors/model/types.ts`
- Create: `frontend/src/features/admin/doctors/model/api.ts`
- Create: `frontend/src/features/admin/doctors/model/schemas.ts`
- Create: `frontend/src/features/admin/doctors/model/mappers.ts`
- Create: `frontend/src/features/admin/doctors/viewmodels/useDoctorsViewModel.ts`
- Create: `frontend/src/features/admin/doctors/views/DoctorsView.tsx`
- Create: `frontend/src/features/admin/doctors/model/__tests__/mappers.test.ts`
- Create: `frontend/src/features/admin/doctors/viewmodels/__tests__/useDoctorsViewModel.test.tsx`
- Create: `frontend/app/(hospital)/admin/doctors.tsx`

**Interfaces:**
- Consumes: `GET /api/doctors/hospital/:hospitalId`, `POST /api/doctors`, `PATCH /api/doctors/:doctor_id`, `PATCH /api/doctors/:doctor_id/deactivate`, plus the authenticated hospital's department query.
- Produces: `DoctorInput`, `DoctorUpdateInput`, `buildDoctorUpdate(doctor, values)`, management state/actions, and navigation to `/admin/doctors/:doctorId/schedules`.

- [ ] Write failing tests proving create always uses the authenticated hospital ID and a selected real department ID, edit sends only supported changed fields, confirmation gates deactivate, schedule navigation uses the selected real doctor ID, validation rejects required/negative inputs, and backend errors remain visible.
- [ ] Run only the doctor tests and confirm expected RED failures.
- [ ] Implement the minimal doctor model, ViewModel, View, and Expo route.
- [ ] Re-run the doctor tests and refactor only while green.

### Task 3: Schedule and slot generation behavior

**Files:**
- Create: `frontend/src/features/admin/doctorSchedules/model/types.ts`
- Create: `frontend/src/features/admin/doctorSchedules/model/api.ts`
- Create: `frontend/src/features/admin/doctorSchedules/model/schemas.ts`
- Create: `frontend/src/features/admin/doctorSchedules/viewmodels/useDoctorSchedulesViewModel.ts`
- Create: `frontend/src/features/admin/doctorSchedules/views/DoctorSchedulesView.tsx`
- Create: `frontend/src/features/admin/doctorSchedules/model/__tests__/schemas.test.ts`
- Create: `frontend/src/features/admin/doctorSchedules/viewmodels/__tests__/useDoctorSchedulesViewModel.test.tsx`
- Create: `frontend/app/(hospital)/admin/doctors/[doctorId]/schedules.tsx`

**Interfaces:**
- Consumes: `GET /api/schedules/doctor/:doctorId`, `POST /api/schedules`, `POST /api/time-slots/generate`.
- Produces: `DoctorSchedule`, `ScheduleInput`, `TimeSlotGenerationInput`, strict Zod validation for the real enum/time/duration/date shapes, and a ViewModel whose pending mutation disables duplicate generation.

- [ ] Write failing tests proving schedule loading, exact create payload, invalid time/duration rejection, exact generation payload, duplicate in-flight submission prevention, returned-slot display state, and backend error state.
- [ ] Run only schedule tests and confirm expected RED failures.
- [ ] Implement the minimal model, ViewModel, View, and doctor-specific Expo route.
- [ ] Re-run schedule tests and refactor only while green.

### Task 4: Navigation and localization

**Files:**
- Modify: `frontend/src/features/admin/dashboard/views/AdminDashboardView.tsx`
- Modify: `frontend/src/features/admin/dashboard/views/__tests__/AdminDashboardView.test.tsx`
- Create: `frontend/app/(hospital)/admin/departments.tsx`
- Modify: `frontend/src/i18n/en.json`
- Modify: `frontend/src/i18n/ur.json`
- Modify: `frontend/src/i18n/ur-roman.json`
- Modify: `frontend/src/i18n/__tests__/adminLocales.test.ts`

**Interfaces:**
- Consumes: implemented admin route paths.
- Produces: dashboard entry points for only implemented admin screens and locale key parity across all three languages.

- [ ] Update the existing dashboard test first so Departments and Doctors are the only newly allowed links; run it and confirm RED.
- [ ] Add route entry points and all translated operational copy while preserving the existing LocaleProvider RTL behavior.
- [ ] Add parity expectations for the management namespaces, run the focused dashboard/localization tests, and confirm GREEN.

### Task 5: Verification and single commit

**Files:** all files listed above.

**Interfaces:**
- Consumes: the exact focused test paths created or modified by Tasks 1–4.
- Produces: a verified clean commit.

- [ ] Invoke `superpowers:verification-before-completion` and read its current instructions.
- [ ] Run the exact focused Jest file list once and record suites/tests.
- [ ] Run `npx tsc --noEmit` from `frontend` and require exit 0.
- [ ] Run `git diff --check` and `git diff --cached --check` and require exit 0.
- [ ] Confirm branch and scoped diff, stage only task files, and create `feat(admin): add clinical resource management`.
- [ ] Confirm the final commit subject and clean worktree before reporting.
