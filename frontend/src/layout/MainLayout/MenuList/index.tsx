// material-ui
import { Box, Divider, List, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconAlertTriangle,
  IconBuildingCommunity,
  IconHome,
  IconListDetails,
  IconShare,
  IconSparkles,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { memo, useMemo } from 'react';

// project imports
import { getJson } from '@/features/platform/api';
import { sortWorkspacesForOwner } from '@/features/platform/displayOrder';
import { productWorkspaceRoute } from '@/features/platform/ownerWorkspaceModel';
import type { ProductProfile, ProductizationCart, ProjectWorkspace } from '@/features/platform/types';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { HORIZONTAL_MAX_ITEM } from 'config';
import { LAYOUT_CONST } from 'constant';
import { useMenuState } from 'contexts/MenuContext';
import useConfig from 'hooks/useConfig';
import menuItem from 'menu-items';
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
    () =>
      menuItem.items
        .map(item => {
          if (!item.children) return item;
          return {
            ...item,
            children: item.children.filter(
              child => !child.roles || (user?.role ? child.roles.includes(user.role) : true)
            ),
          };
        })
        .filter(item => !item.roles || (user?.role ? item.roles.includes(user.role) : true)),
    [user?.role]
  );
  const productWorkspaceMatch = pathname.match(/^\/products\/([^/]+)$/);
  const routeProductId =
    productWorkspaceMatch?.[1] && productWorkspaceMatch[1] !== 'new'
      ? productWorkspaceMatch[1]
      : '';
  const productIdParam = searchParams?.get('productId') || '';
  const globalProductId = globalProductContext.data?.productProfile?.id || '';
  const globalProductName = globalProductContext.data?.productProfile?.name || '';
  const isProductContextRoute =
    Boolean(routeProductId) ||
    pathname === '/owner/project-cart' ||
    Boolean(productIdParam && (pathname === '/catalog' || pathname === '/services'));
  const selectedProductId =
    routeProductId || productIdParam || (isProductContextRoute ? globalProductId : '');
  const routeProduct = useQuery({
    queryKey: ['products', selectedProductId, 'menu-context'],
    enabled:
      isProductOwner &&
      !!selectedProductId &&
      (!globalProductId || selectedProductId !== globalProductId),
    queryFn: () => getJson<ProductProfile>(`/products/${selectedProductId}`),
    staleTime: 60_000,
    retry: false,
  });
  const selectedProductName =
    routeProduct.data?.name || (selectedProductId === globalProductId ? globalProductName : '');
  const productWorkspaces = useQuery({
    queryKey: ['workspaces'],
    enabled: isProductOwner && !!selectedProductId && isProductContextRoute,
    queryFn: () => getJson<ProjectWorkspace[]>('/workspaces'),
    staleTime: 30_000,
  });
  const selectedProductWorkspaces = useMemo(
    () =>
      sortWorkspacesForOwner(
        (productWorkspaces.data || []).filter(
          workspace => workspace.packageInstance?.productProfile?.id === selectedProductId
        )
      ),
    [productWorkspaces.data, selectedProductId]
  );
  const visibleMenuItems = useMemo(
    () =>
      isProductOwner && selectedProductId && isProductContextRoute
        ? buildOwnerProductWorkspaceMenu(
            roleVisibleMenuItems,
            selectedProductId,
            selectedProductName,
            selectedProductWorkspaces
          )
        : roleVisibleMenuItems,
    [
      isProductContextRoute,
      isProductOwner,
      roleVisibleMenuItems,
      selectedProductId,
      selectedProductName,
      selectedProductWorkspaces,
    ]
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

        return (
          <NavGroup key={item.id || `nav-group-${item.title || 'unknown'}`} {...navGroupProps} />
        );
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

function buildOwnerProductWorkspaceMenu(
  items: NavItemType[],
  productId: string,
  productName?: string,
  workspaces: ProjectWorkspace[] = []
): NavItemType[] {
  const platform = items.find(item => item.id === 'platform') || items[0];
  if (!platform) return items;
  const workspaceChildren: NavItemType[] = [
    {
      id: 'product-workspaces-all',
      title: workspaces.length ? 'All workspaces' : 'No workspace yet',
      caption: workspaces.length
        ? `${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'} in this product`
        : 'Create one from the workspace page',
      type: 'item',
      url: productWorkspaceRoute(productId, 'workspaces'),
      breadcrumbs: true,
    },
    ...workspaces.map(workspace => ({
      id: `product-workspace-${workspace.id}`,
      title: shortWorkspaceName(workspace.name),
      caption: workspaceStatusCaption(workspace.status),
      type: 'item',
      url: `${productWorkspaceRoute(productId, 'workspaces')}&workspace=${workspace.id}`,
      breadcrumbs: true,
    })),
  ];

  return [
    {
      ...platform,
      title: 'Selected Product',
      caption: productName || 'Product-specific actions',
      children: [
        {
          id: 'product-switch-home',
          title: 'Home',
          type: 'item',
          url: '/dashboard?focus=products&clearSelectedProduct=1',
          icon: IconHome,
          breadcrumbs: true,
        },
        {
          id: 'product-overview',
          title: 'Product Details',
          type: 'item',
          url: productWorkspaceRoute(productId),
          icon: IconListDetails,
          breadcrumbs: true,
        },
        {
          id: 'product-workspaces',
          title: 'Workspaces',
          type: 'collapse',
          url: productWorkspaceRoute(productId, 'workspaces'),
          icon: IconBuildingCommunity,
          breadcrumbs: true,
          children: workspaceChildren,
        },
        {
          id: 'product-ai-opportunities',
          title: 'AI Opportunities',
          type: 'item',
          url: productWorkspaceRoute(productId, 'ai'),
          icon: IconSparkles,
          breadcrumbs: true,
        },
        {
          id: 'product-findings',
          title: 'Scanners',
          type: 'item',
          url: productWorkspaceRoute(productId, 'findings'),
          icon: IconAlertTriangle,
          breadcrumbs: true,
        },
        {
          id: 'product-share',
          title: 'Share',
          type: 'item',
          url: productWorkspaceRoute(productId, 'share'),
          icon: IconShare,
          breadcrumbs: true,
        },
      ],
    },
  ];
}

function shortWorkspaceName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 34) return trimmed;
  return `${trimmed.slice(0, 31)}...`;
}

function workspaceStatusCaption(status?: ProjectWorkspace['status']) {
  if (!status) return 'Workspace';
  return status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
