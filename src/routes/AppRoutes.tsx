import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Auth from "../pages/auth/Auth";
import CreateShop from "../pages/shop/CreateShop";
import AddListing from "../pages/listing/AddListing";
import ListingPage from "../pages/listing/ListingPage";
import EditListing from "../pages/listing/EditListing";
import Search from "../pages/Search";
import Cart from "../pages/Cart";
import CheckoutPage from "../pages/CheckoutPage";
import ShopPage from "../pages/shop/ShopPage";
import Profile from "../pages/user/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import OrderPage from "../pages/order/OrderPage";
import WishlistPage from "../pages/WishlistPage";
import EditShop from "../pages/shop/EditShop";
import PublicProfile from "../pages/user/PublicProfile";
import ResetPassword from "../pages/auth/ResetPassword";
import AdminPayments from "../pages/admin/AdminPayments";
import SellerGuide from "../pages/SellerGuide";
// Footer pages
import AboutUs from "../pages/AboutUs";
import OurStory from "../pages/OurStory";
import Careers from "../pages/Careers";
import Press from "../pages/Press";
import HelpCenter from "../pages/HelpCenter";
import CustomerService from "../pages/CustomerService";
import ReturnsRefunds from "../pages/ReturnsRefunds";
import ShippingInfo from "../pages/ShippingInfo";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfService from "../pages/TermsOfService";
import CookiePolicy from "../pages/CookiePolicy";
import CommunityGuidelines from "../pages/CommunityGuidelines";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/create-shop" element={<ProtectedRoute><CreateShop /></ProtectedRoute>} />
    <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
    <Route path="/listing/:id" element={<ListingPage />} />
    <Route path="/listing/:listingId/edit" element={<EditListing />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/search" element={<Search />} />
    <Route path="/order/:id" element={<OrderPage />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/shop/:username" element={<ShopPage />} />
    <Route path="/dashboard/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/edit-shop/:shopId" element={<EditShop />} />
    <Route path="/profile/:id" element={<PublicProfile />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/seller-guide" element={<SellerGuide />} />
    <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
    
    {/* Footer pages */}
    {/* Company */}
    <Route path="/about-us" element={<AboutUs />} />
    <Route path="/our-story" element={<OurStory />} />
    <Route path="/careers" element={<Careers />} />
    <Route path="/press" element={<Press />} />
    
    {/* Support */}
    <Route path="/help-center" element={<HelpCenter />} />
    <Route path="/customer-service" element={<CustomerService />} />
    <Route path="/returns-refunds" element={<ReturnsRefunds />} />
    <Route path="/shipping-info" element={<ShippingInfo />} />
    
    {/* Legal */}
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/cookie-policy" element={<CookiePolicy />} />
    <Route path="/community-guidelines" element={<CommunityGuidelines />} />
  </Routes>
);

export default AppRoutes;
