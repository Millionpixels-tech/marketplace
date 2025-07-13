import React, { useState, useRef, useEffect } from "react";
import { db, storage } from "../../utils/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { doc, getDoc, updateDoc, getDocs, query, where, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiPlus, FiPackage, FiDollarSign, FiInfo, FiDownload } from "react-icons/fi";
import { categories, categoryIcons, subCategoryIcons, ItemType } from "../../utils/categories";
import { AddBankAccountModal, Button, Input } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { processImageForUpload, generateImageAltText } from "../../utils/imageUtils";
import { SEOHead } from "../../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../../utils/seo";
import { formatFileSize, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "../../utils/digitalProducts";
import { useSellerVerification } from "../../hooks/useSellerVerification";

// Simple variation interface
interface SimpleVariation {
    id: string;
    name: string; // e.g., "Small Blue", "Large Black"
    priceChange: number; // How much to add to base price (always >= 0)
    quantity: number; // Stock quantity for this variation
}

const steps = [
    { label: "Shop" },
    { label: "Item Type" },
    { label: "Category" },
    { label: "Subcategory" },
    { label: "Details" },
    { label: "Variations" },
    { label: "Images" },
    { label: "Delivery" },
];

export default function EditListing() {
    const { user, loading: userLoading } = useAuth();
    const { listingId } = useParams<{ listingId: string }>();
    const [step, setStep] = useState(1);
    const [shops, setShops] = useState<any[]>([]);
    const [shopId, setShopId] = useState("");
    const [itemType, setItemType] = useState<ItemType>(ItemType.PHYSICAL);
    const [cat, setCat] = useState("");
    const [sub, setSub] = useState("");
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [sellerNotes, setSellerNotes] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [deliveryType, setDeliveryType] = useState<"free" | "paid" | "">("");
    const [deliveryPerItem, setDeliveryPerItem] = useState("");
    const [deliveryAdditional, setDeliveryAdditional] = useState("");
    const [cashOnDelivery, setCashOnDelivery] = useState(false);
    const [bankTransfer, setBankTransfer] = useState(false);
    const [nonRefundable, setNonRefundable] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [showBankAccountModal, setShowBankAccountModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Simple variations state
    const [hasVariations, setHasVariations] = useState(false);
    const [variations, setVariations] = useState<SimpleVariation[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVariation, setEditingVariation] = useState<SimpleVariation | null>(null);
    
    // Digital product state
    const [digitalFile, setDigitalFile] = useState<File | null>(null);
    const [digitalLink, setDigitalLink] = useState("");
    const [existingDigitalFileUrl, setExistingDigitalFileUrl] = useState("");
    const [existingDigitalFileName, setExistingDigitalFileName] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const digitalFileInputRef = useRef<HTMLInputElement | null>(null);
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    // Use seller verification hook
    const { bankTransferEligibility, canUseBankTransfer } = useSellerVerification();

    // Helper function to change step and scroll to top
    const goToStep = (newStep: number) => {
        setStep(newStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Simple variation management functions
    const addVariation = () => {
        const newVariation: SimpleVariation = {
            id: Date.now().toString(),
            name: "",
            priceChange: 0,
            quantity: 0
        };
        setVariations(prev => [...prev, newVariation]);
        setShowAddForm(true); // Show form when adding new variation
    };

    const removeVariation = (variationId: string) => {
        setVariations(prev => prev.filter(v => v.id !== variationId));
    };

    const updateVariation = (variationId: string, field: keyof SimpleVariation, value: any) => {
        setVariations(prev => prev.map(v => 
            v.id === variationId ? { ...v, [field]: value } : v
        ));
    };

    const saveVariation = (variationData: SimpleVariation) => {
        if (variationData.name.trim()) {
            updateVariation(variationData.id, 'name', variationData.name.trim());
            updateVariation(variationData.id, 'priceChange', variationData.priceChange);
            updateVariation(variationData.id, 'quantity', variationData.quantity);
            setShowAddForm(false);
            setEditingVariation(null);
        }
    };

    const cancelVariation = () => {
        if (editingVariation) {
            // If editing, just close the form
            setShowAddForm(false);
            setEditingVariation(null);
        } else {
            // If adding new, remove the empty variation
            setVariations(prev => prev.slice(0, -1));
            setShowAddForm(false);
        }
    };

    const startEditVariation = (variation: SimpleVariation) => {
        setEditingVariation(variation);
        setShowAddForm(true);
    };

    // Calculate total stock from variations
    const getTotalVariationStock = () => {
        return variations.reduce((total, variation) => total + (variation.quantity || 0), 0);
    };

    // Variation Form Component
    const VariationForm = ({ 
        variation, 
        basePrice, 
        onSave, 
        onCancel 
    }: { 
        variation: SimpleVariation; 
        basePrice: number; 
        onSave: (variation: SimpleVariation) => void; 
        onCancel: () => void; 
    }) => {
        const [formData, setFormData] = useState<SimpleVariation>(variation);

        return (
            <div className="space-y-4">
                <div className="space-y-4">
                    {/* Variation Name - Full Width */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variation Name *
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Small Blue, Large Black, Medium Red"
                            className="w-full text-base"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Give a clear name that describes this specific variation
                        </p>
                    </div>

                    {/* Price Change and Quantity - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Price Change */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Price (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-gray-500 text-sm">Rs.</span>
                                </div>
                                <Input
                                    type="number"
                                    value={formData.priceChange}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        // Ensure price adjustment is never negative
                                        const priceChange = Math.max(0, value);
                                        setFormData({ ...formData, priceChange });
                                    }}
                                    placeholder="0.00"
                                    className="pl-10"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Amount to add to base price
                            </p>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Quantity *
                            </label>
                            <Input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full"
                                min="0"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Available units for this variation
                            </p>
                        </div>
                    </div>

                    {/* Price Preview - Full Width */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-green-800">Final Price for this variation</div>
                                <div className="text-2xl font-bold text-green-900">
                                    Rs.{(basePrice + formData.priceChange).toFixed(2)}
                                </div>
                                {formData.priceChange > 0 && (
                                    <div className="text-sm text-green-600">
                                        Base Rs.{basePrice.toFixed(2)} + Additional Rs.{formData.priceChange.toFixed(2)}
                                    </div>
                                )}
                            </div>
                            {formData.quantity > 0 && (
                                <div className="text-right">
                                    <div className="text-sm font-medium text-green-800">Stock</div>
                                    <div className="text-lg font-bold text-green-900">{formData.quantity} units</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!formData.name.trim() || formData.quantity < 0}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (formData.name.trim()) {
                                onSave(formData);
                            }
                        }}
                        className="px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {editingVariation ? 'Update Variation' : 'Add Variation'}
                    </button>
                </div>
            </div>
        );
    };

    // Fetch user's shops
    useEffect(() => {
        if (!userLoading && user?.uid) {
            const fetchShops = async () => {
                const q = query(collection(db, "shops"), where("owner", "==", user.uid));
                const docs = await getDocs(q);
                setShops(docs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            };
            fetchShops();
        }
    }, [user, userLoading]);

    // Fetch bank accounts when user is ready
    useEffect(() => {
        if (!userLoading && user?.uid) {
            const fetchBankAccounts = async () => {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.bankAccounts) {
                            setBankAccounts(userData.bankAccounts);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching bank accounts:", error);
                }
            };
            fetchBankAccounts();
        }
    }, [user, userLoading]);

    // Auto-enable bank transfer when bank accounts become available
    useEffect(() => {
        // If user previously had bank transfer disabled due to no accounts,
        // and now they have accounts, we could auto-enable it
        // But we'll leave this as manual choice for better UX
    }, [bankAccounts]);

    // Provide default seller notes for physical items
    useEffect(() => {
        // Only provide default seller notes if empty AND not loaded from database yet
        if (!sellerNotes && listingId) {
            // Don't auto-populate for existing listings being edited
            return;
        }
        if (!sellerNotes) {
            setSellerNotes("We will ship your order within 2-3 business days. Delivery time may vary based on your location. Please provide accurate delivery address.");
        }
    }, [listingId]);

    // Fetch listing details
    useEffect(() => {
        async function fetchListing() {
            if (!listingId) return;
            const docRef = doc(db, "listings", listingId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return;

            const data = docSnap.data();
            setShopId(data.shopId || "");
            const loadedItemType = data.itemType || "Physical"; // Default to Physical for backward compatibility
            setItemType(loadedItemType);
            
            const loadedCategory = data.category || "";
            const loadedSubcategory = data.subcategory || "";
            
            // Validate that the loaded category matches the item type
            const validCategories = categories.filter(c => c.type === loadedItemType);
            const categoryExists = validCategories.find(c => c.name === loadedCategory);
            
            if (categoryExists) {
                setCat(loadedCategory);
                // Check if subcategory exists in the loaded category
                const subcategoryExists = categoryExists.subcategories.some((sc: string) => sc === loadedSubcategory);
                if (subcategoryExists) {
                    setSub(loadedSubcategory);
                } else {
                    setSub(""); // Reset subcategory if it doesn't exist in the category
                }
            } else {
                setCat(""); // Reset category if it doesn't match the item type
                setSub(""); // Reset subcategory as well
            }
            
            setName(data.name || "");
            setDesc(data.description || "");
            setSellerNotes(data.sellerNotes || "");
            setPrice(data.price ? String(data.price) : "");
            setDeliveryType(data.deliveryType || "");
            setDeliveryPerItem(data.deliveryPerItem ? String(data.deliveryPerItem) : "");
            setDeliveryAdditional(data.deliveryAdditional ? String(data.deliveryAdditional) : "");
            // Create separate copies of the images array to prevent shared references
            const imageUrls = data.images || [];
            setExistingImageUrls([...imageUrls]); // Create a new array copy
            setImagePreviews([...imageUrls]); // Create another separate array copy
            setQuantity(data.quantity ? String(data.quantity) : "");
            setCashOnDelivery(!!data.cashOnDelivery);
            setBankTransfer(!!data.bankTransfer);
            setNonRefundable(!!data.nonRefundable);
            
            // Always load digital product data if it exists (regardless of current item type)
            // Digital product data is stored in a 'digitalProduct' object
            const digitalProduct = data.digitalProduct;
            if (digitalProduct) {
                if (digitalProduct.type === 'file') {
                    setExistingDigitalFileUrl(digitalProduct.fileUrl || "");
                    setExistingDigitalFileName(digitalProduct.fileName || "");
                    setDigitalLink(""); // Clear link if file exists
                } else if (digitalProduct.type === 'link') {
                    setDigitalLink(digitalProduct.downloadLink || "");
                    setExistingDigitalFileUrl(""); // Clear file data if link exists
                    setExistingDigitalFileName("");
                }
            } else {
                // No digital product data found
                setDigitalLink("");
                setExistingDigitalFileUrl("");
                setExistingDigitalFileName("");
            }
            
            // Load digital product data
            if (loadedItemType === ItemType.DIGITAL) {
                // For digital products, set delivery type to free since there's no physical delivery
                setDeliveryType("free");
                setDeliveryPerItem("");
                setDeliveryAdditional("");
                // Digital products can only use bank transfer, disable COD
                setCashOnDelivery(false);
                // Note: digitalFileUrl is loaded but we can't restore a File object
                // The form will show the existing digital product info
            }
            
            // Load variations if they exist
            if (data.hasVariations && data.variations && Array.isArray(data.variations)) {
                setHasVariations(true);
                // Ensure all existing price changes are non-negative
                const sanitizedVariations = data.variations.map((variation: any) => ({
                    ...variation,
                    priceChange: Math.max(0, variation.priceChange || 0)
                }));
                setVariations(sanitizedVariations);
            } else {
                setHasVariations(false);
                setVariations([]);
            }
        }
        fetchListing();
    }, [listingId]);


    // Add new image preview on upload with compression
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const newFiles = files.slice(0, 5 - (images.length + existingImageUrls.length));
        if (newFiles.length === 0) return;

        try {
            // Process each image with compression
            const processedFiles = await Promise.all(
                newFiles.map(async (file, index) => {
                    try {
                        // Get shop name for SEO filename
                        const currentShop = shops.find(s => s.id === shopId);
                        const shopName = currentShop?.name || '';
                        
                        return await processImageForUpload(
                            file,
                            name || 'product', // Use product name or fallback
                            cat || 'general', // Use category or fallback
                            sub, // subcategory (optional)
                            images.length + existingImageUrls.length + index, // current index
                            shopName
                        );
                    } catch (error) {
                        console.error('Error processing image:', error);
                        // Return original file if processing fails
                        return file;
                    }
                })
            );

            setImages(prev => [...prev, ...processedFiles]);
            
            // Create previews for the processed images
            processedFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImagePreviews(prev => [...prev, event.target?.result as string]);
                };
                reader.readAsDataURL(file);
            });
            
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error('Error handling image upload:', error);
            showToast('error', 'Error processing images. Please try again.');
        }
    };

    // Remove images: index starts with existingImageUrls then new images
    const removeImage = (idx: number) => {
        if (idx < existingImageUrls.length) {
            setExistingImageUrls(prev => prev.filter((_, i) => i !== idx));
            setImagePreviews(prev => prev.filter((_, i) => i !== idx));
        } else {
            // Remove new uploaded image
            const relativeIdx = idx - existingImageUrls.length;
            setImages(prev => prev.filter((_, i) => i !== relativeIdx));
            setImagePreviews(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const handleSubmit = async () => {
        if (!shopId || submitting) return;
        
        // Validate payment methods based on item type
        if (itemType === ItemType.DIGITAL) {
            if (!bankTransfer) {
                showToast('error', 'Bank transfer is required for digital products. Cash on delivery is not available.');
                return;
            }
        } else {
            if (!cashOnDelivery && !bankTransfer) {
                showToast('error', 'Please select at least one payment method for this listing.');
                return;
            }
        }
        
        // Digital product validation
        if (itemType === ItemType.DIGITAL) {
            // Get current listing data to check for existing digital product
            const currentListingDoc = await getDoc(doc(db, "listings", listingId!));
            const currentData = currentListingDoc.exists() ? currentListingDoc.data() : null;
            const hasExistingDigitalProduct = currentData?.digitalProduct && 
                (currentData.digitalProduct.fileUrl || currentData.digitalProduct.downloadLink);
            
            if (!digitalFile && !digitalLink && !hasExistingDigitalProduct) {
                showToast('error', 'Please provide either a digital file or a download link for digital products.');
                return;
            }
            
            if (digitalFile) {
                if (!ALLOWED_FILE_TYPES.includes(digitalFile.type)) {
                    showToast('error', `File type not allowed. Supported types: ${ALLOWED_FILE_TYPES.join(', ')}`);
                    return;
                }
                
                if (digitalFile.size > MAX_FILE_SIZE) {
                    showToast('error', `File size too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
                    return;
                }
            }
            
            if (digitalLink && !digitalFile && !hasExistingDigitalProduct) {
                try {
                    new URL(digitalLink);
                } catch {
                    showToast('error', 'Please provide a valid download link.');
                    return;
                }
            }
        }
        
        setSubmitting(true);
        
        let imageUrls: string[] = [...existingImageUrls];
        let newImageMetadata: any[] = [];
        
        try {
            // Upload new images with better organization and metadata
            const uploadPromises = images.map(async (file, idx) => {
                const currentShop = shops.find(s => s.id === shopId);
                const shopName = currentShop?.name || 'unknown-shop';
                
                // Create organized storage path with unique listing ID
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const timestamp = now.getTime();
                const storagePath = `listings/${listingId}/${year}/${month}/${timestamp}_${file.name}`;
                
                const storageRef = ref(storage, storagePath);
                
                // Upload with metadata
                const uploadResult = await uploadBytes(storageRef, file, {
                    customMetadata: {
                        listingId: listingId!,
                        productName: name,
                        category: cat,
                        subcategory: sub || '',
                        shopId: shopId,
                        shopName: shopName,
                        uploadedAt: now.toISOString(),
                        altText: generateImageAltText(name, cat, sub, existingImageUrls.length + idx, shopName),
                        imageIndex: (existingImageUrls.length + idx).toString(),
                        originalSize: file.size.toString(),
                        processedSize: file.size.toString(),
                        listingUpdate: 'true'
                    }
                });
                
                const downloadURL = await getDownloadURL(uploadResult.ref);
                
                return {
                    url: downloadURL,
                    metadata: {
                        altText: generateImageAltText(name, cat, sub, existingImageUrls.length + idx, shopName),
                        filename: file.name,
                        size: file.size,
                        index: existingImageUrls.length + idx,
                        storagePath: storagePath
                    }
                };
            });
            
            const uploadResults = await Promise.all(uploadPromises);
            const newUrls = uploadResults.map(result => result.url);
            newImageMetadata = uploadResults.map(result => result.metadata);
            imageUrls = [...existingImageUrls, ...newUrls];
            
        } catch (err) {
            console.error('Image upload error:', err);
            showToast('error', 'Image upload failed. Please try again.');
            setSubmitting(false);
            return;
        }
        
        try {
            // Update the listing with enhanced metadata
            const updateData: any = {
                shopId,
                itemType,
                category: cat,
                subcategory: sub,
                name,
                description: desc,
                sellerNotes,
                deliveryType,
                deliveryPerItem: deliveryType === "paid" ? parseFloat(deliveryPerItem) : 0,
                deliveryAdditional: deliveryType === "paid" ? parseFloat(deliveryAdditional) : 0,
                images: imageUrls,
                newImageMetadata: newImageMetadata, // Store metadata for new images
                cashOnDelivery,
                bankTransfer,
                nonRefundable,
                updatedAt: (await import("firebase/firestore")).Timestamp.now(),
                // Update SEO fields
                seoTitle: `${name} - ${cat} ${sub ? `- ${sub}` : ''} | ${shops.find(s => s.id === shopId)?.name || 'Shop'}`,
                seoDescription: desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
                keywords: [name, cat, sub, 'Sri Lanka', 'marketplace', shops.find(s => s.id === shopId)?.name].filter(Boolean)
            };

            // Handle digital product data
            if (itemType === ItemType.DIGITAL) {
                // Set appropriate delivery settings for digital products
                updateData.deliveryType = "free"; // Digital products don't have delivery costs
                updateData.deliveryPerItem = 0;
                updateData.deliveryAdditional = 0;
                
                if (digitalFile) {
                    // Upload new digital file using the same utility as AddListing
                    const { uploadDigitalProductFile } = await import('../../utils/digitalProducts');
                    const digitalProductData = await uploadDigitalProductFile(digitalFile, listingId!, shopId);
                    updateData.digitalProduct = digitalProductData;
                } else if (digitalLink) {
                    // User provided a link, create digital product from link
                    const { createDigitalProductFromLink } = await import('../../utils/digitalProducts');
                    const digitalProductData = createDigitalProductFromLink(digitalLink);
                    updateData.digitalProduct = digitalProductData;
                } else {
                    // No new file or link provided, keep existing digital product data
                    // Don't modify digitalProduct if nothing changed
                }
            } else {
                // Clear digital product fields for physical products
                updateData.digitalProduct = null;
            }

            // Handle variations
            if (hasVariations && variations.length > 0) {
                updateData.hasVariations = true;
                updateData.variations = variations.filter(v => v.name.trim()); // Only save variations with names
                // Calculate total stock from variations
                updateData.quantity = getTotalVariationStock();
                // Set base price (variations will have their own pricing)
                updateData.price = parseFloat(price);
            } else {
                updateData.hasVariations = false;
                updateData.price = parseFloat(price);
                updateData.quantity = parseInt(quantity, 10);
                // Remove variations field if not using variations
                updateData.variations = [];
            }

            await updateDoc(doc(db, "listings", listingId!), updateData);
            
            showToast('success', 'Listing updated successfully!');
            navigate(`/shop/${shops.find(s => s.id === shopId)?.username}`);
        } catch (err) {
            console.error('Database update error:', err);
            showToast('error', 'Failed to update listing. Please try again.');
            setSubmitting(false);
        }
    };

    // Steps rendering (same as AddListing)
    return (
        <>
            <SEOHead
                title={`Edit Listing${name ? ` - ${name}` : ''} - Sina.lk`}
                description={`Edit your product listing on Sina.lk. Update photos, prices, and details for ${name || 'your product'}.`}
                keywords={generateKeywords([
                    'edit listing',
                    'update product',
                    'modify listing',
                    'Sri Lankan marketplace',
                    'manage products',
                    cat || '',
                    name || ''
                ])}
                canonicalUrl={getCanonicalUrl(`/edit-listing/${listingId}`)}
                noIndex={true}
            />
            <ResponsiveHeader />
            <div className="bg-white min-h-screen flex flex-col items-center py-2 md:py-8 px-2 md:px-4">
                {/* Modern Progress Stepper */}
                <div className="w-full max-w-4xl mx-auto mb-4 md:mb-12 px-4">
                    {/* Mobile Progress Bar */}
                    <div className="block md:hidden mb-3">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-[#72b01d]">
                                Step {step} of {steps.length}
                            </span>
                            <span className="text-xs text-[#454955] bg-gray-100 px-2 py-1 rounded-full">
                                {Math.round((step / steps.length) * 100)}% Complete
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div 
                                className="bg-gradient-to-r from-[#72b01d] to-[#3f7d20] h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(step / steps.length) * 100}%` }}
                            ></div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#72b01d] to-[#3f7d20] rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-white font-bold text-sm">{step}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#0d0a0b] text-lg">{steps[step - 1]?.label}</h3>
                                    <p className="text-xs text-[#454955] mt-0.5">
                                        {step === 1 && "Choose which shop to list your item under"}
                                        {step === 2 && "Choose what type of product you're selling"}
                                        {step === 3 && "Pick the main category for your item"}
                                        {step === 4 && "Choose a specific subcategory"}
                                        {step === 5 && (itemType === ItemType.DIGITAL ? "Add item details and digital content" : "Add item details, price, and quantity")}
                                        {step === 6 && (itemType === ItemType.DIGITAL ? "Variations not available for digital products" : "Add product variations (optional)")}
                                        {step === 7 && "Upload photos of your item"}
                                        {step === 8 && "Set delivery options and pricing"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Stepper */}
                    <div className="hidden md:block">
                        <div className="flex items-center justify-between relative">
                            {/* Progress Line */}
                            <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 z-0">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#72b01d] to-[#3f7d20] transition-all duration-500 ease-out"
                                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                                ></div>
                            </div>
                            
                            {steps.map((s, idx) => (
                                <div key={s.label} className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg mb-3
                        ${step === idx + 1
                                                ? "bg-gradient-to-br from-[#72b01d] to-[#3f7d20] text-white scale-110 shadow-[#72b01d]/30"
                                                : step > idx + 1
                                                    ? "bg-gradient-to-br from-[#3f7d20] to-[#2d5c17] text-white"
                                                    : "bg-white border-2 border-gray-200 text-[#454955] hover:border-[#72b01d]/30"}
                      `}
                                    >
                                        {step > idx + 1 ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            idx + 1
                                        )}
                                    </div>
                                    <div className="text-center max-w-[100px]">
                                        <span
                                            className={`text-sm font-semibold block leading-tight
                          ${step === idx + 1 ? "text-[#72b01d]" : step > idx + 1 ? "text-[#3f7d20]" : "text-[#454955]"}
                        `}
                                        >
                                            {s.label}
                                        </span>
                                        <span className="text-xs text-[#454955]/70 mt-1 block">
                                            {idx === 0 && "Shop"}
                                            {idx === 1 && "Type"}
                                            {idx === 2 && "Category"}
                                            {idx === 3 && "Subcategory"}
                                            {idx === 4 && "Details"}
                                            {idx === 5 && "Variations"}
                                            {idx === 6 && "Images"}
                                            {idx === 7 && "Shipping"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <form
                    className="w-full max-w-2xl mx-auto bg-white rounded-xl md:rounded-3xl shadow-lg px-4 md:px-12 py-6 md:py-10 transition-all"
                    onSubmit={e => { e.preventDefault(); handleSubmit(); }}
                    autoComplete="off"
                >
                    {/* Step 1: Shop selection */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-[#0d0a0b]">Select your shop</h2>
                            {userLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-[#454955] text-base md:text-lg text-center mb-4">
                                        Loading your shops...
                                    </div>
                                </div>
                            ) : shops.length === 0 ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-[#454955] text-base md:text-lg text-center mb-4">
                                        You haven't created a shop yet.
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6">
                                        {shops.map(shop => (
                                            <button
                                                type="button"
                                                key={shop.id}
                                                onClick={() => setShopId(shop.id)}
                                                className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl border transition text-left
                          ${shopId === shop.id
                                                        ? "border-[#72b01d] bg-[#72b01d] text-white scale-105 shadow-sm"
                                                        : "border-[#45495522] bg-white hover:bg-gray-50"}
                        `}
                                            >
                                                {shop.logo && (
                                                    <img
                                                        src={shop.logo}
                                                        alt={shop.name}
                                                        className="w-10 md:w-12 h-10 md:h-12 rounded-full object-cover border border-[#45495522] shadow-sm"
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-bold text-base md:text-lg">{shop.name}</div>
                                                    <div className="text-xs text-[#454955]">@{shop.username}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-center md:justify-end mt-6 md:mt-8">
                                        <button
                                            type="button"
                                            className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                            disabled={!shopId}
                                            onClick={() => goToStep(2)}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Step 2: Item Type */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-[#0d0a0b]">What type of product are you selling?</h2>
                            
                            <div className="space-y-4 max-w-md mx-auto">
                                {/* Physical Product Option */}
                                <div 
                                    onClick={() => setItemType(ItemType.PHYSICAL)}
                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        itemType === ItemType.PHYSICAL 
                                            ? 'border-[#72b01d] bg-[#72b01d]/5 shadow-sm' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className={`text-3xl mb-3 flex justify-center ${itemType === ItemType.PHYSICAL ? "text-[#72b01d]" : "text-gray-400"}`}>
                                            <FiPackage className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-lg text-[#0d0a0b] mb-2">Physical Product</h3>
                                        <p className="text-sm text-[#454955]">
                                            A tangible item that needs to be shipped to the buyer
                                        </p>
                                    </div>
                                </div>

                                {/* Digital Product Option */}
                                <div 
                                    onClick={() => setItemType(ItemType.DIGITAL)}
                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        itemType === ItemType.DIGITAL 
                                            ? 'border-[#72b01d] bg-[#72b01d]/5 shadow-sm' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className={`text-3xl mb-3 flex justify-center ${itemType === ItemType.DIGITAL ? "text-[#72b01d]" : "text-gray-400"}`}>
                                            <FiDownload className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-lg text-[#0d0a0b] mb-2">Digital Product</h3>
                                        <p className="text-sm text-[#454955]">
                                            A downloadable file, software, or digital content
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#e5e7eb]">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => setStep(1)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    onClick={() => setStep(3)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Category */}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-[#0d0a0b]">Pick a main category</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                                {categories
                                    .filter(c => c.type === itemType)
                                    .map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setCat(c.name)}
                                        className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl md:rounded-2xl transition
                      ${cat === c.name
                                                ? "bg-[#72b01d] text-white shadow-sm scale-105"
                                                : "bg-white border border-[#45495522] hover:bg-white text-[#0d0a0b]"}
                    `}
                                    >
                                        <span className="text-lg md:text-xl">
                                          {categoryIcons[c.name] ? (
                                            React.createElement(categoryIcons[c.name], { className: "w-5 h-5" })
                                          ) : (
                                            <FiPackage className="w-5 h-5" />
                                          )}
                                        </span>
                                        <span className="font-medium text-xs text-center">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => goToStep(2)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={!cat}
                                    onClick={() => goToStep(4)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Subcategory */}
                    {step === 4 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-8 text-center text-[#0d0a0b]">Pick a sub category</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                                {categories.find(c => c.name === cat)?.subcategories.map((sc) => (
                                    <button
                                        key={sc}
                                        type="button"
                                        onClick={() => setSub(sc)}
                                        className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl md:rounded-2xl transition
                      ${sub === sc
                                                ? "bg-[#72b01d] text-white shadow-sm scale-105"
                                                : "bg-white border border-[#45495522] hover:bg-white text-[#0d0a0b]"}
                    `}
                                    >
                                        <div className="flex items-center justify-center text-lg md:text-xl mb-1 w-5 h-5 md:w-6 md:h-6 mx-auto">
                                          {subCategoryIcons[sc] ? 
                                            React.createElement(subCategoryIcons[sc]) : 
                                            <FiPackage />
                                          }
                                        </div>
                                        <span className="font-medium text-xs text-center">{sc}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-8">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => goToStep(3)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={!sub}
                                    onClick={() => goToStep(5)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Details */}
                    {step === 5 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-[#0d0a0b]">Item details</h2>

                            <div className="space-y-6 md:space-y-8">
                                {/* Item Title Field */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                        Item Title
                                    </label>
                                    <input
                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                        maxLength={120}
                                        placeholder="Enter item title..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                        {name.length}/120 characters
                                    </div>
                                </div>

                                {/* Description Field */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[120px] md:min-h-[140px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none text-sm md:text-base"
                                        maxLength={1200}
                                        placeholder="Describe your item in detail..."
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                        {desc.length}/1200 characters
                                    </div>
                                </div>

                                {/* Seller Notes Field */}
                                <div className="group">
                                    <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                        Delivery & Important Notes
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] min-h-[100px] md:min-h-[120px] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 resize-none text-sm md:text-base"
                                        maxLength={500}
                                        placeholder="Provide important information about delivery, shipping, or handling instructions"
                                        value={sellerNotes}
                                        onChange={e => setSellerNotes(e.target.value)}
                                        required
                                    />
                                    <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                        {sellerNotes.length}/500 characters
                                    </div>
                                    <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                                        💡 <strong>Tip:</strong> Include handling time, packaging details, and any special delivery instructions.
                                    </div>
                                </div>

                                {/* Price and Quantity Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Item Price Field */}
                                    <div className="group">
                                        <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                            Item Price
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-14 md:pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                                placeholder="0.00"
                                                value={price}
                                                onChange={e => setPrice(e.target.value)}
                                                required
                                            />
                                            <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-xs md:text-sm select-none pointer-events-none">
                                                LKR
                                            </span>
                                        </div>
                                       
                                    </div>

                                    {/* Available Quantity Field */}
                                    <div className="group">
                                        <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-2 md:mb-3 tracking-wide uppercase">
                                            Available Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                            placeholder="Enter quantity..."
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            required
                                        />
                                        <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                            How many items do you have in stock?
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Digital Product Content Section */}
                            {itemType === ItemType.DIGITAL && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-[#0d0a0b] mb-2">Digital Product Content</h3>
                                        <p className="text-sm text-[#454955]">
                                            Upload your digital file or provide a download link. Either option is required for digital products.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Existing Digital File Section (if exists) */}
                                        {existingDigitalFileUrl && !digitalFile && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
                                                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                    <FiPackage className="w-5 h-5" />
                                                    Current Digital File
                                                </h4>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <FiPackage className="text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-blue-900">
                                                                {existingDigitalFileName || "Digital File"}
                                                            </p>
                                                            <p className="text-sm text-blue-700">Currently uploaded</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-blue-600 mt-3">
                                                    This file will remain unless you upload a new one or provide a download link.
                                                </p>
                                            </div>
                                        )}

                                        {/* Existing Digital Link Section (if exists and no file) */}
                                        {digitalLink && !existingDigitalFileUrl && !digitalFile && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-6">
                                                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                    <FiInfo className="w-5 h-5" />
                                                    Current Download Link
                                                </h4>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <FiInfo className="text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-green-900">Download Link Active</p>
                                                            <p className="text-sm text-green-700 truncate">
                                                                {digitalLink}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-green-600 mt-3">
                                                    This link will remain unless you upload a file or change the link below.
                                                </p>
                                            </div>
                                        )}

                                        {/* File Upload Section */}
                                        <div className="bg-white border border-[#45495522] rounded-xl p-4 md:p-6">
                                            <h4 className="font-semibold text-[#0d0a0b] mb-4 flex items-center gap-2">
                                                <FiPackage className="w-5 h-5" />
                                                {existingDigitalFileUrl ? "Replace File" : "Upload File"}
                                            </h4>
                                            
                                            {!digitalFile ? (
                                                <div 
                                                    onClick={() => digitalFileInputRef.current?.click()}
                                                    className="border-2 border-dashed border-[#72b01d] rounded-xl p-6 md:p-8 text-center cursor-pointer hover:bg-[#72b01d]/5 transition-colors"
                                                >
                                                    <FiPlus className="w-8 h-8 text-[#72b01d] mx-auto mb-3" />
                                                    <p className="text-[#0d0a0b] font-medium mb-1">Click to upload your digital file</p>
                                                    <p className="text-sm text-[#454955]">
                                                        Max size: {formatFileSize(MAX_FILE_SIZE)}
                                                    </p>
                                                    <p className="text-xs text-[#454955] mt-1">
                                                        Supported: {ALLOWED_FILE_TYPES.slice(0, 6).join(', ')}...
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                                <FiPackage className="text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-green-900">{digitalFile.name}</p>
                                                                <p className="text-sm text-green-700">{formatFileSize(digitalFile.size)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDigitalFile(null)}
                                                            className="text-red-500 hover:text-red-700 p-2"
                                                        >
                                                            <FiX className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <input
                                                ref={digitalFileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept={ALLOWED_FILE_TYPES.map(type => `.${type}`).join(',')}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > MAX_FILE_SIZE) {
                                                            showToast('error', `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
                                                            return;
                                                        }
                                                        setDigitalFile(file);
                                                        setDigitalLink(''); // Clear link if file is selected
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* OR Separator */}
                                        <div className="flex items-center justify-center py-4">
                                            <div className="flex-1 border-t border-gray-300"></div>
                                            <div className="px-4">
                                                <span className="bg-white px-3 py-1 text-sm font-medium text-[#454955] border border-gray-300 rounded-full">
                                                    OR
                                                </span>
                                            </div>
                                            <div className="flex-1 border-t border-gray-300"></div>
                                        </div>

                                        {/* Download Link Section */}
                                        <div className="bg-white border border-[#45495522] rounded-xl p-4 md:p-6">
                                            <h4 className="font-semibold text-[#0d0a0b] mb-4 flex items-center gap-2">
                                                <FiInfo className="w-5 h-5" />
                                                {digitalLink && !existingDigitalFileUrl ? "Update Download Link" : "Download Link"}
                                            </h4>
                                            <p className="text-sm text-[#454955] mb-4">
                                                {digitalLink && !existingDigitalFileUrl 
                                                    ? "Update your download link or upload a file instead"
                                                    : "If your file is too large, provide a link to download it (Google Drive, Dropbox, etc.)"
                                                }
                                            </p>
                                            
                                            <Input
                                                type="url"
                                                placeholder="https://drive.google.com/file/d/... or https://dropbox.com/..."
                                                value={digitalLink}
                                                onChange={(e) => {
                                                    setDigitalLink(e.target.value);
                                                    if (e.target.value) {
                                                        setDigitalFile(null); // Clear file if link is provided
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Validation Messages */}
                                        {!digitalFile && !digitalLink && !existingDigitalFileUrl && (
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                <p className="text-[#454955] text-sm flex items-center gap-2">
                                                    <span className="text-orange-500">⚠️</span>
                                                    Please either upload a file or provide a download link to continue.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#e5e7eb]">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                                    onClick={() => goToStep(4)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-[#72b01d] text-white rounded-xl font-semibold transition-all duration-200 hover:bg-[#3f7d20] disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!name || !desc || !sellerNotes || !price || !quantity || (itemType === ItemType.DIGITAL && !digitalFile && !digitalLink && !existingDigitalFileUrl)}
                                    onClick={() => goToStep(6)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Product Variations */}
                    {step === 6 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-[#0d0a0b]">
                                Product Variations {itemType === ItemType.DIGITAL ? "(Not Available for Digital Products)" : "(Optional)"}
                            </h2>
                            
                            {/* Digital Product Notice */}
                            {itemType === ItemType.DIGITAL && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-center">
                                    <div className="text-3xl mb-3">📦</div>
                                    <h3 className="font-semibold text-blue-900 mb-2">Digital Products Don't Need Variations</h3>
                                    <p className="text-blue-700 text-sm leading-relaxed">
                                        Digital products are delivered as downloadable files or links, so size, color, and other physical variations don't apply. 
                                        You can create separate listings for different versions of your digital product if needed.
                                    </p>
                                </div>
                            )}
                            
                            {/* Physical Product Variations */}
                            {itemType === ItemType.PHYSICAL && (
                            
                            <div className="bg-gray-50 rounded-xl p-4 md:p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#0d0a0b] mb-1">Enable Variations</h3>
                                        <p className="text-sm text-[#454955]">
                                            Add different product options like "Small Blue", "Large Black" with their own pricing and stock.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasVariations}
                                            onChange={(e) => {
                                                setHasVariations(e.target.checked);
                                                if (!e.target.checked) {
                                                    // Only reset form states when disabled, preserve variations data
                                                    setShowAddForm(false);
                                                    setEditingVariation(null);
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#72b01d]"></div>
                                    </label>
                                </div>

                                {hasVariations && (
                                    <div className="space-y-6">
                                        {/* Add Variation Button or Empty State */}
                                        {!showAddForm && (
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-md font-semibold text-[#0d0a0b]">Product Variations</h4>
                                                <button
                                                    type="button"
                                                    onClick={addVariation}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] transition-colors text-sm font-medium"
                                                >
                                                    <FiPlus size={16} />
                                                    Add Variation
                                                </button>
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {!showAddForm && variations.filter(v => v.name.trim()).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                <div className="max-w-sm mx-auto">
                                                    <FiPackage className="text-gray-400 w-12 h-12 mb-3" />
                                                    <h6 className="text-lg font-medium text-gray-700 mb-2">No variations yet</h6>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Add variations like "Small Blue", "Large Red" to offer different options to your customers.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={addVariation}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#72b01d] text-white rounded-lg hover:bg-[#3f7d20] transition-colors text-sm font-medium"
                                                    >
                                                        <FiPlus size={16} />
                                                        Add Your First Variation
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Add/Edit Variation Form */}
                                        {showAddForm && (
                                            <div className="bg-white rounded-xl p-6 border-2 border-[#72b01d] shadow-lg">
                                                <h5 className="text-lg font-semibold text-[#0d0a0b] mb-4">
                                                    {editingVariation ? 'Edit Variation' : 'Add New Variation'}
                                                </h5>
                                                <VariationForm
                                                    variation={editingVariation || variations[variations.length - 1]}
                                                    basePrice={parseFloat(price) || 0}
                                                    onSave={saveVariation}
                                                    onCancel={cancelVariation}
                                                />
                                            </div>
                                        )}

                                        {/* Variations Table */}
                                        {variations.filter(v => v.name.trim()).length > 0 && (
                                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                                    <h5 className="font-semibold text-gray-800">Added Variations</h5>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Variation Name
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Final Price
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Price Change
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Quantity
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {variations.filter(v => v.name.trim()).map((variation) => (
                                                                <tr key={variation.id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm font-medium text-gray-900">{variation.name}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900 font-semibold">
                                                                            Rs.{((parseFloat(price) || 0) + variation.priceChange).toFixed(2)}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        {variation.priceChange > 0 && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                +Rs.{variation.priceChange.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                        {variation.priceChange === 0 && (
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                Base price
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">{variation.quantity} units</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => startEditVariation(variation)}
                                                                            className="text-[#72b01d] hover:text-[#3f7d20] mr-3"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeVariation(variation.id)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {variations.filter(v => v.name.trim()).length > 0 && (
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <h5 className="font-semibold text-blue-800 mb-2">Summary</h5>
                                                <div className="text-sm text-blue-700">
                                                    <p>• {variations.filter(v => v.name.trim()).length} variation{variations.filter(v => v.name.trim()).length !== 1 ? 's' : ''} created</p>
                                                    <p>• Total stock: {getTotalVariationStock()} units</p>
                                                    <p>• Price range: Rs.{Math.min(...variations.filter(v => v.name.trim()).map(v => (parseFloat(price) || 0) + v.priceChange)).toFixed(2)} - Rs.{Math.max(...variations.filter(v => v.name.trim()).map(v => (parseFloat(price) || 0) + v.priceChange)).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}

                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                                    onClick={() => goToStep(5)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-[#72b01d] text-white rounded-xl font-semibold transition-all duration-200 hover:bg-[#3f7d20]"
                                    onClick={() => goToStep(7)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Images */}
                    {step === 7 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6 text-[#0d0a0b]">Add images</h2>
                            
                            {/* Simple message about real images */}
                            <p className="text-sm md:text-base text-[#454955] mb-4 md:mb-6 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                📸 <strong>Important:</strong> Please upload only real photos of your actual products. Images from the internet may result in listing removal.
                            </p>

                            <div className="flex flex-wrap gap-3 md:gap-6 mb-4 md:mb-6">
                                {imagePreviews.map((src, idx) => (
                                    <div
                                        key={idx}
                                        className="relative w-20 md:w-28 h-20 md:h-28 rounded-xl md:rounded-2xl overflow-hidden bg-white border border-[#45495522] shadow-sm flex items-center justify-center"
                                    >
                                        <img
                                            src={src}
                                            alt={`Preview ${idx + 1}`}
                                            className="object-cover w-full h-full"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 md:top-2 right-1 md:right-2 bg-[#72b01d] text-white rounded-full p-1 opacity-80 hover:opacity-100 transition z-10"
                                            onClick={() => removeImage(idx)}
                                            aria-label="Remove image"
                                        >
                                            <FiX size={14} className="md:w-[18px] md:h-[18px]" />
                                        </button>
                                    </div>
                                ))}
                                {imagePreviews.length < 5 && (
                                    <button
                                        type="button"
                                        className="w-20 md:w-28 h-20 md:h-28 rounded-xl md:rounded-2xl flex items-center justify-center bg-white border border-[#45495544] border-dashed shadow-sm text-2xl md:text-3xl text-[#45495577] hover:bg-gray-50 hover:text-[#72b01d] transition"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        +
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            aria-label="Upload images"
                                        />
                                    </button>
                                )}
                            </div>
                            <div className="text-sm text-[#454955] mb-2">{imagePreviews.length} / 5 images selected</div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50"
                                    onClick={() => goToStep(6)}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-7 py-3 bg-[#72b01d] text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#3f7d20] disabled:opacity-30"
                                    disabled={imagePreviews.length === 0 && existingImageUrls.length === 0}
                                    onClick={() => goToStep(8)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 8: Delivery */}
                    {step === 8 && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-[#0d0a0b]">
                                {itemType === ItemType.DIGITAL ? "Payment Options" : "Delivery options"}
                            </h2>
                            
                            {itemType === ItemType.DIGITAL && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <FiInfo className="w-5 h-5" />
                                        Digital Product Delivery
                                    </h3>
                                    <p className="text-blue-800 text-sm">
                                        This is a digital product. Customers will receive their download link or file via email after payment confirmation. No physical delivery is required.
                                    </p>
                                </div>
                            )}
                            
                            <div className="space-y-6 md:space-y-8">
                                {/* Delivery Type Selection - Hidden for digital products but still functional */}
                                {itemType === ItemType.PHYSICAL && (
                                    <div className="group">
                                        <label className="block text-xs md:text-sm font-bold text-[#0d0a0b] mb-3 md:mb-4 tracking-wide uppercase">
                                            Delivery Type
                                        </label>
                                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                                            <button
                                                type="button"
                                                className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 font-bold text-base md:text-lg group/card
                                                    ${deliveryType === "free"
                                                        ? "bg-[#72b01d] border-[#72b01d] text-white shadow-lg scale-[1.02]"
                                                        : "bg-white border-[#e5e5e5] text-[#0d0a0b] hover:border-[#72b01d] hover:shadow-md"}`}
                                                onClick={() => setDeliveryType("free")}
                                            >
                                                <div className="flex items-center justify-center mb-2">
                                                    <span className="text-xl md:text-2xl mr-3">🚚</span>
                                                    Free Delivery
                                                </div>
                                                <div className={`text-xs md:text-sm font-medium
                                                    ${deliveryType === "free" ? "text-white/90" : "text-[#6b7280]"}`}>
                                                    You cover delivery costs
                                                </div>
                                                {deliveryType === "free" && (
                                                    <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                                                        <span className="text-[#72b01d] text-xs md:text-sm font-bold">✓</span>
                                                    </div>
                                                )}
                                            </button>
                                            
                                            <button
                                                type="button"
                                                className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-200 font-bold text-base md:text-lg group/card
                                                    ${deliveryType === "paid"
                                                        ? "bg-[#72b01d] border-[#72b01d] text-white shadow-lg scale-[1.02]"
                                                        : "bg-white border-[#e5e5e5] text-[#0d0a0b] hover:border-[#72b01d] hover:shadow-md"}`}
                                                onClick={() => setDeliveryType("paid")}
                                            >
                                                <div className="flex items-center justify-center mb-2">
                                                    <FiDollarSign className="text-green-600 w-6 h-6 md:w-8 md:h-8 mr-3" />
                                                    Buyer Pays Delivery
                                                </div>
                                                <div className={`text-xs md:text-sm font-medium
                                                    ${deliveryType === "paid" ? "text-white/90" : "text-[#6b7280]"}`}>
                                                    Customer covers delivery
                                                </div>
                                                {deliveryType === "paid" && (
                                                    <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                                                        <span className="text-[#72b01d] text-xs md:text-sm font-bold">✓</span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Pricing (only when paid delivery is selected and physical product) */}
                                {itemType === ItemType.PHYSICAL && deliveryType === "paid" && (
                                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl md:rounded-2xl p-4 md:p-6">
                                        <h3 className="text-xs md:text-sm font-bold text-[#0d0a0b] mb-3 md:mb-4 tracking-wide uppercase">
                                            Delivery Pricing
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <div className="group">
                                                <label className="block text-xs md:text-sm font-semibold text-[#374151] mb-2">
                                                    Per Item Delivery
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-14 md:pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                                        placeholder="0.00"
                                                        value={deliveryPerItem}
                                                        onChange={e => setDeliveryPerItem(e.target.value)}
                                                        required
                                                    />
                                                    <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-xs md:text-sm select-none pointer-events-none">
                                                        LKR
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                                    Delivery cost for first item
                                                </div>
                                            </div>
                                            
                                            <div className="group">
                                                <label className="block text-xs md:text-sm font-semibold text-[#374151] mb-2">
                                                    Additional Items
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full bg-white border border-[#e5e5e5] focus:border-[#72b01d] hover:border-[#d4d4d4] transition-all duration-200 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[#0d0a0b] font-medium placeholder-[#9ca3af] pr-14 md:pr-16 shadow-sm focus:shadow-md focus:ring-4 focus:ring-[#72b01d]/10 text-sm md:text-base"
                                                        placeholder="0.00"
                                                        value={deliveryAdditional}
                                                        onChange={e => setDeliveryAdditional(e.target.value)}
                                                        required
                                                    />
                                                    <span className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold text-xs md:text-sm select-none pointer-events-none">
                                                        LKR
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[#6b7280] mt-2 ml-1">
                                                    Cost per additional item
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Methods */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-[#0d0a0b] text-sm md:text-base mb-3">
                                        💳 Payment Methods
                                    </h3>
                                    <div className="space-y-3">
                                        {/* Cash on Delivery Option */}
                                        <div className={`p-4 md:p-6 rounded-xl border ${
                                            itemType === ItemType.DIGITAL ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                                        }`}>
                                            <div className="flex items-start gap-2 md:gap-3">
                                                <input
                                                    id="cod-checkbox"
                                                    type="checkbox"
                                                    checked={itemType === ItemType.DIGITAL ? false : cashOnDelivery}
                                                    onChange={e => {
                                                        if (itemType === ItemType.DIGITAL) {
                                                            showToast('info', 'Cash on delivery is not available for digital products as they are delivered instantly online.');
                                                            return;
                                                        }
                                                        setCashOnDelivery(e.target.checked);
                                                    }}
                                                    disabled={itemType === ItemType.DIGITAL}
                                                    className={`w-4 md:w-5 h-4 md:h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm ${
                                                        itemType === ItemType.DIGITAL ? 'opacity-50' : ''
                                                    }`}
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor="cod-checkbox" className={`font-semibold cursor-pointer text-sm md:text-base ${
                                                        itemType === ItemType.DIGITAL ? 'text-gray-500' : 'text-[#0d0a0b]'
                                                    }`}>
                                                        <FiDollarSign className="w-5 h-5 inline mr-2" />
                                                        Allow Cash on Delivery (COD)
                                                        {itemType === ItemType.DIGITAL && " (Not Available)"}
                                                    </label>
                                                    <p className={`text-xs md:text-sm mt-1 ${
                                                        itemType === ItemType.DIGITAL ? 'text-gray-500' : 'text-[#454955]'
                                                    }`}>
                                                        {itemType === ItemType.DIGITAL 
                                                            ? "Cash on delivery is not available for digital products as they are delivered instantly online"
                                                            : "Let customers pay when they receive their order"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bank Transfer Option */}
                                        <div className={`p-4 md:p-6 rounded-xl border ${
                                          !canUseBankTransfer ? 'bg-yellow-50 border-yellow-200' : 
                                          bankAccounts.length === 0 ? 'bg-gray-50 border-gray-200' : 
                                          'bg-green-50 border-green-200'
                                        }`}>
                                            <div className="flex items-start gap-2 md:gap-3">
                                                <input
                                                    id="bank-transfer-checkbox"
                                                    type="checkbox"
                                                    checked={bankTransfer}
                                                    onChange={e => {
                                                        if (e.target.checked && !canUseBankTransfer) {
                                                            showToast('error', 'You need to verify your account to enable bank transfer payments for your listings.');
                                                            return;
                                                        }
                                                        if (e.target.checked && bankAccounts.length === 0) {
                                                            showToast('error', 'You need to add at least one bank account to enable bank transfers.');
                                                            return;
                                                        }
                                                        setBankTransfer(e.target.checked);
                                                    }}
                                                    disabled={!canUseBankTransfer || bankAccounts.length === 0}
                                                    className="w-4 md:w-5 h-4 md:h-5 accent-[#72b01d] rounded mt-0.5 shadow-sm disabled:opacity-50"
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor="bank-transfer-checkbox" className={`font-semibold cursor-pointer text-sm md:text-base ${
                                                        !canUseBankTransfer || bankAccounts.length === 0 ? 'text-gray-500' : 'text-[#0d0a0b]'
                                                    }`}>
                                                        🏦 Allow Bank Transfer
                                                    </label>
                                                    
                                                    {/* Show verification message if not verified */}
                                                    {!canUseBankTransfer ? (
                                                        <div className="mt-2">
                                                            <p className="text-xs md:text-sm text-yellow-700 mb-2">
                                                                ⚠️ {bankTransferEligibility.message}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                                className="text-xs md:text-sm text-yellow-800 underline hover:text-yellow-900"
                                                            >
                                                                Go to Dashboard Settings to verify your account
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className={`text-xs md:text-sm mt-1 ${bankAccounts.length === 0 ? 'text-gray-400' : 'text-[#454955]'}`}>
                                                            {bankAccounts.length === 0 
                                                                ? "You need to add at least one bank account to enable bank transfers"
                                                                : itemType === ItemType.DIGITAL
                                                                    ? "Customers transfer money directly to your bank account. Digital product will be sent after payment confirmation."
                                                                    : "Customers transfer money directly to your bank account"
                                                            }
                                                        </p>
                                                    )}
                                                    
                                                    {/* Show add bank account button */}
                                                    {bankAccounts.length === 0 && canUseBankTransfer && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowBankAccountModal(true)}
                                                            className="mt-2 px-4 py-2 bg-[#72b01d] hover:bg-[#3f7d20] text-white text-xs md:text-sm font-medium rounded-lg transition-colors"
                                                        >
                                                            Add Bank Account
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Validation message */}
                                        {((itemType === ItemType.DIGITAL && !bankTransfer) || (itemType === ItemType.PHYSICAL && !cashOnDelivery && !bankTransfer)) && (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                <p className="text-xs md:text-sm text-red-700">
                                                    ⚠️ {itemType === ItemType.DIGITAL 
                                                        ? "Bank transfer is required for digital products. Cash on delivery is not available."
                                                        : "Please select at least one payment method for this listing."
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Policy Options */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-[#0d0a0b] text-sm md:text-base mb-3">
                                        📋 Order Policy
                                    </h3>
                                    <div className="space-y-3">
                                        {/* Non-Refundable Option */}
                                        <div className="p-4 md:p-6 rounded-xl border" style={{ 
                                            backgroundColor: 'rgba(251, 191, 36, 0.08)', 
                                            borderColor: 'rgba(251, 191, 36, 0.25)' 
                                        }}>
                                            <div className="flex items-start gap-2 md:gap-3">
                                                <input
                                                    id="non-refundable-checkbox"
                                                    type="checkbox"
                                                    checked={nonRefundable}
                                                    onChange={e => setNonRefundable(e.target.checked)}
                                                    className="w-4 md:w-5 h-4 md:h-5 rounded mt-0.5 shadow-sm"
                                                    style={{ accentColor: '#92400e' }}
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor="non-refundable-checkbox" className="font-semibold cursor-pointer text-sm md:text-base flex items-center gap-2" style={{ color: '#92400e' }}>
                                                        <FiInfo size={18} />
                                                        Non-Refundable Item
                                                    </label>
                                                    <p className="text-xs md:text-sm mt-1" style={{ color: '#78350f' }}>
                                                        This item cannot be refunded once purchased. Customers will be notified before completing their order.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0 mt-6 md:mt-10">
                                <button
                                    type="button"
                                    className="w-full md:w-auto px-6 md:px-8 py-3 bg-white text-[#454955] border border-[#45495522] rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-[#454955]/30"
                                    onClick={() => goToStep(7)}
                                >
                                    ← Back
                                </button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={submitting}
                                    className="w-full md:w-auto px-6 md:px-8 py-3"
                                    disabled={
                                        submitting ||
                                        (itemType === ItemType.PHYSICAL && !deliveryType) ||
                                        (itemType === ItemType.PHYSICAL && deliveryType === "paid" && (!deliveryPerItem || !deliveryAdditional)) ||
                                        ((itemType === ItemType.DIGITAL && !bankTransfer) || (itemType === ItemType.PHYSICAL && !cashOnDelivery && !bankTransfer))
                                    }
                                >
                                    Update Listing ✨
                                </Button>
                            </div>
                        </div>
                    )}
                </form>

                <style>{`
          .animate-fade-in {
            animation: fadeIn 0.3s;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: none; }
          }
        `}</style>

                {/* Add Bank Account Modal */}
                <AddBankAccountModal
                    isOpen={showBankAccountModal}
                    onClose={() => setShowBankAccountModal(false)}
                    onBankAccountAdded={(updatedAccounts) => {
                        setBankAccounts(updatedAccounts);
                        setShowBankAccountModal(false);
                    }}
                />
            </div>
            <Footer />
        </>
    );
}
