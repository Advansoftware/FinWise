export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is for all pages inside the (pages) group
  // It ensures they share the same authenticated app shell
  return <>{children}</>;
}
