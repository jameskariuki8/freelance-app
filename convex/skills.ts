import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByUser = query({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();

        if (!user) {
            return [];
        }

        const skills = await ctx.db
            .query("skills")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        return skills;
    },
});