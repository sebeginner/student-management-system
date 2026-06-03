# Bộ tài liệu dự án Student Management System SE104

Tài liệu trong thư mục `docs/` dùng để thống nhất cách hiểu giữa các thành viên khi hiện thực hệ thống Quản lý học sinh.

## Danh sách tài liệu

| File | Mục đích | Người dùng chính |
|---|---|---|
| `srs.md` | Đặc tả yêu cầu phần mềm: phạm vi, actor, chức năng FR/NFR | Cả nhóm, GVHD |
| `use-cases.md` | 21 use case đã implement với luồng nghiệp vụ chi tiết | BA/PO, Backend, Frontend |
| `business-rules.md` | Quy tắc nghiệp vụ cần validate trong service/backend | Backend, QA |
| `api-spec.md` | Hợp đồng API: đầy đủ endpoint, request, response, quyền | Backend, Frontend |
| `authorization.md` | Ma trận phân quyền, giải thích GVCN/GVBM scope | Backend, QA |
| `database-design.md` | Thiết kế dữ liệu, ràng buộc, mapping nghiệp vụ | Backend, DB/QA |
| `architecture.md` | Kiến trúc hệ thống, module, luồng request | Backend, Frontend |
| `test-plan.md` | Kế hoạch kiểm thử, test cases, checklist demo | QA, cả nhóm |
| `demo-flow.md` | Script demo qua Swagger/Postman với endpoint thực tế | Cả nhóm |
| `final-demo-script.md` | Script thuyết trình đầy đủ theo từng vai trò | Cả nhóm |
| `sprint-plan.md` | Kế hoạch 2 tuần, phân công và mốc hoàn thành | Cả nhóm |
| `test-auth-login.md` | Test cases riêng cho auth/login | QA |
| `viva-prep.md` | Ôn vấn đáp: kiến trúc, DB, flow, 40+ Q&A, 15 tình huống modify | Sinh viên bảo vệ |

## Nguyên tắc thống nhất

1. `srs.md` là tài liệu yêu cầu gốc.
2. `use-cases.md` diễn giải yêu cầu thành use case cụ thể.
3. `business-rules.md` là nguồn chính cho validation nghiệp vụ ở backend service.
4. `database-design.md` phải khớp với `backend/prisma/schema.prisma`.
5. `api-spec.md` là hợp đồng bắt buộc giữa backend và frontend.
6. `authorization.md` là nguồn sự thật về phân quyền (AGENTS.md §2 cũng là nguồn sự thật).
7. `test-plan.md` kiểm tra lại use case, business rule và API.
8. Khi thay đổi schema/API, phải cập nhật tài liệu liên quan trong cùng Pull Request.

## Nguồn sự thật

| Loại thông tin | Nguồn chính |
|---|---|
| API endpoint, HTTP method, params | `backend/src/**/*.controller.ts` + `docs/api-spec.md` |
| Prisma models, enums, relations | `backend/prisma/schema.prisma` + `docs/database-design.md` |
| Seed data, demo accounts, năm học | `backend/prisma/seed.ts` + `AGENTS.md §13` |
| Business rules, RBAC principles | `AGENTS.md` + `docs/business-rules.md` |
| Frontend routes, pages | `frontend/src/router/` + `frontend/README.md` |

## Definition of Done cho tài liệu

Một tài liệu được xem là xong khi:

- Có mục đích rõ ràng.
- Không mâu thuẫn với code thực tế.
- Không mâu thuẫn với `AGENTS.md`.
- Được ít nhất 1 thành viên khác đọc và xác nhận.
