import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useParams } from "react-router-dom";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../utils/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import Header from "../components/UI/Header";

export default function Profile() {
    const { user } = useAuth();
    const { id } = useParams();
    const [shops, setShops] = useState<any[]>([]);
    const [desc, setDesc] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [uploadingPic, setUploadingPic] = useState(false);
    const [profileUid, setProfileUid] = useState<string | null>(null);
    const [profileEmail, setProfileEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Determine which profile to show: current user or by id param
        const fetchProfile = async () => {
            setLoading(true);
            let uid = user?.uid;
            if (id) {
                // Find user by id param
                uid = id;
            }
            if (!uid) {
                setLoading(false);
                return;
            }
            setProfileUid(uid);
            // Fetch user record
            const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
            if (!userDoc.empty) {
                const data = userDoc.docs[0].data();
                setDisplayName(data.displayName || "");
                setPhotoURL(data.photoURL || "");
                setDesc(data.description || "");
                setProfileEmail(data.email || null);
            } else if (user && uid === user.uid) {
                // Fallback to auth user info if viewing own profile and no db record
                setDisplayName(user.displayName || "");
                setPhotoURL(user.photoURL || "");
                setDesc("");
                setProfileEmail(user.email || null);
            }
            // Fetch shops for this user
            const q = query(collection(db, "shops"), where("owner", "==", uid));
            const docsSnap = await getDocs(q);
            setShops(docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchProfile();
    }, [user, id]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        // Update user displayName and photoURL in Firebase Auth
        const auth = getAuth();
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: displayName,
                photoURL: photoURL,
            });
        }
        // Ensure user record exists and update description in users collection
        const userDocSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
        if (!userDocSnap.empty) {
            await updateDoc(doc(db, "users", userDocSnap.docs[0].id), { description: desc, displayName, photoURL });
        } else {
            // Create user record if not exists
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName,
                photoURL,
                description: desc,
            });
        }
        setEditing(false);
        setSaving(false);
    };

    // Handle profile picture upload
    const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;
        setUploadingPic(true);
        const file = e.target.files[0];
        const storage = getStorage();
        const fileRef = storageRef(storage, `profile_pics/${user.uid}_${Date.now()}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setPhotoURL(url);
        setUploadingPic(false);
    };

    // Only allow editing if viewing own profile
    const isOwner = user && profileUid === user.uid;

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    if (!profileUid) return <div className="min-h-screen flex items-center justify-center text-gray-400">User not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <div className="max-w-2xl mx-auto mt-10 bg-white rounded-3xl shadow-lg p-6 md:p-12 flex flex-col items-center">
                {/* Profile Picture */}
                <div className="w-28 h-28 rounded-full bg-gray-200 border-4 border-white shadow flex items-center justify-center overflow-hidden mb-4 relative group">
                    {photoURL ? (
                        <img src={photoURL} alt="Profile" className="object-cover w-full h-full" />
                    ) : (
                        <span className="text-4xl text-gray-500 font-bold">
                            {displayName ? displayName[0] : user?.email ? user.email[0] : ''}
                        </span>
                    )}
                    {isOwner && editing && (
                        <>
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white font-semibold">Change</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} disabled={uploadingPic} />
                            </label>
                            {uploadingPic && <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-black font-bold">Uploading...</div>}
                        </>
                    )}
                </div>
                {/* Name */}
                <div className="text-2xl font-black mb-2 text-center">
                    {isOwner && editing ? (
                        <input
                            className="text-2xl font-black text-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-1 w-full max-w-xs mb-2"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            maxLength={40}
                        />
                    ) : (
                        displayName || profileEmail
                    )}
                </div>
                {/* Description */}
                <div className="w-full mb-6 flex flex-col items-center">
                    {isOwner && editing ? (
                        <textarea
                            className="w-full max-w-md bg-gray-50 border border-gray-300 rounded-xl p-3 text-lg text-center"
                            rows={3}
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="Write something about yourself..."
                            maxLength={300}
                        />
                    ) : (
                        <div className="text-gray-700 text-lg min-h-[48px] whitespace-pre-line text-center">{desc || <span className="text-gray-400">No description yet.</span>}</div>
                    )}
                </div>
                {/* Edit/Save Buttons */}
                {isOwner && (
                    <div className="mb-8">
                        {editing ? (
                            <button
                                className="px-6 py-2 bg-black text-white rounded-full font-semibold mr-2 disabled:opacity-50"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        ) : (
                            <button
                                className="px-6 py-2 bg-gray-200 text-black rounded-full font-semibold"
                                onClick={() => setEditing(true)}
                            >
                                Edit Info
                            </button>
                        )}
                    </div>
                )}
                {/* User's Shops */}
                <div className="w-full">
                    <h2 className="text-xl font-bold mb-4">{isOwner ? "Your Shops" : "Shops"}</h2>
                    {shops.length === 0 ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-gray-400">You have not created any shops yet.</div>
                            {isOwner && (
                                <Link
                                    to="/create-shop"
                                    className="px-6 py-3 bg-black text-white rounded-full font-bold uppercase tracking-wide shadow hover:bg-black/90 transition"
                                >
                                    Create Your Shop
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {shops.map(shop => (
                                <Link
                                    to={`/shop/${shop.username}`}
                                    key={shop.id}
                                    className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    {shop.logo ? (
                                        <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 font-bold">{shop.name[0]}</div>
                                    )}
                                    <div>
                                        <div className="font-bold text-lg">{shop.name}</div>
                                        <div className="text-xs text-gray-500">@{shop.username}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
