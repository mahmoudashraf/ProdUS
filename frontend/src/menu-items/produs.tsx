// third-party
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconChecklist,
  IconDashboard,
  IconPackage,
  IconRobot,
  IconScan,
  IconSettings,
  IconSparkles,
  IconUsers,
  IconVocabulary,
} from '@tabler/icons-react';

// type
import { NavItemType } from 'types';
import { UserRole } from '@/types/auth';

const icons = {
  IconBriefcase,
  IconBuildingCommunity,
  IconChecklist,
  IconDashboard,
  IconPackage,
  IconRobot,
  IconScan,
  IconSettings,
  IconSparkles,
  IconUsers,
  IconVocabulary,
};

// ==============================|| MENU ITEMS - ADMIN ||============================== //

const produs: NavItemType = {
  id: 'platform',
  title: 'Platform',
  type: 'group',
  children: [
    {
      id: 'admin-control',
      title: 'Admin Control',
      type: 'item',
      url: '/dashboard',
      icon: icons.IconDashboard,
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    },
    {
      id: 'owner-productization',
      title: 'Home',
      type: 'item',
      url: '/dashboard',
      icon: icons.IconBriefcase,
      roles: [UserRole.PRODUCT_OWNER],
      breadcrumbs: true
    },
    {
      id: 'team-delivery',
      title: 'Delivery Control',
      type: 'item',
      url: '/dashboard',
      icon: icons.IconDashboard,
      roles: [UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR],
      breadcrumbs: true
    },
    {
      id: 'catalog',
      title: 'Choose Services',
      type: 'item',
      url: '/catalog',
      icon: icons.IconVocabulary,
      roles: [UserRole.ADMIN, UserRole.PRODUCT_OWNER],
      breadcrumbs: true
    },
    {
      id: 'products',
      title: 'Products',
      type: 'item',
      url: '/products',
      icon: icons.IconBriefcase,
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    },
    {
      id: 'requirements',
      title: 'Requirements',
      type: 'item',
      url: '/owner/requirements',
      icon: icons.IconChecklist,
      roles: [UserRole.ADMIN, UserRole.PRODUCT_OWNER],
      breadcrumbs: true
    },
    {
      id: 'packages',
      title: 'Plan Library',
      type: 'item',
      url: '/packages',
      icon: icons.IconPackage,
      roles: [UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER],
      breadcrumbs: true
    },
    {
      id: 'expert-network',
      title: 'ProdUS Network',
      type: 'item',
      url: '/expert-network',
      icon: icons.IconSparkles,
      roles: [UserRole.ADMIN, UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR],
      breadcrumbs: true
    },
    {
      id: 'teams',
      title: 'Team Profile',
      type: 'item',
      url: '/teams',
      icon: icons.IconUsers,
      roles: [UserRole.ADMIN, UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR],
      breadcrumbs: true
    },
    {
      id: 'workspaces',
      title: 'Active Workspaces',
      type: 'item',
      url: '/workspaces',
      icon: icons.IconBuildingCommunity,
      roles: [UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR],
      breadcrumbs: true
    },
    {
      id: 'admin-catalog',
      title: 'Admin Catalog',
      type: 'item',
      url: '/admin/catalog',
      icon: icons.IconSettings,
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    },
    {
      id: 'ai-recommendations',
      title: 'AI Audit',
      type: 'item',
      url: '/admin/recommendations',
      icon: icons.IconRobot,
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    },
    {
      id: 'scanner-operations',
      title: 'Scanner Ops',
      type: 'item',
      url: '/admin/scanners',
      icon: icons.IconScan,
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    },
    {
      id: 'diagnosis-quality',
      title: 'Diagnosis Quality',
      type: 'item',
      url: '/admin/diagnosis-quality',
      icon: icons.IconChecklist,
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    }
  ]
};

export default produs;
