"use server";
import { Post } from "@/lib/models/post";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import slugify from "slugify";
import { Tag } from "@/lib/models/tag";
import { marked } from "marked";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

export async function addPost(formData) {
	const { title, markdownArticle, tags } = Object.fromEntries(formData);

	try {
		await connectToDB();

		// Gestion des tags
		const tagNamesArray = JSON.parse(tags);

		const tagIds = await Promise.all(
			tagNamesArray.map(async (tagName) => {
				const normalizedTagName = tagName.toLowerCase().trim();

				let tag = await Tag.findOne({ name: normalizedTagName });

				if (!tag) {
					tag = await Tag.create({
						name: normalizedTagName,
						slug: slugify(normalizedTagName, { strict: true }),
					});
				}

				return tag._id;
			})
		);

		// GEstion du markdown
		let markdownHTMLResult = marked(markdownArticle);
		console.log(markdownHTMLResult, "markdownHTMLResult");

		const newPost = new Post({
			title,
			markdownArticle,
			tags: tagIds,
			markdownHTMLResult,
		});

		const savedPost = await newPost.save();
		console.log("Post saved");

		return { success: true, slug: savedPost.slug };
	} catch (err) {
		console.log("Error while creating the post:", err);
		throw new Error(err.message || "An error occured while creating the post");
	}
}
