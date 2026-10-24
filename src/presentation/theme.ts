/**
 * The app's visual contract lives here so screens compose a single system
 * rather than introducing one-off colours when new planner states are added.
 */
export const theme = {
  colors: {
    canvas: "#F6F7FB",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF1F8",
    surfaceAccent: "#E8EEFF",
    ink: "#15213B",
    inkMuted: "#65718A",
    primary: "#315EFB",
    primarySoft: "#DCE6FF",
    border: "#DDE3F0",
    success: "#18794E",
    successSoft: "#DDF5E8",
    danger: "#B42318",
    dangerSoft: "#FDE8E7",
    warning: "#A15C00",
    warningSoft: "#FFF1D6",
  },
  radius: { card: 20, control: 12, pill: 999 },
  spacing: { screen: 20, card: 16 },
} as const;
