import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export default function Reports() {
  const { api } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState('all');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = segmentFilter !== 'all' ? `?segment=${segmentFilter}` : '';
      const response = await api.get(`/reports/summary${params}`);
      setReport(response.data);
    } catch (error) {
      console.error('Fetch report error:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [segmentFilter]);

  const exportReport = () => {
    if (!report) return;
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecycle-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const healthData = report ? [
    { name: 'Healthy', value: report.health_distribution.high, color: '#10B981' },
    { name: 'At Risk', value: report.health_distribution.medium, color: '#F59E0B' },
    { name: 'Critical', value: report.health_distribution.low, color: '#EF4444' },
  ] : [];

  const stageData = report ? Object.entries(report.stage_distribution).map(([name, data], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: data.count,
    arr: data.arr,
    color: COLORS[index % COLORS.length]
  })) : [];

  const segmentData = report ? Object.entries(report.segment_distribution).map(([name, data], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: data.count,
    arr: data.arr,
    color: COLORS[index % COLORS.length]
  })) : [];

  const signalData = report ? Object.entries(report.signal_activity).map(([name, count], index) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    count,
    color: COLORS[index % COLORS.length]
  })) : [];

  const totalARR = segmentData.reduce((sum, s) => sum + (s.arr || 0), 0);
  const atRiskARR = stageData.find(s => s.name.toLowerCase() === 'risk')?.arr || 0;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics and insights overview</p>
        </div>
        <div className="flex gap-2">
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[150px]" data-testid="report-segment-filter">
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="mid-market">Mid-Market</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReport} data-testid="refresh-report-btn">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={exportReport} data-testid="export-report-btn">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-3xl font-bold mt-1">{report.total_customers}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total ARR</p>
                    <p className="text-3xl font-bold mt-1">${(totalARR / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Healthy Rate</p>
                    <p className="text-3xl font-bold mt-1 text-green-500">
                      {report.total_customers > 0 
                        ? Math.round((report.health_distribution.high / report.total_customers) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">At Risk ARR</p>
                    <p className="text-3xl font-bold mt-1 text-red-500">${(atRiskARR / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {healthData.some(d => d.value > 0) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={healthData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {healthData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111111',
                            border: '1px solid #262626',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Stage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {stageData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stageData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#A3A3A3', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111111',
                            border: '1px solid #262626',
                            borderRadius: '8px'
                          }}
                          formatter={(value, name) => [value, name === 'arr' ? 'ARR' : 'Count']}
                        />
                        <Bar dataKey="count" name="Customers" radius={[0, 4, 4, 0]}>
                          {stageData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Segment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {segmentData.length > 0 ? (
                  <div className="space-y-4">
                    {segmentData.map((segment) => (
                      <div key={segment.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{segment.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {segment.count} customers • ${(segment.arr / 1000).toFixed(0)}K ARR
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(segment.count / report.total_customers) * 100}%`,
                              backgroundColor: segment.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No segment data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signal Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Signal Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {signalData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={signalData}>
                        <XAxis dataKey="name" tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111111',
                            border: '1px solid #262626',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {signalData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No signal data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No report data available</p>
        </div>
      )}
    </div>
  );
}
