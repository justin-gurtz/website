import { headers } from "next/headers";
import { CRON_PRESHARED_KEY, NYTIMES_PRESHARED_KEY } from "@/env/secret";

const presharedKeys = {
  cron: CRON_PRESHARED_KEY,
  nytimes: NYTIMES_PRESHARED_KEY,
};

export const validatePresharedKey = async (key: keyof typeof presharedKeys) => {
  const headersList = await headers();
  const authorization = headersList.get("Authorization");

  const presharedKey = presharedKeys[key];

  if (authorization !== `Bearer ${presharedKey}`) {
    throw new Error("Invalid pre-shared key");
  }
};
