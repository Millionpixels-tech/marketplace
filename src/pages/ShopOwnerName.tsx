import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ShopOwnerName({ ownerId, username }: { ownerId: string, username: string }) {
    const [ownerName, setOwnerName] = useState<string | null>(null);

    useEffect(() => {
        const fetchOwner = async () => {
            if (!ownerId) return;
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", ownerId)));
            if (!userDoc.empty) {
                setOwnerName(userDoc.docs[0].data().displayName || null);
            }
        };
        fetchOwner();
    }, [ownerId]);

    return (
        <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500 mb-2">
            <span>@{username}</span>
            {ownerName && (
                <span>
                    by <Link to={`/profile/${ownerId}`} className="hover:underline">{ownerName}</Link>
                </span>
            )}
        </div>
    );
}
