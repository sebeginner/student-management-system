# Test Cases — Auth Login

Endpoint: `POST /api/v1/auth/login`

---

## 1. Đăng nhập thành công

| ID | Tình huống | Input | Kết quả mong đợi |
|---|---|---|---|
| TC01 | Admin đăng nhập đúng | username: `admin`, password: `Admin@123` | 200, có `token`, role = `ADMIN` |
| TC02 | Giáo vụ đăng nhập đúng | username: `giaovu01`, password: `Staff@123` | 200, có `token`, role = `ACADEMIC_STAFF` |
| TC03 | BGH đăng nhập đúng | username: `manager01`, password: `Manager@123` | 200, có `token`, role = `MANAGER` |
| TC04 | Giáo viên 1 đăng nhập đúng | username: `teacher01`, password: `Teacher@123` | 200, có `token`, role = `TEACHER` |
| TC05 | Giáo viên 2 đăng nhập đúng | username: `teacher02`, password: `Teacher@123` | 200, có `token`, role = `TEACHER` |
| TC06 | Học sinh đăng nhập đúng | username: `student01`, password: `Student@123` | 200, có `token`, role = `STUDENT` |

---

## 2. Đăng nhập thất bại

| ID | Tình huống | Input | Kết quả mong đợi |
|---|---|---|---|
| TC07 | Sai password | username: `admin`, password: `sai123` | 401, có message lỗi |
| TC08 | Sai username | username: `khongco`, password: `Admin@123` | 401, có message lỗi |
| TC09 | Để trống username | username: ``, password: `Admin@123` | 400, có message lỗi |
| TC10 | Để trống password | username: `admin`, password: `` | 400, có message lỗi |
| TC11 | Để trống cả hai | username: ``, password: `` | 400, có message lỗi |
| TC12 | Username đúng, password viết hoa | username: `admin`, password: `admin@123` | 401, có message lỗi |

---

## 3. Kiểm tra token

| ID | Tình huống | Cách test | Kết quả mong đợi |
|---|---|---|---|
| TC13 | Token hợp lệ dùng được | Dùng token từ TC01 gọi `GET /api/v1/auth/me` | 200, trả về thông tin user |
| TC14 | Không có token | Gọi `GET /api/v1/auth/me` không kèm token | 401 |
| TC15 | Token sai | Gọi `GET /api/v1/auth/me` với token giả | 401 |

---

## 4. Kiểm tra phân quyền cơ bản

| ID | Tình huống | Cách test | Kết quả mong đợi |
|---|---|---|---|
| TC16 | Student không truy cập được API của Giáo vụ | Dùng token `student01` gọi API quản lý học sinh | 403 |
| TC17 | Teacher không truy cập được API của Admin | Dùng token `teacher01` gọi API quản lý users | 403 |

---

## Cách test bằng Swagger

1. Mở http://localhost:3000/api
2. Tìm endpoint `POST /auth/login`
3. Bấm **Try it out**
4. Nhập username/password theo từng test case
5. Ghi lại status code và response nhận được
6. So sánh với cột "Kết quả mong đợi"

---

## Ghi kết quả

| ID | Kết quả thực tế | Pass/Fail | Ghi chú |
|---|---|---|---|
| TC01 | | | |
| TC02 | | | |
| TC03 | | | |
| TC04 | | | |
| TC05 | | | |
| TC06 | | | |
| TC07 | | | |
| TC08 | | | |
| TC09 | | | |
| TC10 | | | |
| TC11 | | | |
| TC12 | | | |
| TC13 | | | |
| TC14 | | | |
| TC15 | | | |
| TC16 | | | |
| TC17 | | | |