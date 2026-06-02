import { useEffect, useMemo, useState } from 'react';

export const usePagination = <T>(items: T[], pageSize = 20) => {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize],
  );

  // Reset to last valid page whenever the list shrinks.
  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, Math.ceil(items.length / pageSize))));
  }, [items.length, pageSize]);

  const slice = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const safeSetPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  return { page, setPage: safeSetPage, totalPages, slice };
};
