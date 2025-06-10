import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const categories = [
    { name: 'Web Development' },
    { name: 'Mobile Development' },
    { name: 'Design' },
    { name: 'Writing' },
    { name: 'Marketing' },
    { name: 'Data Science' },
    { name: 'Artificial Intelligence' },
    { name: 'Game Development' },
    { name: 'Finance' },
    { name: 'Photography' }
];

const subcategories = [
    // Web Development subcategories
    'Frontend Development', 'Backend Development', 'Full-Stack Development', 'WordPress', 'Shopify', 'E-commerce', 'Web Design',
    // Mobile Development subcategories
    'iOS Development', 'Android Development', 'Flutter Development', 'React Native', 'Xamarin', 'Mobile App Design', 'Mobile Game Development',
    // Design subcategories
    'UI/UX Design', 'Graphic Design', 'Logo Design', 'Branding', 'Illustration', 'Print Design', 'Motion Graphics',
    // Writing subcategories
    'Content Writing', 'Copywriting', 'Technical Writing', 'Creative Writing', 'Proofreading', 'Editing', 'Ghostwriting',
    // Marketing subcategories
    'Social Media Marketing', 'SEO', 'Email Marketing', 'Content Marketing', 'Influencer Marketing', 'PPC Advertising', 'Marketing Strategy',
    // Data Science subcategories
    'Machine Learning', 'Data Analysis', 'Big Data', 'Data Visualization', 'Predictive Analytics', 'Deep Learning', 'Natural Language Processing',
    // Artificial Intelligence subcategories
    'Computer Vision', 'Robotics', 'Speech Recognition', 'AI Ethics', 'Reinforcement Learning', 'Expert Systems', 'Cognitive Computing',
    // Game Development subcategories
    'Game Design', 'Game Programming', 'Game Art', 'Game Testing', 'Game Marketing', 'VR Development', 'AR Development',
    // Finance subcategories
    'Investing', 'Personal Finance', 'Financial Planning', 'Stock Market', 'Cryptocurrency', 'Banking', 'Insurance',
    // Photography subcategories
    'Portrait Photography', 'Landscape Photography', 'Product Photography', 'Event Photography', 'Street Photography', 'Fashion Photography', 'Travel Photography'
];

export const seedCategories = mutation({
    args: {},
    handler: async (ctx) => {
        const existingCategories = await ctx.db.query("categories").collect();
        const existingSubcategories = await ctx.db.query("subcategories").collect();
        
        console.log('Existing categories:', existingCategories.length);
        console.log('Existing subcategories:', existingSubcategories.length);
        
        if (existingCategories.length === 0) {
            console.log('Seeding categories...');
            // Insert all categories and store their IDs
            const categoryIds = await Promise.all(categories.map(async (category) => {
                const id = await ctx.db.insert("categories", {
                    name: category.name
                });
                return id;
            }));

            console.log('Categories seeded:', categoryIds.length);

            // Insert subcategories for each category
            for (let i = 0; i < categoryIds.length; i++) {
                const categoryId = categoryIds[i];
                const startIndex = i * 7;
                const endIndex = startIndex + 7;
                const categorySubcategories = subcategories.slice(startIndex, endIndex);
                
                console.log(`Seeding ${categorySubcategories.length} subcategories for category ${i + 1}`);
                
                await Promise.all(
                    categorySubcategories.map((subcategoryName) =>
                        ctx.db.insert("subcategories", {
                            categoryId,
                            name: subcategoryName
                        })
                    )
                );
            }
        }
        
        return existingCategories.length === 0;
    }
});

export const get = query({
    handler: async (ctx) => {
        const categories = await ctx.db.query("categories").collect();
        console.log('Found categories:', categories.length);

        const categoriesWithSubcategories = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await ctx.db
                    .query("subcategories")
                    .withIndex("by_category", (q) => q.eq("categoryId", category._id))
                    .collect();
                
                console.log(`Category ${category.name} (${category._id}) has ${subcategories.length} subcategories:`, 
                    subcategories.map(s => s.name).join(', '));
                
                return {
                    ...category,
                    subcategories: subcategories,
                };
            })
        );

        return categoriesWithSubcategories;
    }
});

export const getSubcategories = query({
    args: { categoryId: v.id("categories") },
    handler: async (ctx, args) => {
        const subcategories = await ctx.db
            .query("subcategories")
            .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
            .collect();
        
        console.log(`Found ${subcategories.length} subcategories for category ${args.categoryId}`);
        return subcategories;
    }
});

export const forceReseed = mutation({
    args: {},
    handler: async (ctx) => {
        try {
            // Delete all existing categories and subcategories
            const existingCategories = await ctx.db.query("categories").collect();
            const existingSubcategories = await ctx.db.query("subcategories").collect();
            
            console.log('Deleting existing categories:', existingCategories.length);
            console.log('Deleting existing subcategories:', existingSubcategories.length);
            
            // Delete subcategories first (due to foreign key constraint)
            for (const subcategory of existingSubcategories) {
                await ctx.db.delete(subcategory._id);
            }
            
            // Then delete categories
            for (const category of existingCategories) {
                await ctx.db.delete(category._id);
            }
            
            // Now seed new categories
            console.log('Seeding new categories...');
            const categoryIds = [];
            
            // Insert categories one by one to ensure order
            for (const category of categories) {
                const id = await ctx.db.insert("categories", {
                    name: category.name
                });
                categoryIds.push(id);
                console.log(`Created category: ${category.name} with ID: ${id}`);
            }

            console.log('Categories seeded:', categoryIds.length);

            // Insert subcategories for each category
            let totalSubcategories = 0;
            for (let i = 0; i < categoryIds.length; i++) {
                const categoryId = categoryIds[i];
                const startIndex = i * 7;
                const endIndex = startIndex + 7;
                const categorySubcategories = subcategories.slice(startIndex, endIndex);
                
                console.log(`Seeding ${categorySubcategories.length} subcategories for category ${i + 1}`);
                
                for (const subcategoryName of categorySubcategories) {
                    const subcategoryId = await ctx.db.insert("subcategories", {
                        categoryId,
                        name: subcategoryName
                    });
                    console.log(`Created subcategory: ${subcategoryName} with ID: ${subcategoryId} for category ${i + 1}`);
                    totalSubcategories++;
                }
            }
            
            console.log(`Total subcategories seeded: ${totalSubcategories}`);
            
            return {
                categoriesSeeded: categoryIds.length,
                subcategoriesSeeded: totalSubcategories
            };
        } catch (error) {
            console.error('Error in forceReseed:', error);
            throw error;
        }
    }
});