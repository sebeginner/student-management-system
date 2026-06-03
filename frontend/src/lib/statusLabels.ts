const statusLabels: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngưng hoạt động',
  LOCKED: 'Đã khóa',
  DISABLED: 'Đã vô hiệu',
  PENDING_CLASS_ASSIGNMENT: 'Chờ phân lớp',
  SUSPENDED: 'Tạm ngưng',
  TRANSFERRED: 'Đã chuyển',
  GRADUATED: 'Đã tốt nghiệp',
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  NEEDS_CORRECTION: 'Cần chỉnh sửa',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  HOMEROOM: 'Chủ nhiệm',
  SUBJECT: 'Bộ môn',
  ORAL_15M: 'Miệng / 15 phút',
  ONE_PERIOD: 'Một tiết',
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
};

export const getStatusLabel = (status?: string | null) =>
  status ? statusLabels[status] ?? status : '-';

export { statusLabels };
