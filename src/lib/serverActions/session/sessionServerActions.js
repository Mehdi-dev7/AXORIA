"use server";
import { Session } from "@/lib/models/session";
import { User } from "@/lib/models/user";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { AppError } from "@/lib/utils/errorHandling/customError";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import slugify from "slugify";

export async function register(formData) {
	const { userName, email, password, passwordRepeat } =
		Object.fromEntries(formData); // On ne peut pas faire du destrtucuting de formData ce n est pas un obj iterable

	try {
		if (typeof userName !== "string" || userName.trim().length < 3) {
			throw new AppError("Username must be at least 3 characters long");
		}

		if (typeof password !== "string" || password.trim().length < 6) {
			throw new AppError("Password must be at least 6 characters long");
		}

		if (password !== passwordRepeat) {
			throw new AppError("Passwords do not match");
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (typeof email !== "string" || !emailRegex.test(email.trim())) {
			throw new AppError("Invalid email format");
		}

		await connectToDB();
		const user = await User.findOne({ $or: [{ userName }, { email }] });

		if (user) {
			throw new AppError(
				user.userName === userName
					? "Username already exists"
					: "Email already exists"
			);
		}
		const normalizedUserName = slugify(userName, { lower: true, strict: true });

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			userName,
			normalizedUserName,
			email,
			password: hashedPassword,
		});

		await newUser.save();

		// console.log("User saved to db");

		return { success: true };
	} catch (error) {
		console.log("Error while registering the user", error);
		if (error instanceof AppError) {
			throw error;
		}
		throw new Error("An error occured while registering the user");
	}
}

export async function login(formData) {
	// const { userName, password } = Object.fromEntries(formData);  ou bien
	const userName = formData.get("userName");
	const password = formData.get("password");

	try {
		await connectToDB();

		const user = await User.findOne({ userName });
		if (!user) {
			throw new Error("Invalid credentials"); // on dit cela parce que l on ne sait pas si c est le userName ou le mdp qui est faux
		}
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new Error("Invalid credentials");
		}
		// Vérifier si l'utilisateur est déjà connecté
		let session;
		const existingSession = await Session.findOne({
			userId: user._id,
			expiresAt: { $gt: new Date() },
		});
		if (existingSession) {
			session = existingSession;
			existingSession.expiresAt = new Date(
				Date.now() + 7 * 24 * 60 * 60 * 1000
			); // 7 days
			await existingSession.save();
		} else {
			session = new Session({
				userId: user._id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			});
			await session.save();
		}

		const cookieStore = await cookies();
		cookieStore.set("sessionId", session._id.toString(), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: 7 * 24 * 60 * 60,
			sameSite: "Lax", // Attaques CSRF
		});

		revalidateTag("auth-session");
		return { success: true };
	} catch (error) {
		console.log("Error while signing in the user :", error);

		throw new Error(
			error.message || "An error occured while signing in the user"
		);
	}
}

export async function logout() {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get("sessionId")?.value;

	try {
		await Session.findByIdAndDelete(sessionId);

		cookieStore.set("sessionId", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: 0, // On supprime le cookie immédiatement
			sameSite: "strict",
		});
		revalidateTag("auth-session");
		return { success: true };
	} catch (error) {
		console.log("Error while signing out the user :", error);
	}
}

export async function isPrivatePage(pathname) {
	const privateSegments = ["/dashboard", "/settings/profile"];

	return privateSegments.some(
		(segment) => pathname === segment || pathname.startsWith(segment + "/")
	);
}

export async function SAsessionInfo() {
	
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    return {success: false, userId: null}
  }
  
  await connectToDB();
  const session = await Session.findById(sessionId);

  if (!session || session.expiresAt < new Date()) {
    return {success: false, userId: null}
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return {success: false, userId: null}
  }

  return {success: true, userId: user._id.toString()}
}