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
            setUser(user);
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
