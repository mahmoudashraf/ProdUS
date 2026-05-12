import NextLink from 'next/link';

// project imports
import Logo from 'ui-component/Logo';

// ==============================|| MAIN LOGO ||============================== //

const LogoSection = () => (
  <NextLink href="/" aria-label="ProdOps Network home" style={{ color: 'inherit', textDecoration: 'none' }}>
    <Logo />
  </NextLink>
);

export default LogoSection;
