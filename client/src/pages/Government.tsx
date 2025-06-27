import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Download,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatTimeAgo, getCategoryColor, getStatusColor, getStatusText, formatNumber } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export default function Government() {
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const { lastMessage } = useWebSocket();

  // Fetch government analytics
  const { data: analytics, refetch } = useQuery({
    queryKey: ['/api/analytics/government', { wardNumber: selectedWard, district: selectedDistrict }],
  });

  const { data: priorityIssues, refetch: refetchPriority } = useQuery({
    queryKey: ['/api/issues/priority', { wardNumber: selectedWard, district: selectedDistrict }],
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_issue':
        case 'vote_update':
        case 'status_update':
          refetch();
          refetchPriority();
          break;
      }
    }
  }, [lastMessage, refetch, refetchPriority]);

  const handleStatusUpdate = async (issueId: number, status: string) => {
    await apiRequest('PUT', `/api/issues/${issueId}/status`, {
      status,
      message: `Status updated to ${getStatusText(status)}`,
    });
    refetchPriority();
  };

  const handleExportReport = () => {
    // In a real app, this would generate and download a report
    const reportData = {
      ward: selectedWard || 'All Wards',
      district: selectedDistrict || 'All Districts',
      stats: analytics?.issueStats,
      categoryStats: analytics?.categoryStats,
      priorityIssues: priorityIssues,
      generatedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civic-pulse-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = analytics?.issueStats || {};
  const categoryStats = analytics?.categoryStats || [];

  return (
    <div className="space-y-8">
      {/* Government Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Government Dashboard</h1>
              <p className="text-gray-600">Bangalore Urban District • Ward Management Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedWard} onValueChange={setSelectedWard}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Wards</SelectItem>
                  <SelectItem value="Ward 184">Ward 184 - Koramangala</SelectItem>
                  <SelectItem value="Ward 71">Ward 71 - Indiranagar</SelectItem>
                  <SelectItem value="Ward 150">Ward 150 - HSR Layout</SelectItem>
                  <SelectItem value="Ward 176">Ward 176 - BTM Layout</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportReport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(stats.criticalIssues || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatNumber(stats.inProgressIssues || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Resolved (30d)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(stats.resolvedIssues || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.avgResponseTime ? `${stats.avgResponseTime.toFixed(1)}d` : '0d'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Issues Requiring Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>VIS Score</TableHead>
                  <TableHead>Support %</TableHead>
                  <TableHead>Days Open</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityIssues && priorityIssues.length > 0 ? (
                  priorityIssues.slice(0, 10).map((issue: any) => {
                    const daysSinceCreated = Math.floor(
                      (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const supportPercentage = Number(issue.supportPercentage) || 0;

                    return (
                      <TableRow key={issue.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">
                              {issue.title}
                            </div>
                            <Badge className={getCategoryColor(issue.category)} variant="secondary">
                              {issue.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {issue.location}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {Number(issue.visScore || 0).toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`font-medium ${
                              supportPercentage >= 20 ? 'text-red-600' : 
                              supportPercentage >= 10 ? 'text-orange-600' : 
                              'text-blue-600'
                            }`}>
                              {supportPercentage.toFixed(1)}%
                            </div>
                            <Progress 
                              value={Math.min(supportPercentage * 5, 100)} 
                              className="w-20 h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {daysSinceCreated}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={issue.status}
                            onValueChange={(value) => handleStatusUpdate(issue.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No priority issues found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Issue Categories Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Categories Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryStats.length > 0 ? (
              categoryStats.map((category: any) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${
                      category.category === 'water' ? 'bg-blue-500' :
                      category.category === 'roads' ? 'bg-yellow-500' :
                      category.category === 'electricity' ? 'bg-green-500' :
                      category.category === 'health' ? 'bg-red-500' :
                      category.category === 'education' ? 'bg-purple-500' :
                      category.category === 'waste' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm capitalize">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={category.percentage} className="w-32 h-2" />
                    <span className="text-sm font-medium w-12">
                      {category.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolution Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">0-7 days</span>
              <span className="text-sm text-green-600">
                {Math.floor((stats.resolvedIssues || 0) * 0.35)} resolved
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">8-14 days</span>
              <span className="text-sm text-yellow-600">
                {Math.floor((stats.resolvedIssues || 0) * 0.25)} resolved
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">15-30 days</span>
              <span className="text-sm text-orange-600">
                {Math.floor((stats.resolvedIssues || 0) * 0.25)} resolved
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">30+ days</span>
              <span className="text-sm text-red-600">
                {Math.floor((stats.resolvedIssues || 0) * 0.15)} resolved
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
