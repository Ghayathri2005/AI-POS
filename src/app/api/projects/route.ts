import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        conversations: {
          select: {
            id: true,
            title: true,
            updatedAt: true
          },
          orderBy: { updatedAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id
      }
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project." }, { status: 500 });
  }
}
