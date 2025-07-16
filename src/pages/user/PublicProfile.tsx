import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import ContactSellerButton from "../../components/UI/ContactSellerButton";
import { SEOHead } from "../../components/SEO/SEOHead";
import { FiUser, FiShoppingBag } from "react-icons/fi";
import { useResponsive } from "../../hooks/useResponsive";

export default function PublicProfile() {
    const { id } = useParams();
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [shops, setShops] = useState<any[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Batch both queries for better performance
                const [userSnap, shopsSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("uid", "==", id))),
                    getDocs(query(collection(db, "shops"), where("owner", "==", id)))
                ]);

                if (!userSnap.empty) {
                    setUserProfile(userSnap.docs[0].data());
                } else {
                    setUserProfile(null);
                }
                
                setShops(shopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching profile data:", error);
                setUserProfile(null);
                setShops([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading)
        return <div className="min-h-screen flex items-center justify-center" style={{ color: '#454955', backgroundColor: '#ffffff' }}>Loading...</div>;
    if (!userProfile)
        return (
            <>
                <SEOHead
                    title="User Not Found - Sina.lk"
                    description="The user profile you're looking for doesn't exist. Browse our marketplace for amazing products from local sellers."
                    noIndex={true}
                />
                <ResponsiveHeader />
                <div className="min-h-screen bg-white flex flex-col">
                    <main className="flex-1 flex items-center justify-center py-12 px-4">
                        <div className="max-w-lg w-full text-center">
                            {/* 404 Illustration */}
                            <div className={`${isMobile ? 'mb-8' : 'mb-12'}`}>
                                <div className="relative">
                                    <h1 className={`${isMobile ? 'text-8xl' : 'text-9xl'} font-bold text-gray-100 select-none`}>
                                        404
                                    </h1>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FiUser className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} text-[#72b01d]`} />
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 mb-4`}>
                                        User Not Found
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed">
                                        The user profile you're looking for doesn't exist or has been removed. 
                                        Explore our marketplace for amazing products and sellers!
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4'} mt-8`}>
                                    <Link
                                        to="/"
                                        className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-[#72b01d] text-white font-semibold rounded-xl hover:bg-[#5a8c17] transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <FiShoppingBag className="w-5 h-5" />
                                        Browse Marketplace
                                    </Link>
                                    
                                    <button
                                        onClick={() => window.history.back()}
                                        className="inline-flex items-center justify-center gap-3 px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                                    >
                                        ← Go Back
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
                <Footer />
            </>
        );

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: '#ffffff' }}>
            <ResponsiveHeader />
            <div className="max-w-2xl mx-auto py-10 px-4">
                <div className="flex flex-col items-center rounded-3xl shadow-lg p-8 mb-8 w-full border" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.3)' }}>
                    <div className="w-28 h-28 rounded-full border-4 shadow flex items-center justify-center overflow-hidden mb-4" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(114, 176, 29, 0.6)' }}>
                        {userProfile.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-4xl font-bold" style={{ color: '#0d0a0b' }}>
                                {userProfile.displayName ? userProfile.displayName[0] : userProfile.email ? userProfile.email[0] : ''}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-black mb-2 text-center flex items-center justify-center gap-2" style={{ color: '#0d0a0b' }}>
                        <span>{userProfile.displayName || userProfile.email}</span>
                        {userProfile.verification?.isVerified === 'COMPLETED' && (
                            <span className="inline-flex items-center justify-center rounded-full w-6 h-6" style={{ backgroundColor: '#72b01d' }}>
                                <svg viewBox="0 0 20 20" fill="#ffffff" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M16.707 6.293a1 1 0 00-1.414 0L9 12.586 6.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </div>
                    <div className="text-lg min-h-[48px] whitespace-pre-line text-center mb-8" style={{ color: '#454955' }}>
                        {userProfile.description || <span style={{ color: '#454955', opacity: 0.7 }}>No description yet.</span>}
                    </div>

                    {/* Contact User Button */}
                    <div className="mb-8">
                        <ContactSellerButton
                            sellerId={userProfile.uid}
                            sellerName={userProfile.displayName || userProfile.email}
                            context={{
                                type: 'user',
                                id: userProfile.uid,
                                title: `${userProfile.displayName || userProfile.email}'s Profile`
                            }}
                            buttonText="Contact User"
                            buttonStyle="primary"
                            size="md"
                        />
                    </div>

                    {/* Shops Section INSIDE card */}
                    <div className="w-full">
                        <h2 className="text-xl font-bold mb-4 text-center" style={{ color: '#0d0a0b' }}>Shops Managed</h2>
                        {shops.length === 0 ? (
                            <div className="text-center" style={{ color: '#454955', opacity: 0.7 }}>No shops found.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {shops.map(shop => (
                                    <Link
                                        key={shop.id}
                                        to={`/shop/${shop.username}`}
                                        className="border rounded-xl p-4 transition flex items-center gap-4"
                                        style={{
                                            borderColor: 'rgba(114, 176, 29, 0.3)',
                                            backgroundColor: '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.6)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.3)';
                                        }}
                                    >
                                        {shop.logo ? (
                                            <img src={shop.logo} alt={shop.name} className="w-14 h-14 rounded-full object-cover border" style={{ borderColor: 'rgba(114, 176, 29, 0.4)' }} />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border" style={{ backgroundColor: '#ffffff', color: '#72b01d', borderColor: 'rgba(114, 176, 29, 0.4)' }}>{shop.name[0]}</div>
                                        )}
                                        <div>
                                            <div className="font-bold text-lg" style={{ color: '#0d0a0b' }}>{shop.name}</div>
                                            <div className="text-xs" style={{ color: '#454955' }}>@{shop.username}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
