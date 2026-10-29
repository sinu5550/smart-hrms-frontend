export const QUERY_KEYS = {
  employees: {
    all: ["employees"] as const,
    list: (filters?: Record<string, any>) => ["employees", "list", filters] as const,
    detail: (id: string) => ["employees", "detail", id] as const,
    nextId: ["employees", "next-id"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    list: (filters?: Record<string, any>) => ["attendance", "list", filters] as const,
    myToday: (userId?: string) => ["attendance", "my-today", userId || "current"] as const,
  },
  organization: {
    current: ["organization", "current"] as const,
  },
  departments: {
    all: ["departments"] as const,
    list: () => ["departments", "list"] as const,
  },
  shifts: {
    all: ["shifts"] as const,
    list: () => ["shifts", "list"] as const,
    default: ["shifts", "default"] as const,
  },
  roles: {
    all: ["roles"] as const,
    list: () => ["roles", "list"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
  devices: {
    all: ["devices"] as const,
    list: () => ["devices", "list"] as const,
    logs: () => ["devices", "logs"] as const,
  },
  coreHr: {
    branches: ["coreHr", "branches"] as const,
    holidays: ["coreHr", "holidays"] as const,
    grades: ["coreHr", "grades"] as const,
    gazettes: ["coreHr", "gazettes"] as const,
    idTemplates: ["coreHr", "idTemplates"] as const,
  },
  settings: {
    shift: ["settings", "shift"] as const,
  },
} as const;
