import { getPostsByTag } from "@/lib/serverMethods/blog/postMethods";
import BlogCard from "@/components/BlogCard";


export default async function TagPage({ params }) {

	const { tag } = await params;
	const posts = await getPostsByTag(tag);
	// console.log(posts, "posts from tag page");

	return (
		<main className="u-main-container u-padding-content-container">
			<h1 className="t-main-title">Posts from the #{tag} tag.🏷️</h1>
			<p className="t-main-subtitle">
				All of the posts that use this tag.
			</p>
      <p className="mr-4 text-md text-zinc-900">Latest articles</p>
      <ul className="u-article-grid">
        {posts.length > 0 ? (
          posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))
        ) : (
          <li>No articles for that tag. 🤷‍♂️</li>
        )}
      </ul>
		</main>
	);
}
