# CampusMate Access & Portals Guide

Each user role has a dedicated login portal with server-side role verification:

| Role | Portal Route | Email | Password | Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| Student | `/login/student` | `amira.benali@isetb.rnu.tn` | `Student@2026!` | `/student/dashboard` |
| Teacher (Professor) | `/login/teacher` | `karim.trabelsi@isetb.rnu.tn` | `Teacher@2026!` | `/teacher/dashboard` |
| University Administration | `/login/administration` | `administration@isetb.rnu.tn` | `AdminIset@2026!` | `/administration/dashboard` |
| Organization (Partner) | `/login/organization` | `rh@techbeja.tn` | `OrgPartner@2026!` | `/organization/dashboard` |
| Super Admin | `/login/admin` | `superadmin@campusmate.tn` | `SuperAdmin@2026!` | `/admin/dashboard` |

- Visiting `/login` shows the portal directory linking to each role's login page.
- Attempting to sign in through the wrong role's portal is rejected server-side with `403`.
