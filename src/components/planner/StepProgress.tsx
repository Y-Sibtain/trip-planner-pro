<<<<<<< HEAD
import { Check, X } from "lucide-react";
=======
import { Check, Plane, Hotel, Target, Users, ReceiptText, MapPin } from "lucide-react";
>>>>>>> 83e3c71f909884b2f2e7e58c49448f732c9c3992

interface StepProgressProps {
  currentStep: "city" | "flight" | "hotel" | "activity" | "traveller" | "plan";
  totalDestinations?: number;
  currentDestinationIndex?: number;
}

const StepProgress = ({ currentStep, totalDestinations = 1, currentDestinationIndex = 0 }: StepProgressProps) => {
  const steps = [
<<<<<<< HEAD
    { id: "city", label: "Destination" },
    { id: "flight", label: "Flight" },
    { id: "hotel", label: "Hotel" },
    { id: "activity", label: "Activity" },
    { id: "traveller", label: "Travelers" },
    { id: "plan", label: "Review Plan" },
=======
    { id: "city", label: "Destination", icon: <MapPin /> },
    { id: "flight", label: "Flight", icon: <Plane /> },
    { id: "hotel", label: "Hotel", icon: <Hotel /> },
    { id: "activity", label: "Activity", icon: <Target /> },
    { id: "traveller", label: "Travelers", icon: <Users /> },
    { id: "plan", label: "Review Plan", icon: <ReceiptText /> },
>>>>>>> 83e3c71f909884b2f2e7e58c49448f732c9c3992
  ];

  const stepOrder = ["city", "flight", "hotel", "activity", "traveller", "plan"];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  // For multi-destination, show progress per destination
  const isMultiDestination = totalDestinations && totalDestinations > 1;
  const destProgress = isMultiDestination ? `(${currentDestinationIndex + 1}/${totalDestinations})` : "";

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 sticky top-0 z-40 shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Progress Title */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Step {currentStepIndex + 1} of {steps.length}
          </h3>
          {isMultiDestination && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Destination {destProgress}
            </p>
          )}
        </div>

        {/* Horizontal Steps Container */}
        <div className="relative">
          {/* Background and Progress Lines */}
          <div className="absolute top-5 left-0 right-0 flex items-center">
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          </div>
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{
              width: currentStepIndex === 0 ? '0%' : `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          ></div>

          {/* Step Items */}
          <div className="relative flex items-start justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center relative z-10 flex-1">
                  {/* Circle Node */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                      isCompleted
                        ? "bg-blue-500 border-blue-600 text-white shadow-md"
                        : isCurrent
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg ring-4 ring-blue-400/20"
                        : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={`mt-3 text-center font-semibold text-sm transition-colors duration-300 whitespace-nowrap ${
                      isCompleted || isCurrent
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* In Progress Indicator */}
                  {isCurrent && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                      In Progress
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
