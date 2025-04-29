"use client";
import { useAuth } from "@/app/AuthContext";
import {
	isPrivatePage,
	logout,
} from "@/lib/serverActions/session/sessionServerActions";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function NavbarDropdown({ userId }) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);
	const router = useRouter();
	const { setIsAuthenticated } = useAuth();

	function toggleDropdown() {
		setIsOpen(!isOpen);
	}
	async function handleLogout() {
		const result = await logout();

		if (result.success) {
			setIsAuthenticated({
				isConnected: false,
				userId: null,
				loading: false,
			});
			if (isPrivatePage(window.location.pathname)) {
				router.push("/signin");
			}
		}
	}
	useEffect(() => {
		function handleClickOutside(event) {
			if (!dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);
	return (
		<div className="relative" ref={dropdownRef}>
			<button className="flex" onClick={toggleDropdown}>
				<Image src="/icons/user.svg" alt="" width={24} height={24} />
			</button>
			{isOpen && (
				<ul className="absolute right-0 top-10 w-[250px] border-b border-x border-zinc-300">
					<li className="bg-slate-50 hover:bg-slate-200 border-b border-slate-300">
						<Link
							className="block p-4"
							href={`/dashboard/${userId}`}
							onClick={() => setIsOpen(false)}
						>
							Dashboard
						</Link>
					</li>
					<li className="bg-slate-50 hover:bg-slate-200">
						<button className="w-full p-4 text-left" onClick={handleLogout}>
							Sign Out
						</button>
					</li>
				</ul>
			)}
		</div>
	);
}
