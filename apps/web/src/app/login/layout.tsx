import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Login",
  description:
    "Sign in to GymFlow with your gym code and credentials. Try the demo accounts to explore owner, cashier, trainer, and member workflows.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
