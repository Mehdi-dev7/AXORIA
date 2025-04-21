"use server";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import slugify from "slugify";
import { User } from "@/lib/models/user";
import bcrypt from "bcryptjs";
import { Session } from "@/lib/models/session";
import { cookies } from "next/headers";

export async function register(formData) {
	const { userName, email, password, passwordRepeat } =
		Object.fromEntries(formData); // On ne peut pas faire du destrtucuting de formData ce n est pas un obj iterable

	if (userName.lenght < 3) {
		throw new Error("Username is too short");
	}

	if (password.length < 6) {
		throw new Error("Password is too short");
	}

	if (password !== passwordRepeat) {
		throw new Error("Passwords do not match");
	}

	try {
		connectToDB();
		const user = await User.findOne({ userName });

		if (user) {
			throw new Error("Username already exists");
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

		console.log("User saved to db");

		return { success: true };
	} catch (error) {
		console.log("Error while creating the user:", error);
		throw new Error(
			error.message || "An error occured while creating the user"
		);
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
		let session
		const existingSession = await Session.findOne({
			userId: user._id,
			expiresAt: { $gt: new Date() },
		});
		if (existingSession) {
			session = existingSession;
		  existingSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
			await existingSession.save();
		} else {
			session = new Session({
				userId: user._id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			});
			await session.save();
		}

		const cookieStore = await cookies()
		cookieStore.set("sessionId", session._id.toString(), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: 7 * 24 *60 * 60,
			sameSite: "Lax" // Attaques CSRF
		})
		
		

		return {success : true}

	} catch (error) {
		console.log("Error while signing in the user :",error);

		throw new Error(
			error.message || "An error occured while signing in the user"
		);
		
	}
}
