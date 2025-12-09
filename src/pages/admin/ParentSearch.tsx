import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { ParentImageModal } from '@/components/ParentImageModal';
import { parentsApi } from '@/services/api';
import { Search, Plus, Mail, Phone, Users, Loader2, XCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Activity, Grid3x3, List, Eye, Calendar } from 'lucide-react';

interface ParentSearchResult {
  id: string;
  parentId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  childrenCount: number;
  photoUrl?: string;
}

type SortField = 'name' | 'parentId' | 'childrenCount' | 'status';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12;

export default function ParentSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allParents, setAllParents] = useState<ParentSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<ParentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  // Load all parents on mount
  useEffect(() => {
    loadAllParents();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentPage(1);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadAllParents = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await parentsApi.list();
      setAllParents(results);
    } catch (error: any) {
      console.error('Failed to load parents:', error);
      setError(error.message || 'Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentPage(1);
      return;
    }

    setSearching(true);
    setError('');
    try {
      const results = await parentsApi.search(query);
      setSearchResults(results);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Search failed:', error);
      setError(error.message || 'Failed to search parents');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Determine which list to use (search results or all parents)
  const sourceList = searchQuery.trim() ? searchResults : allParents;

  // Use useMemo for sorting to avoid infinite loops
  const sortedParents = useMemo(() => {
    const sorted = [...sourceList].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'parentId':
          aValue = a.parentId;
          bValue = b.parentId;
          break;
        case 'childrenCount':
          aValue = a.childrenCount;
          bValue = b.childrenCount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [sourceList, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleViewDetails = (parent: ParentSearchResult) => {
    navigate(`/admin/parents/${parent.id}`);
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedParents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedParents = sortedParents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
        sortField === field
          ? 'bg-foreground text-background shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
      }`}
    >
      {label}
      {sortField === field ? (
        sortOrder === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Parent Management</h1>
              <p className="text-base text-muted-foreground">
                Search and manage parent registrations, children, and check-in/check-out operations
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/calendar')}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base font-semibold w-full sm:w-auto whitespace-nowrap"
              >
                <Calendar className="w-5 h-5" />
                Create Session
              </button>
              <button
                onClick={() => navigate('/admin/activity-tracking')}
                className="btn-secondary flex items-center gap-2 px-6 py-3 text-base font-semibold w-full sm:w-auto whitespace-nowrap"
              >
                <Activity className="w-5 h-5" />
                Activity Tracking
              </button>
              <button
                onClick={() => navigate('/admin/add-parent')}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base font-semibold w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Add New Parent
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Centered Search Section */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-3xl">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Parent ID (e.g., RS073) or Name..."
              className="input-field w-full pl-14 pr-12 py-4 text-base border-2 focus:border-foreground transition-all"
              autoFocus
            />
            {searching && (
              <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Sort Controls and View Toggle */}
        {sortedParents.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Sort by:</span>
              <SortButton field="name" label="Name" />
              <SortButton field="parentId" label="Parent ID" />
              <SortButton field="childrenCount" label="Children" />
              <SortButton field="status" label="Status" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border-r border-border/60 pr-4">
                <span className="text-sm font-semibold text-foreground mr-2">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Showing <span className="text-foreground font-semibold">{startIndex + 1}-{Math.min(endIndex, sortedParents.length)}</span> of <span className="text-foreground font-semibold">{sortedParents.length}</span> {sortedParents.length === 1 ? 'parent' : 'parents'}
              </p>
            </div>
          </div>
        )}

        {/* Parents List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedParents.length === 0 ? (
          <div className="border-2 border-dashed border-border/60 rounded-xl p-16 text-center bg-muted/20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? `No parents found matching "${searchQuery}"` : 'No parents found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery ? 'Try a different search term or' : ''} Create a new parent to get started
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/admin/add-parent')}
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base"
              >
                <Plus className="w-5 h-5" />
                Add New Parent
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
                {paginatedParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="group border-2 border-border/80 rounded-xl p-6 bg-background hover:border-foreground/50 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Image Preview */}
                    {parent.photoUrl ? (
                      <div className="relative mb-4 w-full aspect-square rounded-lg overflow-hidden bg-muted/30 border-2 border-border/60">
                        <img
                          src={parent.photoUrl}
                          alt={parent.name}
                          className="w-full h-full object-cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage({ url: parent.photoUrl!, name: parent.name });
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage({ url: parent.photoUrl!, name: parent.name });
                          }}
                          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                          aria-label="View image"
                        >
                          <Eye className="w-6 h-6 text-white drop-shadow-lg" />
                        </button>
                      </div>
                    ) : (
                      <div className="mb-4 w-full aspect-square rounded-lg bg-muted/30 border-2 border-border/60 flex items-center justify-center">
                        <Users className="w-12 h-12 text-muted-foreground/40" />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-foreground text-background px-2.5 py-1 rounded-md shadow-sm">
                            {parent.parentId}
                          </span>
                          {parent.status === 'active' ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full font-semibold">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-1">{parent.name}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {parent.email && (
                            <div className="flex items-center gap-2.5">
                              <Mail className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                              <span className="truncate">{parent.email}</span>
                            </div>
                          )}
                          {parent.phone && (
                            <div className="flex items-center gap-2.5">
                              <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                            <span className="font-medium">{parent.childrenCount} {parent.childrenCount === 1 ? 'Child' : 'Children'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(parent);
                      }}
                      className="btn-primary w-full mt-5 text-sm py-2.5 group-hover:shadow-md"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {paginatedParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="group border-2 border-border/80 rounded-xl p-5 bg-background hover:border-foreground/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleViewDetails(parent)}
                  >
                    <div className="flex items-center gap-5">
                      {/* Image Preview */}
                      {parent.photoUrl ? (
                        <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted/30 border-2 border-border/60">
                          <img
                            src={parent.photoUrl}
                            alt={parent.name}
                            className="w-full h-full object-cover"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage({ url: parent.photoUrl!, name: parent.name });
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage({ url: parent.photoUrl!, name: parent.name });
                            }}
                            className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                            aria-label="View image"
                          >
                            <Eye className="w-5 h-5 text-white drop-shadow-lg" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-muted/30 border-2 border-border/60 flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-foreground text-background px-2.5 py-1 rounded-md shadow-sm">
                            {parent.parentId}
                          </span>
                          {parent.status === 'active' ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full font-semibold">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{parent.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {parent.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                              <span className="truncate">{parent.email}</span>
                            </div>
                          )}
                          {parent.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
                            <span className="font-medium">{parent.childrenCount} {parent.childrenCount === 1 ? 'Child' : 'Children'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(parent);
                        }}
                        className="btn-primary px-6 py-2.5 text-sm whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 text-sm font-semibold border-2 border-border rounded-lg hover:bg-muted hover:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border flex items-center gap-1.5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2.5 text-sm font-semibold border-2 rounded-lg transition-all ${
                            currentPage === page
                              ? 'bg-foreground text-background border-foreground shadow-sm'
                              : 'border-border hover:bg-muted hover:border-foreground/30'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-muted-foreground font-medium">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 text-sm font-semibold border-2 border-border rounded-lg hover:bg-muted hover:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border flex items-center gap-1.5 transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <MobileNav />
      
      {/* Image Preview Modal */}
      {selectedImage && (
        <ParentImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          alt={selectedImage.name}
        />
      )}
    </div>
  );
}
