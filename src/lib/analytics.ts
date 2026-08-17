import { nestAdminAnalytics } from "@/lib/nest/client";
import type { NestAdminAnalytics } from "@/lib/nest/types";

export type AdminAnalytics = NestAdminAnalytics;

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return nestAdminAnalytics();
}
