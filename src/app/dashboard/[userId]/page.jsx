import { getUserPostsFromUserID } from "@/lib/serverMethods/blog/postMethods";
import Link from "next/link";
import DeletePostButton from "./components/DeletePostButton";
export default async function Dashboard({ params }) {
	const { userId } = await params;
	// console.log("UserId reçu:", userId);

	const posts = await getUserPostsFromUserID(userId);
	// console.log("Posts récupérés:", posts);

	return (
		<main className="u-main-container u-padding-content-container">
			<h1 className="text-3xl mb-5">Dashboard - Your articles</h1>
			<ul>
				{posts.length > 0 ? (
					posts.map((post) => (
						<li
							key={post._id}
							className="flex items-center mb-2 bg-slate-50 py-2 pl-4"
						>
							<Link
								href={`/articles/${post.slug}`}
								className="mr-auto text-xl underline underline-offset-2 text-violet-600"
							>
								{post.title}
							</Link>
							<Link
								href={`/dashboard/edit/${post._id}`}
								className="bg-indigo-500 hover:bg-indigo-700 min-w-20 text-center text-white font-bold py-2 px-4 rounded mr-2"
							>
								Edit
							</Link>
							<DeletePostButton id={post._id.toString()} />
						</li>
					))
				) : (
					<li>You haven't created any articles yet.</li>
				)}
			</ul>
		</main>
	);
}
