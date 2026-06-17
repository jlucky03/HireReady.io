import User from "../models/User.js";
import adminAuth from "../config/firebaseAdmin.js";

const getRoleFromEmail = (email) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = email?.toLowerCase();

  return adminEmails.includes(userEmail) ? "admin" : "user";
};

export const firebaseLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Firebase token is required",
      });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    const uid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name || email?.split("@")[0] || "User";
    const picture = decoded.picture || "";
    const provider =
      decoded.firebase?.sign_in_provider === "google.com"
        ? "google"
        : "password";

    const role = getRoleFromEmail(email);

    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (user) {
      user.firebaseUid = user.firebaseUid || uid;
      user.name = user.name || name;
      user.email = user.email || email;
      user.photoURL = picture || user.photoURL;
      user.authProvider = provider;
      user.credits = user.credits ?? 5;
      user.role = role;

      await user.save();
    } else {
      user = await User.create({
        firebaseUid: uid,
        name,
        email,
        photoURL: picture,
        authProvider: provider,
        credits: 5,
        role,
      });
    }

    res.status(200).json({
      status: "success",
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        credits: user.credits,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Firebase login error:", err.message);
    res.status(401).json({
      message: err.message,
    });
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Token missing.",
      });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    const user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found in database",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired Firebase token",
    });
  }
};