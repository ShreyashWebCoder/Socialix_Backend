const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");
const mongoose = require("mongoose");           

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!id) {
      return res.status(400).json({
        message: "ID is required !",
      });
    }
    if (!text) {
      return res.status(400).json({
        message: "No Comment is Added !",
      });
    }

    const postExists = await Post.findById(id).select("-password");
    if (!postExists) {
      return res.status(400).json({
        message: "Post not found !",
      });
    }

    const userExists = await User.findById(req.user._id).select("-password");

    if (!userExists) {
      return res.status(400).json({
        message: "User not found !",
      });
    }
    const comment = new Comment({
      text,
      post: id,
      admin: userExists._id,
    });
    const newComment = await comment.save();
    await Post.findByIdAndUpdate(
      id,
      { $push: { comments: newComment._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { replies: newComment._id } },
      { new: true }
    ).select("-password");
    res.status(201).json({
      message: "Comment Added Successfully !",
      comment: newComment,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error in Adding Comment.",
      error: error.message,
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, id } = req.params;
    if (!postId || !id) {
      return res.status(400).json({
        message: "ID is required !",
      });
    }
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(400).json({
        message: "Post not found !",
      });
    }
    const commentExists = await Comment.findById(id);
    if (!commentExists) {
      return res.status(400).json({
        message: "Comment not found !",
      });
    }

    const newId = new mongoose.Types.ObjectId(id);
    if (postExists.comments.includes(newId)) {
      const id1 = commentExists.admin._id.toString();
      const id2 = req.user._id.toString();
      if (id1 !== id2) {
        return res.status(400).json({
          message: "You are not authorized to delete this comment !",
        });
      }

      await Post.findByIdAndUpdate(
        postId,
        { $pull: { comments: id } },
        { new: true }
      );
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { replies: id } },
        { new: true }
      );
      await Comment.findByIdAndDelete(id);
      return res.status(201).json({
        message: "Comment Deleted Successfully !",
      });
    }
    res.status(400).json({
      message: "Comment not found in this post !",
    });
  } catch (error) {
    res.status(400).json({
      message: "Error in Deleting Comment.",
      error: error.message,
    });
  }
};

