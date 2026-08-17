import { NextResponse } from "next/server";
import { z } from "zod";
import { setAccessToken } from "@/lib/auth";
import { NestApiError, nestLogin } from "@/lib/nest/client";
import { homePathForRole, mapNestRole } from "@/lib/nest/roles";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    const result = await nestLogin(data.email, data.password);

    await setAccessToken(result.accessToken);

    const role = mapNestRole(result.user.role);
    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role,
        nestRole: result.user.role,
        agencyName: result.user.agencyName,
        avatarUrl: result.user.avatarUrl,
        emailVerified: Boolean(result.user.emailVerified),
      },
      redirectTo: homePathForRole(role),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Enter a valid email and a password of at least 8 characters." },
        { status: 400 },
      );
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
