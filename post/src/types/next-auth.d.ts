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