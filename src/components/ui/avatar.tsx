// MUI-based Avatar component with Shadcn-compatible API
import * as React from "react";
import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps } from "@mui/material";

export interface AvatarProps extends MuiAvatarProps {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (props, ref) => {
    return <MuiAvatar ref={ref} {...props} />;
  }
);

Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ src, alt, ...props }, ref) => {
    // MUI Avatar handles image internally
    return null;
  }
);

AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    // MUI Avatar handles fallback internally
    return <>{children}</>;
  }
);

AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
