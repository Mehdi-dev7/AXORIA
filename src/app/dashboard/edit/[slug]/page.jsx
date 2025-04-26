import { getPostForEdit } from "@/lib/serverMethods/blog/postMethods";
import ClientEditForm from "./(components)/ClientEditForm";
import { Types} from "mongoose";

export default async function EditPostPage({ params }) {
	const { slug } = await params;
	const post = await getPostForEdit(slug);
	// console.log(post, "post from edit page");

	const serializablePost = JSON.parse(JSON.stringify(post, (key, value) => Types.ObjectId ? value.toString() : value));
	

	return <ClientEditForm post={serializablePost} />
}
