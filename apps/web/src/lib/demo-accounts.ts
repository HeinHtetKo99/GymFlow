import { DEFAULT_GYM_CODE } from "./config";

export type DemoAccount = {
  id: string;
  label: string;
  description: string;
  email: string;
  password: string;
  gymCode: string;
};

export const DEMO_PASSWORD = "password";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "owner",
    label: "Owner",
    description: "Analytics, setup, and staff",
    email: "owner@gymflow.test",
    password: DEMO_PASSWORD,
    gymCode: DEFAULT_GYM_CODE,
  },
  {
    id: "cashier",
    label: "Cashier",
    description: "Payments and attendance",
    email: "cashier@gymflow.test",
    password: DEMO_PASSWORD,
    gymCode: DEFAULT_GYM_CODE,
  },
  {
    id: "trainer",
    label: "Trainer",
    description: "Member workout and food plans",
    email: "trainer@gymflow.test",
    password: DEMO_PASSWORD,
    gymCode: DEFAULT_GYM_CODE,
  },
  {
    id: "member",
    label: "Member",
    description: "Portal, plans, and membership",
    email: "test@example.com",
    password: DEMO_PASSWORD,
    gymCode: DEFAULT_GYM_CODE,
  },
];
