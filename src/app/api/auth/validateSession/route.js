import { Session } from "@/lib/models/session";
import { User } from "@/lib/models/user";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const sessionId = (await cookies()).get("sessionId")?.value;

		if (!sessionId) {
			return NextResponse.json({ authorized: false }, { status: 401 });
		}

		await connectToDB();

		const session = await Session.findOne({ _id: sessionId });

		if (!session || session.expiresAt < Date.now()) {
			return NextResponse.json({ authorized: false }, { status: 401 });
		}

		const user = await User.findById(session.userId);

		if (!user) {
			return NextResponse.json({ authorized: false }, { status: 401 });
		}

		return NextResponse.json(
			{ authorized: true, userId: user._id.toString() },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error while validating session", error);
		return NextResponse.json({ authorized: false }, { status: 500 });
	}
}
