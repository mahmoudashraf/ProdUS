// third-party
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconChecklist,
  IconDashboard,
  IconPackage,
  IconRobot,
  IconSettings,
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
  IconSettings,
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
      title: 'Productization',
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
      title: 'Service Catalog',
      type: 'item',
      url: '/catalog',
      icon: icons.IconVocabulary,
      roles: [UserRole.ADMIN, UserRole.PRODUCT_OWNER],
      breadcrumbs: true
    },
    {
      id: 'products',
      title: 'Product Profiles',
      type: 'item',
      url: '/owner/products',
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
      roles: [UserRole.ADMIN],
      breadcrumbs: true
    },
    {
      id: 'packages',
      title: 'Packages',
      type: 'item',
      url: '/packages',
      icon: icons.IconPackage,
      roles: [UserRole.ADMIN],
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
      roles: [UserRole.ADMIN, UserRole.TEAM_MANAGER, UserRole.SPECIALIST, UserRole.ADVISOR],
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
    }
  ]
};

export default produs;
