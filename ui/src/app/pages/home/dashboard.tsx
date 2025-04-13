import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign, 
  Info,
  Award,
  PlusCircle
} from 'lucide-react';

const Dashboard = () => {
  // Sample data for charts
  const activityData = [
    { name: 'Jan', value: 12 },
    { name: 'Feb', value: 19 },
    { name: 'Mar', value: 10 },
    { name: 'Apr', value: 22 },
    { name: 'May', value: 15 },
    { name: 'Jun', value: 25 },
  ];

  const bountyCompletionData = [
    { name: 'In Progress', value: 5, color: '#3b82f6' },
    { name: 'Completed', value: 12, color: '#10b981' },
    { name: 'Expired', value: 2, color: '#ef4444' },
  ];

  const earningsData = [
    { name: 'Jan', earnings: 0.15 },
    { name: 'Feb', earnings: 0.28 },
    { name: 'Mar', earnings: 0.32 },
    { name: 'Apr', earnings: 0.18 },
    { name: 'May', earnings: 0.45 },
    { name: 'Jun', earnings: 0.36 },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Info size={16} />
            Help
          </Button>
          <Button className="flex items-center gap-2">
            <PlusCircle size={16} />
            Create Bounty
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.74 ETH</div>
            <p className="text-xs text-muted-foreground">+0.25 ETH from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Bounties</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">5 new since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">92% success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Network Rank</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#42</div>
            <p className="text-xs text-muted-foreground">Top 10% of contributors</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Welcome to your dashboard!</AlertTitle>
        <AlertDescription>
          This is a placeholder dashboard. You can customize it with real data as your project develops.
        </AlertDescription>
      </Alert>

      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>Your ETH earnings over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} ETH`, 'Earnings']} />
                      <Bar dataKey="earnings" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bounties Status</CardTitle>
                <CardDescription>Distribution of your bounty statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bountyCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {bountyCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>ETH Earnings</CardTitle>
              <CardDescription>Your earnings over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} ETH`, 'Earnings']} />
                    <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Number of bounties you've participated in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest interactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="bg-blue-100 p-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Enrolled in "Smart Contract Security Audit"</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="bg-green-100 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Received 0.18 ETH for "Optimize Gas Usage for Contract"</p>
                <p className="text-sm text-muted-foreground">Yesterday</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="bg-purple-100 p-2 rounded-full">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Completed "Create Educational Content for Blockchain"</p>
                <p className="text-sm text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;