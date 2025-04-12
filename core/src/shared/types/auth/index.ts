import { Wallet } from "ethers";
import { z } from "zod";

export const SiweVerifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
});

export const RegisterSchema = z.object({
  walletAddress: z.string().min(1),
});
