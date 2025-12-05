import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, ChevronDown } from "lucide-react";

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
  onComplete: (travellers: TravellerDetail[]) => void;
  onBack: () => void;
}

const TravellerForm = ({ numTravellers, onComplete, onBack }: TravellerFormProps) => {
  const [travellers, setTravellers] = useState<TravellerDetail[]>(() => {
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

  const handleInputChange = (id: string, field: keyof TravellerDetail, value: string) => {
    // Format CNIC automatically
    if (field === "cnic") {
      value = formatCNIC(value);
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

  const handleSubmit = (e: React.FormEvent) => {
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
      alert("Please fill in all traveller details");
      return;
    }

    // Validate CNIC format (basic check for Pakistani CNIC: 5 digits-7 digits-1 digit)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    const cnicValid = travellers.every((t) => cnicRegex.test(t.cnic));
    if (!cnicValid) {
      alert("Please enter valid CNIC format (e.g., 12345-1234567-1)");
      return;
    }

    // Validate age
    const ageValid = travellers.every((t) => {
      const age = Number(t.age);
      return !isNaN(age) && age >= 0 && age <= 150;
    });
    if (!ageValid) {
      alert("Please enter valid ages (0-150)");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailValid = travellers.every((t) => emailRegex.test(t.email));
    if (!emailValid) {
      alert("Please enter valid email addresses");
      return;
    }

    onComplete(travellers);
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
        <div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            Traveller Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Please provide details for all {numTravellers} traveller{numTravellers > 1 ? "s" : ""}
          </p>
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

                  {/* CNIC */}
                  <div>
                    <Label className="text-gray-900 dark:text-white font-semibold mb-2 block">
                      CNIC *
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
                      placeholder="e.g., +92 300 1234567"
                      value={traveller.phone}
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
              onClick={onBack}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all-smooth"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all-smooth"
            >
              Continue to Flights →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TravellerForm;
