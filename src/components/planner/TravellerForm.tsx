import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface TravellerDetail {
  id: string;
  firstName: string;
  lastName: string;
  cnic: string;
  age: string;
  email: string;
  phone: string;
}

interface TravellerFormProps {
  numTravellers: number;
  onComplete: (travellers: TravellerDetail[], action: 'save' | 'pay') => void;
  onBack: () => void;
}

const TravellerForm = ({ numTravellers, onComplete, onBack }: TravellerFormProps) => {
  const { toast } = useToast();
  const [travellers, setTravellers] = useState<TravellerDetail[]>(() => {
    // Try to load saved traveller data from sessionStorage
    try {
      const savedData = sessionStorage.getItem('travellerData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Verify it matches the current number of travellers
        if (parsed.length === numTravellers) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved traveller data:', e);
    }
    
    // Default: create empty traveller forms
    return Array.from({ length: numTravellers }, (_, i) => ({
      id: `traveller-${i}`,
      firstName: "",
      lastName: "",
      cnic: "",
      age: "",
      email: "",
      phone: "",
    }));
  });

  // Save traveller data to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('travellerData', JSON.stringify(travellers));
  }, [travellers]);

  const [expandedTravellers, setExpandedTravellers] = useState<Set<string>>(
    new Set(Array.from({ length: numTravellers }, (_, i) => `traveller-${i}`))
  );

  const formatCNIC = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "").slice(0, 13);
    
    // Add dashes at positions 5 and 12
    if (digits.length <= 5) {
      return digits;
    } else if (digits.length <= 12) {
      return digits.slice(0, 5) + "-" + digits.slice(5);
    } else {
      return digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);
    }
  };

  const formatPhone = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "").slice(0, 11);
    
    // Add dash after 4 digits: 0xxx-xxxxxxx
    if (digits.length <= 4) {
      return digits;
    } else {
      return digits.slice(0, 4) + "-" + digits.slice(4);
    }
  };

  const handleInputChange = (id: string, field: keyof TravellerDetail, value: string) => {
    // Format CNIC automatically
    if (field === "cnic") {
      value = formatCNIC(value);
    }
    // Format phone automatically
    if (field === "phone") {
      value = formatPhone(value);
    }

    setTravellers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedTravellers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent, action: 'save' | 'pay' = 'pay') => {
    e.preventDefault();

    // Validate all fields are filled
    const isValid = travellers.every(
      (t) =>
        t.firstName.trim() &&
        t.lastName.trim() &&
        t.cnic.trim() &&
        t.age.trim() &&
        t.email.trim() &&
        t.phone.trim()
    );

    if (!isValid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all traveller details",
        variant: "destructive",
      });
      return;
    }

    // Validate CNIC format (basic check for Pakistani CNIC: 5 digits-7 digits-1 digit)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    const cnicValid = travellers.every((t) => cnicRegex.test(t.cnic));
    if (!cnicValid) {
      toast({
        title: "Invalid CNIC Format",
        description: "Please enter valid CNIC format (e.g., 12345-1234567-1)",
        variant: "destructive",
      });
      return;
    }

    // Validate age
    const ageValid = travellers.every((t) => {
      const age = Number(t.age);
      return !isNaN(age) && age >= 0 && age <= 150;
    });
    if (!ageValid) {
      toast({
        title: "Invalid Age",
        description: "Please enter valid ages (0-150)",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailValid = travellers.every((t) => emailRegex.test(t.email));
    if (!emailValid) {
      toast({
        title: "Invalid Email",
        description: "Please enter valid email addresses",
        variant: "destructive",
      });
      return;
    }

    onComplete(travellers, action);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10 dark:opacity-5"></div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6 relative z-10">
        {/* Header */}
        <div className="glass p-8 rounded-2xl border border-cyan-500/20 dark:border-cyan-500/10 backdrop-blur-xl dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Traveller Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Please provide details for all {numTravellers} traveller{numTravellers > 1 ? "s" : ""}
              </p>
            </div>
            <Button 
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold glow-primary hover:scale-105 transition-all-smooth"
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* Traveller Cards */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {travellers.map((traveller, index) => (
            <Card
              key={traveller.id}
              className="glass border-gray-200 dark:border-gray-700 shadow-md dark:bg-gray-800/50"
            >
              <CardHeader 
                className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 cursor-pointer hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 transition-colors"
                onClick={() => toggleExpanded(traveller.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Traveller {index + 1}
                  </CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-900 dark:text-white transition-transform ${
                      expandedTravellers.has(traveller.id) ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>
              </CardHeader>
              {expandedTravellers.has(traveller.id) && (
                <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      First Name *
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g., Ahmed"
                      value={traveller.firstName}
                      onChange={(e) =>
                        handleInputChange(
                          traveller.id,
                          "firstName",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      Last Name *
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g., Khan"
                      value={traveller.lastName}
                      onChange={(e) =>
                        handleInputChange(
                          traveller.id,
                          "lastName",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                    />
                  </div>

                  {/* Government-issued ID */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      Government-issued ID *
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g., 12345-1234567-1"
                      value={traveller.cnic}
                      maxLength={15}
                      onChange={(e) =>
                        handleInputChange(traveller.id, "cnic", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      Age *
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g., 25"
                      min="0"
                      max="150"
                      value={traveller.age}
                      onChange={(e) =>
                        handleInputChange(traveller.id, "age", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      Email *
                    </Label>
                    <Input
                      type="email"
                      placeholder="e.g., ahmed@example.com"
                      value={traveller.email}
                      onChange={(e) =>
                        handleInputChange(traveller.id, "email", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      Phone Number *
                    </Label>
                    <Input
                      type="tel"
                      placeholder="e.g., 0300-1234567"
                      value={traveller.phone}
                      maxLength={12}
                      onChange={(e) =>
                        handleInputChange(traveller.id, "phone", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                    />
                  </div>
                </div>
              </CardContent>
              )}
            </Card>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              onClick={(e) => handleSubmit(e as any, 'save')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all-smooth"
            >
              Save Booking
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all-smooth"
            >
              Pay Now →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TravellerForm;
