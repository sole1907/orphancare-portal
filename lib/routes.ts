export const publicRoutes = [
  "/complete-registration",
  "/login",
  "/forgot-password",
];

export const isPublicRoute = (pathname: string): boolean => {
  console.log("Checking if public route:", pathname);
  return publicRoutes.some((route) => pathname.startsWith(route));
};
