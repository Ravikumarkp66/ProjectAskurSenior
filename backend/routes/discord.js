const express = require("express");
const axios = require("axios");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

/**
 * GET /api/discord/login
 * Initiates Discord OAuth flow by building the authorize URL
 */
router.get("/login", authMiddleware, (req, res) => {
    try {
        const { DISCORD_CLIENT_ID, BACKEND_URL } = process.env;
        // The token is already verified by authMiddleware and available in req.query.token or state
        const token = req.query.token || req.query.state;

        if (!DISCORD_CLIENT_ID) {
            return res.status(500).json({ error: "Discord client ID not configured" });
        }

        const cleanRedirectUri = `${BACKEND_URL || "https://askursenior.onrender.com"}/api/discord/callback`;
        const scope = encodeURIComponent("identify guilds.join");

        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(cleanRedirectUri)}&response_type=code&scope=${scope}&state=${token}`;

        res.redirect(discordAuthUrl);
    } catch (error) {
        console.error("Discord Login Redirect Error:", error.message);
        res.status(500).json({ error: "Failed to initiate Discord login" });
    }
});

/**
 * GET /api/discord/callback
 * Handles Discord OAuth2 Redirect, joins server, and syncs roles
 */
router.get("/callback", authMiddleware, async (req, res) => {
    const { code, state: token } = req.query; // state contains our JWT token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!code) return res.redirect(`${frontendUrl}/profile?error=no_code_provided`);
    if (!token) return res.redirect(`${frontendUrl}/profile?error=authentication_required`);

    try {
        const {
            DISCORD_CLIENT_ID,
            DISCORD_CLIENT_SECRET,
            DISCORD_BOT_TOKEN,
            DISCORD_GUILD_ID,
            FREE_ROLE_ID,
            PREMIUM_ROLE_ID,
            BACKEND_URL
        } = process.env;

        if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
            console.error("Missing Discord configuration in .env");
            return res.redirect(`${frontendUrl}/profile?error=server_config_error`);
        }

        // MUST match registered URI exactly (no query params here!)
        const cleanRedirectUri = `${BACKEND_URL || "https://askursenior.onrender.com"}/api/discord/callback`;

        // 1. Exchange OAuth Code for Access Token
        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: cleanRedirectUri,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const accessToken = tokenResponse.data.access_token;

        // 2. Fetch Discord User Info
        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const discordUser = userResponse.data;

        // 3. Update User in DB
        const user = await User.findById(req.userId);
        if (!user) return res.redirect(`${frontendUrl}/profile?error=user_not_found`);

        user.discordId = discordUser.id;
        await user.save();

        // 4. Join Server
        try {
            await axios.put(
                `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}`,
                { access_token: accessToken },
                {
                    headers: {
                        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (e) {
            if (e.response?.status !== 204) console.warn("Join Error:", e.message);
        }

        // 5. Sync Roles
        const botHeaders = { Authorization: `Bot ${DISCORD_BOT_TOKEN}` };
        const rolesToRemove = [FREE_ROLE_ID, PREMIUM_ROLE_ID].filter(Boolean);
        for (const roleId of rolesToRemove) {
            try {
                await axios.delete(
                    `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}/roles/${roleId}`,
                    { headers: botHeaders }
                );
            } catch (e) { }
        }

        const isPremium = user.subscription === 'askplus' || user.role === 'premium' || user.isAdmin === true;
        const targetRoleId = isPremium ? PREMIUM_ROLE_ID : FREE_ROLE_ID;

        if (targetRoleId) {
            await axios.put(
                `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}/roles/${targetRoleId}`,
                {},
                { headers: botHeaders }
            );
        }

        return res.redirect(`${frontendUrl}/profile?discord=success`);
    } catch (error) {
        console.error("Discord Callback Error:", error.response?.data || error.message);
        return res.redirect(`${frontendUrl}/profile?error=sync_failed`);
    }
});

module.exports = router;
