import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function middleware(request) {
	//console.log("middleware!!!");
  
	const authCheckUrl = new URL("/api/auth/validateSession", request.url);

	const authResponse = await fetch(authCheckUrl, {
		headers: {
			cookie: (await cookies()).toString(),
		},
		cache: "force-cache",
		next: { tags: ["auth-session"] },
	});

	const { authorized } = await authResponse.json();

	if (!authorized) {
		return NextResponse.redirect(new URL("/signin", request.nextUrl.origin));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
