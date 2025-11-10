export const publicRoutes = [
  "/complete-registration",
  "/login",
  "/forgot-password",
];

export const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some((route) => pathname.startsWith(route));
};
