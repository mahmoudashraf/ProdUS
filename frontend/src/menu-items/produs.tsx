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
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard',
      icon: icons.IconDashboard,
      breadcrumbs: true
    },
    {
      id: 'catalog',
      title: 'Service Catalog',
      type: 'item',
      url: '/catalog',
      icon: icons.IconVocabulary,
      breadcrumbs: true
    },
    {
      id: 'products',
      title: 'Product Profiles',
      type: 'item',
      url: '/owner/products',
      icon: icons.IconBriefcase,
      breadcrumbs: true
    },
    {
      id: 'requirements',
      title: 'Requirements',
      type: 'item',
      url: '/owner/requirements',
      icon: icons.IconChecklist,
      breadcrumbs: true
    },
    {
      id: 'packages',
      title: 'Packages',
      type: 'item',
      url: '/packages',
      icon: icons.IconPackage,
      breadcrumbs: true
    },
    {
      id: 'teams',
      title: 'Teams',
      type: 'item',
      url: '/teams',
      icon: icons.IconUsers,
      breadcrumbs: true
    },
    {
      id: 'workspaces',
      title: 'Workspaces',
      type: 'item',
      url: '/workspaces',
      icon: icons.IconBuildingCommunity,
      breadcrumbs: true
    },
    {
      id: 'admin-catalog',
      title: 'Admin Catalog',
      type: 'item',
      url: '/admin/catalog',
      icon: icons.IconSettings,
      breadcrumbs: true
    },
    {
      id: 'ai-recommendations',
      title: 'AI Audit',
      type: 'item',
      url: '/admin/recommendations',
      icon: icons.IconRobot,
      breadcrumbs: true
    }
  ]
};

export default produs;
