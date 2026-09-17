'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { UploadIcon } from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { hostPresenceMeta, hostPresenceSource } from '../host-presence-model';
import {
  venuePresenceGenres,
  venuePresenceSource,
  venuePresenceStyleTags,
  venuePublicPresenceConfig,
  venuePresenceMeta,
  venueMenuSource,
} from '../venue-presence-model';

import styles from './VenuePresence.module.css';

import type {
  VenuePresenceGenre,
  VenuePresenceStyleTag,
  VenueMenu,
  VenueMenuSection,
  VenueMenuItem,
} from '../venue-presence-model';

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type PresenceTab = 'page' | 'menu' | 'public';

export type PresenceStudio = 'venue' | 'host';

type InnerTab = 'identity' | 'content' | 'media' | 'broadcast' | 'engagement';

const OUTER_TABS: readonly { readonly id: PresenceTab; readonly label: string }[] = [
  { id: 'page', label: 'Venue Page' },
  { id: 'menu', label: 'Menu' },
  { id: 'public', label: 'Public Page' },
];

const HOST_OUTER_TABS: readonly { readonly id: PresenceTab; readonly label: string }[] = [
  { id: 'page', label: 'Your Page' },
];

const INNER_TABS: readonly {
  readonly id: InnerTab;
  readonly label: string;
  readonly icon: string;
}[] = [
  { id: 'identity', label: 'Identity', icon: 'settings' },
  { id: 'content', label: 'Content', icon: 'file-text' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'broadcast', label: 'Broadcast', icon: 'zap' },
  { id: 'engagement', label: 'Engagement', icon: 'trending-up' },
];

