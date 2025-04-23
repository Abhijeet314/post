import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// @ts-expect-error - Ignore type errors for NextAuth
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };