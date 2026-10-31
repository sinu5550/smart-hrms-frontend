export interface PermissionDefinition {
  id: string;
  name: string;
  category: "Attendance" | "Employees" | "Organization & Settings" | "Biometric & Hardware" | "Reports & Payroll";
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Attendance Permissions
  {
    id: "attendance.view",
    name: "View Attendance Logs",
    category: "Attendance",
    description: "Can view daily punches, check-in, check-out and active breaks for all staff.",
  },
  {
    id: "attendance.manage",
    name: "Manage Attendance & Shift Adjustments",
    category: "Attendance",
    description: "Can override clock-ins, approve late excuses, and adjust shift hours.",
  },
  {
    id: "attendance.exempt",
    name: "Manage Attendance Exemptions",
    category: "Attendance",
    description: "Can exempt specific employees, HR officers, or managers from daily attendance tracking requirements.",
  },

  // Employee Management
  {
    id: "employees.view",
    name: "View Employee Directory",
    category: "Employees",
    description: "Can browse employee profiles, contact information, and departments.",
  },
  {
    id: "employees.create",
    name: "Create & Enlist Employees",
    category: "Employees",
    description: "Can onboard new staff and issue initial login credentials.",
  },
  {
    id: "employees.registration",
    name: "Employee Self-Registration & Forms",
    category: "Employees",
    description: "Can configure public registration forms, copy form links, and review submitted registrations.",
  },
  {
    id: "employees.edit",
    name: "Edit Personnel Profiles",
    category: "Employees",
    description: "Can edit personal details, phone numbers, addresses, and emergency contacts.",
  },
  {
    id: "employees.status",
    name: "Change Employment Status",
    category: "Employees",
    description: "Can promote, put on probation, suspend, terminate, or mark resigned.",
  },
  {
    id: "employees.permissions",
    name: "Manage Permissions & Access Control",
    category: "Employees",
    description: "Can grant or revoke specific module permissions for individual employees.",
  },
  {
    id: "employees.roles",
    name: "Manage Roles & Assign Roles",
    category: "Employees",
    description: "Can assign system roles (Admin, HR, Employee) and manage user designations.",
  },

  // Organization & Settings
  {
    id: "organization.settings",
    name: "Manage Organization Profile & Prefix",
    category: "Organization & Settings",
    description: "Can change company name, upload workspace logo, and configure employee ID prefix.",
  },
  {
    id: "departments.manage",
    name: "Manage Departments & Units",
    category: "Organization & Settings",
    description: "Can create, rename, and delete company departments.",
  },
  {
    id: "shift.settings",
    name: "Manage Shift Schedules & Grace Period",
    category: "Organization & Settings",
    description: "Can create multi-shifts (day, evening, part-time), edit timings, and set defaults.",
  },

  // Biometric & Hardware
  {
    id: "devices.view",
    name: "View Biometric Hardware & Live Feed",
    category: "Biometric & Hardware",
    description: "Can view registered Hikvision/ZKTeco machines and live punch ingestion feed.",
  },
  {
    id: "devices.manage",
    name: "Manage Biometric Machines",
    category: "Biometric & Hardware",
    description: "Can link, configure, and delete biometric facial and fingerprint terminals.",
  },
  {
    id: "devices.wifi",
    name: "Manage Office Wi-Fi Geofence IPs",
    category: "Biometric & Hardware",
    description: "Can whitelist or delete public router IPs for location-based attendance.",
  },
  {
    id: "devices.qr",
    name: "Generate & Print Office QR Codes",
    category: "Biometric & Hardware",
    description: "Can generate, customize, download, and print cryptographic attendance QR signs.",
  },

  // Reports & Payroll
  {
    id: "payroll.view",
    name: "View Salary & Payroll Summaries",
    category: "Reports & Payroll",
    description: "Can view payroll runs, salary slips, and attendance hour tallies.",
  },
  {
    id: "reports.export",
    name: "Export Logs & Audit Reports",
    category: "Reports & Payroll",
    description: "Can export employee roster, attendance spreadsheets, and company records.",
  },
];