function cx(...values: readonly (string | undefined)[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export function PresenceScreen({
  tab = 'page',
  requirePermission = true,
  studio = 'venue',
  baseHref = '/venue/presence',
}: {
  readonly tab?: PresenceTab;
  readonly requirePermission?: boolean;
  readonly studio?: PresenceStudio;
  readonly baseHref?: string;
}) {
  const auth = useDashboardAuth();
  const canView =
    !requirePermission ||
    auth.grantedPermissions.length === 0 ||
    auth.grantedPermissions.includes('*') ||
    auth.hasPermission('VIEW_MARKETING');

  const isHost = studio === 'host';
  const outerTabs = isHost ? HOST_OUTER_TABS : OUTER_TABS;
  const meta = isHost ? hostPresenceMeta : venuePresenceMeta;

  if (!canView) {
    return (
      <section className={styles['unavailable']} role="alert">
        <h1>Presence unavailable</h1>
        <p>Your current {isHost ? 'host' : 'venue'} access does not include presence management.</p>
      </section>
    );
  }

  return (
    <section className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <h1>{meta.card.title}</h1>
          <p>{meta.card.subtitle}</p>
        </div>
        <nav className={styles['tabs']} aria-label="Presence sections">
          {outerTabs.map((item) => (
            <Link
              key={item.id}
              href={`${baseHref}?tab=${item.id}`}
              className={tab === item.id ? styles['active'] : undefined}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {tab === 'page' ? <PageManagementTab studio={studio} /> : null}
      {!isHost && tab === 'menu' ? <MenuTab /> : null}
      {!isHost && tab === 'public' ? <PublicConfigTab /> : null}
    </section>
  );
}

/* ─── Page Management Tab ──────────────────────────────────────────────────── */

function PageManagementTab({ studio }: { readonly studio: PresenceStudio }) {
  const [activeTab, setActiveTab] = useState<InnerTab>('identity');
  const isHost = studio === 'host';
  const [data, setData] = useState(isHost ? hostPresenceSource : venuePresenceSource);

  const setProfile = (updates: Partial<typeof data.profile>) => {
    setData((current) => ({ ...current, profile: { ...current.profile, ...updates } }));
  };

  const toggleGenre = (genre: VenuePresenceGenre) => {
    const current = data.profile.genres;
    setProfile({
      genres: current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre],
    });
  };

  const toggleStyleTag = (tag: VenuePresenceStyleTag) => {
    const current = data.profile.styleTags;
    setProfile({
      styleTags: current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    });
  };

  const isPublicProfileEnabled = data.profile.publicProfileEnabled;

  const handleViewLive = () => {
    if (!data.profile.slug) return;
    const rolePath = isHost ? 'host' : 'venue';
    window.open(
      `https://thec1rcle.com/${rolePath}/${encodeURIComponent(data.profile.slug)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <>
      {/* Hero Header Card */}
      <div className={styles['heroCard']}>
        <div className={styles['heroGlow']} />

        <div className={styles['heroTop']}>
          {/* Profile Photo */}
          <div className={styles['profilePhoto']}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgb(255,255,255,0.35)' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <div className={styles['profilePhotoOverlay']}>
              <CameraIcon />
            </div>
          </div>

          {/* Info */}
          <div className={styles['heroInfo']}>
            <span className={styles['heroBadge']}>{isHost ? 'Host' : 'Venue'}</span>
            <h2 className={styles['heroTitle']}>Your Page</h2>
            <p className={styles['heroSubtitle']}>{data.profile.tagline}</p>
          </div>

          {/* Publish Controls */}
          <div className={styles['heroActions']}>
            <button
              type="button"
              onClick={() => { setProfile({ publicProfileEnabled: !isPublicProfileEnabled }); }}
              className={styles['publishToggle']}
              data-active={String(isPublicProfileEnabled)}
            >
              <div className={styles['publishToggleHead']}>
                <span className={styles['publishToggleLabel']}>
                  {isPublicProfileEnabled ? <EyeIcon /> : <EyeOffIcon />}
                  Public Profile
                </span>
                <span
                  className={styles['toggleTrack']}
                  style={{
                    background: isPublicProfileEnabled ? '#F44A22' : 'rgb(255,255,255,0.14)',
                  }}
                >
                  <span
                    className={styles['toggleThumb']}
                    style={{
                      transform: isPublicProfileEnabled
                        ? 'translateX(20px)'
                        : 'translateX(0px)',
                    }}
                  />
                </span>
              </div>
              <p className={styles['publishToggleStatus']}>
                {isPublicProfileEnabled ? 'Profile is live.' : 'Profile is hidden.'}
              </p>
              <p className={styles['publishToggleDesc']}>
                {isPublicProfileEnabled
                  ? isHost
                    ? 'Guests can open your page from search, event links, and profile pills.'
                    : 'Guests can open your page from discovery, event links, and venue profile pills.'
                  : 'Direct links stay branded, but guests will see an offline page instead of your profile.'}
              </p>
            </button>

            <button onClick={handleViewLive} className={styles['publishBtn']}>
              <EyeIcon /> View Live
            </button>
          </div>
        </div>

        <div className={styles['heroDivider']} />

        {/* Stats Row */}
        <div className={styles['statsRow']}>
          {[
            { value: data.stats.followersCount, label: 'Followers', color: '#818CF8', bg: 'rgb(129,140,248,0.12)' },
            { value: data.stats.postsCount, label: 'Posts', color: '#34D399', bg: 'rgb(52,211,153,0.12)' },
            { value: data.stats.totalLikes, label: 'Total Engagement', color: '#F472B6', bg: 'rgb(244,114,182,0.12)' },
            { value: data.stats.totalViews, label: 'Page Views', color: '#FB923C', bg: 'rgb(251,146,60,0.12)' },
          ].map((stat) => (
            <div key={stat.label} className={styles['statCell']}>
              <div className={styles['statIcon']} style={{ background: stat.bg }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <p className={styles['statValue']}>{formatNum(stat.value)}</p>
                <p className={styles['statLabel']}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inner Tab Navigation */}
      <div className={styles['innerTabs']}>
        {INNER_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); }}
            className={styles['innerTab']}
            data-active={String(activeTab === t.id)}
          >
            <InnerTabIcon icon={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles['contentCard']}>
        <div className={styles['contentBody']}>
          {activeTab === 'identity' && (
            <IdentityTab
              data={data}
              onProfile={setProfile}
              onGenreToggle={toggleGenre}
              onStyleTagToggle={toggleStyleTag}
            />
          )}
          {activeTab === 'content' && <ContentTab data={data} />}
          {activeTab === 'media' && <MediaTab data={data} onProfile={setProfile} />}
          {activeTab === 'broadcast' && <BroadcastTab data={data} />}
          {activeTab === 'engagement' && <EngagementTab data={data} />}
        </div>
      </div>
    </>
  );
}

/* ─── Identity Tab ─────────────────────────────────────────────────────────── */

function IdentityTab({
  data,
  onProfile,
  onGenreToggle,
  onStyleTagToggle,
}: {
  readonly data: typeof venuePresenceSource;
  readonly onProfile: (updates: Partial<typeof data.profile>) => void;
  readonly onGenreToggle: (genre: VenuePresenceGenre) => void;
  readonly onStyleTagToggle: (tag: VenuePresenceStyleTag) => void;
}) {
  return (
    <div>
      {/* Core Identity */}
      <div className={styles['section']}>
        <SectionHeader title="Core Identity" subtitle="The fundamentals of your public presence" />
        <div className={styles['fieldGrid']}>
          <FormField
            label="Display Name"
            placeholder="Your stage name or brand"
            defaultValue={data.profile.displayName}
            onSave={(v: string) => { onProfile({ displayName: v }); }}
          />
          <FormField
            label="Tagline"
            placeholder="A one-liner that defines you"
            defaultValue={data.profile.tagline}
            onSave={(v: string) => { onProfile({ tagline: v }); }}
          />
        </div>
        <div className={styles['fieldGrid']}>
          <div className={styles['field']}>
            <label className={styles['fieldLabel']}>Neighborhood</label>
            <input
              className={styles['fieldInput']}
              defaultValue={data.profile.neighborhood}
              onBlur={(e) => { onProfile({ neighborhood: e.target.value }); }}
              placeholder="e.g. Bandra West, Indiranagar"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['fieldLabel']}>Category Tag</label>
            <select
              className={styles['fieldSelect']}
              value={data.profile.categoryTag}
              onChange={(e) => { onProfile({ categoryTag: e.target.value as typeof data.profile.categoryTag }); }}
            >
              {venuePresenceMeta.categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <FormField
          label="Bio / Story"
          placeholder="Tell your story, describe your sound, share your journey..."
          defaultValue={data.profile.bio}
          onSave={(v: string) => { onProfile({ bio: v }); }}
          multiline
          rows={5}
        />

        <div className={styles['field']}>
          <label className={styles['fieldLabel']}>Role / Type</label>
          <div className={styles['pillRow']}>
            {venuePresenceMeta.roles.map((role) => (
              <button
                key={role}
                onClick={() => { onProfile({ role }); }}
                className={styles['pill']}
                data-active={data.profile.role === role ? 'true' : undefined}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Layer */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Action Layer" subtitle="Configure primary call-to-action buttons" icon="zap" />
        <div className={styles['fieldGrid']}>
          <FormField
            label="WhatsApp Number"
            placeholder="+91..."
            defaultValue={data.profile.whatsapp}
            onSave={(v: string) => { onProfile({ whatsapp: v }); }}
          />
          <div className={styles['field']}>
            <label className={styles['fieldLabel']}>Primary CTA Type</label>
            <select
              className={styles['fieldSelect']}
              value={data.profile.primaryCta}
              onChange={(e) => { onProfile({ primaryCta: e.target.value as typeof data.profile.primaryCta }); }}
            >
              {venuePresenceMeta.ctaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Identity */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Visual Identity" subtitle="Cover image for your public page" />
        <div className={styles['coverUpload']}>
          <div className={styles['coverUploadIcon']}>
            <UploadIcon size={24} color="var(--partner-accent)" aria-hidden="true" />
          </div>
          <p className={styles['coverUploadText']}>Upload Cover Image</p>
          <p className={styles['coverUploadHint']}>Recommended: 1920 × 480px</p>
          <div className={styles['coverUploadCamera']}>
            <CameraIcon />
            <span>Change cover</span>
          </div>
        </div>
      </div>

      {/* Sound & Style */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Sound & Style" subtitle="Help guests discover you by genre and vibe" icon="music" />
        <div className={styles['field']}>
          <label className={styles['fieldLabel']}>Genres</label>
          <div className={styles['pillRow']}>
            {venuePresenceGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => { onGenreToggle(genre); }}
                className={styles['pill']}
                data-active={data.profile.genres.includes(genre) ? 'true' : undefined}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        <div className={styles['field']}>
          <label className={styles['fieldLabel']}>Style Tags</label>
          <div className={styles['pillRow']}>
            {venuePresenceStyleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => { onStyleTagToggle(tag); }}
                className={styles['pill']}
                data-active={data.profile.styleTags.includes(tag) ? 'style' : undefined}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Social & Contact */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Social & Contact" subtitle="Connect your channels and let fans find you everywhere" icon="link" />
        <div className={styles['fieldGrid3']}>
          <FormField
            label="Instagram"
            placeholder="@yourhandle"
            defaultValue={data.profile.socialLinks.instagram ?? ''}
            onSave={(v: string) =>
              { onProfile({ socialLinks: { ...data.profile.socialLinks, instagram: v } }); }
            }
          />
          <FormField
            label="Twitter / X"
            placeholder="@yourhandle"
            defaultValue={data.profile.socialLinks.twitter ?? ''}
            onSave={(v: string) =>
              { onProfile({ socialLinks: { ...data.profile.socialLinks, twitter: v } }); }
            }
          />
          <FormField
            label="SoundCloud"
            placeholder="soundcloud.com/..."
            defaultValue={data.profile.socialLinks.soundcloud ?? ''}
            onSave={(v: string) =>
              { onProfile({ socialLinks: { ...data.profile.socialLinks, soundcloud: v } }); }
            }
          />
          <FormField
            label="Spotify"
            placeholder="open.spotify.com/artist/..."
            defaultValue={data.profile.socialLinks.spotify ?? ''}
            onSave={(v: string) =>
              { onProfile({ socialLinks: { ...data.profile.socialLinks, spotify: v } }); }
            }
          />
          <FormField
            label="Website"
            placeholder="https://..."
            defaultValue={data.profile.website}
            onSave={(v: string) => { onProfile({ website: v }); }}
          />
          <FormField
            label="Email"
            placeholder="booking@..."
            defaultValue={data.profile.email}
            onSave={(v: string) => { onProfile({ email: v }); }}
          />
          <FormField
            label="Location"
            placeholder="City, Country"
            defaultValue={data.profile.city}
            onSave={(v: string) => { onProfile({ city: v }); }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Content Tab ──────────────────────────────────────────────────────────── */

function ContentTab({ data }: { readonly data: typeof venuePresenceSource }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');

  const handleCreatePost = () => {
    if (!composerContent.trim()) return;
    setComposerContent('');
    setComposerOpen(false);
  };

  return (
    <div>
      {/* Posts */}
      <div className={styles['section']}>
        <div className={styles['contentHeader']}>
          <SectionHeader title="Timeline Updates" subtitle="Share news, announcements, and behind-the-scenes" />
          <button type="button" onClick={() => { setComposerOpen(true); }} className={styles['addBtn']}>
            <PlusIcon /> New Post
          </button>
        </div>
        <div className={styles['postGrid']}>
          {data.posts.map((post) => (
            <div key={post.id} className={styles['postCard']}>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" className={styles['postCardImage']} />
              )}
              <div className={styles['postCardBody']}>
                <div className={styles['postCardMeta']}>
                  <span className={styles['postCardDate']}>{formatDate(post.createdAt)}</span>
                </div>
                <p className={styles['postCardContent']}>{post.content}</p>
                <div className={styles['postCardStats']}>
                  <span className={styles['postStat']}>
                    <HeartIcon /> {post.likes}
                  </span>
                  <span className={styles['postStat']}>
                    <MiniEyeIcon /> {post.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {data.posts.length === 0 && (
            <div className={styles['emptyState']}>
              <FileTextIcon />
              <p>No posts yet. Share your first update!</p>
            </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <div className={styles['contentHeader']}>
          <SectionHeader title="Story Highlights" subtitle="Pin your best moments to the top of your page" icon="camera" />
        </div>
        <div className={styles['highlightRow']}>
          {data.highlights.map((h) => (
            <div key={h.id} className={styles['highlightCard']}>
              <div className={styles['highlightCircle']}>
                <div
                  className={styles['highlightCircleInner']}
                  style={{ backgroundColor: `${h.color}15` }}
                >
                  <CameraIcon />
                </div>
              </div>
              <p className={styles['highlightTitle']}>{h.title}</p>
            </div>
          ))}
          {data.highlights.length === 0 && (
            <div className={styles['emptyState']} style={{ width: '100%' }}>
              <CameraIcon />
              <p>No highlights added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Press */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Press & Features" subtitle="Showcase media mentions and press coverage" icon="quote" />
        <div className={styles['pressGrid']}>
          <div className={styles['pressCard']}>
            <p className={styles['pressQuote']}>
              "One of Pune's definitive rooftop destinations for electronic music."
            </p>
            <p className={styles['pressSource']}>Mix Magazine</p>
          </div>
          <div className={styles['pressCard']}>
            <p className={styles['pressQuote']}>
              "Top 10 nightlife venues to hit this season."
            </p>
            <p className={styles['pressSource']}>Lifestyle Asia</p>
          </div>
          <div
            className={styles['pressCard']}
            style={{
              borderStyle: 'dashed',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 120,
              cursor: 'pointer',
            }}
          >
            <PlusIcon />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--partner-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 8,
              }}
            >
              Add Press Quote
            </span>
          </div>
        </div>
      </div>

      {/* Post Composer Modal */}
      {composerOpen && (
        <Modal onClose={() => { setComposerOpen(false); }}>
          <div className={styles['modalBody']}>
            <h2 className={styles['modalTitle']}>New Post</h2>
            <p className={styles['modalDesc']}>Share an update with your audience</p>
            <div className={styles['field']}>
              <label className={styles['fieldLabel']}>Content</label>
              <textarea
                className={styles['fieldTextarea']}
                value={composerContent}
                onChange={(e) => { setComposerContent(e.target.value); }}
                placeholder="What's happening?"
                rows={4}
              />
            </div>
            <div className={styles['modalFooter']}>
              <button onClick={() => { setComposerOpen(false); }} className={styles['modalFooterBtn']}>
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!composerContent.trim()}
                className={styles['modalFooterBtn']}
                data-primary="true"
              >
                Post
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Media Tab ────────────────────────────────────────────────────────────── */

function MediaTab({
  data,
  onProfile,
}: {
  readonly data: typeof venuePresenceSource;
  readonly onProfile: (updates: Partial<typeof data.profile>) => void;
}) {
  const [videoModal, setVideoModal] = useState(false);
  const [newVideo, setNewVideo] = useState({
    url: '',
    type: 'aftermovie',
    title: '',
  });

  const handleAddVideo = () => {
    if (!newVideo.url || !newVideo.title) return;
    onProfile({
      videos: [
        ...(data.profile.videos ?? []),
        {
          id: Date.now(),
          url: newVideo.url,
          type: newVideo.type as 'aftermovie' | 'recap' | 'promo' | 'live',
          title: newVideo.title,
        },
      ],
    });
    setNewVideo({ url: '', type: 'aftermovie', title: '' });
    setVideoModal(false);
  };

  const handleRemoveVideo = (videoId: number) => {
    onProfile({
      videos: (data.profile.videos ?? []).filter((v) => v.id !== videoId),
    });
  };

  const handleRemovePhoto = (photo: string) => {
    onProfile({
      photos: (data.profile.photos ?? []).filter((p) => p !== photo),
    });
  };

  return (
    <div>
      {/* Photo Gallery */}
      <div className={styles['section']}>
        <div className={styles['contentHeader']}>
          <SectionHeader title="Photo Gallery" subtitle="Showcase your best shots from events and performances" />
        </div>
        <div className={styles['photoGrid']}>
          {data.profile.photos?.map((photo, idx) => (
            <div key={idx} className={styles['photoCard']}>
              <img src={photo} alt="" />
              <button
                onClick={() => { handleRemovePhoto(photo); }}
                className={styles['photoDeleteBtn']}
                aria-label="Remove photo"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          {(!data.profile.photos || data.profile.photos.length === 0) && (
            <div className={styles['emptyState']}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p>No photos uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Videos */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <div className={styles['contentHeader']}>
          <SectionHeader title="Videos & Aftermovies" subtitle="Share recaps, aftermovies, and performance clips" icon="video" />
          <button type="button" onClick={() => { setVideoModal(true); }} className={styles['addBtn']}>
            <PlusIcon /> Add Video
          </button>
        </div>
        <div className={styles['videoGrid']}>
          {data.profile.videos?.map((video) => (
            <div key={video.id} className={styles['videoCard']}>
              <div className={styles['videoThumb']}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--partner-muted)' }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className={styles['videoTypeBadge']}>{video.type}</span>
              </div>
              <div className={styles['videoCardBody']}>
                <p className={styles['videoTitle']}>{video.title}</p>
                <button
                  onClick={() => { handleRemoveVideo(video.id); }}
                  className={styles['postDeleteBtn']}
                  aria-label="Remove video"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
          {(!data.profile.videos || data.profile.videos.length === 0) && (
            <div className={styles['emptyState']}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <p>No videos added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {videoModal && (
        <Modal onClose={() => { setVideoModal(false); }}>
          <div className={styles['modalBody']}>
            <h2 className={styles['modalTitle']}>Add Video</h2>
            <p className={styles['modalDesc']}>Add a YouTube, Vimeo, or SoundCloud link</p>
            <div className={styles['field']}>
              <label className={styles['fieldLabel']}>Video Title</label>
              <input
                className={styles['fieldInput']}
                value={newVideo.title}
                onChange={(e) => { setNewVideo({ ...newVideo, title: e.target.value }); }}
                placeholder="e.g. Summer 2024 Aftermovie"
              />
            </div>
            <div className={styles['field']}>
              <label className={styles['fieldLabel']}>Video URL</label>
              <input
                className={styles['fieldInput']}
                value={newVideo.url}
                onChange={(e) => { setNewVideo({ ...newVideo, url: e.target.value }); }}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className={styles['field']}>
              <label className={styles['fieldLabel']}>Type</label>
              <div className={styles['pillRow']}>
                {['aftermovie', 'recap', 'promo', 'live'].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setNewVideo({ ...newVideo, type }); }}
                    className={styles['pill']}
                    data-active={newVideo.type === type ? 'true' : undefined}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles['modalFooter']}>
              <button onClick={() => { setVideoModal(false); }} className={styles['modalFooterBtn']}>
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={!newVideo.url || !newVideo.title}
                className={styles['modalFooterBtn']}
                data-primary="true"
              >
                Add Video
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Broadcast Tab ────────────────────────────────────────────────────────── */

function BroadcastTab({ data }: { readonly data: typeof venuePresenceSource }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    setStatus('success');
    setTitle('');
    setMessage('');
    setTimeout(() => { setStatus('idle'); }, 4000);
  };

  return (
    <div>
      <div className={styles['section']}>
        <SectionHeader
          title="Push Broadcast"
          subtitle="Send a direct notification to all your followers"
          icon="zap"
        />
        <div className={styles['broadcastCard']}>
          <div className={styles['field']}>
            <label className={styles['fieldLabel']}>Notification Title</label>
            <input
              className={styles['fieldInput']}
              value={title}
              onChange={(e) => { setTitle(e.target.value); }}
              placeholder="e.g. New Event Dropping Tonight!"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['fieldLabel']}>Message Body</label>
            <textarea
              className={styles['fieldTextarea']}
              value={message}
              onChange={(e) => { setMessage(e.target.value); }}
              placeholder="Details about your announcement..."
              rows={4}
            />
          </div>

          <div className={styles['broadcastDivider']}>
            <div className={styles['broadcastTarget']}>
              <UsersIcon />
              <span className={styles['broadcastTargetLabel']}>
                Target: {data.stats.followersCount} Followers
              </span>
            </div>

            {status === 'success' && (
              <div className={styles['broadcastSuccess']}>
                <CheckIcon />
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  Broadcast delivered to all followers
                </span>
              </div>
            )}

            <button
              disabled={!title.trim() || !message.trim()}
              onClick={handleSend}
              className={styles['broadcastSendBtn']}
            >
              Send Broadcast Now
            </button>
          </div>
        </div>

        <div className={styles['infoCards']}>
          <div className={styles['infoCard']}>
            <h4 className={styles['infoCardTitle']}>Auto-Broadcasts</h4>
            <p className={styles['infoCardDesc']}>
              Followers are automatically notified when you launch a new ticketed event.
            </p>
          </div>
          <div className={styles['infoCard']}>
            <h4 className={styles['infoCardTitle']}>Delivery Time</h4>
            <p className={styles['infoCardDesc']}>
              Broadcasts are delivered instantly via Mobile Push and In-App Notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Engagement Tab ───────────────────────────────────────────────────────── */

function EngagementTab({ data }: { readonly data: typeof venuePresenceSource }) {
  return (
    <div>
      {/* Audience Overview */}
      <div className={styles['section']}>
        <SectionHeader title="Audience Overview" subtitle="Understand your community and reach" icon="users" />
        <div className={styles['engagementStats']}>
          <EngagementStat
            label="Total Followers"
            value={formatNum(data.stats.followersCount)}
            change="+12%"
            positive
          />
          <EngagementStat label="This Month" value="—" change="" positive={false} />
          <EngagementStat
            label="Engagement Rate"
            value={data.stats.engagementRate != null ? `${data.stats.engagementRate}%` : '—'}
            change=""
            positive
          />
          <EngagementStat
            label="Page Views"
            value={formatNum(data.stats.totalViews)}
            change="+24%"
            positive
          />
        </div>
      </div>

      {/* Follower Growth */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Follower Growth" subtitle="Track your audience expansion over time" icon="trending-up" />
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            borderRadius: 20,
            background: 'var(--dashboard-control)',
            border: '1px solid var(--partner-border)',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--partner-muted)' }}>
            Insufficient historical data to calculate growth trend
          </p>
        </div>
      </div>

      {/* Demographics */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Audience Demographics" subtitle="Who your followers are" icon="users" />
        <div className={styles['demographicsGrid']}>
          {/* Age Bands */}
          <div className={styles['demoCard']}>
            <h4 className={styles['demoCardTitle']}>Age Bands</h4>
            <div className={styles['ageRow']}>
              {venuePresenceMeta.demographics.ageBands.map((band) => (
                <div key={band.range}>
                  <div className={styles['ageLabel']}>
                    <span style={{ color: 'var(--partner-muted)' }}>{band.range}</span>
                    <span style={{ color: 'var(--partner-muted)' }}>{band.pct}%</span>
                  </div>
                  <div className={styles['ageBar']}>
                    <div
                      className={styles['ageBarFill']}
                      style={{ width: `${band.pct}%`, background: band.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Split */}
          <div className={styles['demoCard']}>
            <h4 className={styles['demoCardTitle']}>Gender Split</h4>
            <div className={styles['genderRow']}>
              {venuePresenceMeta.demographics.genderSplit.map((g) => (
                <div key={g.label} style={{ textAlign: 'center' }}>
                  <div
                    className={styles['genderCircle']}
                    style={{
                      border: '4px solid ' + g.color,
                      background: `${g.color}20`,
                      width: g.label === 'Other' ? 48 : 64,
                      height: g.label === 'Other' ? 48 : 64,
                    }}
                  >
                    <span className={styles['genderPercent']} style={{ color: g.color, fontSize: g.label === 'Other' ? 12 : 18 }}>
                      {g.pct}%
                    </span>
                  </div>
                  <p className={styles['genderLabel']}>{g.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className={styles['demoCard']}>
            <h4 className={styles['demoCardTitle']}>Top Cities</h4>
            {venuePresenceMeta.demographics.topCities.map((c, i) => (
              <div key={c.city} className={styles['cityRow']} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={styles['cityRank']}>{i + 1}</span>
                  <span className={styles['cityName']}>{c.city}</span>
                </div>
                <span className={styles['cityPct']}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Patterns */}
      <div className={cx(styles['section'], styles['sectionDivider'])}>
        <SectionHeader title="Engagement Patterns" subtitle="When your audience is most active" icon="zap" />
        <div className={styles['engagementPatterns']}>
          <div className={styles['patternCard']}>
            <h4 className={styles['demoCardTitle']}>Best Posting Times</h4>
            {venuePresenceMeta.engagement.bestPostingTimes.map((slot) => (
              <div key={slot.day} className={styles['patternRow']}>
                <div>
                  <p className={styles['patternDay']}>{slot.day}</p>
                  <p className={styles['patternTime']}>{slot.time}</p>
                </div>
                <span className={styles['patternEngagement']} data-level={slot.level}>
                  {slot.level}
                </span>
              </div>
            ))}
          </div>
          <div className={styles['patternCard']}>
            <h4 className={styles['demoCardTitle']}>Content Performance</h4>
            {venuePresenceMeta.engagement.contentPerformance.map((content) => (
              <div key={content.type} className={styles['patternRow']}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{content.icon}</span>
                  <p className={styles['patternDay']}>{content.type}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>
                  {content.rate}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu Tab ─────────────────────────────────────────────────────────────── */

function MenuTab() {
  const [menu, setMenu] = useState<VenueMenu>(venueMenuSource);
  const [activeSectionId, setActiveSectionId] = useState(venueMenuSource.sections[0]?.id ?? '');
  const [dirty, setDirty] = useState(false);
  const idRef = useRef(0);

  const nextId = (prefix: string) => {
    idRef.current += 1;
    return `${prefix}-${String(idRef.current)}`;
  };

  const activeSection: VenueMenuSection | null =
    menu.sections.find((s) => s.id === activeSectionId) ?? null;

  const updateMenu = (updater: (m: VenueMenu) => VenueMenu) => {
    setMenu(updater);
    setDirty(true);
  };

  const addSection = () => {
    const id = nextId('sec');
    updateMenu((m) => ({
      ...m,
      sections: [
        ...m.sections,
        { id, name: `Section ${String(m.sections.length + 1)}`, displayOrder: m.sections.length, active: true, items: [] },
      ],
    }));
    setActiveSectionId(id);
  };

  const updateSection = (sectionId: string, patch: Partial<VenueMenuSection>) => {
    updateMenu((m) => ({
      ...m,
      sections: m.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    }));
  };

  const removeSection = (sectionId: string) => {
    updateMenu((m) => ({
      ...m,
      sections: m.sections.filter((s) => s.id !== sectionId),
    }));
    setActiveSectionId((prev) => {
      if (prev !== sectionId) return prev;
      const remaining = menu.sections.filter((s) => s.id !== sectionId);
      return remaining[0]?.id ?? '';
    });
  };

  const reorderSection = (sectionId: string, direction: -1 | 1) => {
    updateMenu((m) => {
      const idx = m.sections.findIndex((s) => s.id === sectionId);
      const target = idx + direction;
      if (target < 0 || target >= m.sections.length) return m;
      const next = [...m.sections];
      const a = next[idx];
      const b = next[target];
      if (!a || !b) return m;
      next[idx] = b;
      next[target] = a;
      return { ...m, sections: next };
    });
  };

  const addItem = () => {
    if (!activeSection) return;
    updateSection(activeSection.id, {
      items: [
        ...activeSection.items,
        { id: nextId('item'), name: 'New Item', description: '', pricePaise: 0, imageUrl: '', dietaryTags: [], available: true, displayOrder: activeSection.items.length },
      ],
    });
  };

  const updateItem = (itemId: string, patch: Partial<VenueMenuItem>) => {
    if (!activeSection) return;
    updateSection(activeSection.id, {
      items: activeSection.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    });
  };

  const removeItem = (itemId: string) => {
    if (!activeSection) return;
    updateSection(activeSection.id, {
      items: activeSection.items.filter((i) => i.id !== itemId),
    });
  };

  const reorderItem = (itemId: string, direction: -1 | 1) => {
    if (!activeSection) return;
    const idx = activeSection.items.findIndex((i) => i.id === itemId);
    const target = idx + direction;
    if (target < 0 || target >= activeSection.items.length) return;
    const next = [...activeSection.items];
    const a = next[idx];
    const b = next[target];
    if (!a || !b) return;
    next[idx] = b;
    next[target] = a;
    updateSection(activeSection.id, { items: next });
  };

  const togglePublish = () => {
    updateMenu((m) => ({ ...m, published: !m.published }));
  };

  return (
    <div className={styles['contentCard']}>
      {/* Header */}
      <div className={styles['menuHeader']}>
        <div>
          <h3 className={styles['menuHeaderTitle']}>Digital Menu Manager</h3>
          <p className={styles['menuHeaderDesc']}>
            Structured sections and items for your public venue menu.
          </p>
        </div>
        <div className={styles['menuHeaderActions']}>
          {dirty && <span className={styles['menuSaveHint']}>Unsaved changes</span>}
          <span
            className={styles['menuStatusBadge']}
            data-published={menu.published}
          >
            {menu.published ? 'Published' : 'Draft'}
          </span>
          <button
            type="button"
            onClick={togglePublish}
            className={styles['menuPublishBtn']}
            data-published={menu.published}
          >
            {menu.published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className={styles['menuEditor']}>
        {/* Sidebar — Sections */}
        <div className={styles['menuSidebar']}>
          <div className={styles['menuSidebarTitle']}>
            <h3>Sections</h3>
            <button type="button" onClick={addSection} title="Add section">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>

          {menu.sections.length === 0 && (
            <p className={styles['menuSidebarEmpty']}>
              No sections yet. Click + to add one.
            </p>
          )}

          {menu.sections.map((section, idx) => (
            <div
              key={section.id}
              className={styles['menuSectionItem']}
              data-active={section.id === activeSectionId}
              onClick={() => { setActiveSectionId(section.id); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSectionId(section.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                className={styles['menuSectionName']}
                value={section.name}
                onChange={(e) => { updateSection(section.id, { name: e.target.value }); }}
                onClick={(e) => { e.stopPropagation(); }}
                readOnly={false}
              />
              <span className={styles['menuSectionCount']}>{section.items.length}</span>
              <span className={styles['menuSectionActions']}>
                <button
                  type="button"
                  className={styles['menuSectionBtn']}
                  onClick={(e) => { e.stopPropagation(); reorderSection(section.id, -1); }}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
                </button>
                <button
                  type="button"
                  className={styles['menuSectionBtn']}
                  onClick={(e) => { e.stopPropagation(); reorderSection(section.id, 1); }}
                  disabled={idx === menu.sections.length - 1}
                  title="Move down"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <button
                  type="button"
                  className={styles['menuSectionBtn']}
                  data-danger="true"
                  onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                  title="Delete section"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            </div>
          ))}
        </div>

        {/* Main — Items */}
        <div className={styles['menuMain']}>
          {!activeSection ? (
            <div className={styles['menuEmpty']}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              <p>Select a section or create one to start adding items.</p>
            </div>
          ) : (
            <>
              <div className={styles['menuMainHeader']}>
                <h3 className={styles['menuMainTitle']}>{activeSection.name}</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className={styles['menuAddBtn']}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Add Item
                </button>
              </div>

              {activeSection.items.length === 0 ? (
                <div className={styles['menuEmpty']}>
                  <p>No items yet. Add the first item.</p>
                </div>
              ) : (
                <div className={styles['menuItemGrid']}>
                  {activeSection.items.map((item, itemIdx) => (
                    <div key={item.id} className={styles['menuItemRow']}>
                      <input
                        className={styles['menuItemField']}
                        value={item.name}
                        onChange={(e) => { updateItem(item.id, { name: e.target.value }); }}
                        placeholder="Item name"
                      />
                      <input
                        className={[styles['menuItemField'], styles['menuItemFieldDesc']].filter(Boolean).join(' ')}
                        value={item.description}
                        onChange={(e) => { updateItem(item.id, { description: e.target.value }); }}
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        min={0}
                        className={[styles['menuItemField'], styles['menuItemPrice']].filter(Boolean).join(' ')}
                        value={item.pricePaise / 100}
                        onChange={(e) => { updateItem(item.id, { pricePaise: Math.max(0, Math.round(Number(e.target.value || 0) * 100)) }); }}
                        aria-label={`${item.name} price in rupees`}
                      />
                      <div className={styles['menuItemControls']}>
                        <label className={styles['menuItemAvail']}>
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={(e) => { updateItem(item.id, { available: e.target.checked }); }}
                          />
                          Available
                        </label>
                        <span className={styles['menuItemActions']}>
                          <button
                            type="button"
                            className={styles['menuSectionBtn']}
                            onClick={() => { reorderItem(item.id, -1); }}
                            disabled={itemIdx === 0}
                            title="Move up"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
                          </button>
                          <button
                            type="button"
                            className={styles['menuSectionBtn']}
                            onClick={() => { reorderItem(item.id, 1); }}
                            disabled={itemIdx === activeSection.items.length - 1}
                            title="Move down"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                          <button
                            type="button"
                            className={styles['menuSectionBtn']}
                            data-danger="true"
                            onClick={() => { removeItem(item.id); }}
                            title="Remove"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </span>
                      </div>
                      {item.dietaryTags.length > 0 && (
                        <div className={styles['menuItemTagRow']}>
                          {item.dietaryTags.map((tag) => (
                            <span key={tag} className={styles['menuItemTag']}>
                              {tag}
                              <button type="button" onClick={() => { updateItem(item.id, { dietaryTags: item.dietaryTags.filter((t) => t !== tag) }); }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Public Config Tab ────────────────────────────────────────────────────── */

function PublicConfigTab() {
  const [config, setConfig] = useState(venuePublicPresenceConfig);
  const [timingInput, setTimingInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => { setSaveStatus('idle'); }, 3000);
  };

  return (
    <div style={{ maxWidth: 768 }}>
      {/* Basic Info */}
      <div className={styles['configCard']}>
        <h3 className={styles['configCardTitle']}>Basic Info</h3>
        <div className={styles['configField']}>
          <label className={styles['configFieldLabel']}>Venue Name</label>
          <input
            className={styles['fieldInput']}
            value={config.name}
            onChange={(e) => { setConfig((prev) => ({ ...prev, name: e.target.value })); }}
            placeholder="Your venue name"
          />
        </div>
        <div className={styles['configField']}>
          <label className={styles['configFieldLabel']}>Description</label>
          <textarea
            className={styles['fieldTextarea']}
            value={config.description}
            onChange={(e) => { setConfig((prev) => ({ ...prev, description: e.target.value })); }}
            placeholder="Describe your venue for guests..."
            rows={3}
          />
        </div>
        <div className={styles['configField']}>
          <label className={styles['configFieldLabel']}>Price Range</label>
          <input
            className={styles['fieldInput']}
            value={config.price}
            onChange={(e) => { setConfig((prev) => ({ ...prev, price: e.target.value })); }}
            placeholder="e.g. ₹1500 per person or ₹500–₹2000"
          />
        </div>
      </div>

      {/* Image Gallery */}
      <div className={styles['configCard']}>
        <h3 className={styles['configCardTitle']}>Image Gallery</h3>
        <p style={{ fontSize: 12, color: 'var(--partner-muted)', marginBottom: 16 }}>
          Upload up to 7 photos shown publicly on your venue page.
        </p>
        <div className={styles['imageGrid']}>
          {Array.from({ length: 7 }).map((_, idx) => {
            const url = config.images[idx];
            return (
              <div key={idx} className={styles['imageSlot']}>
                {url ? (
                  <img src={url} alt={`Gallery photo ${idx + 1}`} />
                ) : (
                  <div className={styles['imageSlotEmpty']}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ color: 'var(--partner-muted)' }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className={styles['imageSlotNum']}>{idx + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Booking */}
      <div className={styles['configCard']}>
        <div className={styles['toggleRow']}>
          <div>
            <h3 className={styles['configCardTitle']} style={{ marginBottom: 4 }}>
              Table Booking
            </h3>
            <p style={{ fontSize: 12, color: 'var(--partner-muted)' }}>
              Let guests request table bookings from your venue page.
            </p>
          </div>
          <button
            onClick={() =>
              { setConfig((prev) => ({
                ...prev,
                bookingConfig: {
                  ...prev.bookingConfig,
                  enabled: !prev.bookingConfig.enabled,
                },
              })); }
            }
            className={styles['toggleTrack']}
            style={{
              background: config.bookingConfig.enabled
                ? 'var(--partner-accent)'
                : 'var(--dashboard-control)',
              flexShrink: 0,
            }}
          >
            <span
              className={styles['toggleThumb']}
              style={{
                transform: config.bookingConfig.enabled
                  ? 'translateX(24px)'
                  : 'translateX(2px)',
              }}
            />
          </button>
        </div>

        {config.bookingConfig.enabled && (
          <div style={{ marginTop: 16 }}>
            <div className={styles['configField']}>
              <label className={styles['configFieldLabel']}>Max Capacity</label>
              <input
                type="number"
                min={1}
                className={styles['fieldInput']}
                value={config.bookingConfig.capacity}
                onChange={(e) =>
                  { setConfig((prev) => ({
                    ...prev,
                    bookingConfig: {
                      ...prev.bookingConfig,
                      capacity: parseInt(e.target.value, 10) || 0,
                    },
                  })); }
                }
              />
            </div>
            <div className={styles['configField']}>
              <label className={styles['configFieldLabel']}>Available Timings</label>
              {config.bookingConfig.timings.length > 0 && (
                <div className={styles['timingPills']}>
                  {config.bookingConfig.timings.map((t, i) => (
                    <span key={i} className={styles['timingPill']}>
                      {t}
                      <button
                        onClick={() =>
                          { setConfig((prev) => ({
                            ...prev,
                            bookingConfig: {
                              ...prev.bookingConfig,
                              timings: prev.bookingConfig.timings.filter(
                                (_, idx) => idx !== i,
                              ),
                            },
                          })); }
                        }
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className={styles['timingRow']}>
                <input
                  className={cx(styles['fieldInput'], styles['timingInput'])}
                  value={timingInput}
                  onChange={(e) => { setTimingInput(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTiming(timingInput, setTimingInput, setConfig);
                    }
                  }}
                  placeholder="e.g. 7PM–10PM"
                />
                <button
                  onClick={() => { addTiming(timingInput, setTimingInput, setConfig); }}
                  className={styles['timingAddBtn']}
                >
                  Add
                </button>
              </div>
            </div>
            <div className={styles['configField']}>
              <label className={styles['configFieldLabel']}>Contact Info</label>
              <input
                className={styles['fieldInput']}
                value={config.bookingConfig.contact}
                onChange={(e) =>
                  { setConfig((prev) => ({
                    ...prev,
                    bookingConfig: {
                      ...prev.bookingConfig,
                      contact: e.target.value,
                    },
                  })); }
                }
                placeholder="Phone or email for bookings"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16 }}>
        <button onClick={handleSave} className={styles['saveBtn']}>
          Save Changes
        </button>
        {saveStatus === 'saved' && (
          <span className={styles['saveSuccess']}>
            <CheckIcon /> Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

type PublicConfigState = typeof venuePublicPresenceConfig;

function addTiming(
  value: string,
  setTimingInput: (v: string) => void,
  setConfig: (value: PublicConfigState | ((prev: PublicConfigState) => PublicConfigState)) => void,
) {
  const trimmed = value.trim();
  if (!trimmed) return;
  setConfig((prev) => ({
    ...prev,
    bookingConfig: {
      ...prev.bookingConfig,
      timings: [...prev.bookingConfig.timings, trimmed],
    },
  }));
  setTimingInput('');
}

/* ─── Helper Components ────────────────────────────────────────────────────── */

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly icon?: string;
}) {
  return (
    <div className={styles['sectionHeader']}>
      {icon && (
        <div className={styles['sectionIcon']}>
          <SectionIconSVG icon={icon} />
        </div>
      )}
      <div>
        <h3 className={styles['sectionTitle']}>{title}</h3>
        <p className={styles['sectionSubtitle']}>{subtitle}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  defaultValue,
  multiline,
  rows,
  onSave,
}: {
  readonly label?: string;
  readonly placeholder?: string;
  readonly defaultValue?: string;
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly onSave?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? '');

  useEffect(() => {
    setValue(defaultValue ?? '');
  }, [defaultValue]);

  const handleBlur = () => {
    if (onSave && value !== defaultValue) {
      onSave(value);
    }
  };

  return (
    <div className={styles['field']}>
      {label && <label className={styles['fieldLabel']}>{label}</label>}
      {multiline ? (
        <textarea
          className={styles['fieldTextarea']}
          value={value}
          onChange={(e) => { setValue(e.target.value); }}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows || 4}
        />
      ) : (
        <input
          type="text"
          className={styles['fieldInput']}
          value={value}
          onChange={(e) => { setValue(e.target.value); }}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function EngagementStat({
  label,
  value,
  change,
  positive,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly change: string;
  readonly positive: boolean;
}) {
  return (
    <div className={styles['engagementStat']}>
      <p className={styles['engagementStatLabel']}>{label}</p>
      <p className={styles['engagementStatValue']}>{value}</p>
      {change && (
        <span className={styles['engagementStatChange']} data-positive={String(positive)}>
          {change}
        </span>
      )}
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}) {
  return (
    <div className={styles['modalOverlay']}>
      <div className={styles['modalBackdrop']} onClick={onClose} />
      <div className={styles['modalContent']}>
        <button onClick={onClose} className={styles['modalClose']}>✕</button>
        {children}
      </div>
    </div>
  );
}

/* ─── Inline SVG Icons ─────────────────────────────────────────────────────── */

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.8)' }}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--partner-border)' }}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function MiniEyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function InnerTabIcon({ icon }: { readonly icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    settings: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    'file-text': (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
    image: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
    zap: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    'trending-up': (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  };
  return iconMap[icon] ?? null;
}

function SectionIconSVG({ icon }: { readonly icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    zap: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    music: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    link: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
    camera: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    quote: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
      </svg>
    ),
    video: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    ),
    users: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    'trending-up': (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--partner-accent)" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  };
  return iconMap[icon] ?? null;
}

/* ─── Utilities ────────────────────────────────────────────────────────────── */

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}