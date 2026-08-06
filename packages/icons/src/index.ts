/**
 * The single icon surface for the platform.
 *
 * Applications never install an icon library. They import from here, which
 * means the icon set can be swapped, subset, or self-hosted in one place
 * instead of in three applications.
 *
 * Adding an icon: re-export it below with a semantic name describing what it
 * *means* in the product, not what it looks like.
 */
export {
  AlertCircle as AlertIcon,
  ArrowLeft as BackIcon,
  ArrowRight as ForwardIcon,
  Bell as NotificationIcon,
  Building2 as PartnerIcon,
  Calendar as CalendarIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  CircleUser as AccountIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  Eye as VisibleIcon,
  EyeOff as HiddenIcon,
  Filter as FilterIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  LayoutDashboard as DashboardIcon,
  LoaderCircle as SpinnerIcon,
  LogOut as SignOutIcon,
  Menu as MenuIcon,
  Moon as DarkModeIcon,
  Plus as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shield as AdminIcon,
  Sun as LightModeIcon,
  Trash2 as DeleteIcon,
  TriangleAlert as WarningIcon,
  Users as UsersIcon,
  X as CloseIcon,
} from 'lucide-react';

export type { LucideProps as IconProps } from 'lucide-react';
