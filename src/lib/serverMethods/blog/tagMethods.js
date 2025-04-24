import { connectToDB } from "@/lib/utils/db/connectToDB";
import { Tag } from "@/lib/models/tag";

export async function getTags() {
  await connectToDB();

  const tags = await Tag.aggregate([
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "tags",
        as: "postsWithTag",
      },
    },
   {
    $addFields: {
      postCount: {
        $size: "$postsWithTag",
      },
      },
    },
    {
      $match: {
        postCount: { $gt: 0 },
      },
    },
    {
      $sort: { postCount: -1 },
    },
    {
      $project: {
        postsWithTag: 0,
      },
    },
  ]);

  return tags;
}