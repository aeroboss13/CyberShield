import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  "data-testid"?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12", 
  xl: "h-16 w-16"
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg"
};

export function UserAvatar({ 
  src, 
  name = "", 
  size = "md", 
  className,
  "data-testid": testId 
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];
  
  // Get initials from name (first letters of first and last name)
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 0 || !words[0]) return "";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <Avatar className={cn(sizeClass, className)} data-testid={testId}>
      {src && (
        <AvatarImage 
          src={src} 
          alt={name || "User avatar"} 
          className="object-cover"
        />
      )}
      <AvatarFallback className="cyber-bg-surface border cyber-border">
        {initials ? (
          <span className={cn("cyber-text font-semibold", textSizeClass)}>
            {initials}
          </span>
        ) : (
          <User className="cyber-text-muted" size={size === "sm" ? 16 : size === "lg" ? 20 : size === "xl" ? 24 : 18} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}