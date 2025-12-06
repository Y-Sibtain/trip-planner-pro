import { Check, Plane, Hotel, Target, Users, ReceiptText, MapPin } from "lucide-react";

interface StepProgressProps {
  currentStep: "city" | "flight" | "hotel" | "activity" | "traveller" | "plan";
  totalDestinations?: number;
  currentDestinationIndex?: number;
}

const StepProgress = ({ currentStep, totalDestinations = 1, currentDestinationIndex = 0 }: StepProgressProps) => {
  const steps = [
    { id: "city", label: "Destination", icon: <MapPin /> },
    { id: "flight", label: "Flight", icon: <Plane /> },
    { id: "hotel", label: "Hotel", icon: <Hotel /> },
    { id: "activity", label: "Activity", icon: <Target /> },
    { id: "traveller", label: "Travelers", icon: <Users /> },
    { id: "plan", label: "Review Plan", icon: <ReceiptText /> },
  ];

  const stepOrder = ["city", "flight", "hotel", "activity", "traveller", "plan"];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  // For multi-destination, show progress per destination
  const isMultiDestination = totalDestinations && totalDestinations > 1;
  const destProgress = isMultiDestination ? `(${currentDestinationIndex + 1}/${totalDestinations})` : "";

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/80 border-b border-blue-200 dark:border-gray-700 px-4 py-8 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto">
        {/* Progress Title */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Step {currentStepIndex + 1} of {steps.length}
          </h3>
          {isMultiDestination && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Destination {destProgress}
            </p>
          )}
        </div>

        {/* Steps Container with Timeline */}
        <div className="flex items-center justify-between gap-2 px-4">
          {/* Step Items */}
          <div className="flex items-start justify-between w-full relative z-10 gap-3">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Circle Node */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-3 flex-shrink-0 ${
                      isCompleted
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-500/50 ring-2 ring-blue-400/30"
                        : isCurrent
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 border-cyan-500 text-white shadow-2xl shadow-cyan-500/50 scale-110 ring-4 ring-cyan-400/20"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7" />
                    ) : (
                      <span className="text-xl">{step.icon}</span>
                    )}
                  </div>

                  {/* Label */}
                  <p
                    className={`mt-3 text-center font-semibold text-sm transition-colors duration-300 whitespace-nowrap ${
                      isCompleted || isCurrent
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Connector Line to next step */}
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-12 -mx-6 transition-all duration-300 ${
                        isCompleted
                          ? "bg-blue-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      style={{ marginTop: "0.75rem", marginBottom: "-0.75rem" }}
                    ></div>
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
