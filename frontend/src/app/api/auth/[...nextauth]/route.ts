import axios from "axios";
import { image } from "motion/react-client";
import NextAuth, { DefaultSession , DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface User extends DefaultUser {
    internalId?: string;
  }

  interface Session {
    user: {
      internalId?: string; 
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    internalId?: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  
  callbacks: {
      async signIn({ user }) {
        try {
        const res = await axios.post("http://localhost:9100/user/create",
          { 
            email: user.email,
            image: user.image
          },{
           headers: {
             "Content-Type": "application/json"
           }}
        );

        const data = res.data.create;
        console.log("data",data);

        user.internalId = data.uniqueUserId;
        return true;
      } catch (e) {
        console.error("SignIn error:", e);
        return false;
      }
      },

      async session({ session, token }) {
        session.user.internalId = token.internalId;
        return session;
      },

      async jwt({ token, user }) {
        if (user) token.internalId = user.internalId;
        return token;
      },
     },

     secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };