import { getPostsByAuthor } from "@/lib/serverMethods/blog/postMethods";
import BlogCard from "@/components/BlogCard";

export default async function AuthorPage({ params }) {

	const { author } = await params;
	const postsData = await getPostsByAuthor(author);
	// console.log(postsData, "posts from author page");

	return (
		<main className="u-main-container u-padding-content-container">
			<h1 className="t-main-title">Posts from {postsData.author.userName} 👨‍💻</h1>
			<p className="t-main-subtitle">
				Every post from that author.
			</p>
      <p className="mr-4 text-md text-zinc-900">Latest articles</p>
      <ul className="u-article-grid">
        {postsData.posts.length > 0 ? (
          postsData.posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))
        ) : (
          <li>No articles for that author. 🤷‍♂️</li>
        )}
      </ul>
		</main>
	);
}
