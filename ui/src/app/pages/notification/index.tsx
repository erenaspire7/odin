import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCircle,
  Clock,
  MessageCircle,
  Award,
  DollarSign,
  Info,
} from "lucide-react";
import Layout from "@/app/layout";

const NotificationsPage = () => {
  // Sample notifications data
  const allNotifications = [
    {
      id: 1,
      type: "bounty",
      title: "New Bounty Available",
      message:
        'A new bounty "Smart Contract Security Audit" has been posted that matches your skills.',
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "reward",
      title: "Bounty Reward Received",
      message:
        'You received 0.18 ETH for completing "Optimize Gas Usage for Contract".',
      time: "2 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "message",
      title: "New Message",
      message:
        'BlockSec left a comment on your submission for "Smart Contract Security Audit".',
      time: "Yesterday",
      read: true,
    },
    {
      id: 4,
      type: "system",
      title: "System Update",
      message:
        "The platform will undergo scheduled maintenance on Apr 15, 2025.",
      time: "2 days ago",
      read: true,
    },
    {
      id: 5,
      type: "bounty",
      title: "Deadline Approaching",
      message:
        'Your submission for "Create Educational Content for Blockchain" is due in 2 days.',
      time: "3 days ago",
      read: true,
    },
    {
      id: 6,
      type: "reward",
      title: "Rank Increased",
      message: "Your network rank has increased to #42. Keep up the good work!",
      time: "5 days ago",
      read: true,
    },
  ];

  const [notifications, setNotifications] = useState(allNotifications);
  const [activeTab, setActiveTab] = useState("all");

  // Filter notifications based on active tab
  const filteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((notif) => !notif.read);
      case "bounties":
        return notifications.filter((notif) => notif.type === "bounty");
      case "rewards":
        return notifications.filter((notif) => notif.type === "reward");
      default:
        return notifications;
    }
  };

  // Mark a notification as read
  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif,
      ),
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "bounty":
        return <Award className="h-5 w-5" />;
      case "reward":
        return <DollarSign className="h-5 w-5" />;
      case "message":
        return <MessageCircle className="h-5 w-5" />;
      case "system":
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get notification background color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case "bounty":
        return "bg-purple-100";
      case "reward":
        return "bg-green-100";
      case "message":
        return "bg-blue-100";
      case "system":
        return "bg-gray-100";
      default:
        return "bg-gray-100";
    }
  };

  // Get text color based on notification type
  const getTextColor = (type) => {
    switch (type) {
      case "bounty":
        return "text-purple-600";
      case "reward":
        return "text-green-600";
      case "message":
        return "text-blue-600";
      case "system":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  // Get unread count
  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your activity
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-primary">{unreadCount} new</Badge>
              )}
            </div>
            <CardDescription>
              Your recent notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="all"
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-primary h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="bounties">Bounties</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredNotifications().length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications().map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex rounded-lg border p-4 ${!notification.read ? "bg-muted/50" : ""}`}
                      >
                        <div
                          className={`${getNotificationColor(notification.type)} p-2 rounded-full mr-4`}
                        >
                          <div className={getTextColor(notification.type)}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">
                              {notification.title}
                              {!notification.read && (
                                <Badge
                                  className="ml-2 bg-primary"
                                  variant="default"
                                >
                                  New
                                </Badge>
                              )}
                            </h4>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                              <span className="text-xs text-muted-foreground">
                                {notification.time}
                              </span>
                            </div>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs h-7"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">No notifications</h3>
                    <p className="text-muted-foreground">
                      {activeTab === "all"
                        ? "You don't have any notifications yet."
                        : `You don't have any ${activeTab} notifications.`}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
