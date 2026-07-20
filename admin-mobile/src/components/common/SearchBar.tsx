import { Input } from "../ui";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({
  value,
  onChangeText,
}: Props) {
  return (
    <Input
      placeholder="Search..."
      value={value}
      onChangeText={onChangeText}
    />
  );
}