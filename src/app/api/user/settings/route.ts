import prisma from "@/lib/prisma";
import { auth, hashPassword } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user and their settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create default settings if they do not exist
    let settings = user.settings;
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          theme: "dark",
          defaultModel: "gemini-1-5-pro",
          temperature: 0.7
        }
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name || "",
        email: user.email || ""
      },
      settings: {
        theme: settings.theme,
        defaultModel: settings.defaultModel,
        temperature: settings.temperature
      }
    });
  } catch (error: any) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to load settings." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, theme, defaultModel, temperature, currentPassword, newPassword } = body;

    // Update user profile name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name }
      });
    }

    // Update settings if provided
    await prisma.settings.upsert({
      where: { userId },
      update: {
        theme: theme !== undefined ? theme : undefined,
        defaultModel: defaultModel !== undefined ? defaultModel : undefined,
        temperature: temperature !== undefined ? parseFloat(temperature) : undefined
      },
      create: {
        userId,
        theme: theme || "dark",
        defaultModel: defaultModel || "gemini-1-5-pro",
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7
      }
    });

    // Update password if password details are sent
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.password) {
        return NextResponse.json({ error: "User or password record not found." }, { status: 404 });
      }

      const hashedCurrent = await hashPassword(currentPassword);
      if (hashedCurrent !== user.password) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
      }

      const hashedNew = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNew }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully!"
    });
  } catch (error: any) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings." }, { status: 500 });
  }
}
