import slugify from "slugify";
import mongoose from "mongoose";
import { Post } from "@/lib/models/post";

export async function generateUniqueSlug(title) {
	let slugCandidate = slugify(title, {lower: true, strict: true});

	let slugExists = await Post.findOne({slug: slugCandidate});

	let counter = 1;
	while (slugExists) {
		slugCandidate = `${slugCandidate}-${counter}`;
		slugExists = await Post.findOne({slug: slugCandidate});
		counter++;
	}

	return slugCandidate;
}


export function areTagSimilar(userTagsArray, DBTagsArray) {
	if (userTagsArray.length !== DBTagsArray.length) return false;

	const sortedUserTagsArray = [...userTagsArray].sort();
	const sortedDBTagsArray = DBTagsArray.map((tag) => tag.name).sort();

	return sortedUserTagsArray.every((tag, i) => tag === sortedDBTagsArray[i]);
}
