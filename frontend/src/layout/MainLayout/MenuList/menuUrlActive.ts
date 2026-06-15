export function parseProductWorkspaceUrl(url: string) {
  if (!url.startsWith('/products/')) return null;

  const [rawPath = '', rawSearch = ''] = url.split('?');
  const match = rawPath.match(/^\/products\/([^/]+)$/);
  if (!match || match[1] === 'new') return null;

  const params = new URLSearchParams(rawSearch);
  return {
    productId: match[1],
    tab: params.get('tab') || 'overview',
    workspaceId: params.get('workspace') || '',
  };
}

export function isMenuUrlActive(
  itemUrl: string,
  currentPath: string,
  currentPathWithSearch: string
) {
  if (!itemUrl || itemUrl === '#') return false;

  const itemProduct = parseProductWorkspaceUrl(itemUrl);
  const currentProduct = parseProductWorkspaceUrl(currentPathWithSearch);
  if (itemProduct && currentProduct) {
    if (itemProduct.productId !== currentProduct.productId || itemProduct.tab !== currentProduct.tab) {
      return false;
    }

    if (itemProduct.tab === 'workspaces') {
      return itemProduct.workspaceId
        ? currentProduct.workspaceId === itemProduct.workspaceId
        : !currentProduct.workspaceId;
    }

    return true;
  }

  if (itemUrl === '/dashboard?focus=products' && currentPath === '/dashboard') {
    const currentParams = new URLSearchParams(document.location.search);
    return !currentParams.get('focus') || currentParams.get('focus') === 'products';
  }

  if (itemUrl === currentPath || itemUrl === currentPathWithSearch) return true;
  if (!itemUrl.includes('?')) return false;

  const [itemPath = '', itemSearch = ''] = itemUrl.split('?');
  if (itemPath !== currentPath) return false;

  const itemParams = new URLSearchParams(itemSearch);
  const currentParams = new URLSearchParams(document.location.search);
  return Array.from(itemParams.entries()).every(([key, value]) => currentParams.get(key) === value);
}
