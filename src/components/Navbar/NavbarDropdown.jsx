"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
export default function NavbarDropdown() {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);
	const router = useRouter();

	function toggleDropdown() {
		setIsOpen(!isOpen);
	}
  function handleLogout() {
    router.push("/signin");
  }

	useEffect(() => {
		const handleClickOutside = (event) => {};
	});
	return (
		<div className="relative" ref={dropdownRef}>
			<button className="flex" onClick={toggleDropdown}>
				<Image src="/icons/user.svg" alt="" width={24} height={24} />
			</button>
			{isOpen && (
				<ul className="absolute right-0 top-10 w-[250px] border-b border-x border-zinc-300">
					<li className="bg-slate-50 hover:bg-slate-200 border-b border-slate-300">
						<Link className="block p-4" href="/dashboard">
							Dashboard
						</Link>
					</li>
					<li className="bg-slate-50 hover:bg-slate-200">
						<button className="w-full p-4 text-left" onClick={handleLogout}>Sign Out</button>
					</li>
				</ul>
			)}
		</div>
	);
}
