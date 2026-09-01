import express from "express";
import { userLogin, userRegister, updateUser, updatePassword,getAllUsers ,getStats,getUserDetails,getLoginUser} from "../controllers/userController.js";
import { userAuth,isAdmin } from "../middlewares/authMiddlewares.js";
import upload from "../middlewares/multer.js";

// FIX: Used express.Router() properly
const router = express.Router();

// REGISTER || POST
router.post("/register", userRegister);

// LOGIN || POST
router.post("/login", userLogin);

// UPDATE PROFILE || PATCH
router.patch("/update/:id", userAuth, upload.single("image"), updateUser);

// UPDATE PASSWORD || PATCH
router.patch("/update-password/:id", userAuth, updatePassword);

// GET ALL USERS || GET
router.get("/get-all", userAuth, isAdmin, getAllUsers);
// GET ALL STATS || GET
router.get("/get-stats", userAuth, isAdmin, getStats);
// GET USERS DETAILS || GET
router.get("/get-user/:id", userAuth, isAdmin, getUserDetails);
//GET LOGIN USERS DETAILS || GET
router.get("/get-login-user/:id", userAuth, getLoginUser);

export default router;