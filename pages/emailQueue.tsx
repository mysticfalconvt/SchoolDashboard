import gql from 'graphql-tag';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import Loading from '../components/Loading';
import GradientButton from '../components/styles/Button';
import { useUserStatus } from '../components/User';
import { useGQLQuery } from '../lib/useGqlQuery';

const EMAIL_QUEUE_QUERY = gql`
  query EmailQueue($take: Int!, $where: EmailDeliveryWhereInput!) {
    pendingCount: emailDeliveriesCount(where: { status: { equals: "pending" } })
    processingCount: emailDeliveriesCount(where: { status: { equals: "processing" } })
    retryingCount: emailDeliveriesCount(where: { status: { equals: "retrying" } })
    sentCount: emailDeliveriesCount(where: { status: { equals: "sent" } })
    failedCount: emailDeliveriesCount(where: { status: { equals: "failed" } })
    emailDeliveries(where: $where, orderBy: { createdAt: desc }, take: $take) {
      id
      recipient
      subject
      kind
      lowPriority
      batchId
      status
      attempts
      maxAttempts
      nextAttemptAt
      lastAttemptAt
      sentAt
      providerMessageId
      lastError
      createdAt
    }
  }
`;

type QueueStatus = 'pending' | 'processing' | 'retrying' | 'sent' | 'failed';

type EmailDelivery = {
  id: string;
  recipient?: string;
  subject?: string;
  kind?: string;
  lowPriority?: boolean;
  batchId?: string;
  status?: QueueStatus;
  attempts?: number;
  maxAttempts?: number;
  nextAttemptAt?: string;
  lastAttemptAt?: string;
  sentAt?: string;
  providerMessageId?: string;
  lastError?: string;
  createdAt?: string;
};

type QueueData = {
  pendingCount: number;
  processingCount: number;
  retryingCount: number;
  sentCount: number;
  failedCount: number;
  emailDeliveries: EmailDelivery[];
};

const statusLabels: Record<QueueStatus, string> = {
  pending: 'Queued',
  processing: 'Sending',
  retrying: 'Retrying',
  sent: 'Sent',
  failed: 'Failed',
};
const EMPTY_DELIVERIES: EmailDelivery[] = [];

function displayDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const EmailQueue: NextPage = () => {
  const { user: me, isLoading: isUserLoading } = useUserStatus();
  const router = useRouter();
  const selectedBatch =
    typeof router.query.batchId === 'string' ? router.query.batchId : '';
  const [statusFilter, setStatusFilter] = useState<'all' | QueueStatus>('all');
  const allowed = !!(me?.isSuperAdmin || me?.canManagePbis);
  const { data, isLoading, error, refetch, isFetching } = useGQLQuery<QueueData>(
    'Email queue',
    EMAIL_QUEUE_QUERY,
    {
      take: 500,
      where: selectedBatch ? { batchId: { equals: selectedBatch } } : {},
    },
    { enabled: allowed, refetchInterval: allowed ? 3000 : false },
  );

  const deliveries = data?.emailDeliveries || EMPTY_DELIVERIES;
  const visibleDeliveries = useMemo(
    () =>
      deliveries.filter(
        (delivery) =>
          (!selectedBatch || delivery.batchId === selectedBatch) &&
          (statusFilter === 'all' || delivery.status === statusFilter),
      ),
    [deliveries, selectedBatch, statusFilter],
  );
  const counts = {
    pending: data?.pendingCount || 0,
    processing: data?.processingCount || 0,
    retrying: data?.retryingCount || 0,
    sent: data?.sentCount || 0,
    failed: data?.failedCount || 0,
  };
  const batches = useMemo(() => {
    const grouped = new Map<
      string,
      { id: string; createdAt?: string; total: number; sent: number; failed: number }
    >();
    deliveries.forEach((delivery) => {
      if (!delivery.batchId) return;
      const batch = grouped.get(delivery.batchId) || {
        id: delivery.batchId,
        createdAt: delivery.createdAt,
        total: 0,
        sent: 0,
        failed: 0,
      };
      batch.total++;
      if (delivery.status === 'sent') batch.sent++;
      if (delivery.status === 'failed') batch.failed++;
      grouped.set(delivery.batchId, batch);
    });
    return Array.from(grouped.values()).slice(0, 12);
  }, [deliveries]);

  if (isUserLoading) return <Loading />;
  if (!allowed) {
    return <p>You do not have permission to view the email queue.</p>;
  }

  return (
    <main className="queue-page">
      <header className="queue-header">
        <div>
          <p className="eyebrow">Delivery operations</p>
          <h1>Email Queue</h1>
          <p className="subtitle">
            SMTP acceptance and retry progress. This page refreshes every three seconds.
          </p>
        </div>
        <div className="header-actions">
          <span className={isFetching ? 'live refreshing' : 'live'}>
            {isFetching ? 'Refreshing' : 'Live'}
          </span>
          <GradientButton onClick={() => void refetch()}>Refresh</GradientButton>
          <Link href="/superUserSettings">
            <GradientButton>Administration</GradientButton>
          </Link>
        </div>
      </header>

      {error && <div className="error-banner">Unable to load the queue: {error.message}</div>}

      <section className="stats" aria-label="Email queue totals">
        {(Object.keys(statusLabels) as QueueStatus[]).map((status) => (
          <button
            type="button"
            key={status}
            className={`stat ${status} ${statusFilter === status ? 'selected' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <span>{statusLabels[status]}</span>
            <strong>{counts[status]}</strong>
          </button>
        ))}
      </section>

      {batches.length > 0 && (
        <section className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">PBIS bulk sends</p>
              <h2>Recent Batches</h2>
            </div>
            {selectedBatch && (
              <Link href="/emailQueue" className="clear-filter">
                Clear batch filter
              </Link>
            )}
          </div>
          <div className="batches">
            {batches.map((batch) => {
              const complete = batch.sent + batch.failed;
              const percent = batch.total ? Math.round((complete / batch.total) * 100) : 0;
              return (
                <Link
                  key={batch.id}
                  href={`/emailQueue?batchId=${encodeURIComponent(batch.id)}`}
                  className={`batch ${selectedBatch === batch.id ? 'active' : ''}`}
                >
                  <div className="batch-topline">
                    <strong>{displayDate(batch.createdAt)}</strong>
                    <span>{percent}% complete</span>
                  </div>
                  <div className="progress"><span style={{ width: `${percent}%` }} /></div>
                  <div className="batch-counts">
                    <span>{batch.total} total</span>
                    <span>{batch.sent} sent</span>
                    <span className={batch.failed ? 'failure-text' : ''}>{batch.failed} failed</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="panel deliveries-panel">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Individual deliveries</p>
            <h2>{selectedBatch ? 'Selected Batch' : 'Recent Email'}</h2>
          </div>
          {statusFilter !== 'all' && (
            <button className="clear-filter" onClick={() => setStatusFilter('all')}>
              Clear status filter
            </button>
          )}
        </div>
        {isLoading ? (
          <Loading />
        ) : visibleDeliveries.length === 0 ? (
          <p className="empty">No email deliveries match this view.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Attempts</th>
                  <th>Queued</th>
                  <th>Latest activity</th>
                  <th>Problem</th>
                </tr>
              </thead>
              <tbody>
                {visibleDeliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td><span className={`status-pill ${delivery.status}`}>{delivery.status ? statusLabels[delivery.status] : 'Unknown'}</span></td>
                    <td>{delivery.recipient}</td>
                    <td>{delivery.subject}</td>
                    <td>{delivery.attempts || 0}/{delivery.maxAttempts || 5}</td>
                    <td>{displayDate(delivery.createdAt)}</td>
                    <td>{displayDate(delivery.sentAt || delivery.lastAttemptAt || delivery.nextAttemptAt)}</td>
                    <td className="problem">{delivery.lastError || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .queue-page { max-width: 1500px; margin: 0 auto; padding: 28px 22px 60px; color: #172033; }
        .queue-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding: 28px; border-radius: 20px; color: white; background: linear-gradient(125deg, #18253f 0%, #253f70 58%, #8d2935 100%); box-shadow: 0 18px 45px rgba(24, 37, 63, .18); }
        h1 { margin: 2px 0 6px; font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -.04em; }
        h2 { margin: 2px 0 0; font-size: 1.35rem; }
        .eyebrow { margin: 0; text-transform: uppercase; letter-spacing: .16em; font-size: .72rem; font-weight: 800; opacity: .72; }
        .subtitle { max-width: 650px; margin: 0; opacity: .82; }
        .header-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
        .live { padding: 7px 11px; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; font-size: .78rem; font-weight: 700; }
        .live::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: #7ee2a8; }
        .refreshing::before { background: #ffd166; }
        .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 20px 0; }
        .stat { display: flex; align-items: center; justify-content: space-between; border: 1px solid #dce2ec; border-left: 5px solid #8b96a9; border-radius: 14px; padding: 17px; background: white; color: #344054; cursor: pointer; box-shadow: 0 5px 16px rgba(34, 48, 73, .05); }
        .stat strong { font-size: 1.6rem; color: #172033; }
        .stat.processing { border-left-color: #3178c6; } .stat.retrying { border-left-color: #d69e2e; } .stat.sent { border-left-color: #27845b; } .stat.failed { border-left-color: #c13d4a; }
        .stat.selected { outline: 3px solid rgba(49,120,198,.2); }
        .panel { margin-top: 18px; padding: 22px; border: 1px solid #dde3ec; border-radius: 18px; background: #f9fafc; box-shadow: 0 8px 24px rgba(31, 43, 65, .06); }
        .panel-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .batches { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .batch { padding: 15px; border: 1px solid #d9e0ea; border-radius: 12px; color: inherit; background: white; text-decoration: none; }
        .batch.active { border-color: #315f9d; box-shadow: 0 0 0 3px rgba(49,95,157,.14); }
        .batch-topline, .batch-counts { display: flex; justify-content: space-between; gap: 10px; font-size: .8rem; }
        .progress { height: 7px; margin: 12px 0; overflow: hidden; border-radius: 99px; background: #e8ecf2; }
        .progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #315f9d, #27845b); }
        .failure-text { color: #a82d3a; font-weight: 700; }
        .clear-filter { border: 0; padding: 0; color: #315f9d; background: none; font-weight: 700; cursor: pointer; text-decoration: underline; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th { padding: 11px 12px; color: #667085; background: #f1f4f8; text-align: left; text-transform: uppercase; letter-spacing: .06em; font-size: .69rem; }
        td { padding: 12px; border-top: 1px solid #e5e9f0; font-size: .84rem; vertical-align: top; }
        .status-pill { display: inline-block; padding: 4px 8px; border-radius: 99px; background: #e8ecf2; white-space: nowrap; font-size: .72rem; font-weight: 800; }
        .status-pill.processing { color: #245b96; background: #e2effd; } .status-pill.retrying { color: #865f11; background: #fff2ce; } .status-pill.sent { color: #17603f; background: #dff5e9; } .status-pill.failed { color: #932d38; background: #fde5e8; }
        .problem { max-width: 320px; color: #8f2c37; overflow-wrap: anywhere; }
        .empty, .error-banner { padding: 18px; border-radius: 10px; background: white; }
        .error-banner { margin-top: 18px; color: #8f2c37; border: 1px solid #f2bdc3; }
        @media (max-width: 900px) { .queue-header { flex-direction: column; } .header-actions { justify-content: flex-start; } .stats { grid-template-columns: repeat(2, 1fr); } .batches { grid-template-columns: 1fr; } }
        @media (max-width: 520px) { .queue-page { padding: 14px 10px 40px; } .queue-header, .panel { padding: 16px; border-radius: 14px; } .stats { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
};

export default EmailQueue;
