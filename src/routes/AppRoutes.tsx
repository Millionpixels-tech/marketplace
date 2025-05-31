import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Auth from "../pages/Auth";
import CreateShop from "../pages/CreateShop";
import AddListing from "../pages/AddListing";
import ListingPage from "../pages/ListingPage";
import Search from "../pages/Search";
import Cart from "../pages/Cart";
import ShopPage from "../pages/ShopPage";
import Profile from "../pages/Profile";
import ProtectedRoute from "./ProtectedRoute";
import OrderPage from "../pages/OrderPage";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/create-shop" element={<ProtectedRoute><CreateShop /></ProtectedRoute>} />
    <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
    <Route path="/listing/:id" element={<ListingPage />} />
    <Route path="/search" element={<Search />} />
    <Route path="/order/:id" element={<OrderPage />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/shop/:username" element={<ShopPage />} />
    <Route path="/profile/:id" element={<Profile />} />
  </Routes>
);

export default AppRoutes;
