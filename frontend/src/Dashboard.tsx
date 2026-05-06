import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  // Lấy chìa khóa từ trong két sắt ra xem thử
  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token'); // Xóa chìa khóa
    navigate('/'); // Đuổi về trang đăng nhập
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Bảng Điều Khiển Hệ Thống Học Vụ</h1>
      {token ? (
        <div
          style={{
            backgroundColor: '#d4edda',
            padding: '20px',
            borderRadius: '8px',
            display: 'inline-block',
            marginTop: '20px',
          }}
        >
          <h3 style={{ color: '#155724' }}>Chào mừng Quản trị viên!</h3>
          <p>Bạn đã đăng nhập thành công và cầm trong tay chiếc thẻ Access Token.</p>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#f8d7da',
            padding: '20px',
            borderRadius: '8px',
            display: 'inline-block',
            marginTop: '20px',
          }}
        >
          <h3 style={{ color: '#721c24' }}>Bạn chưa đăng nhập!</h3>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Quay lại Đăng nhập
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
