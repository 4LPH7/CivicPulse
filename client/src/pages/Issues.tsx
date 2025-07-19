import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateIssueModal from '@/components/CreateIssueModal';
import IssueCard from '@/components/IssueCard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';
import type { IssueWithDetails, VoteData } from '@/lib/types';

export default function Issues() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [area, setArea] = useState('all');
  const [sortBy, setSortBy] = useState('vis_score');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { lastMessage } = useWebSocket();

  const { data: issues, refetch } = useQuery<IssueWithDetails[]>({
    queryKey: ['/api/issues', { 
      search: searchTerm, 
      category, 
      wardNumber: area, 
      sortBy,
      limit: 20,
      offset: page * 20
    }],
  });

  const { data: userVotes } = useQuery<VoteData[]>({
    queryKey: ['/api/user/votes'],
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_issue':
        case 'vote_update':
        case 'status_update':
          refetch();
          break;
      }
    }
  }, [lastMessage, refetch]);

  const handleCreateIssue = async (data: any, files: FileList | null) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    if (files) {
      Array.from(files).forEach((file) => {
        formData.append('media', file);
      });
    }

    await apiRequest('POST', '/api/issues', formData);
    refetch();
  };

  const handleVote = async (issueId: number, rating: number) => {
    await apiRequest('POST', `/api/issues/${issueId}/vote`, { rating });
    refetch();
  };

  const handleShare = (issue: any) => {
    if (navigator.share) {
      navigator.share({
        title: issue.title,
        text: issue.description,
        url: `${window.location.origin}/issues/${issue.id}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${issue.title}\n\n${issue.description}\n\nView on CivicPulse: ${window.location.origin}/issues/${issue.id}`
      );
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="roads">Roads</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="waste">Waste Management</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="Ward 184">Koramangala</SelectItem>
                  <SelectItem value="Ward 71">Indiranagar</SelectItem>
                  <SelectItem value="Ward 150">HSR Layout</SelectItem>
                  <SelectItem value="Ward 176">BTM Layout</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vis_score">Sort by VIS</SelectItem>
                  <SelectItem value="created_at">Most Recent</SelectItem>
                  <SelectItem value="vote_count">Most Votes</SelectItem>
                  <SelectItem value="support_percentage">Most Support</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Issue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-6">
        {issues && Array.isArray(issues) && issues.length > 0 ? (
          <>
            {issues.map((issue: IssueWithDetails) => {
              const userVote = userVotes?.find((v: VoteData) => v.issueId === issue.id);
              return (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  userVote={userVote}
                  onVote={(rating) => handleVote(issue.id, rating)}
                  onShare={() => handleShare(issue)}
                />
              );
            })}
            
            {/* Load More */}
            {hasMore && (
              <div className="text-center py-6">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  className="px-8"
                >
                  Load More Issues
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <Filter className="h-12 w-12 mx-auto text-gray-300" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">No issues found</h3>
                  <p className="text-gray-500">
                    {searchTerm || category || area 
                      ? 'Try adjusting your filters or search terms'
                      : 'Be the first to report an issue in your area'
                    }
                  </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Report First Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateIssue}
      />
    </div>
  );
}
