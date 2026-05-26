'use client';

import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { trackClick, type ClickType } from '@/lib/actions/tracking';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> & {
  providerSlug: string;
  clickType: ClickType;
  city?: string | null;
  stateCode?: string | null;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export function TrackedLink({
  providerSlug,
  clickType,
  city,
  stateCode,
  onClick,
  ...rest
}: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackClick({ providerSlug, clickType, city, stateCode });
        onClick?.(e);
      }}
    />
  );
}
