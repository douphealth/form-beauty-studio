import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl text-muted-foreground transition-all duration-500 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)] hover:scale-105 active:scale-95"
      aria-label="Toggle theme"
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-500 dark:-rotate-180 dark:scale-0" />
      <Moon className="absolute h-[18px] w-[18px] rotate-180 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
