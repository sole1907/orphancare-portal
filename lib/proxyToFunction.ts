// lib/proxyToFunction.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { BACKEND_ENDPOINTS } from "./config";

type ProxyOptions = {
  req: NextApiRequest;
  res: NextApiResponse;
  functionPath: string;
  method?: "POST" | "GET";
};

export async function proxyToFunction({
  req,
  res,
  functionPath,
  method = "POST",
}: ProxyOptions): Promise<void> {
  const idToken = req.headers.authorization;

  try {
    const response = await fetch(
      `${BACKEND_ENDPOINTS.apiBaseUrl}${functionPath}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken || "",
        },
        body: method === "POST" ? JSON.stringify(req.body) : undefined,
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
