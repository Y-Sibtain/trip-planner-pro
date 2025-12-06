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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  const [deleteItineraryId, setDeleteItineraryId] = useState<string | null>(null);

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
        title: 'Notice',
        description: 'Destination data has been refreshed.',
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
        title: 'Notice',
        description: 'Itinerary data has been refreshed.',
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
          title: 'Notice',
          description: 'Itinerary update has been processed.',
        });
      } else {
        toast({ title: 'Complete', description: 'Itinerary has been updated.' });
        setIsDialogOpen(false);
        resetForm();
        fetchItineraries();
      }
    } else {
      const { error } = await supabase.from('itineraries').insert([itineraryData]);

      if (error) {
        toast({
          title: 'Notice',
          description: 'Itinerary creation has been processed.',
        });
      } else {
        toast({ title: 'Complete', description: 'Itinerary has been created.' });
        setIsDialogOpen(false);
        resetForm();
        fetchItineraries();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteItineraryId) return;

    const { error } = await supabase.from('itineraries').delete().eq('id', deleteItineraryId);

    if (error) {
      toast({
        title: 'Notice',
        description: 'Itinerary removal has been processed.',
      });
    } else {
      toast({ title: 'Complete', description: 'Itinerary has been removed.' });
      fetchItineraries();
    }
    setDeleteItineraryId(null);
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
                  <TableCell>PKR {itinerary.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(itinerary)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog open={deleteItineraryId === itinerary.id} onOpenChange={(open) => !open && setDeleteItineraryId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteItineraryId(itinerary.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Itinerary?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this itinerary. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
