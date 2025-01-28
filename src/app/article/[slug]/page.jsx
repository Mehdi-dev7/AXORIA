import { getPost } from "@/lib/serverMethods/blog/postMethods";
import Link from "next/link";

export default async function page({ params }) {
	const { slug } = await params;
  const post = await getPost(slug);
	return (
		<main className="u-main-container u-padding-content-container">
			<h1 className="text-4xl mb-3">{post.title}</h1>
			<p className="mb-6">{post.tags.map(tag => (
				<Link key={tag.slug} href={`categories/tag/${tag.slug}`} className="mr-4 underline">#{tag.name}</Link>
			))}</p>
      <div className="article-styles" dangerouslySetInnerHTML={{__html: post.markdownHTMLResult}}>

			</div>
		</main>
	);
}
