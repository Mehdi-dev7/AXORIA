"use server";
import { Post } from "@/lib/models/post";
import { Tag } from "@/lib/models/tag";
import { sessionInfo } from "@/lib/serverMethods/session/sessionMethods";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { AppError } from "@/lib/utils/errorHandling/customError";
import crypto from "crypto";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import sharp from "sharp";
import slugify from "slugify";
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
import { revalidatePath } from "next/cache";

export async function addPost(formData) {
	const { title, markdownArticle, tags, coverImage } =
		Object.fromEntries(formData);

	try {
		if (typeof title !== "string" || title.trim().length < 2) {
			throw new AppError("Invalid data");
		}
		if (
			typeof markdownArticle !== "string" ||
			markdownArticle.trim().length === 0
		) {
			throw new AppError("Invalid data");
		}

		await connectToDB();

		const session = await sessionInfo();
		if (!session.success) {
			throw new AppError("Authentication required");
		}

		// Gestion de l'image de couverture
		if (!coverImage || !coverImage instanceof File) {
			throw new AppError("Invalid cover image");
		}
		const validImageTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
		];
		if (!validImageTypes.includes(coverImage.type)) {
			throw new AppError("Invalid cover image");
		}

		const imageBuffer = Buffer.from(await coverImage.arrayBuffer());
		const { width, height } = await sharp(imageBuffer).metadata();
		if (width > 1280 || height > 720) {
			throw new AppError("Invalid cover image");
		}
		const uniqueFileName = `${crypto.randomUUID()}_${coverImage.name.trim()}`;

		const uploadUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${uniqueFileName}`;

		const publicImageUrl = `https://axoriablogeducation12.b-cdn.net/${uniqueFileName}`;

		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				accesskey: process.env.BUNNY_STORAGE_API_KEY,
				"Content-type": "application/octet-stream",
			},
			body: imageBuffer,
		});

		if (!response.ok) {
			throw new AppError(
				`Failed to upload cover image : ${response.statusText}`
			);
		}

		// Gestion des tags
		if (typeof tags !== "string") {
			throw new AppError("Invalid data");
		}

		const tagNamesArray = JSON.parse(tags);
		if (!Array.isArray(tagNamesArray)) {
			throw new AppError("Tags must be a valid array");
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

		// Gestion du markdown

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
			coverImageUrl: publicImageUrl,
			author: session.userId,
		});

		const savedPost = await newPost.save();
		console.log("Post saved");

		return { success: true, slug: savedPost.slug };
	} catch (err) {
		console.log("Error while creating the post:", err);

		if (err instanceof AppError) {
			throw err;
		}
		console.error(err);
		throw new AppError("An error occured while creating the post");
	}
}

export async function deletePost(id) {
	try {
		await connectToDB();
		const session = await sessionInfo();
		if (!session.success) {
			throw new AppError("Authentication required");
		}

		const post = await Post.findById(id);
		if (!post) {
			throw new AppError("Post not found");
		}

		// Vérifier si l'utilisateur est l'auteur du post
		if (post.author.toString() !== session.userId) {
			throw new AppError("You are not authorized to delete this post");
		}

		await Post.findByIdAndDelete(id);

		if (post.coverImageUrl) {
			const fileName = post.coverImageUrl.split("/").pop();
			const deleteUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;

			const response = await fetch(deleteUrl, {
				method: "DELETE",
				headers: {
					accesskey: process.env.BUNNY_STORAGE_API_KEY,
				},
			});

			if (!response.ok) {
				throw new AppError(
					`Failed to delete cover image : ${response.statusText}`
				);
			}
		}

		revalidatePath(`/articles/${post.slug}`);
		return { success: true };
	} catch (err) {
		console.log("Error while deleting the post:", err);

		if (err instanceof AppError) {
			throw err;
		}
		console.error(err);
		throw new AppError("An error occurred while deleting the post");
	}
}
