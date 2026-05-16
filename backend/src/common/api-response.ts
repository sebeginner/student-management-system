export function successResponse<T>(data: T, message = 'Success') {
  return { data, message };
}
