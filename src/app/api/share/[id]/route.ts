import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    return NextResponse.json({
      title: conversation.title || "Shared Chat",
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content
      }))
    });
  } catch (error: any) {
    console.error("Fetch shared chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch shared conversation." }, { status: 500 });
  }
}
