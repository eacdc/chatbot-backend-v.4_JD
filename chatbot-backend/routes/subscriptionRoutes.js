const express = require("express");
const Subscription = require("../models/Subscription");
const Book = require("../models/Book");
const User = require("../models/User");
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware"); // Middleware to get logged-in user

// ✅ Subscribe to a book (Ensuring user details come from authentication)
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { bookId } = req.body;

    // Get logged-in user's ID from middleware
    // FIXED: Changed req.user.id to req.user.userId to match how it's set in your auth middleware
    const userId = req.user.userId;
    
    console.log("👤 User Info from Token:", req.user);
    
    // Fetch user details from database
    const user = await User.findById(userId);
    console.log("📋 User from Database:", user);
    
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate if the book exists
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    // Check if the user is already subscribed
    const existingSubscription = await Subscription.findOne({ userId, bookId });
    if (existingSubscription) {
      return res.status(400).json({ error: "Already subscribed to this book" });
    }

    // Save new subscription with actual user details
    const newSubscription = new Subscription({
      userId,
      userName: user.fullname,
      bookId,
      bookTitle: book.title,
      bookCoverImgLink: book.bookCoverImgLink
    });

    await newSubscription.save();
    res.status(201).json({ message: "Subscribed successfully!", subscription: newSubscription });

  } catch (err) {
    console.error("Error subscribing:", err.message);
    res.status(500).json({ error: `Failed to subscribe: ${err.message}` });
  }
});

// ✅ Get all subscriptions for the logged-in user
router.get("/my-subscriptions", authenticateUser, async (req, res) => {
  try {
    // FIXED: Changed req.user.id to req.user.userId
    const userId = req.user.userId; 
    const subscriptions = await Subscription.find({ userId });
    res.json(subscriptions);
  } catch (err) {
    console.error("Error fetching subscriptions:", err.message);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// ✅ Get all subscriptions for any user by userId (Admin Use)
router.get("/:userId", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.params.userId });
    res.json(subscriptions);
  } catch (err) {
    console.error("Error fetching user subscriptions:", err.message);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// Update existing subscriptions with book cover links
router.post("/update-covers", authenticateUser, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({});
    let updated = 0;

    for (const subscription of subscriptions) {
      // Find the associated book
      const book = await Book.findById(subscription.bookId);
      if (book && book.bookCoverImgLink) {
        // Update the subscription with the book cover link
        subscription.bookCoverImgLink = book.bookCoverImgLink;
        await subscription.save();
        updated++;
      }
    }

    res.status(200).json({ 
      message: `Updated ${updated} of ${subscriptions.length} subscriptions with book cover links` 
    });
  } catch (err) {
    console.error("Error updating subscriptions with book covers:", err.message);
    res.status(500).json({ error: `Failed to update subscriptions: ${err.message}` });
  }
});

// ✅ Unsubscribe from a book
router.delete("/:bookId", authenticateUser, async (req, res) => {
  try {
    // Get logged-in user's ID from middleware
    const userId = req.user.userId;
    const { bookId } = req.params;
    
    // Find and delete the subscription
    const subscription = await Subscription.findOneAndDelete({ userId, bookId });
    
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }
    
    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (err) {
    console.error("Error unsubscribing:", err.message);
    res.status(500).json({ error: `Failed to unsubscribe: ${err.message}` });
  }
});

// Admin endpoint to update all subscriptions with book cover links (no auth for easy updating)
router.get("/admin/update-all-covers", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({});
    let updated = 0;

    for (const subscription of subscriptions) {
      // Find the associated book
      const book = await Book.findById(subscription.bookId);
      if (book && book.bookCoverImgLink) {
        // Update the subscription with the book cover link
        subscription.bookCoverImgLink = book.bookCoverImgLink;
        await subscription.save();
        updated++;
      }
    }

    res.status(200).json({ 
      message: `Updated ${updated} of ${subscriptions.length} subscriptions with book cover links`,
      subscriptions: await Subscription.find({})
    });
  } catch (err) {
    console.error("Error updating subscriptions with book covers:", err.message);
    res.status(500).json({ error: `Failed to update subscriptions: ${err.message}` });
  }
});

module.exports = router;