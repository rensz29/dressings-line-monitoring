import {
  Layers, Wind, Droplets, Disc, Ribbon, Tag, Scale, Flame, Scan,
  PackagePlus, Box, Package, PackageCheck, Cog,
  Play, Pause, Timer, Ban, OctagonX, CircleHelp, PowerOff,
} from "lucide-react";

/* Machine icons — keys must match the bridge's machineType strings exactly. */
export const MACHINE_ICONS = {
  "Depalletizer": Layers,
  "Jar Blower": Wind,
  "Filler": Droplets,
  "Capper": Disc,
  "SOB": Ribbon,
  "Labeller": Tag,
  "Check Weigher": Scale,
  "Shrink Tunnel": Flame,
  "Xray": Scan,
  "Autocaser": PackagePlus,
  "Case Former": Box,
  "Case Packer": Package,
  "Case Sealer": PackageCheck,
};

export const machineIcon = (type) => MACHINE_ICONS[type] || Cog;

/* Status icons — shape redundancy so no status relies on color alone. */
export const STATUS_ICONS = {
  RUNNING: Play,
  IDLE: Pause,
  WAITING: Timer,
  BLOCKED: Ban,
  STOPPED: OctagonX,
  OFFLINE: CircleHelp,
  DISABLED: PowerOff,
};
