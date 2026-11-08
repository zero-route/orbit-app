import type { ReactNode } from "react";
import { ImageBackground, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  radius: number;
  border?: number;
  solid?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export default function GradientBox({ radius, border = 1.5, solid, style, children }: Props) {
  if (solid) {
    return (
      <View
        style={[
          { borderRadius: radius, padding: border, backgroundColor: solid, overflow: "hidden" },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/spectrum.png")}
      resizeMode="stretch"
      style={[{ borderRadius: radius, padding: border, overflow: "hidden" }, style]}
    >
      {children}
    </ImageBackground>
  );
}
