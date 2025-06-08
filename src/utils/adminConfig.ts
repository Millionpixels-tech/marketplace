// Admin configuration constants
export const ADMIN_CONFIG = {
    PASSWORD: "7788",
    ROUTES: {
        PAYMENTS: "/admin/payments"
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
