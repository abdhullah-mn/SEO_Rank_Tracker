import jwt from "jsonwebtoken";

export const JWT_ALGORITHM = "HS256";
export const JWT_ISSUER = process.env.JWT_ISSUER || "seo-rank-tracker-api";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "seo-rank-tracker-client";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters long.");
    }

    return secret;
};

export const generateToken = ({ id, tokenVersion = 0 }) => jwt.sign(
    { tokenVersion },
    getJwtSecret(),
    {
        algorithm: JWT_ALGORITHM,
        subject: String(id),
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    },
);

export const verifyToken = (token) => jwt.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
});