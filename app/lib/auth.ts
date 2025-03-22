import { Session, TokenSet } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { signUpType } from "../packages/zod";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Enter your Email here..",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { data, success } = signUpType.safeParse(credentials);

        if (!success) {
          throw new Error("Email and min. 6 letter password are required.");
        } else {
          const existingUser = await prisma.user.findFirst({
            where: {
              email: data.email,
            },
          });
          if (existingUser) {
            const passwordValidation = await bcrypt.compare(
              data.password,
              existingUser.password
            );
            if (passwordValidation) {
              return {
                id: existingUser.id.toString(),
                name: existingUser.name,
                email: existingUser.email,
              };
            }
            return null;
          }

          try {
            const newUser = await prisma.user.create({
              data: {
                email: data.email,
                password: await bcrypt.hash(data.password, 10),
              },
            });

            return {
              id: newUser.id.toString(),
              name: newUser.name,
              email: newUser.email,
            };
          } catch (error) {
            console.error("Error creating user:", error);
            return null;
          }
        }
      },
    }),
  ],
  secret: process.env.JWT_SECRET || "secret",
  callbacks: {
    // async signIn({ account, profile }: { account: Account; profile: Profile }) {
    //   if (account.provider === "google") {
    //     return profile.email && profile.email.endsWith("@gmail.com");
    //   }
    //   return true;
    // },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: TokenSet;
    }): Promise<Session> {
      if (session.user) {
        session.user.email = token.sub as string;
      }
      return session;
    },
  },
};
