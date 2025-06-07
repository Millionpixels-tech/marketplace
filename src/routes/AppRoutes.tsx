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

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/create-shop" element={<ProtectedRoute><CreateShop /></ProtectedRoute>} />
    <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
    <Route path="/listing/:id" element={<ListingPage />} />
    <Route path="/listing/:listingId/edit" element={<EditListing />} />
    <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/search" element={<Search />} />
    <Route path="/order/:id" element={<OrderPage />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/shop/:username" element={<ShopPage />} />
    <Route path="/dashboard/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/edit-shop/:shopId" element={<EditShop />} />
    <Route path="/profile/:id" element={<PublicProfile />} />
    <Route path="/reset-password" element={<ResetPassword />} />
  </Routes>
);

export default AppRoutes;
