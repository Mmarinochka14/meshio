import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import AboutPage from "../pages/AboutPage";
import BuyerProfilePage from "../pages/BuyerProfilePage";
import CartPage from "../pages/CartPage";
import CatalogPage from "../pages/CatalogPage";
import ContactsPage from "../pages/ContactsPage";
import FAQPage from "../pages/FAQPage";
import FavoritesPage from "../pages/FavoritesPage";
import HomePage from "../pages/HomePage";
import MyModelsPage from "../pages/MyModelsPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProductPage from "../pages/ProductPage";
import PrivacyPage from "../pages/PrivacyPage";
import SellerLayout from "../layouts/SellerLayout";
import SellerProfilePage from "../pages/SellerProfilePage";
import SellerModelsPage from "../pages/SellerModelsPage";
import SellerStorePage from "../pages/SellerStorePage";

import AdminLayout from "../pages/admin/AdminLayout";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminRequestsPage from "../pages/admin/AdminRequestsPage";
import AdminProfilePage from "../pages/admin/AdminProfilePage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        <Route
          path="/catalog"
          element={
            <MainLayout>
              <CatalogPage />
            </MainLayout>
          }
        />

        <Route
          path="/products/:id"
          element={
            <MainLayout>
              <ProductPage />
            </MainLayout>
          }
        />

        <Route
          path="/sellers/:id"
          element={
            <MainLayout>
              <SellerStorePage />
            </MainLayout>
          }
        />

        <Route
          path="/favorites"
          element={
            <MainLayout>
              <FavoritesPage />
            </MainLayout>
          }
        />

        <Route
          path="/cart"
          element={
            <MainLayout>
              <CartPage />
            </MainLayout>
          }
        />

        <Route
          path="/my-models"
          element={
            <MainLayout>
              <MyModelsPage />
            </MainLayout>
          }
        />

        <Route
          path="/about"
          element={
            <MainLayout>
              <AboutPage />
            </MainLayout>
          }
        />

        <Route
          path="/contacts"
          element={
            <MainLayout>
              <ContactsPage />
            </MainLayout>
          }
        />

        <Route
          path="/privacy"
          element={
            <MainLayout>
              <PrivacyPage />
            </MainLayout>
          }
        />

        <Route
          path="/buyer/profile"
          element={
            <MainLayout>
              <BuyerProfilePage />
            </MainLayout>
          }
        />

        <Route
          path="/faq"
          element={
            <MainLayout>
              <FAQPage />
            </MainLayout>
          }
        />

        <Route
          path="/seller/profile"
          element={
            <SellerLayout>
              <SellerProfilePage />
            </SellerLayout>
          }
        />

        <Route
          path="/seller/models"
          element={
            <SellerLayout>
              <SellerModelsPage />
            </SellerLayout>
          }
        />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
