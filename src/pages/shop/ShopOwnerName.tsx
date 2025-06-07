import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

type ShopOwnerNameProps = {
    ownerId: string;
    username: string;
    showUsername?: boolean; // Whether to show @username
    compact?: boolean; // Whether to show in compact format (just "by Name")
};

export default function ShopOwnerName({ ownerId, username, showUsername = true, compact = false }: ShopOwnerNameProps) {
    const [ownerName, setOwnerName] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<string | null>(null);

    useEffect(() => {
        const fetchOwner = async () => {
            if (!ownerId) return;
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", ownerId)));
            if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                setOwnerName(userData.displayName || null);
                setIsVerified(userData.verification?.isVerified || null);
            }
        };
        fetchOwner();
    }, [ownerId]);

    if (compact && ownerName) {
        return (
            <span className="text-sm text-gray-500 flex items-center gap-1">
                by
                <Link to={`/profile/${ownerId}`} className="hover:underline text-gray-700 flex items-center gap-1">
                    <span>{ownerName}</span>
                    {isVerified === 'COMPLETED' && (
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-500 w-4 h-4">
                            <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                                <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        </span>
                    )}
                </Link>
            </span>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500 mb-2">
            {showUsername && <span>@{username}</span>}
            {ownerName && (
                <span className="flex items-center gap-1">
                    by
                    <Link to={`/profile/${ownerId}`} className="hover:underline flex items-center gap-1">
                        {isVerified === 'COMPLETED' && (
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-500 w-4 h-4">
                                <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                        <span>{ownerName}</span>
                    </Link>
                </span>
            )}
        </div>
    );
}
