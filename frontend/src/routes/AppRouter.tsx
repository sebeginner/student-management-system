import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<div className="p-10">Trang Login</div>} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<div>Dashboard Page</div>} />
        <Route path="students" element={<div>Danh sách Học sinh</div>} />
        <Route path="classes" element={<div>Danh sách Lớp học</div>} />
        <Route path="scores" element={<div>Nhập điểm</div>} />
      </Route>
    </Routes>
  );
};