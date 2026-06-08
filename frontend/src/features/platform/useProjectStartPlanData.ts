'use client';

import { useQuery } from '@tanstack/react-query';
import { getJson } from './api';
import { isPlaceholderProduct, sortProductsForOwner } from './displayOrder';
import type { PackageTemplate, ProductProfile, ProductizationCart } from './types';

export const useProjectStartPlanData = () => {
  const products = useQuery({ queryKey: ['products'], queryFn: () => getJson<ProductProfile[]>('/products') });
  const cart = useQuery({ queryKey: ['productization-cart'], queryFn: () => getJson<ProductizationCart>('/productization-cart/current') });
  const packageTemplates = useQuery({
    queryKey: ['catalog-package-templates'],
    queryFn: () => getJson<PackageTemplate[]>('/catalog/package-templates'),
  });

  const currentCart = cart.data;
  const productList = sortProductsForOwner(products.data || []);
  const selectableProducts = productList.filter((item) => !isPlaceholderProduct(item));

  return {
    products,
    cart,
    packageTemplates,
    currentCart,
    productList,
    selectableProducts,
  };
};
