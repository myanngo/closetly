import { Slot } from "expo-router";

export default function SlotLayout() {
  // Override default layout to ensure that our screen background bleeds
  // into the status bar.
  return <Slot />;
}
