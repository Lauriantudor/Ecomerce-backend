import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import "dotenv/config";
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "TOP SECRETSASSASAASA";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "TOPS REFSECRETFDXSSSZsaaaaaa";
// SINGUP
const singup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({
                message: "This user is already registered.",
            });
        }
        const hashPasword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashPasword,
                refreshToken: "",
            },
        });
        res.status(200).json({
            message: "User created succeessfully",
            userId: newUser.id,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error registing.",
            error: error,
        });
    }
};
//LOGIN
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }
        const user = await prisma.user.findUnique({ where: { email: email } });
        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }
        const isPassworldvalid = await bcrypt.compare(password, user.password);
        if (!isPassworldvalid) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }
        const accesToken = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, ACCESS_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
            expiresIn: "7d",
        });
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // true doar pe producție (HTTPS)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            accessToken: accesToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error logging in.",
            error: error,
        });
    }
};
// REFRESH TOKEN
const refresh = async (req, res) => {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (!tokenFromCookie) {
        return res.status(401).json({
            message: "Session expired or token missing",
        });
    }
    try {
        const user = await prisma.user.findFirst({
            where: { refreshToken: tokenFromCookie },
        });
        if (!user) {
            return res.status(403).json({
                message: "Invalid refresh token",
            });
        }
        jwt.verify(tokenFromCookie, REFRESH_SECRET, (err, decoded) => {
            if (err || decoded.id !== user.id) {
                return res.status(403).json({
                    message: "Token neverificat sau expirat.",
                });
            }
            const newAccessToken = jwt.sign({
                userId: user.id,
                email: user.email,
                role: user.role,
            }, ACCESS_SECRET, { expiresIn: "15m" });
            res.status(200).json({
                accessToken: newAccessToken,
            });
        });
    }
    catch (error) {
        res.status(500).json(error);
    }
};
//LOGOUT
const logout = async (req, res) => {
    const tokenFromCookie = req.cookies?.refreshToken;
    try {
        if (tokenFromCookie) {
            await prisma.user.updateMany({
                where: { refreshToken: tokenFromCookie },
                data: { refreshToken: "" },
            });
        }
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        });
        res.status(200).json({
            message: "Disconect successfuly",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error at disconection",
        });
    }
};
const userController = {
    singup,
    login,
    refresh,
    logout,
};
export default userController;
