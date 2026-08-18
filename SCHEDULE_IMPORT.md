# Schedule Import

How the office's schedule spreadsheet becomes users in the app, and what still
has to happen before this year's **student schedules** can be imported.

> **Status:** staff accounts are created (87 users). The 12-block migration is
> applied to the database and both repos. `students_output.json` holds 240
> students and is ready to import.

---

## Background

Each year the office exports a schedule sheet — `student users to update -
student schedule data.csv` — with one row per student and teachers written as
`"Last, First"`. A Google Sheet used to turn those names into
`first.last@ncsuvt.org` and produce the JSON the app imports. Those formulas are
gone; columns 22–39 of the export are all `#REF!` / `#VALUE!`. The scripts here
replace that sheet.

## The pipeline

| Step | Command | In → Out |
| --- | --- | --- |
| 1. Staff list | `npm run build-staff` | CSV → `staff_input.json`, `teachers.csv` |
| 2. Student schedules | `npm run build-students` | CSV → `students_input.json` |
| 3. Clean students | `npm run process-students` | `students_input.json` → `students_output.json` |

Both JSON files are pasted into forms on `/superUserSettings` (super-admin only):
`staff_input.json` into **Batch Update Staff from JSON**, `students_output.json`
into **Batch add/update students from JSON**. Staff must go first — students
reference teachers by email.

## Fixing names in one place

`emailOverrides.js` holds `teacherEmailCorrections`, keyed generated address →
correct address. It is shared by every script here, so a nickname is fixed once.
It mirrors the `emailCorrections` map in `processStudents.js`, which does the
same job for students.

Any entry that never fires is printed in red as `(not found in data)` when a
script runs, so a stale correction announces itself.

Three teachers currently need one — the office writes their nickname in the
sheet:

| Sheet name | Generated | Actual |
| --- | --- | --- |
| Fortin, Josh | `josh.fortin@` | `joshua.fortin@` |
| Hallinan, Mic | `mic.hallinan@` | `michael.hallinan@` |
| LaRose, Becca | `becca.larose@` | `rebecca.larose@` |

Every other teacher's `first.last` matches the addresses already in
`students_input.json`, which are authoritative.

---

## Reading the spreadsheet

It is a *paginated print* export, not a clean table. Anything consuming it must
handle:

- **Repeated headers.** The `A` / `B` banner and the `TA, Red, Ora, BR, Yel, Gre,
  Blu, Pur, GS` label row recur every ~45 rows (14 rows total).
- **A leftover table** at rows 281+, headed `L` / `H` with labels
  `TA, 16, 27, BR, SR, 38, 49, 510, GS`. It holds 11 W–Z students whose teachers
  contradict the main table. It is scratch — ignore it. That legend describes the
  **old** 10-block layout, not the current schedule.
- **Stray legend text.** Row 95 (`Gonzalez, Adrian`) has literal `L` and `H` in
  its TA cells. Detect the scratch banner by its *blank student-name cell*, or
  this row gets mistaken for it and truncates the file.
- **19 nameless rows** carrying full schedule data but no student name, three at a
  time before each page break. They are skipped.
- **Quoted commas.** Every teacher cell is `"Last, First"`. `parseCSV` in
  `lib/csvParentImportUtils.ts` splits on bare commas and cannot be used.

## How the columns map to the bell schedule

NCUJHS runs six classes on a ROYGBP rotation (started Red A Day, 8/27/2026):

| CSV column | Bell schedule row | What it is |
| --- | --- | --- |
| `TA` | TA / M.M. 8:20–8:40 | Advisory. Identical in A and B for all 274 students. |
| `Red Ora Yel Gre Blu Pur` | Blocks 1–6 | The six real classes. |
| `BR` | Break 10:36–10:48 | Duplicate of the TA teacher (25/25); only 44 rows filled. |
| `GS` | TA / G.S. / S.R. 3:03–3:28 | Duplicate of the TA teacher (245/245). |

`BR` and `GS` carry no information beyond `ta` and are dropped.

---

## The A/B rotation, and why there are 12 blocks

Six colour classes (ROYGBP) rotate through six time slots on an A/B rotation.
Every student has **exactly 2 of their 6 colours** where the A-rotation teacher
differs from the B-rotation teacher — 237 of 246 students; the other 9 have
incomplete rows. Which two varies per student, and all 15 colour pairs occur. A
distinct teacher pool (Auclair, Brown, Gunn, Yoresh, LaRose) appears *only* in
split slots — alternating specials.

A and B run all year rather than by semester, so both teachers are live and all
12 slots are needed:

