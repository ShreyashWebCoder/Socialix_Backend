const express = require("express");
const {
  signIn,
  login,
  userDetails,
  followUser,
  updateProfile,
  logout,
  searchUser,
  myInfo,
} = require("../controllers/user.controllers");

const authMiddleware = require("../middleware/auth.middleware");
const {
  addPost,
  allPost,
  deletePost,
  likePost,
  repost,
  singlePost,
} = require("../controllers/post.controllers");
const {
  addComment,
  deleteComment,
} = require("../controllers/comment.controllers");

const router = express.Router();

// Auth Routes
router.route("/signin").post(signIn);
router.route("/login").post(login);

router.route("/logout").post(authMiddleware, logout);
router.route("/me").get(authMiddleware, myInfo);

//  User Routes
router.route("/user/:id").get(authMiddleware, userDetails);
router.route("/user/follow/:id").put(authMiddleware, followUser);
router.route("/update-profile").put(authMiddleware, updateProfile);
router.route("/users/search/:query").get(authMiddleware, searchUser);

// Post Routes
router.route("/post").post(authMiddleware, addPost);
router.route("/post").get(authMiddleware, allPost);
router.route("/post/:id").delete(authMiddleware, deletePost);
router.route("/post/like/:id").put(authMiddleware, likePost);
router.route("/repost/:id").put(authMiddleware, repost);
router.route("/post/:id").get(authMiddleware, singlePost);

// Comment Routes
router.route("/comment/:id").post(authMiddleware, addComment);
router.route("/comment/:postId/:id").delete(authMiddleware, deleteComment);

module.exports = router;
