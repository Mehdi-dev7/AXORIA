import Link from "next/link";

export default function NotFound() {
	return (
		<div className="pt-44 text-center">
			<h1 className="text-4xl mb-4">404 - Page Not Found</h1>
			<p className="mb-4">
				Oops! The page you are looking for does not exist.
			</p>
			<Link href="/" className="underline">
				Return to the home page
			</Link>
		</div>
	);
}