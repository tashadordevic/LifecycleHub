import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { HealthScore, HealthBadge } from '../components/HealthScore';
import AIAssistant from '../components/AIAssistant';
import {
  ArrowLeft,
  Building2,
  Mail,
  User,
  Activity,
  Lightbulb,
  Target,
  Sparkles,
  Loader2,
  ExternalLink,
  Calendar,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [signals, setSignals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customerRes, signalsRes, insightsRes, recsRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/signals`),
        api.get(`/customers/${id}/insights`),
        api.get(`/customers/${id}/recommendations`)
      ]);
      setCustomer(customerRes.data);
      setSignals(signalsRes.data);
      setInsights(insightsRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Fetch customer error:', error);
      toast.error('Failed to load customer data');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post(`/ai/analyze-customer/${id}`);
      setAnalysis(response.data.analysis);
      toast.success('Analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze customer');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateRecStatus = async (recId, status) => {
    try {
      await api.put(`/recommendations/${recId}/status?status=${status}`);
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) return null;

  const signalTypeIcon = {
    usage: Activity,
    support: Mail,
    billing: Target,
    engagement: User,
    feature_adoption: Sparkles
  };

  const handleEditOpen = () => {
    setEditForm({
      name: customer.name || '',
      segment: customer.segment || 'standard',
      lifecycle_stage: customer.lifecycle_stage || 'onboarding',
      health_score: customer.health_score || 70,
      contact_name: customer.contact_name || '',
      contact_email: customer.contact_email || '',
      industry: customer.industry || '',
      company_size: customer.company_size || '',
      arr: customer.arr || '',
      contract_start: customer.contract_start || '',
      contract_end: customer.contract_end || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.put(`/customers/${id}`, {
        ...editForm,
        health_score: parseInt(editForm.health_score) || 70,
        arr: editForm.arr ? parseFloat(editForm.arr) : null,
      });
      toast.success('Customer updated');
      setEditOpen(false);
      fetchData();
    } catch (e) {
      toast.error('Failed to update customer');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="customer-detail">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold">{customer.name}</h1>
              <HealthBadge score={customer.health_score} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="capitalize">{customer.segment}</span>
              <span>•</span>
              <span className="capitalize">{customer.lifecycle_stage}</span>
              {customer.industry && (
                <>
                  <span>•</span>
                  <span>{customer.industry}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditOpen} data-testid="edit-customer-btn">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" disabled data-testid="customer-ai-btn" className="opacity-50 cursor-not-allowed">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
            <span className="ml-2 text-xs bg-secondary px-1.5 py-0.5 rounded-full">Soon</span>
          </Button>
          <Button disabled data-testid="analyze-btn" className="opacity-50 cursor-not-allowed">
            <Lightbulb className="w-4 h-4 mr-2" />
            Analyze
            <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">Soon</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Health Score</p>
            <div className="mt-2">
              <HealthScore score={customer.health_score} size="lg" showLabel />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">ARR</p>
            <p className="text-2xl font-bold mt-2">
              {customer.arr ? `$${customer.arr.toLocaleString()}` : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Contact</p>
            <p className="font-medium mt-2">{customer.contact_name || 'Not set'}</p>
            <p className="text-sm text-muted-foreground">{customer.contact_email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Last Activity</p>
            <p className="font-medium mt-2">
              {customer.last_activity 
                ? new Date(customer.last_activity).toLocaleDateString()
                : 'No activity yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Results */}
      {analysis && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.health_assessment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Health Assessment</p>
                <p>{analysis.health_assessment}</p>
              </div>
            )}
            {analysis.risks?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Risks</p>
                <div className="space-y-1">
                  {analysis.risks.map((risk, i) => (
                    <div key={i} className="flex items-center gap-2 text-red-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.opportunities?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Opportunities</p>
                <div className="space-y-1">
                  {analysis.opportunities.map((opp, i) => (
                    <div key={i} className="flex items-center gap-2 text-green-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {opp}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.recommended_actions?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Actions</p>
                <div className="space-y-2">
                  {analysis.recommended_actions.map((action, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'}>
                          {action.priority}
                        </Badge>
                        <span className="font-medium">{action.action}</span>
                      </div>
                      {action.reason && (
                        <p className="text-sm text-muted-foreground">{action.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.raw_response && !analysis.health_assessment && (
              <p className="whitespace-pre-wrap">{analysis.raw_response}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="signals">
        <TabsList>
          <TabsTrigger value="signals">
            Signals ({signals.length})
          </TabsTrigger>
          <TabsTrigger value="insights">
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations ({recommendations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {signals.length > 0 ? (
                <div className="divide-y divide-border">
                  {signals.map((signal) => {
                    const Icon = signalTypeIcon[signal.signal_type] || Activity;
                    return (
                      <div key={signal.id} className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10`}>
                          <Icon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{signal.description || signal.signal_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {signal.source} • {new Date(signal.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{signal.signal_type}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No signals recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {insights.length > 0 ? (
                <div className="divide-y divide-border">
                  {insights.map((insight) => (
                    <div key={insight.id} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          insight.insight_type === 'risk' ? 'destructive' :
                          insight.insight_type === 'opportunity' ? 'default' : 'secondary'
                        }>
                          {insight.insight_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Confidence: {Math.round(insight.confidence_score * 100)}%
                        </span>
                      </div>
                      <p>{insight.description}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(insight.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No insights yet. Insights will be available in a future release.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {recommendations.length > 0 ? (
                <div className="divide-y divide-border">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            rec.priority === 'high' ? 'destructive' :
                            rec.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.status}</Badge>
                        </div>
                        <div className="flex gap-1">
                          {rec.status === 'new' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateRecStatus(rec.id, 'acknowledged')}
                              >
                                Acknowledge
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateRecStatus(rec.id, 'executed')}
                              >
                                Execute
                              </Button>
                            </>
                          )}
                          {rec.status === 'acknowledged' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRecStatus(rec.id, 'executed')}
                            >
                              Mark Executed
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">{rec.suggested_action}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.action_type} • {new Date(rec.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No recommendations yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Name</label>
                <input className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Health Score (0-100)</label>
                <input type="number" min="0" max="100" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.health_score || ''} onChange={e => setEditForm({...editForm, health_score: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ARR ($)</label>
                <input type="number" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.arr || ''} onChange={e => setEditForm({...editForm, arr: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Lifecycle Stage</label>
                <select className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.lifecycle_stage || ''} onChange={e => setEditForm({...editForm, lifecycle_stage: e.target.value})}>
                  <option value="onboarding">Onboarding</option>
                  <option value="adoption">Adoption</option>
                  <option value="retention">Retention</option>
                  <option value="expansion">Expansion</option>
                  <option value="risk">Risk</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Segment</label>
                <select className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.segment || ''} onChange={e => setEditForm({...editForm, segment: e.target.value})}>
                  <option value="standard">Standard</option>
                  <option value="mid-market">Mid-Market</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Name</label>
                <input className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.contact_name || ''} onChange={e => setEditForm({...editForm, contact_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Email</label>
                <input type="email" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.contact_email || ''} onChange={e => setEditForm({...editForm, contact_email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Industry</label>
                <input className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.industry || ''} onChange={e => setEditForm({...editForm, industry: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Company Size</label>
                <input className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" value={editForm.company_size || ''} onChange={e => setEditForm({...editForm, company_size: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant */}
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} customerId={id} />
    </div>
  );
}
