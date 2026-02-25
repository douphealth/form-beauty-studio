import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl text-muted-foreground transition-colors duration-300 hover:text-foreground hover:border-primary/20 hover:bg-primary/[0.04]"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {theme === "dark" ? (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
        ) : (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
        )}
      </motion.div>
    </motion.button>
  );
}
