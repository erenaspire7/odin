import React, { useState } from "react";
import Layout from "@/app/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Database,
  Calendar,
  ArrowLeft,
  FileText,
  Eye,
} from "lucide-react";

const DatasetsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Sample datasets data
  const datasets = [
    {
      id: 1,
      name: "Ethereum Transaction Data",
      description: "Historical transaction data from the Ethereum blockchain",
      format: "CSV",
      size: "2.4 GB",
      records: "1.2M",
      lastUpdated: "Apr 10, 2025",
      category: "Blockchain",
      creator: "Ethereum Foundation",
    },
    {
      id: 2,
      name: "NFT Marketplace Trends",
      description: "Collection of NFT sales data across major marketplaces",
      format: "JSON",
      size: "850 MB",
      records: "500K",
      lastUpdated: "Apr 8, 2025",
      category: "NFT",
      creator: "CryptoAnalytics",
    },
    {
      id: 3,
      name: "DeFi Protocol Performance",
      description: "Performance metrics for top DeFi protocols",
      format: "CSV",
      size: "1.1 GB",
      records: "750K",
      lastUpdated: "Apr 5, 2025",
      category: "DeFi",
      creator: "DeFi Pulse",
    },
    {
      id: 4,
      name: "Smart Contract Security Incidents",
      description: "Documented smart contract vulnerabilities and exploits",
      format: "JSON",
      size: "450 MB",
      records: "10K",
      lastUpdated: "Apr 2, 2025",
      category: "Security",
      creator: "BlockSec",
    },
    {
      id: 5,
      name: "Token Price History",
      description: "Historical price data for top 100 cryptocurrencies",
      format: "CSV",
      size: "3.2 GB",
      records: "5M",
      lastUpdated: "Apr 1, 2025",
      category: "Market",
      creator: "CoinMetrics",
    },
    {
      id: 6,
      name: "DAO Governance Votes",
      description: "Voting data from major DAOs governance proposals",
      format: "JSON",
      size: "720 MB",
      records: "150K",
      lastUpdated: "Mar 28, 2025",
      category: "Governance",
      creator: "DAOresearch",
    },
  ];

  // Sample dataset details (columns in the dataset)
  const sampleDatasetColumns = [
    {
      name: "transaction_hash",
      type: "string",
      description: "Unique hash of the transaction",
    },
    {
      name: "block_number",
      type: "integer",
      description: "Block number containing the transaction",
    },
    {
      name: "timestamp",
      type: "datetime",
      description: "Time when the transaction was mined",
    },
    {
      name: "from_address",
      type: "string",
      description: "Address that sent the transaction",
    },
    {
      name: "to_address",
      type: "string",
      description: "Address that received the transaction",
    },
    { name: "value", type: "float", description: "Amount of ETH transferred" },
    {
      name: "gas_used",
      type: "integer",
      description: "Amount of gas used by the transaction",
    },
    { name: "gas_price", type: "float", description: "Price of gas in wei" },
    {
      name: "status",
      type: "boolean",
      description: "Transaction status (success/fail)",
    },
  ];

  // Sample dataset records
  const sampleDatasetRecords = [
    {
      transaction_hash:
        "0x8a7f11d6a2acf4f2ab7f3ee53ac4c3f5c253c779c0b28bf9f8e2e3b443675f17",
      block_number: 14500000,
      timestamp: "2025-04-05T14:32:15Z",
      from_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      to_address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      value: 0.05,
      gas_used: 21000,
      gas_price: 25.6,
      status: true,
    },
    {
      transaction_hash:
        "0x2b91fc54c0f67c16e2edf45931662fc52330d12e9cec4a1e6baa8c51c7154936",
      block_number: 14500010,
      timestamp: "2025-04-05T14:35:22Z",
      from_address: "0x8c7f24ec6Ab3F2cdA6A5320a7B2F71080C3C2817",
      to_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      value: 0.12,
      gas_used: 21000,
      gas_price: 27.3,
      status: true,
    },
    {
      transaction_hash:
        "0x3c6e82f0c95875e32c99103199843acbf4c01a9e85c320c3967183ab6c7fd9a5",
      block_number: 14500015,
      timestamp: "2025-04-05T14:37:45Z",
      from_address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      to_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      value: 0.02,
      gas_used: 21000,
      gas_price: 26.1,
      status: true,
    },
    {
      transaction_hash:
        "0x4d8f3e21c4572c248e484602b6c5e65848d4d2a9095d1460d93a0152b5878c7a",
      block_number: 14500025,
      timestamp: "2025-04-05T14:42:18Z",
      from_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      to_address: "0x8c7f24ec6Ab3F2cdA6A5320a7B2F71080C3C2817",
      value: 0.07,
      gas_used: 23000,
      gas_price: 28.5,
      status: false,
    },
    {
      transaction_hash:
        "0x5f3c9e17b5d922a620950b85c7c8220b736ff27af56c81cb3e7e920d74278421",
      block_number: 14500032,
      timestamp: "2025-04-05T14:45:36Z",
      from_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      to_address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      value: 0.03,
      gas_used: 21000,
      gas_price: 26.8,
      status: true,
    },
  ];

  // Filter datasets based on search query
  const filteredDatasets = datasets.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.creator.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Items per page
  const itemsPerPage = 5;

  // Calculate total pages
  const totalPages = Math.ceil(filteredDatasets.length / itemsPerPage);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDatasets.slice(startIndex, endIndex);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Open dataset detail view
  const openDatasetDetail = (dataset) => {
    setSelectedDataset(dataset);
    setIsDetailViewOpen(true);
    setDetailPage(1); // Reset to first page when opening a new dataset
  };

  // Get format badge color
  const getFormatBadgeColor = (format) => {
    switch (format) {
      case "CSV":
        return "bg-green-100 text-green-800";
      case "JSON":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Custom pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Previous</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
          >
            <path
              d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
              fill="currentColor"
            />
          </svg>
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0"
          >
            <span>{page}</span>
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Next</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
          >
            <path
              d="M6.1584 3.13514C5.95694 3.32401 5.94673 3.64042 6.13559 3.84188L9.565 7.49991L6.13559 11.1579C5.94673 11.3594 5.95694 11.6758 6.1584 11.8647C6.35986 12.0535 6.67627 12.0433 6.86513 11.8419L10.6151 7.84188C10.7954 7.64955 10.7954 7.35027 10.6151 7.15794L6.86513 3.15794C6.67627 2.95648 6.35986 2.94628 6.1584 3.13514Z"
              fill="currentColor"
            />
          </svg>
        </Button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl text-black">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Datasets</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search for datasets by name, description, category..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Datasets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Available Datasets</CardTitle>
            <CardDescription>
              Browse and access datasets for your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Custom table since we can't use the shadcn table component directly */}
            <div className="rounded-md border">
              {/* Table header */}
              <div className="grid grid-cols-7 border-b bg-gray-100/50 p-3">
                <div className="font-medium">Name</div>
                <div className="font-medium col-span-2">Description</div>
                <div className="font-medium">Format</div>
                <div className="font-medium">Size</div>
                <div className="font-medium">Last Updated</div>
                <div className="font-medium text-right">Actions</div>
              </div>

              {/* Table body */}
              {getCurrentPageItems().map((dataset) => (
                <div
                  key={dataset.id}
                  className="grid grid-cols-7 items-center border-b p-3 hover:bg-gray-50"
                >
                  <div className="font-medium">{dataset.name}</div>
                  <div className="col-span-2 truncate">
                    {dataset.description}
                  </div>
                  <div>
                    <Badge
                      className={`${getFormatBadgeColor(dataset.format)} border-none`}
                    >
                      {dataset.format}
                    </Badge>
                  </div>
                  <div>{dataset.size}</div>
                  <div>{dataset.lastUpdated}</div>
                  <div className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 ml-auto"
                      onClick={() => openDatasetDetail(dataset)}
                    >
                      <Eye size={14} />
                      View
                    </Button>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {filteredDatasets.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No datasets found matching your search criteria.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>

        {/* Dataset Detail View (Dialog) */}
        {selectedDataset && (
          <Dialog
            open={isDetailViewOpen}
            onOpenChange={setIsDetailViewOpen}
            className="max-w-5xl"
          >
            <DialogContent className="max-w-5xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => setIsDetailViewOpen(false)}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <DialogTitle className="text-xl">
                    {selectedDataset.name}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Format</div>
                  <div className="font-medium flex items-center gap-1">
                    <FileText size={14} />
                    {selectedDataset.format}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Size / Records
                  </div>
                  <div className="font-medium flex items-center gap-1">
                    <Database size={14} />
                    {selectedDataset.size} / {selectedDataset.records} records
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Last Updated
                  </div>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar size={14} />
                    {selectedDataset.lastUpdated}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {selectedDataset.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Dataset Schema</h3>
                </div>
                {/* Custom schema table */}
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 border-b bg-gray-100/50 p-3">
                    <div className="font-medium">Column Name</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Description</div>
                  </div>
                  {sampleDatasetColumns.map((column, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 items-center border-b p-3 last:border-0"
                    >
                      <div className="font-medium">{column.name}</div>
                      <div>{column.type}</div>
                      <div>{column.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Sample Data</h3>
                  <Button className="flex items-center gap-1">
                    <Download size={14} />
                    Download {selectedDataset.format}
                  </Button>
                </div>
                {/* Custom data table */}
                <div className="rounded-md border overflow-x-auto">
                  <div className="min-w-max">
                    <div className="grid grid-cols-9 border-b bg-gray-100/50 p-3">
                      {Object.keys(sampleDatasetRecords[0]).map((key) => (
                        <div key={key} className="font-medium px-2">
                          {key}
                        </div>
                      ))}
                    </div>
                    {sampleDatasetRecords.map((record, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-9 items-center border-b p-3 last:border-0"
                      >
                        {Object.values(record).map((value, valueIndex) => (
                          <div key={valueIndex} className="px-2 truncate">
                            {typeof value === "boolean"
                              ? value
                                ? "true"
                                : "false"
                              : value.toString()}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample data pagination */}
                <Pagination
                  currentPage={detailPage}
                  totalPages={3}
                  onPageChange={setDetailPage}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default DatasetsPage;
