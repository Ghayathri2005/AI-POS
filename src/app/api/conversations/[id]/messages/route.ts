import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    if (conversation.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch messages." }, { status: 500 });
  }
}
