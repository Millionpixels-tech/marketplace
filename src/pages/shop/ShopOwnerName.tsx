import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUserData } from "../../utils/optimizedQueries";

type ShopOwnerNameProps = {
    ownerId: string;
    username: string;
    showUsername?: boolean; // Whether to show @username
    compact?: boolean; // Whether to show in compact format (just "by Name")
    disableLink?: boolean; // Whether to disable the link (to prevent nested links)
};

export default function ShopOwnerName({ ownerId, username, showUsername = true, compact = false, disableLink = false }: ShopOwnerNameProps) {
    const [ownerName, setOwnerName] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<string | null>(null);

    useEffect(() => {
        const fetchOwner = async () => {
            if (!ownerId) return;
            const userData = await fetchUserData(ownerId);
            if (userData) {
                setOwnerName(userData.displayName || null);
                setIsVerified(userData.isVerified || null);
            }
        };
        fetchOwner();
    }, [ownerId]);

    if (compact && ownerName) {
        return (
            <span className="text-sm text-gray-500 flex items-center gap-1">
                by
                {disableLink ? (
                    <span className="text-gray-700 flex items-center gap-1">
                        <span>{ownerName}</span>
                        {isVerified === 'COMPLETED' && (
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-500 w-4 h-4">
                                <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </span>
                ) : (
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
                )}
            </span>
        );
    }

    return (
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-1 text-sm text-gray-500 mb-2">
            {showUsername && <span>@{username}</span>}
            {ownerName && (
                <span className="flex items-center gap-1">
                    by
                    {disableLink ? (
                        <span className="flex items-center gap-1">
                            {isVerified === 'COMPLETED' && (
                                <span className="inline-flex items-center justify-center rounded-full bg-blue-500 w-4 h-4">
                                    <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                                        <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                            <span>{ownerName}</span>
                        </span>
                    ) : (
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
                    )}
                </span>
            )}
        </div>
    );
}
