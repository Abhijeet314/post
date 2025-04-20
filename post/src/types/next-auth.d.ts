import { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the Session type
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    accessSecret?: string;
    user: {
      id: string;
      email: string;
      name: string;
    }
  }
}