```
block1..block6   = Red, Orange, Yellow, Green, Blue, Purple   (A columns)
block7..block12  = Red, Orange, Yellow, Green, Blue, Purple   (B columns)
ta               = TA
```

**Block numbers are keyed on colour, not on per-student slot order.**
`components/Assignments/AssignmentViewCardsStudent.tsx` reads a student's
`block{N}Teacher` and then that teacher's `block{N}Assignment` — the same `N` on
both sides. A block number therefore has to mean the same thing to every student
and every teacher, and colour is the only thing they all agree on.

Where 12 is declared:

| Place | What |
| --- | --- |
| `schemas/blocks.ts` (backend) | `NUMBER_OF_BLOCKS` — used by the User schema hook and `updateStudentSchedules` |
| `.env` → `config.ts` | `NEXT_PUBLIC_NUMBER_OF_BLOCKS`, consumed by five UI files |
| `processStudents.js` | local `NUMBER_OF_BLOCKS` constant |
| `buildStudentsInput.js` | derived from the six `COLOURS` |

Raising it again means adding `block{N}Teacher` / `Students` / `Assignment` /
`ClassName` / `AssignmentLastUpdated` to `schemas/User.ts`, plus the matching
GraphQL selection sets in the front end (19 files reference them individually).

## Known quirks

- **18 rows have schedule data but no student name.** A paste artifact in how the
  sheet is assembled, three at a time before each page break. Skipped. Any teacher
  appearing *only* on those rows ends up referenced by no student.
- **Lynn Crew** shows 8 class slots, all on nameless rows. She is Assistant
  Principal and does not teach; she is listed in `nonTeachingStaff` in
  `emailOverrides.js` so she is not emitted as a teacher.
- **`addStaff` is create-only.** Its update branch is commented out, so
  re-importing an existing user is a no-op — flags cannot be corrected by
  re-running it. It also ignores `name` (deriving a lowercase one from the email)
  and reads *lowercase* keys `hasta` / `hasclasses` / `isteacher`. Accounts were
  created with `createUser` directly instead, which avoids all three problems.
- **`updateStudentSchedules` does update existing students**, unlike `addStaff`.
  It now warns about any teacher email matching no user — the failure that
  silently dropped 93 assignments when last year's file used `jess.tetreault@`
  instead of `jessica.tetreault@`.
- Roster turnover is ~55% a year (113 of 251 carried over), which is normal for a
  two-grade school. Departed students get pruned from `emailCorrections` in
  `processStudents.js`; a correction that stops firing is reported in red.

## Verifying a staff import

1. `npm run build-staff`. Expect **34 teachers**, 3 corrections applied, 0 unused,
   8 flagged new.
2. Check the 8 new addresses in `teachers.csv` against the real staff directory.
   Wrong ones get an entry in `emailOverrides.js`; then re-run.
3. Paste a **one-element** array into *Batch Update Staff from JSON* first.
   Expect `<email> - New User`. The result panel may be blank on the very first
   submit — `NewStaff.tsx` reads the previous render's data — so reopen the modal.
4. Then paste all 34. The 26 returning teachers should read `Existing User`, the
   8 new ones `New User`. A returning teacher showing as `New User` means their
   address is wrong.
5. Spot-check a new teacher: they should appear in the teacher dropdown in
   `components/users/CreateNewStudent.tsx`, which filters on `isTeacher` plus
   `hasClasses` or `hasTA`.

### Two things to know about the staff payload

- **The input shape is inferred.** `addStaff(staffData: JSON!)` is resolved in the
  backend repo; nothing here documents its input. Only its *return* shape is
  known — `[{ email, existed }]`. The fields written follow `User` in the schema.
  This is why you send one record first.
- **`name` may rename existing staff.** The CSV carries the office's nickname, so
  the payload says `Mic Hallinan` where the app may hold `Michael Hallinan`, and
  `Dawn E Hall` keeps the middle initial. If `addStaff` writes `name` on existing
  users, returning teachers get renamed. Confirm with the one-record test, and
  drop `name` for existing users if it does.

### Flags

Every teacher is written with `isStaff`, `isTeacher`, `hasTA` and `hasClasses` all
`true`. The CSV disagrees on TA duty for 8 of them — Auclair, Brown, Crew,
Garfield, Lanou, McFarlane Katrina, Moulton, Pearson never appear in a TA column.
`teachers.csv` records what was actually observed (`hasTA`, `hasClasses`) so those
can be corrected by hand if any of them genuinely has no advisory.
