import { getPostsByTag } from "@/lib/serverMethods/blog/postMethods";
import { notFound } from "next/navigation";

export default async function TagPage({ params }) {

  const { tag } = await params;
	const posts = await getPostsByTag(tag);
 console.log(posts, "posts from tag page");
 

  return(
    <main></main>
  )
}
