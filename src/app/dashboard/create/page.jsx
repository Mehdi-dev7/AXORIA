"use client";
import { addPost } from "@/lib/serverActions/blog/postServerActions";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function page() {
	const [tags, setTags] = useState([]);

	const router = useRouter();

	const tagInputRef = useRef(null);
	const submitButtonRef = useRef(null);
	const serverValidationText = useRef(null);
	const imgUploaderValidationText = useRef(null);

	async function handleSubmit(e) {
		e.preventDefault();

		const formData = new FormData(e.target);
		formData.set("tags", JSON.stringify(tags));
		// console.log();

		// for (const [key, value] of formData.entries()) {
		// 	console.log(key, value);
		// }

		serverValidationText.current.textContent = "";
		submitButtonRef.current.textContent = "Saving Post ...";
		submitButtonRef.current.disabled = true;

		try {
			const result = await addPost(formData);

			if (result.success) {
				submitButtonRef.current.textContent = "Post saved ✅";

				let countdown = 3;
				serverValidationText.current.textContent = `Redirecting in ${countdown} seconds...`;
				const interval = setInterval(() => {
					countdown -= 1;
					serverValidationText.current.textContent = `Redirecting in ${countdown} seconds...`;
					if (countdown === 0) {
						clearInterval(interval);
						router.push(`/article/${result.slug}`);
					}
				}, 1000);
			}
		} catch (error) {
			serverValidationText.current.textContent = `${error.message}`;
			submitButtonRef.current.textContent = "Submit";
			submitButtonRef.current.disabled = false;
		}
	}
	function handleAddTag() {
		// e.preventDefault() ici on n en a pas besoin vu qu on a deja specifier ds le  props du button que c est un type button

		const newTag = tagInputRef.current.value.trim().toLowerCase(); // on recupere la valeur de ce qui a été saisi trim est pr de supprimer les espaces et toLow  on la transforme en minuscule

		if (newTag !== "" && !tags.includes(newTag) && tags.length <= 4) {
			setTags([...tags, newTag]);
			tagInputRef.current.value = "";
		}
	}

	function handleRemoveTag(tagToRemove) {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	}

	function handleEnterOnTagInput(e) {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		}
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		console.log(file);
		if (!validImageTypes.includes(file.type)) {
			imgUploaderValidationText.current.textContent =
				"Please upload a valid image (JPEG, PNG or WebP.";
			e.target.value = "";
			return;
		} else {
			imgUploaderValidationText.current.textContent = "";
		}
		const img = new Image();
		img.addEventListener("load", checkImgSizeOnLoad);

		function checkImgSizeOnLoad() {
			if (img.width > 1280 || img.height > 720) {
				imgUploaderValidationText.current.textContent =
					"Image exceeds 1280x720 dimensions";
				e.target.value = "";
				URL.revokeObjectURL(img.src);
				return;
			} else {
				imgUploaderValidationText.current.textContent = "";
				URL.revokeObjectURL(img.src);
			}
		}
		img.src = URL.createObjectURL(file);
	}

	return (
		<main className="u-main-container bg-white p-7 mt-32 mb-44">
			<h1 className="text-4xl mb-4">Write an article 📝</h1>

			<form onSubmit={handleSubmit} className="pb-6">
				<label htmlFor="title" className="f-label">
					Title
				</label>
				<input
					type="text"
					name="title"
					className="shadow border rounded w-full p-3 mb-7 text-gray-700 focus:outline-slate-400"
					id="title"
					placeholder="Title"
					required
				/>

				<label htmlFor="coverImage" className="f-label">
					Cover image (1280x720 for the best quality, or less)
				</label>
				<input
					type="file"
					name="coverImage"
					id="coverImage"
					required
					placeholder="Article's cover image"
					className="shadow cursor-pointer border rounded w-full p-3 mb-2 text-gray-700 focus:outline-none focus:shadow-outline"
					onChange={handleFileChange}
				/>
				<p ref={imgUploaderValidationText} className="text-red-700 mb-7"></p>

				<div className="mb-10">
					<label className="f-label" htmlFor="tag">
						Add a tag(s) &nbsp; (optional, max 5)
					</label>
					<div className="flex">
						<input
							type="text"
							className="shadow border rounded p-3 text-gray-700 focus:outline-slate-400"
							id="tag"
							placeholder="Add a tag"
							ref={tagInputRef}
							onKeyDown={handleEnterOnTagInput}
						/>
						<button
							className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold p-4 rounded mx-4"
							onClick={handleAddTag}
							type="button" // c est pour specifier que c est juste un button par defaut ds un formulaire le button submit le form.
						>
							Add
						</button>
						<div className="flex items-center grow whitespace-nowrap overflow-y-auto shadow border rounded px-3">
							{tags.map((tag) => (
								<span
									key={tag}
									className="inline-block whitespace-nowrap bg-gray-200 text-gray-700 rounded-full px-3 py-1 mr-2 text-sm font-semibold"
								>
									{tag}
									<button
										type="button"
										onClick={() => handleRemoveTag(tag)}
										className="text-red-500 ml-2"
									>
										&times;
									</button>
								</span>
							))}
						</div>
					</div>
				</div>

				<label htmlFor="markdown" className="f-label">
					Write your article using markdown - do not repeat already given title
				</label>
				<a
					target="_blank"
					href="https://www.markdownguide.org/cheat-sheet/"
					className="block mb-4 text-blue-600"
				>
					How to use the markdown syntax ?
				</a>

				<textarea
					name="markdownArticle"
					id="markdownArticle"
					required
					className="shadow border rounded w-full p-8 text-gray-700 mb-4 focus:outline-slate-400 min-h-44 text-xl appearance-none"
				></textarea>

				<button
					ref={submitButtonRef}
					className="min-w-44 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded border-none mb-4"
				>
					Submit
				</button>
				<p ref={serverValidationText}></p>
			</form>
		</main>
	);
}
