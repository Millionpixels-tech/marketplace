import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "../utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextProps {
    user: User | null | undefined;
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({ user: undefined, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    // Function to create user document if it doesn't exist
    const ensureUserDocument = async (user: User) => {
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                // Check if this is a Google user
                const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
                
                // Create user document with data from Google if available
                const userData = {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    createdAt: new Date(),
                    isGoogleUser,
                    emailVerified: user.emailVerified,
                    description: '',
                    bankAccounts: []
                };
                
                await setDoc(userDocRef, userData);
                console.log('User document created for:', user.email);
            }
        } catch (error) {
            console.error('Error creating user document:', error);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Check if email is verified
                if (user.emailVerified || user.providerData.some(provider => provider.providerId === 'google.com')) {
                    // Ensure user document exists
                    await ensureUserDocument(user);
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
