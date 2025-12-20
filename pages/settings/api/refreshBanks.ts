// pages/api/refreshBanks.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { proxyToFunction } from "@/lib/proxyToFunction";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return proxyToFunction({
    req,
    res,
    functionPath: "/refreshBanks",
  });
}
