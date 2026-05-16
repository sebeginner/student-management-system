export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  studentId: number | null;
  teacherId: number | null;
}
