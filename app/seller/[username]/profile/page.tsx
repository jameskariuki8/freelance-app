"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loading } from "@/components/auth/loading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useState } from "react";

const ProfilePage = () => {
    const currentUser = useQuery(api.users.getCurrentUser);
    const [bio, setBio] = useState(currentUser?.bio || "");
    const [country, setCountry] = useState(currentUser?.country || "");
    const [languages, setLanguages] = useState(currentUser?.languages || "");
    const updateProfile = useApiMutation(api.users.updateProfile);

    if (currentUser === undefined) {
        return <Loading />;
    }

    if (currentUser === null) {
        return <div>Not found</div>;
    }

    const handleSave = async () => {
        try {
            await updateProfile({
                bio,
                country,
                languages,
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="space-y-2">
                <h1 className="text-4xl font-semibold">Profile</h1>
                <p className="text-muted-foreground">
                    Manage your profile information and settings.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={currentUser.username}
                            disabled
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={currentUser.email}
                            disabled
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="Your country"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="languages">Languages</Label>
                        <Input
                            id="languages"
                            value={languages}
                            onChange={(e) => setLanguages(e.target.value)}
                            placeholder="Languages you speak (comma separated)"
                            className="mt-1"
                        />
                    </div>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </div>
    );
};

export default ProfilePage; 