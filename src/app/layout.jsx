import Footer from "../components/Footer";
import Navbar from "../components/Navbar/Navbar";
import { AuthProvider } from "./AuthContext";
import "./globals.css";

export default function RootLayout({ children }) {
	return (
		<html lang="en" className="h-full">
			<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />

			<body className="flex min-h-full flex-col">
				<AuthProvider>
					<Navbar />
					<main className="grow">{children}</main>
				</AuthProvider>
				<Footer />
			</body>
		</html>
	);
}
