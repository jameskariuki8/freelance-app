"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useApiMutation } from "@/hooks/use-api-mutation"
import { useRouter } from "next/navigation"

interface CreateFormProps {
    username: string;
}

const CreateFormSchema = z.object({
    title: z
        .string()
        .min(20, {
            message: "Title must be at least 20 characters.",
        })
        .max(100, {
            message: "Title must not be longer than 100 characters.",
        }),
    category: z
        .string({
            required_error: "Please select a category.",
        }),
    subcategoryId: z
        .string({
            required_error: "Please select a subcategory.",
        })
})

type CreateFormValues = z.infer<typeof CreateFormSchema>

// This can come from your database or API.
const defaultValues: Partial<CreateFormValues> = {
    title: "",
}

export const CreateForm = ({
    username
}: CreateFormProps) => {
    const categories = useQuery(api.categories.get);
    const [selectedCategoryId, setSelectedCategoryId] = useState<Id<"categories"> | null>(null);
    const subcategories = useQuery(api.categories.getSubcategories, 
        selectedCategoryId ? { categoryId: selectedCategoryId } : "skip"
    );
    const {
        mutate: createGig,
        pending: createPending
    } = useApiMutation(api.gig.create);
    const {
        mutate: seedCategories,
        pending: seedPending
    } = useApiMutation(api.categories.seedCategories);
    const {
        mutate: forceReseed,
        pending: reseedPending
    } = useApiMutation(api.categories.forceReseed);
    const router = useRouter();

    const form = useForm<CreateFormValues>({
        resolver: zodResolver(CreateFormSchema),
        defaultValues,
        mode: "onChange",
    })

    // Force reseed categories and subcategories if needed
    useEffect(() => {
        if (categories && categories.length === 0) {
            forceReseed({}).then(() => {
                console.log('Categories and subcategories reseeded');
            }).catch((error) => {
                console.error('Error reseeding categories:', error);
            });
        }
    }, [categories, forceReseed]);

    function handleCategoryChange(categoryName: string) {
        if (!categories) return;
        
        const selectedCategory = categories.find(category => category.name === categoryName);
        if (selectedCategory) {
            setSelectedCategoryId(selectedCategory._id);
            form.setValue("subcategoryId", "");
        } else {
            setSelectedCategoryId(null);
        }
    }

    if (!categories || seedPending || reseedPending) {
        return <div>Loading categories...</div>;
    }

    function onSubmit(data: CreateFormValues) {
        console.log('Form submitted with data:', data);
        if (!data.subcategoryId) {
            toast.error("Please select a subcategory");
            return;
        }
        
        createGig({
            title: data.title,
            description: "",
            subcategoryId: data.subcategoryId,
        })
            .then((gigId: Id<"gigs">) => {
                toast.info("Gig created successfully");
                router.push(`/seller/${username}/manage-gigs/edit/${gigId}`)
            })
            .catch(() => {
                toast.error("Failed to create gig")
            })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-end">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                            forceReseed({}).then(() => {
                                toast.success("Categories and subcategories reseeded successfully");
                            }).catch((error) => {
                                console.error('Error reseeding:', error);
                                toast.error("Failed to reseed categories and subcategories");
                            });
                        }}
                        disabled={reseedPending}
                    >
                        {reseedPending ? "Reseeding..." : "Reseed Categories"}
                    </Button>
                </div>
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="I will do something amazing" {...field} />
                            </FormControl>
                            <FormDescription>
                                Craft a keyword-rich Gig title to attract potential buyers.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    handleCategoryChange(value);
                                }}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category._id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select a category most relevant to your service.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="subcategoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subcategory</FormLabel>
                            <Select 
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!selectedCategoryId}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={!selectedCategoryId ? "Select a category first" : "Select a subcategory"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subcategories?.map((subcategory) => (
                                        <SelectItem key={subcategory._id} value={subcategory._id}>
                                            {subcategory.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Subcategory will help buyers pinpoint your service more narrowly.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={createPending}>Save</Button>
            </form>
        </Form>
    )
}
