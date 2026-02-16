import React from 'react';
import { Route, Routes } from 'react-router-dom';

const AdminLayout = React.lazy(() => import('./AdminLayout'));
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
const StoreList = React.lazy(() => import('./stores/StoreList'));
const StoreForm = React.lazy(() => import('./stores/StoreForm'));
const StoreDetail = React.lazy(() => import('./stores/StoreDetail'));
const ProductList = React.lazy(() => import('./products/ProductList').then((m) => ({ default: m.ProductList })));
const ProductForm = React.lazy(() => import('./products/ProductForm').then((m) => ({ default: m.ProductForm })));
const ProductDetail = React.lazy(() => import('./products/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const ImportPage = React.lazy(() => import('./import/ImportPage'));
const SyncDashboard = React.lazy(() => import('./sync/SyncDashboard'));

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="stores" element={<StoreList />} />
        <Route path="stores/new" element={<StoreForm />} />
        <Route path="stores/:id" element={<StoreDetail />} />
        <Route path="stores/:id/edit" element={<StoreForm />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="sync" element={<SyncDashboard />} />
      </Route>
    </Routes>
  );
}
