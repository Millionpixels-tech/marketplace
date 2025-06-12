import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../utils/firebase";

interface AuthContextProps {
    user: User | null | undefined;
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({ user: undefined, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if email is verified
                if (user.emailVerified || user.providerData.some(provider => provider.providerId === 'google.com')) {
                    // User is verified (either email verified or signed in with Google)
                    setUser(user);
                } else {
                    // User exists but email is not verified
                    setUser(null);
                }
            } else {
                // No user signed in
                setUser(null);
            }
        });
        return () => unsub();
    }, []);

    const loading = user === undefined;

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
