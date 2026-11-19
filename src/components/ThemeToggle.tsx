import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Icon = theme === "dark" ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
      className="grid h-11 w-11 place-items-center rounded-lg border border-border/50"
    >
      <Icon size={18} />
    </button>
  );
}
