import User from '../models/userModel.js'
import jwt from "jsonwebtoken"

export default async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized or token missing'
        })
    }

    try {
        const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(payload.id).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'user not found.'
            })
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("JWT verification failed: ", err);
        return res.status(401).json({
            success: false,
            message: 'Token invalid or expired.'
        })
    }
}
