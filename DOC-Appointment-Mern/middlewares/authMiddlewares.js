import JWT from "jsonwebtoken";
// FIX: Imported userModel (make sure this path matches your folder structure)
import userModel from "../models/userModel.js"; 

//user auth
export const userAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(402).send({
        success: false,
        message: "Not Authorized User",
      });
    }
    const decode = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    res.status(402).send({
      success: false,
      message: "Error In User Auth",
      error,
    });
  }
};

//admin auth
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    // FIX: Cleaner syntax for checking admin status
    if (user.isAdmin !== true) {
      return res.status(402).send({
        success: false,
        message: "Unauthorized Access",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(402).send({
      success: false,
      message: "Error In Admin Auth",
      error,
    });
  }
};