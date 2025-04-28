"use client";
import { useRef } from "react";
import { login } from "@/lib/serverActions/session/sessionServerActions";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthContext";

export default function page() {
	const {setIsAuthenticated} = useAuth();
	const serverInfoRef = useRef();
	const submitButtonRef = useRef();
	const router = useRouter();

	async function handleSubmit(e) {
		e.preventDefault();

		serverInfoRef.current.textContent = ""   // on vide le texte du ref
		submitButtonRef.current.disabled = true; // on désactive le bouton

		try {
			const result = await login(new FormData(e.target));
			if (result.success) {
				setIsAuthenticated({
					isConnected: true,
					userId: result.userId,
					loading: false
				})
				router.push("/")
			}
		}

		catch (error) {
			console.log("Error while signing in the user :",error);
			submitButtonRef.current.textContent = "Submit";
			serverInfoRef.current.textContent = `${error.message}`;
			submitButtonRef.current.disabled = false;

		}
}
	return (
		<form className="max-w-md mx-auto mt-36" onSubmit={handleSubmit}>
			<label htmlFor="userName" className="f-label">
				Your pseudo
			</label>
			<input
				type="text"
				className="f-auth-input"
				id="userName"
				name="userName"
				required
				placeholder="Your pseudo"
			/>
			<label htmlFor="password" className="f-label">
				Your password
			</label>
			<input
				type="password"
				className="f-auth-input"
				id="password"
				name="password"
				required
				placeholder="Your password"
			/>
			<button
				ref={submitButtonRef}
				className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 mt-6 mb-10 rounded border-none"
			>
				Submit
			</button>
			<p ref={serverInfoRef} className="text-center mb-10 text-red-500"></p>
		</form>
	);
}

