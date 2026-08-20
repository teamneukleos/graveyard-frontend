import { NextResponse } from "next/server";
import { z } from "zod";
import { NestApiError, nestRegister } from "@/lib/nest/client";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    role: z.enum(["CREATOR", "AGENCY"]).optional(),
    agencyName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "AGENCY" && !data.agencyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agency name is required",
        path: ["agencyName"],
      });
    }
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    const role = data.role === "AGENCY" ? "AGENCY" : "CREATOR";
    const agencyName = data.agencyName?.trim() || undefined;

    const result = await nestRegister({
      email: data.email,
      password: data.password,
      name: role === "AGENCY" ? agencyName! : data.name,
      role,
      agencyName,
    });

    // Do not set a session — user must verify email, then log in.
    return NextResponse.json({
      ok: true,
      email: result.user.email,
      message:
        "We sent a verification link to your email. Open it to verify your account, then log in.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid registration data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
