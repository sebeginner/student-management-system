import { Outlet, Link } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Hệ thống QLHS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Dashboard</Link>
          <Link to="/students" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Học sinh</Link>
          <Link to="/classes" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Lớp học</Link>
          <Link to="/scores" className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Nhập điểm</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <span className="text-sm font-medium text-gray-700">Admin</span>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet/> 
        </div>
      </main>
    </div>
  );
};