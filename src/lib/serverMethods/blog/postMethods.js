import { Post } from "@/lib/models/post";
import { connectToDB } from "@/lib/utils/db/connectToDB";

export async function getPost(slug) {
  try {
    await connectToDB();

    const post = await Post.findOne({ slug });

    return post;
  }
  catch (err) {
    console.log("Error while getting the post:", err);
    throw new Error(err.message || "An error occured while getting the post");
  }
}

export async function getPosts() {
  try {
    await connectToDB();

    const posts = await Post.find({});

    return posts;
  }
  catch (err) {
    console.log("Error while getting the posts:", err);
    throw new Error(err.message || "An error occured while getting the posts");
  }

}