import { BrowserRouter, Route, Routes } from "react-router-dom";

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
import SellerDashboardPage from "../pages/SellerDashboardPage";
import SellerLayout from "../layouts/SellerLayout";
import SellerProfilePage from "../pages/SellerProfilePage";
import SellerModelsPage from "../pages/SellerModelsPage";

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
          path="/seller/profile"
          element={
            <SellerLayout>
              <SellerProfilePage />
            </SellerLayout>
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
          path="/seller/models"
          element={
            <SellerLayout>
              <SellerModelsPage />
            </SellerLayout>
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
          path="/buyer/profile"
          element={
            <MainLayout>
              <BuyerProfilePage />
            </MainLayout>
          }
        />

        <Route
          path="/seller/dashboard"
          element={
            <MainLayout>
              <SellerDashboardPage />
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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
