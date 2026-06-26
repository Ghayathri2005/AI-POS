import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
        isArchived: false
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversations." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, projectId } = await req.json();

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "New Chat",
        userId: session.user.id,
        projectId: projectId || null
      }
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create conversation." }, { status: 500 });
  }
}
