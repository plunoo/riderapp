export function Topbar({ title }: { title: string }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>{title}</h1>
    </div>
  );
}

const styles: Record<string, any> = {
  wrap: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  h1: { fontSize: 34, margin: 0 },
};
