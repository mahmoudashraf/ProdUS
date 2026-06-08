// material-ui
import { Box, Divider, List, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconAlertTriangle,
  IconChecklist,
  IconHome,
  IconListDetails,
  IconPackage,
  IconShare,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { memo } from 'react';

// project imports
import { HORIZONTAL_MAX_ITEM } from 'config';
import { LAYOUT_CONST } from 'constant';
import useConfig from 'hooks/useConfig';
import menuItem from 'menu-items';
import { useMenuState } from 'contexts/MenuContext';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

// types
import { NavItemType } from 'types';

import NavGroup from './NavGroup';
import NavItem from './NavItem';

// ==============================|| SIDEBAR MENU LIST ||============================== //

const MenuList = () => {
  const theme = useTheme();
  const { layout } = useConfig();
  const { drawerOpen } = useMenuState();
  const { user } = useAuth();
  const pathname = usePathname() || '';

  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  // last menu-item to show in horizontal menu bar
  const lastItem =
    layout === LAYOUT_CONST.HORIZONTAL_LAYOUT && !matchDownMd ? HORIZONTAL_MAX_ITEM : undefined;

  const roleVisibleMenuItems = menuItem.items
    .map((item) => {
      if (!item.children) return item;
      return {
        ...item,
        children: item.children.filter((child) => !child.roles || (user?.role ? child.roles.includes(user.role) : true)),
      };
    })
    .filter((item) => !item.roles || (user?.role ? item.roles.includes(user.role) : true));
  const productWorkspaceMatch = pathname.match(/^\/products\/([^/]+)$/);
  const selectedProductId = productWorkspaceMatch?.[1] && productWorkspaceMatch[1] !== 'new'
    ? productWorkspaceMatch[1]
    : '';
  const visibleMenuItems = user?.role === UserRole.PRODUCT_OWNER && selectedProductId
    ? buildOwnerProductWorkspaceMenu(roleVisibleMenuItems, selectedProductId)
    : roleVisibleMenuItems;

  let lastItemIndex = visibleMenuItems.length - 1;
  let remItems: NavItemType[] = [];
  let lastItemId: string = '';

  if (typeof lastItem === 'number' && lastItem < visibleMenuItems.length) {
    const targetItem = visibleMenuItems[lastItem - 1];
    lastItemId = targetItem?.id || '';
    lastItemIndex = lastItem - 1;
    remItems = visibleMenuItems.slice(lastItem - 1, visibleMenuItems.length).map(item => ({
      title: item.title,
      elements: item.children ?? [],
      icon: item.icon,
      ...(item.url && {
        url: item.url,
      }),
    }));
  }

  const navItems = visibleMenuItems.slice(0, lastItemIndex + 1).map(item => {
    switch (item.type) {
      case 'group':
        if (item.url && item.id !== lastItemId) {
          return (
            <List key={item.id}>
              <NavItem item={item} level={1} isParents />
              {layout !== LAYOUT_CONST.HORIZONTAL_LAYOUT && <Divider sx={{ py: 0.5 }} />}
            </List>
          );
        }
        const navGroupProps: {
          item: NavItemType;
          lastItem?: number;
          remItems: NavItemType[];
          lastItemId: string;
        } = {
          item: item,
          ...(lastItem !== undefined && { lastItem }),
          remItems: remItems,
          lastItemId: lastItemId || '',
        };
        
        return <NavGroup key={item.id || `nav-group-${item.title || 'unknown'}`} {...navGroupProps} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Menu Items Error
          </Typography>
        );
    }
  });

  return layout === LAYOUT_CONST.VERTICAL_LAYOUT ||
    (layout === LAYOUT_CONST.HORIZONTAL_LAYOUT && matchDownMd) ? (
    <Box {...(drawerOpen && { sx: { mt: 1.5 } })}>{navItems}</Box>
  ) : (
    <>{navItems}</>
  );
};

export default memo(MenuList);

function buildOwnerProductWorkspaceMenu(items: NavItemType[], productId: string): NavItemType[] {
  const platform = items.find((item) => item.id === 'platform') || items[0];
  if (!platform) return items;
  const basePath = `/products/${productId}`;
  return [
    {
      ...platform,
      title: 'Selected Product',
      children: [
        {
          id: 'product-switch-home',
          title: 'Home / switch product',
          type: 'item',
          url: '/dashboard?focus=products',
          icon: IconHome,
          breadcrumbs: true,
        },
        {
          id: 'product-overview',
          title: 'Overview',
          type: 'item',
          url: basePath,
          icon: IconListDetails,
          breadcrumbs: true,
        },
        {
          id: 'product-action-plan',
          title: 'Action Plan',
          type: 'item',
          url: `${basePath}?tab=actions`,
          icon: IconChecklist,
          breadcrumbs: true,
        },
        {
          id: 'product-findings',
          title: 'Findings',
          type: 'item',
          url: `${basePath}?tab=findings`,
          icon: IconAlertTriangle,
          breadcrumbs: true,
        },
        {
          id: 'product-services',
          title: 'Services',
          type: 'item',
          url: `${basePath}?tab=services`,
          icon: IconPackage,
          breadcrumbs: true,
        },
        {
          id: 'product-share',
          title: 'Share',
          type: 'item',
          url: `${basePath}?tab=share`,
          icon: IconShare,
          breadcrumbs: true,
        },
      ],
    },
  ];
}
