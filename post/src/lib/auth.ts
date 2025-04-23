import TwitterProvider from "next-auth/providers/twitter";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID ?? "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "tweet.read tweet.write users.read offline.access",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Record<string, unknown> }) {
      if (account) {
        token.accessToken = account.access_token as string;
      }
      return token;
    },
    async session(params: { session: Session; token: JWT; user?: Record<string, unknown>; trigger?: string }) {
      const { session, token } = params;
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      return `${baseUrl}/twitter`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = async () => {
  // @ts-expect-error - Ignore type errors for getServerSession
  return getServerSession(authOptions);
};