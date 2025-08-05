import * as React from "react";
import { View, ViewStyle } from "react-native";

interface SeparatorProps {
  style?: ViewStyle;
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<View, SeparatorProps>(
  (
    { style, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => {
    const baseStyle: ViewStyle = {
      backgroundColor: "#e2e8f0", // Default border color, adjust as needed
      ...(orientation === "horizontal"
        ? { height: 1, width: "100%" }
        : { width: 1, height: "100%" }),
    };

    return (
      <View
        ref={ref}
        style={[baseStyle, style]}
        accessibilityRole={decorative ? "none" : undefined}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export { Separator };