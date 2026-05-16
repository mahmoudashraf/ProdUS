import { Box, BoxProps } from '@mui/material';
import Head from 'next/head';
import { forwardRef, ReactNode, Ref } from 'react';

// material-ui

// ==============================|| Page - SET TITLE & META TAGS ||============================== //

interface Props extends BoxProps {
  children: ReactNode;
  meta?: ReactNode;
  title: string;
}

const Page = forwardRef<HTMLDivElement, Props>(
  ({ children, title = '', meta, ...other }: Props, ref: Ref<HTMLDivElement>) => (
    <>
      <Head>
        <title>{`${title} | ProdUS Platform`}</title>
        <meta name="description" content="ProdUS productization collaboration platform" key="desc" />
        <meta property="og:title" content="ProdUS Platform" />
        <meta property="og:description" content="Service catalog, service plans, teams, and product workspaces." />
        {meta}
      </Head>

      <Box ref={ref} {...other}>
        {children}
      </Box>
    </>
  )
);

export default Page;
