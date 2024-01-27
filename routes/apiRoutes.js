const express = require("express");
const router = express.Router();
const userQueries = require("../queries/userQueries");
const multer = require("multer");
const { checkAuthenticated } = require("../middleware/authMiddleware");
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(null, "profile-" + Date.now() + ".jpg");
  },
});
const utilFunctions = require("../utils/utilFunctions");
const upload = multer({ storage });

router.get("/getUsername/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await userQueries.findById(id);
    if (user) {
      res.json(user.username);
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await utilFunctions.getCommentsForPost(postId); // Implement this function
    res.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).send("Error fetching comments");
  }
});

router.get("/posts/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const postData = await utilFunctions.getPostData(postId); // Implement this function
    res.json(postData);
  } catch (err) {
    console.error("Error fetching post data:", err);
    res.status(500).send("Error fetching post data");
  }
});

router.get("/comments/:commentId/replies", async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const replies = await utilFunctions.getRepliesForComment(commentId); // Implement this function
    res.json(replies);
  } catch (err) {
    console.error("Error fetching replies:", err);
    res.status(500).send("Error fetching replies");
  }
});

router.get("/posts", async (req, res) => {
  try {
    console.log("Fetching posts...");
    const posts = await utilFunctions.getPosts();
    res.json(posts);
    console.log(posts);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/user-details/:userId", async (req, res) => {
  try {
    const userDetails = await utilFunctions.getUserDetails(req.params.userId);
    res.json(userDetails);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/comments/:postId", async (req, res) => {
  try {
    const comments = await utilFunctions.getComments(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/tags/:postId", async (req, res) => {
  try {
    const tags = await utilFunctions.getTags(req.params.postId);
    res.json(tags);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/communities/:communitiesId", async (req, res) => {
  try {
    const communities = await utilFunctions.getCommunities(
      req.params.communitiesId
    );
    res.json(communities);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/link-preview/:link", async (req, res) => {
  try {
    const link = decodeURIComponent(decodeURIComponent(req.params.link));
    console.log("Link received for preview:", link);
    const linkPreview = await utilFunctions.getLinkPreview(link);
    console.log("Link preview data:", linkPreview);
    res.json(linkPreview);
  } catch (err) {
    console.error("Error in link preview route:", err);
    res.status(500).send(err.message);
  }
});

router.get("/commits", async (req, res) => {
  try {
    console.log("Fetching commits...");
    const commits = await utilFunctions.fetchCommits();
    res.json(commits);
  } catch (error) {
    res.status(500).json({ message: "Error fetching commits" });
  }
});

router.post(
  "/upload-profile-picture",
  checkAuthenticated,
  upload.single("file"),
  async (req, res) => {
    try {
      if (req.file.size > 1000000) {
        return res.status(400).send("File size too large");
      }
      const userId = req.user.userId;
      const filePath = req.file.path;
      await userQueries.updateProfilePicture(userId, filePath);
      res.redirect("back");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
