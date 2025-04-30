import { Post } from "@/lib/models/post";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { notFound } from "next/navigation";
import { Tag } from "@/lib/models/tag";
import { User } from "@/lib/models/user";

export const dynamic = "force-static";

export async function getPost(slug) {
	await connectToDB();

	const post = await Post.findOne({ slug })
		.populate({
			path: "author",
			select: "userName normalizedUserName",
		})
		.populate({
			path: "tags",
			select: "name slug",
		});

	if (!post) {
		notFound();
	}

	return post;
}

export async function getPosts() {
	await connectToDB();

	const posts = await Post.find({});

	return posts;
}

export async function getUserPostsFromUserID(userId) {
	// console.log("Recherche des posts pour l'utilisateur:", userId);

	await connectToDB();

	const posts = await Post.find({ author: userId }).select("title _id slug");
	// console.log("Posts trouvés:", posts);

	return posts;
}

export async function getPostsByTag(tagSlug) {
	await connectToDB();

	const tag = await Tag.findOne({ slug: tagSlug });

	if (!tag) {
		notFound();
	}

	const posts = await Post.find({ tags: tag._id }).populate({
		path: "author",
		select: "userName",
	})
	.select("title coverImageUrl slug createdAt ")
	.sort({ createdAt: -1 });

	return posts;
}

export async function getPostsByAuthor(normalizedUserName) {
	await connectToDB();

	const author = await User.findOne({ normalizedUserName });

	if (!author) {
		notFound();
	}

	const posts = await Post.find({ author: author._id }).populate({
		path: "author",
		select: "userName normalizedUserName",
	})
	.select("title coverImageUrl slug createdAt ")
	.sort({ createdAt: -1 });

	return {
		posts,
		author,
	};
}

export async function getPostForEdit(id) {
	await connectToDB();

	const post = await Post.findOne({ _id: id })
		.populate({
			path: "author",
			select: "userName normalizedUserName",
		})
		.populate({
			path: "tags",
			select: "name slug",
		});

	if (!post) {
		notFound();
	}

	return post;
}
