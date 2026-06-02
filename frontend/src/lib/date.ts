export const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
};

export const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
};
