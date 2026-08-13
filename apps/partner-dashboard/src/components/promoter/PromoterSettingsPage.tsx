import { promoterProfile } from './promoter-studio-model';
import { UnavailableAction } from './PromoterStudioActions';
import { PromoterPageHeader, SettingsNav } from './PromoterStudioUi';

export function PromoterSettingsPage({
  section,
}: {
  readonly section: 'profile' | 'payout-account' | 'notifications' | 'security';
}) {
  const content = {
    profile: {
      title: 'Profile',
      description:
        'Manage the public credibility profile venues and hosts use to assess partnerships.',
      button: 'Save profile',
      fields: (
        <>
          <label>
            <span>Display name</span>
            <input defaultValue={promoterProfile.name} />
          </label>
          <label>
            <span>Handle</span>
            <input defaultValue={promoterProfile.handle} />
          </label>
          <label className="pr-field-wide">
            <span>Bio</span>
            <textarea defaultValue={promoterProfile.bio} />
          </label>
          <label>
            <span>City</span>
            <input defaultValue={promoterProfile.city} />
          </label>
          <label>
            <span>Profile visibility</span>
            <select defaultValue="network">
              <option value="network">Verified network only</option>
            </select>
          </label>
        </>
      ),
    },
    'payout-account': {
      title: 'Payout account',
      description: 'Review the verified bank account used for promoter settlements.',
      button: 'Update account',
      fields: (
        <>
          <div className="pr-account-tile">
            <span>Primary payout account</span>
            <strong>HDFC Bank · •••• 2481</strong>
            <small>Verified · Club Zing</small>
          </div>
          <label>
            <span>Settlement schedule</span>
            <select defaultValue="weekly">
              <option value="weekly">Weekly when available</option>
            </select>
          </label>
        </>
      ),
    },
    notifications: {
      title: 'Notifications',
      description: 'Choose which promoter activity should reach your workspace.',
      button: 'Save preferences',
      fields: (
        <>
          <div className="pr-toggle-row">
            <span>
              <b>Event invitations</b>
              <small>New and expiring invitations</small>
            </span>
            <input aria-label="Event invitations" type="checkbox" defaultChecked />
          </div>
          <div className="pr-toggle-row">
            <span>
              <b>Link performance</b>
              <small>Ticket movement and milestones</small>
            </span>
            <input aria-label="Link performance" type="checkbox" defaultChecked />
          </div>
          <div className="pr-toggle-row">
            <span>
              <b>Finance</b>
              <small>Settlements and payout availability</small>
            </span>
            <input aria-label="Finance notifications" type="checkbox" defaultChecked />
          </div>
        </>
      ),
    },
    security: {
      title: 'Security',
      description: 'Review access protections for this promoter workspace.',
      button: 'Save security settings',
      fields: (
        <>
          <div className="pr-account-tile">
            <span>Authentication</span>
            <strong>Firebase account protected</strong>
            <small>Last verified today</small>
          </div>
          <div className="pr-toggle-row">
            <span>
              <b>Sign-in alerts</b>
              <small>Notify me about new device access</small>
            </span>
            <input aria-label="Sign-in alerts" type="checkbox" defaultChecked />
          </div>
          <div className="pr-toggle-row">
            <span>
              <b>Session review</b>
              <small>Require re-authentication for finance actions</small>
            </span>
            <input aria-label="Session review" type="checkbox" defaultChecked />
          </div>
        </>
      ),
    },
  }[section];
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Workspace preferences"
        title="Settings"
        description="Profile, payouts, notifications and account security."
      />
      <div className="pr-settings-layout">
        <SettingsNav active={section} />
        <section className="pr-settings-card pr-glass-panel">
          <header>
            <h2>{content.title}</h2>
            <p>{content.description}</p>
          </header>
          <div className="pr-form-grid">{content.fields}</div>
          <footer>
            <UnavailableAction
              label={content.button}
              title="Save unavailable"
              description="A verified settings write adapter is not connected. Your current settings remain unchanged."
            />
          </footer>
        </section>
      </div>
    </div>
  );
}
