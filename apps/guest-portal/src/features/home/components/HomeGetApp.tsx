import Image from 'next/image';
import Link from 'next/link';

import styles from './HomeGetApp.module.css';

const posters = [
  'afterhours',
  'house-of-afro',
  'midnight-club',
  'aqua-sundays',
  'red-room',
  'eclipse',
  'velvet-nights',
  'no-signal',
  'neon-district',
];
const posterCount = 100;

export function HomeGetApp() {
  return (
    <section className={styles['section']} aria-labelledby="home-get-app-heading">
      <div className={styles['artwork']} aria-hidden="true">
        <div className={styles['spiral']}>
          {Array.from({ length: posterCount }, (_, index) => (
            <div key={index} className={styles['poster']}>
              <Image
                src={`/home/featured-drops/${posters[(index * 5) % posters.length] ?? 'afterhours'}.webp`}
                alt=""
                fill
                sizes="(max-width: 600px) 100px, 160px"
                className={styles['image']}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles['content']}>
        <h2 id="home-get-app-heading" className={styles['heading']}>
          <Link href="/app" className={styles['button']}>
            Get the app
          </Link>
        </h2>
        <p className={styles['caption']}>
          Your next great night
          <br />
          starts with THE C1RCLE.
        </p>
      </div>
    </section>
  );
}
