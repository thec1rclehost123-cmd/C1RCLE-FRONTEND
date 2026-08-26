import styles from './partner-v3.module.css';

export function Avatar({ name, size = 'medium' }: { readonly name: string; readonly size?: 'small' | 'medium' }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'C1';

  return (
    <span className={[styles['avatar'], size === 'small' ? styles['avatarSmall'] : ''].filter(Boolean).join(' ')} aria-label={name}>
      {initials}
    </span>
  );
}
