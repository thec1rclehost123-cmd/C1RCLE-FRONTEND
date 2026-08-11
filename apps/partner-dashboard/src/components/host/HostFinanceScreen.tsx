import { hostPayouts } from './host-studio-model';
import {
  HostButton,
  HostHeader,
  HostMetric,
  HostPage,
  HostStatus,
  HostTable,
} from './HostStudioUi';

export function HostFinanceScreen() {
  return (
    <HostPage>
      <HostHeader title="Finance" description="Your Host earnings and payouts." />
      <section className="host-metric-row">
        <HostMetric
          label="Available earnings"
          value="₹83,200"
          detail="Ready for next payout"
          tone="success"
        />
        <HostMetric label="Pending earnings" value="₹51,400" detail="Awaiting event settlement" />
        <HostMetric label="Lifetime paid" value="₹4,86,200" detail="Authoritative payout records" />
      </section>
      <div className="host-finance-grid">
        <section className="host-panel">
          <div className="host-section-head">
            <div>
              <h2>Payout history</h2>
              <p>Host payouts only.</p>
            </div>
            <HostButton disabled title="Payout export is unavailable">
              Export
            </HostButton>
          </div>
          <HostTable columns={['Date', 'Event', 'Status', 'Amount']} label="Host payout history">
            <>
              {hostPayouts.map((payout) => (
                <tr key={`${payout[0]}-${payout[1]}`}>
                  <td>{payout[0]}</td>
                  <td>
                    <strong>{payout[1]}</strong>
                  </td>
                  <td>
                    <HostStatus tone={payout[2] === 'Paid' ? 'success' : 'accent'}>
                      {payout[2]}
                    </HostStatus>
                  </td>
                  <td>{payout[3]}</td>
                </tr>
              ))}
            </>
          </HostTable>
        </section>
        <aside>
          <section className="host-panel">
            <h2>Payout account</h2>
            <div className="host-info-list">
              <div>
                <span>Bank</span>
                <strong>HDFC Bank</strong>
              </div>
              <div>
                <span>Account</span>
                <strong>••4412</strong>
              </div>
              <div>
                <span>Account holder</span>
                <strong>Rhea Kapoor</strong>
              </div>
              <div>
                <span>Status</span>
                <HostStatus tone="success">Verified</HostStatus>
              </div>
            </div>
            <HostButton href="/host/settings?tab=payout">Manage</HostButton>
          </section>
          <section className="host-panel">
            <h2>Next payout</h2>
            <strong className="host-large-value">₹86,200</strong>
            <p>Fri, 18 Jul · HDFC ••4412</p>
          </section>
        </aside>
      </div>
    </HostPage>
  );
}
