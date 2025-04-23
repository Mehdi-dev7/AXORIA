import Image from "next/image";
import { getPost } from "@/lib/serverMethods/blog/postMethods";
import Link from "next/link";
import "prism-themes/themes/prism-material-oceanic.css";
import "./article-styles.css";

export default async function page({ params }) {
	const { slug } = await params;
	const post = await getPost(slug);
	return (
		<main className="u-main-container u-padding-content-container">
			<h1 className="text-4xl mb-3">{post.title}</h1>
			<p className="mb-6">
				By&nbsp;
				<Link href={`/categories/author/${post.author.normalizedUserName}`} className="underline mr-4">
					{post.author.userName}
				</Link>
				{post.tags.map((tag) => (
					<Link
						key={tag.slug}
						href={`/categories/tag/${tag.slug}`}
						className="mr-4 underline"
					>
						#{tag.name}
					</Link>
				))}
			</p>
			<Image
				src={post.coverImageUrl}
				alt={post.title}
				width={1280}
				height={720}
				className="mb-10"
			/>
			<div
				className="article-styles"
				dangerouslySetInnerHTML={{ __html: post.markdownHTMLResult }}
			></div>
		</main>
	);
}
