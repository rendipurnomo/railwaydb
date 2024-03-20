const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

dotenv.config()

exports.generateTokenAndSetCookie = (userId,res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  })

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  })
}

