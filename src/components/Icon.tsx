import { Image, type ImageStyle, type StyleProp } from "react-native";

const SOURCES = {
  bookmark: require("../../assets/icons/bookmark.png"),
  check: require("../../assets/icons/check.png"),
  chevronleft: require("../../assets/icons/chevronleft.png"),
  chevronright: require("../../assets/icons/chevronright.png"),
  close: require("../../assets/icons/close.png"),
  comment: require("../../assets/icons/comment.png"),
  copy: require("../../assets/icons/copy.png"),
  download: require("../../assets/icons/download.png"),
  external: require("../../assets/icons/external.png"),
  eye: require("../../assets/icons/eye.png"),
  heart: require("../../assets/icons/heart.png"),
  link: require("../../assets/icons/link.png"),
  music: require("../../assets/icons/music.png"),
  pause: require("../../assets/icons/pause.png"),
  play: require("../../assets/icons/play.png"),
  repost: require("../../assets/icons/repost.png"),
  share: require("../../assets/icons/share.png"),
  slides: require("../../assets/icons/slides.png"),
};

export type IconName = keyof typeof SOURCES;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
};

export default function Icon({ name, size = 20, color = "#e8eaf0", style }: Props) {
  return (
    <Image
      source={SOURCES[name]}
      style={[{ width: size, height: size, tintColor: color }, style]}
    />
  );
}
