// material-ui
import { Avatar, Grid, Stack, Typography  } from '@mui/material';

// project imports
import { GenericCardProps } from 'types';

import MainCard from './MainCard';

// types

// ============================|| ROUND ICON CARD ||============================ //

interface Props {
  primary: string;
  secondary: string;
  content: string;
  iconPrimary: GenericCardProps['iconPrimary'];
  color: string;
  bgcolor: string;
}

const RoundIconCard = ({ primary, secondary, content, iconPrimary, color, bgcolor }: Props) => {
  const IconPrimary = iconPrimary!;
  const primaryIcon = iconPrimary ? <IconPrimary fontSize="large" /> : null;

  return (
    <MainCard>
      <Grid container alignItems="center" spacing={0} justifyContent="space-between">
        <Grid>
          <Stack spacing={1}>
            <Typography variant="h5" color="inherit">
              {primary}
            </Typography>
            <Typography variant="h3">{secondary}</Typography>
            <Typography variant="subtitle2" color="inherit">
              {content}
            </Typography>
          </Stack>
        </Grid>
        <Grid>
          <Avatar
            sx={{ bgcolor, color, width: 48, height: 48, '& .MuiSvgIcon-root': { fontSize: '1.5rem' } }}
            aria-hidden="true"
          >
            {primaryIcon}
          </Avatar>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default RoundIconCard;
