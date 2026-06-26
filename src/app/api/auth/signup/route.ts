import prisma from "@/lib/prisma";
import { hashPassword } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Double check constraints
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Create user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    // Create default settings for user
    await prisma.settings.create({
      data: {
        userId: user.id,
        theme: "dark",
        defaultModel: "gemini-1-5-pro",
        temperature: 0.7
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to register user." }, { status: 500 });
  }
}
