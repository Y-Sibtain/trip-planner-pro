import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Itinerary {
  id: string;
  title: string;
  description: string | null;
  duration_days: number;
  price: number;
  destination_id: string | null;
}

interface Destination {
  id: string;
  name: string;
}

export default function ManageItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<Itinerary | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: '',
    price: '',
    destination_id: '',
  });

  useEffect(() => {
    fetchItineraries();
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    const { data, error } = await supabase.from('destinations').select('id, name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load destinations',
        variant: 'destructive',
      });
    } else {
      setDestinations(data || []);
    }
  };

  const fetchItineraries = async () => {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load itineraries',
        variant: 'destructive',
      });
    } else {
      setItineraries(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itineraryData = {
      title: formData.title,
      description: formData.description,
      duration_days: parseInt(formData.duration_days),
      price: parseFloat(formData.price),
      destination_id: formData.destination_id || null,
    };

    if (editingItinerary) {
      const { error } = await supabase
        .from('itineraries')
        .update(itineraryData)
        .eq('id', editingItinerary.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update itinerary',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Itinerary updated successfully' });
        setIsDialogOpen(false);
        resetForm();
        fetchItineraries();
      }
    } else {
      const { error } = await supabase.from('itineraries').insert([itineraryData]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create itinerary',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Itinerary created successfully' });
        setIsDialogOpen(false);
        resetForm();
        fetchItineraries();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    const { error } = await supabase.from('itineraries').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete itinerary',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Itinerary deleted successfully' });
      fetchItineraries();
    }
  };

  const handleEdit = (itinerary: Itinerary) => {
    setEditingItinerary(itinerary);
    setFormData({
      title: itinerary.title,
      description: itinerary.description || '',
      duration_days: itinerary.duration_days.toString(),
      price: itinerary.price.toString(),
      destination_id: itinerary.destination_id || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration_days: '',
      price: '',
      destination_id: '',
    });
    setEditingItinerary(null);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Itineraries</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Itinerary
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItinerary ? 'Edit Itinerary' : 'Add New Itinerary'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Select
                    value={formData.destination_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, destination_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((dest) => (
                        <SelectItem key={dest.id} value={dest.id}>
                          {dest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration_days">Duration (Days)</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_days: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingItinerary ? 'Update' : 'Create'} Itinerary
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itineraries.map((itinerary) => (
                <TableRow key={itinerary.id}>
                  <TableCell>{itinerary.title}</TableCell>
                  <TableCell>{itinerary.duration_days} days</TableCell>
                  <TableCell>${itinerary.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(itinerary)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(itinerary.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
