"use server";
import { Post } from "@/lib/models/post";
import { Tag } from "@/lib/models/tag";
import { sessionInfo } from "@/lib/serverMethods/session/sessionMethods";
import { findOrCreateTag } from "@/lib/serverMethods/tag/tagMethods";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { AppError } from "@/lib/utils/errorHandling/customError";
import { areTagSimilar, generateUniqueSlug } from "@/lib/utils/general/utils";
import crypto from "crypto";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { revalidatePath } from "next/cache";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import sharp from "sharp";
import slugify from "slugify";
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

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
		if (!coverImage || !(coverImage instanceof File) || coverImage.size === 0) {
			throw new AppError("Cover image is required for new posts");
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

export async function editPost(formData) {
	const { postToEditStringified, title, markdownArticle, tags, coverImage } =
		Object.fromEntries(formData);

	const postToEdit = JSON.parse(postToEditStringified);

	// console.log(
	// 	postToEdit,
	// 	postToEditStringified,
	// 	title,
	// 	markdownArticle,
	// 	tags,
	// 	coverImage,
	// 	"postToEdit"
	// );

	try {
		await connectToDB();

		const session = await sessionInfo();
		if (!session.success) {
			throw new Error("Authentication required");
		}
		const updatedData = {};

		if (typeof title !== "string") throw new Error();
		if (title.trim() !== postToEdit.title) {
			updatedData.title = title;
			updatedData.slug = await generateUniqueSlug(title);
		}
		if (typeof markdownArticle !== "string") throw new Error();
		if (markdownArticle.trim() !== postToEdit.markdownArticle) {
			updatedData.markdownHTMLResult = DOMPurify.sanitize(
				marked(markdownArticle)
			);
			updatedData.markdownArticle = markdownArticle;
		}

		// Gestion de l'image de couverture
		if (coverImage && coverImage instanceof File && coverImage.size > 0) {
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
				throw new AppError("Invalid cover image dimensions");
			}

			// Supprimer l'ancienne image
			const toDeleteImageFileName = postToEdit.coverImageUrl.split("/").pop();
			const deleteUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${toDeleteImageFileName}`;

			const imageDeleteResponse = await fetch(deleteUrl, {
				method: "DELETE",
				headers: {
					accesskey: process.env.BUNNY_STORAGE_API_KEY,
				},
			});

			if (!imageDeleteResponse.ok && imageDeleteResponse.status !== 404) {
				throw new AppError(
					`Error while deleting the image : ${imageDeleteResponse.statusText}`
				);
			}

			// Upload la nouvelle image
			const imageToUploadFileName = `${crypto.randomUUID()}_${coverImage.name}`;
			const imageToUploadUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${imageToUploadFileName}`;
			const imageToUploadPublicUrl = `https://axoriablogeducation12.b-cdn.net/${imageToUploadFileName}`;

			const imageToUploadResponse = await fetch(imageToUploadUrl, {
				method: "PUT",
				headers: {
					accesskey: process.env.BUNNY_STORAGE_API_KEY,
					"Content-type": "application/octet-stream",
				},
				body: imageBuffer,
			});

			if (!imageToUploadResponse.ok) {
				throw new AppError(
					`Error while uploading the image : ${imageToUploadResponse.statusText}`
				);
			}

			updatedData.coverImageUrl = imageToUploadPublicUrl;
		}

		// Gestion des tags
		if (typeof tags !== "string") throw new Error();

		const tagNamesArray = JSON.parse(tags);
		if (!Array.isArray(tagNamesArray)) throw new AppError();

		if (!areTagSimilar(tagNamesArray, postToEdit.tags)) {
			const tagIds = await Promise.all(
				tagNamesArray.map((tag) => findOrCreateTag(tag))
			);
			updatedData.tags = tagIds;
		}

		if (Object.keys(updatedData).length === 0) throw new Error();

		const updatedPost = await Post.findByIdAndUpdate(
			postToEdit._id,
			updatedData,
			{ new: true }
		);

		revalidatePath(`/articles/${updatedPost.slug}`);

		return { success: true, slug: updatedPost.slug };
	} catch (err) {
		if (err instanceof AppError) {
			throw err;
		}
		console.error(err);
		throw new AppError("An error occured while editing the post");
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
			try {
				const fileName = post.coverImageUrl.split("/").pop();
				const deleteUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;

				const response = await fetch(deleteUrl, {
					method: "DELETE",
					headers: {
						accesskey: process.env.BUNNY_STORAGE_API_KEY,
					},
				});

				if (!response.ok && response.status !== 404) {
					throw new AppError(
						`Failed to delete cover image : ${response.statusText}`
					);
				}
			} catch (error) {
				console.error("Error deleting cover image:", error);
				// On continue même si la suppression de l'image échoue
			}
		}

		revalidatePath(`/articles/${post.slug}`);
	} catch (err) {
		console.log("Error while deleting the post:", err);

		if (err instanceof AppError) {
			throw err;
		}
		console.error(err);
		throw new AppError("An error occurred while deleting the post");
	}
}
