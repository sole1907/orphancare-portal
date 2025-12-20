import { BACKEND_ENDPOINTS } from "./config";

// lib/proxyToFunction.ts
type ProxyOptions = {
  req: any;
  res: any;
  functionPath: string;
  method?: "POST" | "GET";
};

export async function proxyToFunction({
  req,
  res,
  functionPath,
  method = "POST",
}: ProxyOptions) {
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
