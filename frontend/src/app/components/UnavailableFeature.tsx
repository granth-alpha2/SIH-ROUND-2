import Link from "next/link";
import AppShell from "./AppShell";

type UnavailableFeatureProps = { title: string; eyebrow: string; description: string; action?: { label: string; href: string } };

export default function UnavailableFeature({ title, eyebrow, description, action }: UnavailableFeatureProps) {
  return <AppShell pageTitle={title}><section className="page-wrap feature-page"><div className="feature-header"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subhead">{description}</p></div><section className="empty-dashboard panel" aria-labelledby="feature-state-title"><div className="empty-icon">...</div><p className="eyebrow">NOT CONNECTED</p><h2 id="feature-state-title">This workspace is ready for its service</h2><p>This screen is intentionally empty until a real API or saved farm data is available. No sample results are shown as live information.</p>{action && <Link className="primary-button" href={action.href}>{action.label}</Link>}</section></section></AppShell>;
}