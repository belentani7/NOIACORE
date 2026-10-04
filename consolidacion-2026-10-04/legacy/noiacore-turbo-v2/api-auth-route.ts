import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateUser, createUser } from "@/lib/auth";
import { auditLog } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/auth/login") {
    return handleLogin(req);
  } else if (pathname === "/api/auth/signup") {
    return handleSignup(req);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleLogin(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const result = await authenticateUser(email, password);
    if (!result) {
      await auditLog("", "auth.failed", "User", `Failed login for ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await auditLog(result.user.id, "auth.success", "User", `Login successful`);

    return NextResponse.json(
      {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          tier: result.user.tier
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleSignup(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Invalid email or password (min 8 chars)" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const user = await createUser(email, password, name);
    await auditLog(user.id, "auth.signup", "User", `New user registered`);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
