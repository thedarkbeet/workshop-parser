import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for API routes, Next.js internals and files
  // that contain a dot (e.g. favicon.ico).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
