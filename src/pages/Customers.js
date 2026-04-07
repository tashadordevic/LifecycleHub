import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { HealthScore, HealthIndicator } from '../components/HealthScore';
import { Search, Plus, Filter, ChevronRight, Building2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const { api } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    segment: 'standard',
    lifecycle_stage: 'onboarding',
    contact_name: '',
    contact_email: '',
    industry: '',
    arr: ''
  });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'all');
  const [segmentFilter, setSegmentFilter] = useState(searchParams.get('segment') || 'all');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stageFilter && stageFilter !== 'all') params.append('stage', stageFilter);
      if (segmentFilter && segmentFilter !== 'all') params.append('segment', segmentFilter);
      if (searchParams.get('health_max')) params.append('health_max', searchParams.get('health_max'));

      const response = await api.get(`/customers?${params.toString()}`);
      setCustomers(response.data.customers);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Fetch customers error:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const response = await api.get('/lifecycle-stages');
      setStages(response.data);
    } catch (error) {
      console.error('Fetch stages error:', error);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timeoutId);
  }, [search, stageFilter, segmentFilter, searchParams]);

  const handleAddCustomer = async () => {
    try {
      const data = {
        ...newCustomer,
        arr: newCustomer.arr ? parseFloat(newCustomer.arr) : null
      };
      await api.post('/customers', data);
      toast.success('Customer added successfully');
      setShowAddDialog(false);
      setNewCustomer({
        name: '',
        segment: 'standard',
        lifecycle_stage: 'onboarding',
        contact_name: '',
        contact_email: '',
        industry: '',
        arr: ''
      });
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to add customer');
    }
  };


  const exportCSV = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    const headers = ['Name', 'Segment', 'Lifecycle Stage', 'Health Score', 'Contact Name', 'Contact Email', 'Industry', 'ARR', 'Created At', 'Last Activity'];
    const rows = customers.map(c => [
      c.name || '',
      c.segment || '',
      c.lifecycle_stage || '',
      c.health_score || '',
      c.contact_name || '',
      c.contact_email || '',
      c.industry || '',
      c.arr || '',
      c.created_at || '',
      c.last_activity || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecyclehub-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Customers exported');
  };
  return (
    <div className="space-y-6 animate-fadeIn" data-testid="customers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">{total} total customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} data-testid="export-csv-btn">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-customer-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="customer-search"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="stage-filter">
                <SelectValue placeholder="Lifecycle Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.name.toLowerCase()}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="segment-filter">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="mid-market">Mid-Market</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : customers.length > 0 ? (
            <div className="divide-y divide-border">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  data-testid={`customer-row-${customer.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{customer.name}</p>
                        <span className="px-2 py-0.5 rounded text-xs bg-secondary capitalize">
                          {customer.segment}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{customer.lifecycle_stage}</span>
                        {customer.industry && (
                          <>
                            <span>•</span>
                            <span>{customer.industry}</span>
                          </>
                        )}
                        {customer.arr && (
                          <>
                            <span>•</span>
                            <span>${customer.arr.toLocaleString()} ARR</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <HealthScore score={customer.health_score} />
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new customer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Acme Corp"
                data-testid="new-customer-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segment</Label>
                <Select
                  value={newCustomer.segment}
                  onValueChange={(v) => setNewCustomer({ ...newCustomer, segment: v })}
                >
                  <SelectTrigger data-testid="new-customer-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="mid-market">Mid-Market</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lifecycle Stage</Label>
                <Select
                  value={newCustomer.lifecycle_stage}
                  onValueChange={(v) => setNewCustomer({ ...newCustomer, lifecycle_stage: v })}
                >
                  <SelectTrigger data-testid="new-customer-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.name.toLowerCase()}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={newCustomer.contact_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={newCustomer.contact_email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contact_email: e.target.value })}
                  placeholder="john@acme.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={newCustomer.industry}
                  onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value })}
                  placeholder="Technology"
                />
              </div>
              <div className="space-y-2">
                <Label>ARR ($)</Label>
                <Input
                  type="number"
                  value={newCustomer.arr}
                  onChange={(e) => setNewCustomer({ ...newCustomer, arr: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={!newCustomer.name} data-testid="save-customer-btn">
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
