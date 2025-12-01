import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeSwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

const ThemeSwitch = ({
  className,
  collapsed = false,
  ...props
}: ThemeSwitchProps) => {
  const { theme, setTheme } = useTheme();
  const [checked, setChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setChecked(theme === "dark"), [theme]);

  const handleCheckedChange = useCallback(
    (isChecked: boolean) => {
      setChecked(isChecked);
      setTheme(isChecked ? "dark" : "light");
    },
    [setTheme],
  );

  const handleClick = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  if (!mounted) return null;

  // When collapsed, show a simple button instead of toggle
  if (collapsed) {
    return (
      <button
        onClick={handleClick}
        title={`Dark mode: ${theme === "dark" ? "on" : "off"} (click to toggle)`}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 transition-colors"
        {...props}
      >
        {theme === "dark" ? (
          <MoonIcon size={18} className="text-blue-400" />
        ) : (
          <SunIcon size={18} className="text-yellow-500" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center cursor-pointer",
        "h-9 w-20",
        className
      )}
      {...props}
    >
      {/* Custom switch implementation using checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => handleCheckedChange(e.target.checked)}
        className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-20"
        style={{ cursor: "pointer" }}
      />

      {/* Track background */}
      <div className="absolute inset-0 h-full w-full rounded-full bg-gray-300 dark:bg-gray-600 transition-colors pointer-events-none" />

      {/* Thumb/Slider */}
      <div
        className={cn(
          "absolute left-1 h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow transition-all duration-300 z-10 pointer-events-none",
          checked ? "translate-x-[44px]" : "translate-x-0"
        )}
      />

      {/* Sun Icon (left) */}
      <span
        className={cn(
          "pointer-events-none absolute left-2 inset-y-0 z-0",
          "flex items-center justify-center"
        )}
      >
        <SunIcon
          size={16}
          className={cn(
            "transition-all duration-200 ease-out",
            checked ? "text-gray-400/70" : "text-yellow-500 scale-110"
          )}
        />
      </span>

      {/* Moon Icon (right) */}
      <span
        className={cn(
          "pointer-events-none absolute right-2 inset-y-0 z-0",
          "flex items-center justify-center"
        )}
      >
        <MoonIcon
          size={16}
          className={cn(
            "transition-all duration-200 ease-out",
            checked ? "text-blue-400 scale-110" : "text-gray-400/70"
          )}
        />
      </span>
    </div>
  );
};

export default ThemeSwitch;
