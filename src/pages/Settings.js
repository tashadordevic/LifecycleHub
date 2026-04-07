import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Shield, Database, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const [restoring, setRestoring] = useState(false);

  const handleBackup = async () => {
    try {
      const result = await window.electronAPI.backupDatabase();
      if (result.error) {
        toast.error(result.error);
      } else if (result.cancelled) {
        // user cancelled dialog, do nothing
      } else {
        toast.success(`Database backed up to ${result.path}`);
      }
    } catch (e) {
      toast.error('Backup failed');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await window.electronAPI.restoreDatabase();
      if (result.error) {
        toast.error(result.error);
      } else if (result.cancelled) {
        // user cancelled dialog, do nothing
      } else {
        toast.success('Database restored. Please restart LifecycleHub.');
      }
    } catch (e) {
      toast.error('Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and data</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Your data is stored locally in a SQLite database on your machine.
            Back it up regularly to avoid data loss.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleBackup} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Backup Database
            </Button>
            <Button variant="outline" onClick={handleRestore} disabled={restoring} className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {restoring ? 'Restoring...' : 'Restore Database'}
            </Button>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">Backup</span> — saves a copy of your database file to a location you choose.</p>
            <p><span className="font-medium text-foreground">Restore</span> — replaces your current database with a backup file. This cannot be undone.</p>
            <p className="pt-1">Database location: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">~/.config/lifecycle-hub/lifecyclehub.db</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
