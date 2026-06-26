import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return new Response("Missing url parameter", { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return new Response("Failed to fetch image", { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    return new Response(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
