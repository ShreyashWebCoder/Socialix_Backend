const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const cloudinary = require("../config/cloudinary");
const formidable = require("formidable");
const { default: mongoose } = require("mongoose");

exports.addPost = async (req, res) => {
    try {
        const form = formidable({});
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({
                    message: "Error in Formidable Parse.",
                    err: err,
                });
            }

            const post = new Post();
            if (fields.text) {
                post.text = fields.text;
            }
            if (files.media) {
                const uploadedImage = await cloudinary.uploader.upload(
                    files.media.filepath,
                    {
                        folder: "SocialixWebApp/Posts",
                    }
                );
                if (!uploadedImage) {
                    return res.status(400).json({
                        message: "Error while uploading Post.",
                    });
                }
                post.media = uploadedImage.secure_url;
                post.public_id = uploadedImage.public_id;
            }
            post.admin = req.user._id;
            const newpost = await post.save();

            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $push: { posts: newpost._id },
                },
                { new: true }
            );
            res.status(201).json({
                message: "Post Created Successfully !",
                newpost,
            });
        });
    } catch (error) {
        res.status(400).json({
            message: "Error in Add Post.",
            err: error,
        });
    }
};

exports.allPost = async (req, res) => {
    try {
        const { page } = req.query;
        let pageNumber = page;

        if (!page || !page === undefined) {
            pageNumber = 1;
        }
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * 3)
            .limit(3)
            .populate("admin")
            .populate({ path: "likes", select: "-password" })
            .populate({
                path: "comments",
                populate: {
                    path: "admin",
                    model: "user",
                },
            });
        res.status(200).json({
            message: "Post Fetch Successfully !",
            posts,
            page: pageNumber,
        });
    } catch (error) {
        res.status(400).json({
            message: "Error in All Post.",
            err: error,
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "ID is required !",
            });
        }
        const postExists = await Post.findById(id);
        if (!postExists) {
            return res.status(400).json({
                message: "Post not found !",
            });
        }

        const userId = req.user._id;
        if (postExists.admin.toString() !== userId.toString()) {
            return res.status(400).json({
                message: "You are not authorized to delete this post !",
            });
        }

        if (postExists.media) {
            // Delete the image from Cloudinary
            await cloudinary.uploader.destroy(postExists.public_id, (err, result) => {
                if (err) {
                    return res.status(400).json({
                        message: "Error in deleting image from Cloudinary.",
                        err: err,
                    });
                }
                console.log({ err, result });
            });
        }
        await Comment.deleteMany({ _id: { $in: postExists.comments } });
        await User.updateMany(
            {
                $or: [{ posts: id }, { reposts: id }, { replies: id }],
            },
            {
                $pull: {
                    posts: id,
                    reposts: id,
                    replies: id,
                },
            },
            { new: true }
        );

        await Post.findByIdAndDelete(id);
        res.status(200).json({
            message: "Post Deleted Successfully !",
        });
    } catch (error) {
        res.status(400).json({
            message: "Error in Delete Post.",
            err: error.message,
        });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "ID is required !",
            });
        }
        const postExists = await Post.findById(id);
        if (!postExists) {
            return res.status(400).json({
                message: "Post not found !",
            });
        }

        const userId = req.user._id;
        if (postExists.likes.includes(userId)) {
            await Post.findByIdAndUpdate(
                id,
                {
                    $pull: { likes: userId },
                },
                { new: true }
            );
            //   await User.findByIdAndUpdate(
            //     userId,
            //     {
            //       $pull: { likes: id },
            //     },
            //     { new: true }
            //   );
            return res.status(400).json({
                message: "Post Unliked Successfully !",
            });
        }

        await Post.findByIdAndUpdate(
            id,
            {
                $push: { likes: userId },
            },
            { new: true }
        );
        // await User.findByIdAndUpdate(
        //   userId,
        //   {
        //     $push: { likes: id },
        //   },
        //   { new: true }
        // );
        return res.status(200).json({
            message: "Post Liked Successfully !",
        });
    } catch (error) {
        res.status(400).json({
            message: "Error in Like Post.",
            err: error,
        });
    }
};

exports.repost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "ID is required !",
            });
        }
        const postExists = await Post.findById(id);
        if (!postExists) {
            return res.status(400).json({
                message: "Post not found !",
            });
        }

        const newId = new mongoose.Types.ObjectId(id);
        if (req.user.reposts.includes(newId)) {
            return res.status(400).json({
                message: "You have already reposted this post !",
            });
        }

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { reposts: postExists._id },
            },
            { new: true }
        );
        return res.status(201).json({
            message: "Post Reposted Successfully !",
        });
    } catch (error) {
        res.status(400).json({
            message: "Error in Repost Post.",
            err: error,
        });
    }
};

exports.singlePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "ID is required !",
            });
        }
        const postExists = await Post.findById(id)
            .populate({ path: "admin", select: "-password" })
            .populate({ path: "likes", select: "-password" })
            .populate({
                path: "comments",
                populate: {
                    path: "admin",
                }
            });
            
        if (!postExists) {
            return res.status(400).json({
                message: "Post not found !",
            });
        }
        res.status(200).json({
            message: "Post Fetched Successfully !",
            post: postExists,
        });
    } catch (error) {
        res.status(400).json({
            message: "Error in Single Post.",
            err: error,
        });
    }
};

// exports.updatePost = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return res.status(400).json({
//         message: "ID is required !",
//       });
//     }
//     const postExists = await Post.findById(id);
//     if (!postExists) {
//       return res.status(400).json({
//         message: "Post not found !",
//       });
//     }

//     const userId = req.user._id;
//     if (postExists.admin.toString() !== userId.toString()) {
//       return res.status(400).json({
//         message: "You are not authorized to update this post !",
//       });
//     }

//     const form = formidable({});
//     form.parse(req, async (err, fields, files) => {
//       if (err) {
//         return res.status(400).json({
//           message: "Error in Formidable Parse.",
//           err: err,
//         });
//       }

//       if (fields.text) {
//         postExists.text = fields.text;
//       }
//       if (files.media) {
//         // Delete the old image from Cloudinary
//         await cloudinary.uploader.destroy(postExists.public_id, (err, result) => {
//           if (err) {
//             return res.status(400).json({
//               message: "Error in deleting image from Cloudinary.",
//               err: err,
//             });
//           }
//           console.log({ err, result });
//         });

//         const uploadedImage = await cloudinary.uploader.upload(
//           files.media.filepath,
//           {
//             folder: "SocialixWebApp/Posts",
//           }
//         );
//         if (!uploadedImage) {
//           return res.status(400).json({
//             message: "Error while uploading Post.",
//           });
//         }
//         postExists.media = uploadedImage.secure_url;
//         postExists.public_id = uploadedImage.public_id;
//       }

//       await postExists.save();
//       res.status(200).json({
//         message: "Post Updated Successfully !",
//         postExists,
//       });
//     });
//   } catch (error) {
//     res.status(400).json({
//       message: "Error in Update Post.",
//       err: error,
//     });
//   }
// };
