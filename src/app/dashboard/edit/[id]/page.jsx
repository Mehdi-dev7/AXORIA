import { getPostForEdit } from "@/lib/serverMethods/blog/postMethods";
import ClientEditForm from "./(components)/ClientEditForm";

export default async function EditPostPage({ params }) {
	const { id } = await params;
	const post = await getPostForEdit(id);
	// console.log("Post avant sérialisation:", post);

	const serializablePost = JSON.parse(
		JSON.stringify(post, (key, value) => {
			if (value && typeof value === "object" && value._id) {
				return {
					...value,
					_id: value._id.toString(),
				};
			}
			return value;
		})
	);
	// console.log("Post après sérialisation:", serializablePost);

	return <ClientEditForm post={serializablePost} />;
}
