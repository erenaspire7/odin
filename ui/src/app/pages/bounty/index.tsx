import Layout from "@/app/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Target,
  CheckCircle,
  Clock,
  Users,
  Award,
  PlusCircle,
  GitPullRequestDraft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { CreateBountyDialog } from "./form";
import { get } from "@/lib/api";

const sampleActiveBounties = [
  {
    bountyId: 1,
    name: "Smart Contract Security Audit",
    description: "Perform a security audit on our new DeFi smart contract",
    reward: "0.35 ETH",
    prize: {
      amount: 0.05,
      description: "Prize for the best article",
    },
    expiresAt: "Apr 25, 2025",
    participants: 3,
    difficulty: "Hard",
    tags: ["Security", "Solidity", "Audit"],
  },
  {
    bountyId: 2,
    name: "UI Design for NFT Marketplace",
    description:
      "Create a clean and modern UI design for our upcoming NFT marketplace",
    reward: "0.25 ETH",
    prize: {
      amount: 0.05,
      description: "Prize for the best article",
    },
    expiresAt: "Apr 30, 2025",
    participants: 7,
    difficulty: "Medium",
    tags: ["Design", "UI/UX", "NFT"],
  },
  {
    bountyId: 3,
    name: "Optimize Gas Usage for Contract",
    description: "Find ways to optimize gas usage in our token contract",
    reward: "0.18 ETH",
    prize: {
      amount: 0.05,
      description: "Prize for the best article",
    },
    expiresAt: "May 5, 2025",
    participants: 2,
    difficulty: "Medium",
    tags: ["Optimization", "Solidity", "Gas"],
  },
];

const enrolledBounties = [
  {
    bountyId: 4,
    name: "Implement Zero-Knowledge Proof",
    description:
      "Implement a ZKP solution for our identity verification system",
    reward: "0.45 ETH",
    prize: {
      amount: 0.05,
      description: "Prize for the best article",
    },
    expiresAt: "May 1, 2025",
    status: "In Progress",
    submissionDate: "Apr 28, 2025",
    difficulty: "Hard",
    tags: ["zkSNARK", "Privacy", "Cryptography"],
  },
  {
    bountyId: 5,
    name: "Create Educational Content for Blockchain",
    description:
      "Create a series of educational articles about blockchain technology",
    reward: "0.15 ETH",
    prize: {
      amount: 0.05,
      description: "Prize for the best article",
    },
    expiresAt: "Apr 20, 2025",
    status: "Submitted",
    submissionDate: "Apr 18, 2025",
    difficulty: "Easy",
    tags: ["Education", "Content", "Blockchain"],
  },
];

const draftBounties = [
  {
    bountyId: 6,
    name: "Lorem Ipsum",
    description:
      "Implement a ZKP solution for our identity verification system",
    reward: "0.45 ETH",
    expiresAt: "May 1, 2025",
    status: "In Progress",
    submissionDate: "Apr 28, 2025",
    difficulty: "Hard",
    tags: ["zkSNARK", "Privacy", "Cryptography"],
  },
];

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Easy":
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Submitted":
      return "bg-purple-100 text-purple-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Bounty() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [activeBounties, setActiveBounties] = useState([]);

  useEffect(() => {
    get("bounty/all", { status: "active" }).then((data) => {
      console.log(data);
      setActiveBounties(data);
    });
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-end">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle size={18} />
                Create Bounty
              </Button>
            </DialogTrigger>

            <CreateBountyDialog setIsCreateModalOpen={setIsCreateModalOpen} />
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Target size={16} />
              Active Bounties
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="flex items-center gap-2">
              <CheckCircle size={16} />
              My Bounties
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <GitPullRequestDraft size={16} />
              Drafts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeBounties.map((bounty) => (
                <Card
                  key={bounty.bountyId}
                  className="overflow-hidden border-2 hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">
                        {bounty.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Award size={12} />
                        {bounty.prize.amount} ETH
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {bounty.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bounty.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{new Date(bounty.expiresAt).toUTCString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{bounty.participants} participants</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Badge
                      className={`${getDifficultyColor(bounty.difficulty)} border-none text-xs`}
                    >
                      {bounty.difficulty}
                    </Badge>
                    <Button size="sm">Enroll</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledBounties.map((bounty) => (
                <Card
                  key={bounty.bountyId}
                  className="overflow-hidden border-2 hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">
                        {bounty.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Award size={12} />
                        {bounty.reward}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {bounty.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bounty.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{bounty.expiresAt}</span>
                      </div>
                      <Badge
                        className={`${getStatusColor(bounty.status)} border-none text-xs`}
                      >
                        {bounty.status}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Badge
                      className={`${getDifficultyColor(bounty.difficulty)} border-none text-xs`}
                    >
                      {bounty.difficulty}
                    </Badge>
                    {bounty.status === "In Progress" ? (
                      <Button size="sm">Submit Work</Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        View Submission
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftBounties.map((bounty) => (
                <Card
                  key={bounty.bountyId}
                  className="overflow-hidden border-2 hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-1">
                        {bounty.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Award size={12} />
                        {bounty.reward}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {bounty.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {bounty.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{bounty.expiresAt}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-end space-x-4">
                    <Button size="sm">Modify Bounty</Button>

                    <Button size="sm" variant="outline">
                      Initiate Bounty
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
