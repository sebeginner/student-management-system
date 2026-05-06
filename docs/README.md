# Bộ tài liệu dự án Student Management System

Tài liệu trong thư mục `docs/` dùng để thống nhất cách hiểu giữa các thành viên khi hiện thực hệ thống Quản lý học sinh.

## Danh sách tài liệu

| File | Mục đích | Người dùng chính |
|---|---|---|
| `srs.md` | Đặc tả yêu cầu phần mềm: phạm vi, actor, chức năng, phi chức năng | Cả nhóm, GVHD |
| `use-cases.md` | Danh sách use case và mô tả luồng nghiệp vụ | BA/PO, Backend, Frontend |
| `business-rules.md` | Quy tắc nghiệp vụ cần validate trong service/backend | Backend, QA |
| `api-spec.md` | Hợp đồng API giữa backend và frontend | Backend, Frontend |
| `database-design.md` | Thiết kế dữ liệu dựa trên Prisma schema | Backend, DB/QA |
| `architecture.md` | Kiến trúc hệ thống, module, luồng request | Backend, Frontend |
| `test-plan.md` | Kế hoạch kiểm thử và test case thủ công | QA, cả nhóm |
| `sprint-plan.md` | Kế hoạch 2 tuần, phân công và mốc hoàn thành | Cả nhóm |

## Nguyên tắc thống nhất

1. `srs.md` là tài liệu yêu cầu gốc.
2. `use-cases.md` diễn giải yêu cầu thành use case.
3. `business-rules.md` là nguồn chính cho validation nghiệp vụ.
4. `database-design.md` phải khớp với `backend/prisma/schema.prisma`.
5. `api-spec.md` là hợp đồng bắt buộc giữa backend và frontend.
6. `test-plan.md` kiểm tra lại use case, business rule và API.
7. Khi thay đổi schema/API, phải cập nhật tài liệu liên quan trong cùng Pull Request.

## Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| Draft | Mới đề xuất, chưa chắc chắn |
| Approved | Đã được nhóm thống nhất |
| Implementing | Đang hiện thực |
| Done | Đã code, test và demo được |

## Definition of Done cho tài liệu

Một tài liệu được xem là xong khi:

- Có mục đích rõ ràng.
- Có phạm vi áp dụng.
- Có liên kết với use case/API/schema nếu liên quan.
- Không mâu thuẫn với các tài liệu khác.
- Được ít nhất 1 thành viên khác đọc và xác nhận.
