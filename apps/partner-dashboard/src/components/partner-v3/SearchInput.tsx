import { SearchIcon } from '@c1rcle/icons';

import styles from './partner-v3.module.css';

import type { InputHTMLAttributes } from 'react';

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={[styles['searchInput'], className].filter(Boolean).join(' ')}>
      <SearchIcon size={16} aria-hidden="true" />
      <input {...props} type="search" />
    </label>
  );
}
