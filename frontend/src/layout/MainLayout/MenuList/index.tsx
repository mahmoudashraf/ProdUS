// material-ui
import { Box, Divider, List, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import {
  IconAlertTriangle,
  IconChecklist,
  IconHome,
  IconListDetails,
  IconPackage,
  IconShare,
} from '@tabler/icons-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { memo, useMemo } from 'react';

// project imports
import { HORIZONTAL_MAX_ITEM } from 'config';
import { LAYOUT_CONST } from 'constant';
import useConfig from 'hooks/useConfig';
import menuItem from 'menu-items';
import { useMenuState } from 'contexts/MenuContext';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson } from '@/features/platform/api';
import type { ProductProfile, ProductizationCart } from '@/features/platform/types';

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
  const searchParams = useSearchParams();
  const isProductOwner = user?.role === UserRole.PRODUCT_OWNER;
  const globalProductContext = useQuery({
    queryKey: ['productization-cart'],
    enabled: isProductOwner,
    queryFn: () => getJson<ProductizationCart>('/productization-cart/current'),
    staleTime: 30_000,
  });

  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  // last menu-item to show in horizontal menu bar
  const lastItem =
    layout === LAYOUT_CONST.HORIZONTAL_LAYOUT && !matchDownMd ? HORIZONTAL_MAX_ITEM : undefined;

  const roleVisibleMenuItems = useMemo(
    () => menuItem.items
      .map((item) => {
        if (!item.children) return item;
        return {
          ...item,
          children: item.children.filter((child) => !child.roles || (user?.role ? child.roles.includes(user.role) : true)),
        };
      })
      .filter((item) => !item.roles || (user?.role ? item.roles.includes(user.role) : true)),
    [user?.role]
  );
  const productWorkspaceMatch = pathname.match(/^\/products\/([^/]+)$/);
  const routeProductId = productWorkspaceMatch?.[1] && productWorkspaceMatch[1] !== 'new'
    ? productWorkspaceMatch[1]
    : '';
  const productIdParam = searchParams?.get('productId') || '';
  const globalProductId = globalProductContext.data?.productProfile?.id || '';
  const globalProductName = globalProductContext.data?.productProfile?.name || '';
  const selectedProductId = routeProductId || productIdParam || globalProductId;
  const routeProduct = useQuery({
    queryKey: ['products', selectedProductId, 'menu-context'],
    enabled: isProductOwner && !!selectedProductId && (!globalProductId || selectedProductId !== globalProductId),
    queryFn: () => getJson<ProductProfile>(`/products/${selectedProductId}`),
    staleTime: 60_000,
    retry: false,
  });
  const selectedProductName = routeProduct.data?.name || (selectedProductId === globalProductId ? globalProductName : '');
  const isProductContextRoute = Boolean(routeProductId)
    || pathname === '/owner/project-cart'
    || Boolean(productIdParam && (pathname === '/catalog' || pathname === '/services'));
  const visibleMenuItems = useMemo(
    () => isProductOwner && selectedProductId && isProductContextRoute
      ? buildOwnerProductWorkspaceMenu(roleVisibleMenuItems, selectedProductId, selectedProductName)
      : roleVisibleMenuItems,
    [isProductContextRoute, isProductOwner, roleVisibleMenuItems, selectedProductId, selectedProductName]
  );

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

function buildOwnerProductWorkspaceMenu(items: NavItemType[], productId: string, productName?: string): NavItemType[] {
  const platform = items.find((item) => item.id === 'platform') || items[0];
  if (!platform) return items;
  const basePath = `/products/${productId}`;
  return [
    {
      ...platform,
      title: 'Selected Product',
      caption: productName || 'Product-specific actions',
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
          title: 'Product Home',
          type: 'item',
          url: basePath,
          icon: IconListDetails,
          breadcrumbs: true,
        },
        {
          id: 'product-start-plan',
          title: 'Project Start Plan',
          type: 'item',
          url: '/owner/project-cart',
          icon: IconPackage,
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
