import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, CheckCircle } from "lucide-react";
import Layout from "@/app/layout";

const ProfilePage = () => {
  const [userName, setUserName] = useState("0x26...812399");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(userName);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdateName = () => {
    if (newName.trim() !== "") {
      setUserName(newName);
      setEditingName(false);

      // Show success message
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="bg-green-100 border border-green-200 text-green-800 rounded-md p-4 mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Profile updated successfully
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Display Name
                </Label>

                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1"
                      placeholder="Enter your display name"
                    />
                    <Button onClick={handleUpdateName}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingName(false);
                        setNewName(userName);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userName}</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setEditingName(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  This is how your name will appear to other users on the
                  platform.
                </p>
              </div>

              {/* Wallet address (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="wallet" className="text-sm font-medium">
                  Wallet Address
                </Label>
                <div className="flex items-center gap-2">
                  <div className="rounded-md border px-3 py-2 w-full bg-muted/50 text-muted-foreground">
                    0x26...812399
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your connected wallet address. This cannot be changed.
                </p>
              </div>

              {/* Email address (placeholder for future) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground italic">
                      Not set
                    </span>
                  </div>
                  <Button variant="outline" disabled>
                    Add Later
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add an email to receive notifications and updates (coming
                  soon).
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 flex justify-between">
              <p className="text-sm text-muted-foreground">
                Last updated: Apr 12, 2025
              </p>
            </CardFooter>
          </Card>

          {/* Placeholder for additional profile sections you might add later */}
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>Additional settings coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center text-muted-foreground">
                <p>
                  Additional profile settings will be available in future
                  updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
