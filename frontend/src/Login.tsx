import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Ngăn trang web bị tải lại khi bấm nút
    try {
      // Nhờ axios mang dữ liệu xuống cổng 3000 của Backend
      const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
        username: username,
        password: password,
      });

      // Nếu thành công, lấy "chìa khóa" lưu vào két sắt của trình duyệt (localStorage)
      localStorage.setItem('access_token', response.data.access_token);
      alert('🎉 Đăng nhập thành công!');

      // Chuyển hướng người dùng vào trang Dashboard
      navigate('/dashboard');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('❌ Đăng nhập thất bại: Sai tài khoản hoặc mật khẩu!');
      } else if (axios.isAxiosError(error)) {
        alert(`❌ Không kết nối được tới máy chủ (${error.message}).`);
      } else {
        alert('❌ Đăng nhập thất bại do lỗi không xác định.');
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '350px',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>ĐĂNG NHẬP</h2>

        <input
          type="text"
          placeholder="Tên đăng nhập (vd: admin)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />

        <input
          type="password"
          placeholder="Mật khẩu (vd: Admin@123)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Vào Hệ Thống
        </button>
      </form>
    </div>
  );
}

export default Login;
