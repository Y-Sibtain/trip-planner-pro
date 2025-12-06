import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: "city" | "flight" | "hotel" | "activity" | "traveller" | "plan";
  totalDestinations?: number;
  currentDestinationIndex?: number;
  onStepClick?: (stepId: string, index: number) => void;
}

const StepProgress = ({ currentStep, totalDestinations = 1, currentDestinationIndex = 0, onStepClick }: StepProgressProps) => {
  const steps = [
    { id: "city", label: "Destination" },
    { id: "flight", label: "Flight" },
    { id: "hotel", label: "Hotel" },
    { id: "activity", label: "Activity" },
    { id: "traveller", label: "Travelers" },
    { id: "plan", label: "Review Plan" },
  ];

  const stepOrder = ["city", "flight", "hotel", "activity", "traveller", "plan"];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 sticky top-0 z-40 shadow-sm">
      <div className="max-w-4xl mx-auto">
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
                <div
                  key={step.id}
                  className="flex flex-col items-center relative z-10 flex-1"
                >
                  {/* Circle Node */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => (typeof (onStepClick as any) === 'function' ? onStepClick(step.id, index) : undefined)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') (onStepClick as any)?.(step.id, index); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 select-none ${
                      isCompleted
                        ? "bg-blue-500 border-blue-600 text-white shadow-md cursor-pointer"
                        : isCurrent
                        ? "bg-blue-500 border-blue-600 text-white shadow-lg ring-4 ring-blue-400/20 cursor-pointer"
                        : "bg-transparent border-gray-300 dark:border-gray-600 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                    )}
                  </div>

                  {/* Label */}
                  <p
                    onClick={() => (typeof (onStepClick as any) === 'function' ? onStepClick(step.id, index) : undefined)}
                    className={`mt-3 text-center font-semibold text-sm transition-colors duration-300 whitespace-nowrap ${
                      isCompleted || isCurrent
                        ? "text-gray-900 dark:text-white cursor-pointer"
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
