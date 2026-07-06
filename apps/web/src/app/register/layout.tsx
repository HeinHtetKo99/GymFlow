import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Create a Gym",
  description:
    "Register a new gym on GymFlow and become the owner. Set up staff, membership plans, attendance, and member onboarding.",
  path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
