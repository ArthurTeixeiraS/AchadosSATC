import React from "react";
import { SafeAreaView, SafeAreaViewProps} from "react-native-safe-area-context";

import { styles } from "./styles";

interface ScreenContainerProps extends SafeAreaViewProps {
  children: React.ReactNode;
}

export function ScreenContainer({ children, style, edges, ...props }: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={edges ?? ["left", "right", "bottom"]}
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
