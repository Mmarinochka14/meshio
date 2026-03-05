import { BrowserRouter, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import BuyerProfilePage from "../pages/BuyerProfilePage";
import CatalogPage from "../pages/CatalogPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProductPage from "../pages/ProductPage";
import RegisterPage from "../pages/RegisterPage";
import SellerDashboardPage from "../pages/SellerDashboardPage";

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

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
