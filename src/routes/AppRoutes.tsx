import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Auth from "../pages/Auth";
import CreateShop from "../pages/CreateShop";
import AddListing from "../pages/AddListing";
import ListingPage from "../pages/ListingPage";
import EditListing from "../pages/EditListing";
import Search from "../pages/Search";
import Cart from "../pages/Cart";
import ShopPage from "../pages/ShopPage";
import Profile from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import OrderPage from "../pages/OrderPage";
import WishlistPage from "../pages/WishlistPage";
import CheckoutPage from "../pages/CheckoutPage";
import EditShop from "../pages/EditShop";
import PublicProfile from "../pages/PublicProfile";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/create-shop" element={<ProtectedRoute><CreateShop /></ProtectedRoute>} />
    <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
    <Route path="/listing/:id" element={<ListingPage />} />
    <Route path="/listing/:listingId/edit" element={<EditListing />} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/search" element={<Search />} />
    <Route path="/order/:id" element={<OrderPage />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/shop/:username" element={<ShopPage />} />
    <Route path="/dashboard/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/edit-shop/:shopId" element={<EditShop />} />
    <Route path="/profile/:id" element={<PublicProfile />} />
  </Routes>
);

export default AppRoutes;
