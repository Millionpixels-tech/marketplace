// Admin configuration constants
// Note: Admin password is loaded from environment variables (VITE_ADMIN_PASSWORD)
// Falls back to "7788" for development if env var is not set
export const ADMIN_CONFIG = {
    PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || "7788", // Fallback for development
    ROUTES: {
        PAYMENTS: "/admin/payments",
        MANAGEMENT: "/admin/management"
    }
} as const;

// Admin roles and permissions (can be extended in the future)
export const AdminRole = {
    SUPER_ADMIN: "super_admin",
    PAYMENT_ADMIN: "payment_admin"
} as const;

// Admin permission checks
export const hasAdminAccess = (password: string): boolean => {
    return password === ADMIN_CONFIG.PASSWORD;
};
