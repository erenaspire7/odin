import { z } from "zod";

export const AuthHeadersSchema = z.object({
  userAddress: z.string().min(1),
  signature: z.string().min(1),
});

export const AuthMessageSchema = z.object({
  expiresAt: z.string().datetime(), // ISO 8601 date string
});
