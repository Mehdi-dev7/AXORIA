"use server";
import { Post } from "@/lib/models/post";
import { Tag } from "@/lib/models/tag";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import slugify from "slugify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

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

		marked.use(
			markedHighlight({
				highlight: (code, language) => {
					const validLanguage = Prism.languages[language]
						? language
						: "plaintext";
					return Prism.highlight(
						code,
						Prism.languages[validLanguage],
						validLanguage
					);
				},
			})
		);

		let markdownHTMLResult = marked(markdownArticle);
		console.log(markdownHTMLResult, "markdownHTMLResult");

		markdownHTMLResult = DOMPurify.sanitize(markdownHTMLResult);

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
