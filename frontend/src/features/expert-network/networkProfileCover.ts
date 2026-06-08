export function detailCoverSx(coverUrl?: string | null) {
  return {
    height: coverUrl ? 220 : { xs: 104, md: 136 },
    background: coverUrl
      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.22)), url(${coverUrl}) center/cover`
      : 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 48%, #ecfeff 100%)',
  };
}
