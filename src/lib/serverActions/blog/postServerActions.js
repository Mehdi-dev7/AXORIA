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
import { AppError } from "@/lib/utils/errorHandling/customError";
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export async function addPost(formData) {
	const { title, markdownArticle, tags } = Object.fromEntries(formData);

	try {

		if(typeof title !== "string" || title.trim().length < 3) {
			throw new AppError("Invalid data")
		}
		if(typeof markdownArticle !== "string" || markdownArticle.trim().length === 0) {
			throw new AppError("Invalid data")
		}
		
		await connectToDB();

		const session = await sessionInfo()
		if(!session.success) {
			throw new AppError("Authentication required")
		}

		// Gestion des tags
		if(typeof tags !== "string" ) {
			throw new AppError("Invalid data")
		}

		const tagNamesArray = JSON.parse(tags);
		if(!Array.isArray(tagNamesArray)) {
			throw new AppError("Tags must be a valid array")
		}


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
		
		if(err instanceof AppError) {
			throw err
		}
		throw new AppError("An error occured while creating the post")
	}
}
