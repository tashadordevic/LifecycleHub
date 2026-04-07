import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  GitBranch,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function LifecycleStages() {
  const { api } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
    color: '#007AFF'
  });

  const fetchStages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lifecycle-stages');
      setStages(response.data);
    } catch (error) {
      console.error('Fetch stages error:', error);
      toast.error('Failed to load lifecycle stages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const handleOpenDialog = (stage = null) => {
    if (stage) {
      setEditingStage(stage);
      setFormData({
        name: stage.name,
        description: stage.description,
        order: stage.order,
        color: stage.color
      });
    } else {
      setEditingStage(null);
      setFormData({
        name: '',
        description: '',
        order: stages.length + 1,
        color: '#007AFF'
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingStage) {
        await api.put(`/lifecycle-stages/${editingStage.id}`, formData);
        toast.success('Stage updated successfully');
      } else {
        await api.post('/lifecycle-stages', formData);
        toast.success('Stage created successfully');
      }
      setShowDialog(false);
      fetchStages();
    } catch (error) {
      toast.error('Failed to save stage');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stage?')) return;
    try {
      await api.delete(`/lifecycle-stages/${id}`);
      toast.success('Stage deleted');
      fetchStages();
    } catch (error) {
      toast.error('Failed to delete stage');
    }
  };

  const PRESET_COLORS = [
    '#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="lifecycle-stages-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Lifecycle Stages</h1>
          <p className="text-muted-foreground mt-1">Define and customize your customer lifecycle stages</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="add-stage-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {/* Stages List */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Configuration</CardTitle>
          <CardDescription>
            Stages are evaluated in order. Customers progress through stages based on signals and criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : stages.length > 0 ? (
            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                  data-testid={`stage-${stage.id}`}
                >
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <GripVertical className="w-5 h-5" />
                    <span className="text-sm font-mono w-6">{stage.order}</span>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{stage.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(stage)}
                      data-testid={`edit-stage-${stage.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(stage.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`delete-stage-${stage.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No lifecycle stages defined</p>
              <p className="text-sm mt-1">Add stages to model your customer lifecycle</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lifecycle Flow Visualization */}
      {stages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle Flow</CardTitle>
            <CardDescription>Visual representation of your customer journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between overflow-x-auto pb-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: stage.color }}
                    >
                      {index + 1}
                    </div>
                    <p className="mt-2 text-sm font-medium text-center max-w-[100px]">
                      {stage.name}
                    </p>
                  </div>
                  {index < stages.length - 1 && (
                    <div className="w-12 h-0.5 bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage ? 'Edit Stage' : 'Add Stage'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Onboarding"
                data-testid="stage-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this lifecycle stage..."
                rows={3}
                data-testid="stage-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min={1}
                  data-testid="stage-order-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name}
              data-testid="save-stage-btn"
            >
              {editingStage ? 'Update' : 'Create'} Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
