import { Input } from "../ui";

import { TextInputProps } from "react-native";

interface Props extends Pick<
  TextInputProps,
  "onSubmitEditing" | "returnKeyType"
> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  onSubmitEditing,
  returnKeyType = "search",
}: Props) {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      returnKeyType={returnKeyType}
    />
  );
}